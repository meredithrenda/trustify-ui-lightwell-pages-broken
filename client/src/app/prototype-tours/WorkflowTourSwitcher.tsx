import React from "react";

import {
  Button,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Tooltip,
} from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import { useWorkflowTour } from "./TourProvider";

const WORKFLOW_TOURS_HELP =
  "Select a workflow to open its starting page and follow highlighted steps.";

/**
 * Bar above the masthead. Matches the trustify-ui / design-review chrome
 * (label + info · Select “Select a workflow”).
 */
export const WorkflowTourSwitcher: React.FC = () => {
  const { tours, activeTour, startTour, dismissTour } = useWorkflowTour();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      id="workflow-tours-select"
      aria-label="Select a workflow tour"
      size="sm"
      isExpanded={isOpen}
      onClick={() => setIsOpen((open) => !open)}
      className="workflow-tours-bar__toggle"
    >
      {activeTour?.label ?? "Select a workflow"}
    </MenuToggle>
  );

  return (
    <div className="workflow-tours-bar" role="region" aria-label="Workflow tours">
      <div className="workflow-tours-bar__inner">
        <span className="workflow-tours-bar__label">
          Workflow tours
          <Tooltip content={WORKFLOW_TOURS_HELP} position="bottom-start">
            <Button
              variant="plain"
              aria-label="About workflow tours"
              className="workflow-tours-bar__help"
              icon={<InfoCircleIcon />}
            />
          </Tooltip>
        </span>
        <Select
          id="workflow-tours-select-list"
          isOpen={isOpen}
          selected={activeTour?.id}
          onOpenChange={setIsOpen}
          onSelect={(_event, value) => {
            setIsOpen(false);
            if (value === undefined) {
              return;
            }
            if (value === "__dismiss") {
              dismissTour();
              return;
            }
            startTour(String(value));
          }}
          toggle={toggle}
        >
          <SelectList>
            {tours.length === 0 ? (
              <SelectOption key="empty" value="__empty" isDisabled>
                No workflows yet — add one after designer intake
              </SelectOption>
            ) : (
              tours.map((tour) => (
                <SelectOption
                  key={tour.id}
                  value={tour.id}
                  description={tour.summary}
                >
                  {tour.label}
                </SelectOption>
              ))
            )}
            {activeTour ? (
              <SelectOption key="dismiss" value="__dismiss">
                Dismiss current tour
              </SelectOption>
            ) : null}
          </SelectList>
        </Select>
      </div>
    </div>
  );
};
