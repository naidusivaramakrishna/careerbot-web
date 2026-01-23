import React from "react";

interface Props {
  className?: string;
}

/**
 * A nib pen with sparkles icon — matches the uploaded design.
 * Works seamlessly with Tailwind CSS (v4+).
 */
const NibPenSparkleIcon: React.FC<Props> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
    >
      {/* Pen body */}
      <path d="M403.8 0c-7.1 0-14 2.8-19.1 7.9l-78.5 78.5 119.3 119.3 78.5-78.5c10.5-10.5 10.5-27.6 0-38.1L422 7.9C416.9 2.8 410 0 403.8 0zM273.6 129.1 42.6 360.1 0 512l151.9-42.6 231-231L273.6 129.1zm-79.3 187.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0-12.5-32.8 0-45.3 32.8-12.5 45.3 0z" />
      {/* Sparkles */}
      <path d="M432 256l16 48 48 16-48 16-16 48-16-48-48-16 48-16 16-48zM80 64l24 72 72 24-72 24-24 72-24-72-72-24 72-24 24-72z" />
    </svg>
  );
};

export default NibPenSparkleIcon;
