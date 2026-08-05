import type { WorkflowTour } from "./types";

/**
 * Registered workflow tours for the Lightwell prototype.
 * Add tours here after designer intake — keep empty until then.
 */
export const WORKFLOW_TOURS: WorkflowTour[] = [];

export const getWorkflowTourById = (
  tourId: string | null | undefined,
): WorkflowTour | undefined => {
  if (!tourId) {
    return undefined;
  }
  return WORKFLOW_TOURS.find((tour) => tour.id === tourId);
};
