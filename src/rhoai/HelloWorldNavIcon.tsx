import React from 'react';

/**
 * Navigation icon for the Hello World plugin
 */
const HelloIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="4" fill="#6b21a8" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="12"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      HW
    </text>
  </svg>
);

export default HelloIcon;
