import React from 'react';

/**
 * Official CoalSafe Brand Logo Component
 * Represents the miner helmet with headlamp and safety green checkmark.
 */
export default function CoalSafeLogo({
  size = 32,
  className = '',
  showText = false,
  showSubtitle = false,
  textClassName = '',
  subtitleClassName = '',
  variant = 'dark' // 'dark' | 'transparent'
}) {
  const isDark = variant === 'dark';

  const iconElement = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="CoalSafe Logo"
    >
      {/* Background container */}
      {isDark && (
        <rect width="512" height="512" rx="104" fill="#111827" />
      )}

      {/* Miner's Safety Helmet Dome */}
      <path
        d="M256 112 C248 112 244 116 244 122 V140 C176 148 124 200 120 262 H392 C388 200 336 148 268 140 V122 C268 116 264 112 256 112 Z"
        fill="#f59e0b"
      />

      {/* Helmet Spine / Center Ridge */}
      <path
        d="M249 116 C249 114 252 113 256 113 C260 113 263 114 263 116 V186 H249 Z"
        fill="#d97706"
      />

      {/* Helmet Brim */}
      <rect x="94" y="260" width="324" height="26" rx="13" fill="#f59e0b" />
      <rect x="100" y="278" width="312" height="8" rx="4" fill="#d97706" opacity="0.6" />

      {/* Mining Headlamp (Housing & Lamp) */}
      <circle cx="256" cy="214" r="26" fill="#1e293b" stroke="#d97706" stroke-width="4" />
      <circle cx="256" cy="214" r="16" fill="#ffffff" />

      {/* Safety Verified Green Checkmark */}
      <path
        d="M192 352 L238 398 L320 318"
        fill="none"
        stroke="#22c55e"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!showText) {
    return iconElement;
  }

  return (
    <div className="flex items-center gap-2.5">
      {iconElement}
      <div className="flex flex-col">
        <span className={`text-base font-bold text-slateText leading-tight tracking-tight ${textClassName}`}>
          Coal<span className="text-primary">Safe</span>
        </span>
        {showSubtitle && (
          <span className={`text-[11px] text-slateText-secondary leading-tight ${subtitleClassName}`}>
            Productivity & Safety Management
          </span>
        )}
      </div>
    </div>
  );
}
