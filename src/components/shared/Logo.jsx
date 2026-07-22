import React from "react";

export default function Logo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FestChain"
      >
        {/* Ticket badge with side notches */}
        <path
          d="M9 7H27a2 2 0 0 1 2 2V13a2 2 0 0 0 0 4V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V17a2 2 0 0 0 0-4V9a2 2 0 0 1 2-2z"
          fill="#FF6500"
        />
        {/* Music note: two note heads + connecting beam */}
        <circle cx="14" cy="23" r="2.6" fill="white" />
        <path
          d="M16.6 23V12l7-1.4v6.2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23.6" cy="17" r="2.1" fill="white" />
      </svg>
      {withWordmark && (
        <span className="font-heading font-extrabold tracking-tight leading-none text-[19px]">
          <span className="text-white">Fest</span>
          <span className="text-[#FF6500]">Chain</span>
        </span>
      )}
    </span>
  );
}