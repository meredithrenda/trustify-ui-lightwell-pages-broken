import React from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { getWorkflowTourById, WORKFLOW_TOURS } from "./tours";
import type { TourStep, WorkflowTour } from "./types";

type TourContextValue = {
  tours: WorkflowTour[];
  activeTour: WorkflowTour | null;
  activeStep: TourStep | null;
  stepIndex: number;
  startTour: (tourId: string) => void;
  dismissTour: () => void;
  goToStart: () => void;
  nextStep: () => void;
  advanceFromAction: () => void;
};

const TourContext = React.createContext<TourContextValue | null>(null);

const TOUR_QUERY_PARAM = "tour";

export const useWorkflowTour = (): TourContextValue => {
  const ctx = React.useContext(TourContext);
  if (!ctx) {
    throw new Error("useWorkflowTour must be used within TourProvider");
  }
  return ctx;
};

const buildTourSearch = (
  tourId: string,
  startSearch?: string,
): string => {
  const params = new URLSearchParams(
    startSearch ? startSearch.replace(/^\?/, "") : "",
  );
  params.set(TOUR_QUERY_PARAM, tourId);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTourId, setActiveTourId] = React.useState<string | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);
  const deepLinkHandled = React.useRef(false);

  const activeTour = React.useMemo(
    () => getWorkflowTourById(activeTourId) ?? null,
    [activeTourId],
  );
  const activeStep = activeTour?.steps[stepIndex] ?? null;

  const clearTourQuery = React.useCallback(() => {
    if (!searchParams.has(TOUR_QUERY_PARAM)) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete(TOUR_QUERY_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const startTour = React.useCallback(
    (tourId: string) => {
      const tour = getWorkflowTourById(tourId);
      if (!tour || tour.steps.length === 0) {
        return;
      }

      setActiveTourId(tour.id);
      setStepIndex(0);
      navigate({
        pathname: tour.startPath,
        search: buildTourSearch(tour.id, tour.startSearch),
      });
    },
    [navigate],
  );

  const dismissTour = React.useCallback(() => {
    setActiveTourId(null);
    setStepIndex(0);
    clearTourQuery();
  }, [clearTourQuery]);

  const goToStart = React.useCallback(() => {
    if (!activeTour) {
      return;
    }
    setStepIndex(0);
    navigate({
      pathname: activeTour.startPath,
      search: buildTourSearch(activeTour.id, activeTour.startSearch),
    });
  }, [activeTour, navigate]);

  const nextStep = React.useCallback(() => {
    if (!activeTour) {
      return;
    }
    if (stepIndex >= activeTour.steps.length - 1) {
      dismissTour();
      return;
    }
    setStepIndex((current) => current + 1);
  }, [activeTour, dismissTour, stepIndex]);

  const advanceFromAction = React.useCallback(() => {
    if (activeStep?.advanceOn !== "action") {
      return;
    }
    nextStep();
  }, [activeStep?.advanceOn, nextStep]);

  // Deep link: ?tour=<id>
  React.useEffect(() => {
    if (deepLinkHandled.current) {
      return;
    }
    const fromQuery = searchParams.get(TOUR_QUERY_PARAM);
    if (!fromQuery) {
      return;
    }
    deepLinkHandled.current = true;
    const tour = getWorkflowTourById(fromQuery);
    if (!tour || tour.steps.length === 0) {
      return;
    }
    setActiveTourId(tour.id);
    setStepIndex(0);
    if (location.pathname !== tour.startPath) {
      navigate(
        {
          pathname: tour.startPath,
          search: buildTourSearch(tour.id, tour.startSearch),
        },
        { replace: true },
      );
    }
  }, [location.pathname, navigate, searchParams]);

  // Navigate when a step requests it
  React.useEffect(() => {
    if (!activeStep?.navigateTo) {
      return;
    }
    if (location.pathname !== activeStep.navigateTo) {
      navigate(activeStep.navigateTo);
    }
  }, [activeStep, location.pathname, navigate]);

  // Advance on route match (once per step)
  const routeAdvanceKey = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!activeTour || !activeStep || activeStep.advanceOn !== "route") {
      return;
    }
    const expected = activeStep.advanceWhenPath ?? activeStep.navigateTo;
    const key = `${activeTour.id}.${activeStep.id}`;
    if (expected && location.pathname === expected) {
      if (routeAdvanceKey.current === key) {
        return;
      }
      routeAdvanceKey.current = key;
      nextStep();
    }
  }, [activeStep, activeTour, location.pathname, nextStep]);

  const value = React.useMemo<TourContextValue>(
    () => ({
      tours: WORKFLOW_TOURS,
      activeTour,
      activeStep,
      stepIndex,
      startTour,
      dismissTour,
      goToStart,
      nextStep,
      advanceFromAction,
    }),
    [
      activeTour,
      activeStep,
      stepIndex,
      startTour,
      dismissTour,
      goToStart,
      nextStep,
      advanceFromAction,
    ],
  );

  return (
    <TourContext.Provider value={value}>{children}</TourContext.Provider>
  );
};
