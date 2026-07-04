import React from "react";

export default function Logo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FestChain"
      >
        <rect width="32" height="32" rx="9" fill="#0d0d0d"/>
        <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#FF6500" strokeWidth="1"/>
        <path d="M11.5 7.5V24.5" stroke="#FF6500" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5 8.5H21" stroke="#FF6500" strokeWidth="3" strokeLinecap="round"/>
        <path d="M11.5 16H19" stroke="#FF6500" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="2.8" fill="#FF6500"/>
        <circle cx="22" cy="22" r="1.05" fill="#0d0d0d"/>
      </svg>
      {withWordmark && (
        <span className="font-heading font-bold tracking-tight text-white leading-none">FestChain</span>
      )}
    </span>
  );
}