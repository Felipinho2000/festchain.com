import React from "react";

const LOGO_URL = "https://media.base44.com/images/public/6a397da94e9321ecf0c31364/b1f134374_image.png";

export default function Logo({ size = 32, withWordmark = true, className = "" }) {
  return (
    <span className={"inline-flex items-center " + className}>
      <img
        src={LOGO_URL}
        alt="FestChain"
        style={{ height: size }}
        className="w-auto rounded-md"
      />
    </span>
  );
}