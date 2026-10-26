import React from "react";

/**
 * Button label while AI text is being generated: "Generating" followed by three dots that bounce
 * one after another, so it reads as work in progress rather than a frozen label.
 */
const GeneratingLabel: React.FC = () => (
  <span className="inline-flex items-center" role="status" aria-live="polite">
    <span>Generating</span>
    <span className="ml-1 inline-flex items-end gap-[3px]" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          data-testid="generating-dot"
          className="ai-generating-dot h-1 w-1 rounded-full bg-current"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
    <span className="sr-only"> please wait</span>
  </span>
);

export default GeneratingLabel;
