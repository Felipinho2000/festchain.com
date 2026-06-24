import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Qr({ value, size = 160, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl p-3 inline-flex items-center justify-center ${className}`}>
      {value ? (
        <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
      ) : (
        <div style={{ width: size, height: size }} className="flex items-center justify-center text-neutral-400 text-[10px] text-center px-2">
          no code
        </div>
      )}
    </div>
  );
}