export type TourAdvanceOn = "action" | "next" | "route";

export type TourStepTarget = {
  /** Matches `data-tour="<tourId>.<stepId>"` on a visible control. */
  tourAttr: string;
};

export type TourStep = {
  id: string;
  title: string;
  /** Imperative reviewer action (one sentence). */
  body: string;
  /**
   * Optional Design annotation for developers about the visible product UI
   * state — not tour mechanics.
   */
  annotation?: string;
  target?: TourStepTarget;
  navigateTo?: string;
  advanceOn: TourAdvanceOn;
  advanceWhenPath?: string;
};

export type WorkflowTour = {
  id: string;
  label: string;
  summary: string;
  startPath: string;
  startSearch?: string;
  /** Implementer-only notes; not shown on the step card. */
  notes?: string;
  steps: TourStep[];
};
