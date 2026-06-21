import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * BackButton — floating back arrow shown on every dashboard/inner page.
 * Sits in the top-left corner, calls navigate(-1) on click.
 */
export default function BackButton({ label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button
      className="back-btn"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      title="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="back-btn__icon"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      <span className="back-btn__label">{label}</span>
    </button>
  );
}
