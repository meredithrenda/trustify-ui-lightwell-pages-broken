import React from "react";

import { Button, Title } from "@patternfly/react-core";

import { useWorkflowTour } from "./TourProvider";

const CARD_DEFAULT = { x: null as number | null, y: null as number | null };

type Rect = { top: number; left: number; width: number; height: number };

const RING_PADDING = 6;

const resolveTourTarget = (tourAttr: string): HTMLElement | null => {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${tourAttr}"]`),
  );
  const visible = nodes.find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  });
  return visible ?? null;
};

/**
 * Spotlight ring + draggable step card for the active tour step.
 */
export const TourSpotlight: React.FC = () => {
  const {
    activeTour,
    activeStep,
    stepIndex,
    dismissTour,
    goToStart,
    nextStep,
    advanceFromAction,
  } = useWorkflowTour();

  const [targetRect, setTargetRect] = React.useState<Rect | null>(null);
  const [targetMissing, setTargetMissing] = React.useState(false);
  const [cardOffset, setCardOffset] = React.useState(CARD_DEFAULT);
  const dragState = React.useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Reset card to bottom-right on each step
  React.useEffect(() => {
    setCardOffset(CARD_DEFAULT);
  }, [activeStep?.id, activeTour?.id]);

  // Track target geometry while step is active (portaled menus move after layout)
  React.useEffect(() => {
    if (!activeStep?.target?.tourAttr) {
      setTargetRect(null);
      setTargetMissing(false);
      return;
    }

    const tourAttr = activeStep.target.tourAttr;
    let raf = 0;

    const measure = () => {
      const el = resolveTourTarget(tourAttr);
      if (!el) {
        setTargetRect(null);
        setTargetMissing(true);
        return;
      }
      setTargetMissing(false);
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(measure);
    };

    measure();
    // Re-measure briefly after step change for Popper/portals
    const timers = [50, 150, 300, 500].map((ms) =>
      window.setTimeout(scheduleMeasure, ms),
    );
    const interval = window.setInterval(scheduleMeasure, 250);
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(document.body);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(interval);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [activeStep?.target?.tourAttr, activeStep?.id]);

  // Advance on real click of the spotlight target
  React.useEffect(() => {
    if (!activeStep?.target?.tourAttr || activeStep.advanceOn !== "action") {
      return;
    }
    const tourAttr = activeStep.target.tourAttr;

    const onClick = (event: MouseEvent) => {
      const el = event.target;
      if (!(el instanceof Element)) {
        return;
      }
      if (el.closest(`[data-tour="${tourAttr}"]`)) {
        // Let the app handle the click, then advance
        window.setTimeout(() => advanceFromAction(), 0);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [activeStep, advanceFromAction]);

  const onCardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) {
      return;
    }
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: cardOffset.x ?? rect.left,
      originY: cardOffset.y ?? rect.top,
    };
    card.setPointerCapture(event.pointerId);
  };

  const onCardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) {
      return;
    }
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setCardOffset({
      x: dragState.current.originX + dx,
      y: dragState.current.originY + dy,
    });
  };

  const onCardPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
  };

  if (!activeTour || !activeStep) {
    return null;
  }

  const stepCount = activeTour.steps.length;
  const showNext =
    activeStep.advanceOn === "next" ||
    (targetMissing && Boolean(activeStep.target));

  const cardStyle: React.CSSProperties =
    cardOffset.x !== null && cardOffset.y !== null
      ? { left: cardOffset.x, top: cardOffset.y, right: "auto", bottom: "auto" }
      : undefined;

  const ringStyle: React.CSSProperties | undefined = targetRect
    ? {
        top: targetRect.top - RING_PADDING,
        left: targetRect.left - RING_PADDING,
        width: targetRect.width + RING_PADDING * 2,
        height: targetRect.height + RING_PADDING * 2,
      }
    : undefined;

  return (
    <>
      {ringStyle ? (
        <div
          className="workflow-tour-spotlight__ring"
          style={ringStyle}
          aria-hidden
        />
      ) : null}

      <div
        className="workflow-tour-spotlight__card"
        style={cardStyle}
        onPointerDown={onCardPointerDown}
        onPointerMove={onCardPointerMove}
        onPointerUp={onCardPointerUp}
        role="dialog"
        aria-label={`Tour step: ${activeStep.title}`}
      >
        <div className="workflow-tour-spotlight__card-handle">
          <span className="workflow-tour-spotlight__step-meta">
            Step {stepIndex + 1} of {stepCount}
          </span>
          <Button variant="plain" onClick={dismissTour} aria-label="Dismiss tour">
            Dismiss
          </Button>
        </div>
        <Title headingLevel="h2" size="md">
          {activeStep.title}
        </Title>
        <p className="workflow-tour-spotlight__body">{activeStep.body}</p>
        {activeStep.annotation ? (
          <div className="workflow-tour-spotlight__annotation">
            <div className="workflow-tour-spotlight__annotation-label">
              Design annotation
            </div>
            <p>{activeStep.annotation}</p>
          </div>
        ) : null}
        {targetMissing && activeStep.target ? (
          <p className="workflow-tour-spotlight__missing">
            That control isn’t on this screen yet.
          </p>
        ) : null}
        <div className="workflow-tour-spotlight__actions">
          {targetMissing && activeStep.target ? (
            <Button variant="secondary" onClick={goToStart}>
              Go to start
            </Button>
          ) : null}
          {showNext ? (
            <Button variant="primary" onClick={nextStep}>
              {stepIndex >= stepCount - 1 ? "Done" : "Next"}
            </Button>
          ) : null}
          {!showNext && activeStep.advanceOn === "action" ? (
            <span className="workflow-tour-spotlight__hint">
              Click the highlighted control to continue
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
};
