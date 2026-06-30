import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a397da94e9321ecf0c31364/17db3821c_image.png";

export default function Logo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <img
        src={LOGO_URL}
        alt="FestChain"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <span className="font-heading font-bold tracking-tight text-white leading-none">FestChain</span>
      )}
    </span>
  );
}