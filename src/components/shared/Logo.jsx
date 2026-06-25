import React from "react";

// Temporary branded logo lockup for FestChain.
// Stylized "F" (ticket + ticket stub bars) with a chain-link dot — neon emerald on dark.
// Replace with a final graphic asset when available.
export default function Logo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <span className={"inline-flex items-center gap-2.5 " + className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-primary"
      >
        <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="9" fill="#0d0d0d" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11.5 7.5 V24.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M11.5 8.5 H21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M11.5 16 H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="22" cy="22" r="2.8" fill="currentColor" />
        <circle cx="22" cy="22" r="1.05" fill="#0d0d0d" />
      </svg>
      {withWordmark && (
        <span className="font-heading font-bold tracking-tight text-white leading-none">FestChain</span>
      )}
    </span>
  );
}