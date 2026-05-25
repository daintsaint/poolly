// PoollyLogo.tsx — drop-in React component for the mark, wordmark, and lockup.
// No external deps. Tailwind- and CSS-Module-friendly via className passthrough.
//
// Usage:
//   <PoollyLogo />                     // mark + wordmark (horizontal), inherits color
//   <PoollyLogo variant="mark" />      // mark only
//   <PoollyLogo variant="wordmark" />  // wordmark only
//   <PoollyLogo variant="stacked" />   // mark above wordmark
//   <PoollyLogo size={48} />           // sets the height in px (or any CSS length)
//   <PoollyLogo accentColor="#B8945A" />
//   <PoollyLogo onDark />              // convenience: cream + champagne preset
//
// The wordmark uses Instrument Serif. Load it once globally:
//   <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap" rel="stylesheet" />
// or via next/font:
//   import { Instrument_Serif } from 'next/font/google';
//   const display = Instrument_Serif({ subsets: ['latin'], weight: '400' });

import * as React from "react";

type Variant = "lockup" | "mark" | "wordmark" | "stacked";

export interface PoollyLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** Height in px (or any CSS length). Mark and wordmark scale together. Default 32. */
  size?: number | string;
  /** Override the outline / wordmark color. Defaults to currentColor. */
  color?: string;
  /** Override the intersection fill. Defaults to brand emerald #1F4E3D. */
  accentColor?: string;
  /** Convenience preset: cream outline + champagne accent for dark backgrounds. */
  onDark?: boolean;
  /** Wordmark text. Default "Poolly". */
  label?: string;
}

const EMERALD = "#1F4E3D";
const CHAMPAGNE = "#B8945A";
const CREAM = "#F2EDE3";

export function PoollyLogo({
  variant = "lockup",
  size = 32,
  color,
  accentColor,
  onDark = false,
  label = "Poolly",
  className,
  style,
  ...rest
}: PoollyLogoProps) {
  const resolvedColor = color ?? (onDark ? CREAM : "currentColor");
  const resolvedAccent = accentColor ?? (onDark ? CHAMPAGNE : EMERALD);
  const px = typeof size === "number" ? `${size}px` : size;

  // Mark aspect ratio: 160 / 92
  const markHeight = px;
  const markWidth = `calc(${px} * (160 / 92))`;
  const wordSize = `calc(${px} * 1.55)`; // wordmark cap-height ≈ mark height

  const Mark = (
    <svg
      role="img"
      aria-label={variant === "mark" ? label : undefined}
      aria-hidden={variant !== "mark"}
      viewBox="0 0 160 92"
      style={{ height: markHeight, width: markWidth, display: "block", flexShrink: 0 }}
    >
      {variant === "mark" && <title>{label}</title>}
      <circle cx="58" cy="46" r="40" fill="none" stroke={resolvedColor} strokeWidth="3" />
      <circle cx="102" cy="46" r="40" fill="none" stroke={resolvedColor} strokeWidth="3" />
      <path
        d="M 80 12.59 A 40 40 0 0 1 80 79.41 A 40 40 0 0 1 80 12.59"
        fill={resolvedAccent}
      />
      <circle cx="58" cy="46" r="40" fill="none" stroke={resolvedColor} strokeWidth="3" />
      <circle cx="102" cy="46" r="40" fill="none" stroke={resolvedColor} strokeWidth="3" />
    </svg>
  );

  const Wordmark = (
    <span
      aria-label={variant === "wordmark" ? label : undefined}
      style={{
        fontFamily: '"Instrument Serif", Georgia, "Times New Roman", serif',
        fontWeight: 400,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        fontSize: wordSize,
        color: resolvedColor,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );

  if (variant === "mark") {
    return (
      <span className={className} style={{ display: "inline-flex", ...style }} {...rest}>
        {Mark}
      </span>
    );
  }
  if (variant === "wordmark") {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", alignItems: "center", ...style }}
        role="img"
        aria-label={label}
        {...rest}
      >
        {Wordmark}
      </span>
    );
  }
  if (variant === "stacked") {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `calc(${px} * 0.35)`,
          ...style,
        }}
        role="img"
        aria-label={label}
        {...rest}
      >
        {Mark}
        {Wordmark}
      </span>
    );
  }
  // lockup (default)
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `calc(${px} * 0.35)`,
        ...style,
      }}
      role="img"
      aria-label={label}
      {...rest}
    >
      {Mark}
      {Wordmark}
    </span>
  );
}

export default PoollyLogo;
