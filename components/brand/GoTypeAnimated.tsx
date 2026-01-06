import React from "react";
import styles from "./GoTypeAnimated.module.css";

type GoTypeAnimatedProps = {
  text?: string;              // default "GO"
  size?: number | string;     // e.g. 64, "4rem", "72px"
  loopSeconds?: number;       // total cycle duration
  dwellFinal?: number;        // multiplier for last frame dwell
  className?: string;
  overlay?: boolean;          // if true: pointer-events none
};

const FRAMES: Array<{ label: string; fontFamily: string; letterSpacing?: string; weight?: number }> = [
  {
    label: "Primary",
    fontFamily: `"Suisse Int'l", "Neue Haas Grotesk Display Pro", "Helvetica Neue", Helvetica, Arial, system-ui`,
    letterSpacing: "-0.04em",
    weight: 600,
  },
  {
    label: "Grotesk",
    fontFamily: `"Helvetica Neue", Helvetica, Arial, system-ui`,
    letterSpacing: "-0.05em",
    weight: 700,
  },
  {
    label: "Inter",
    fontFamily: `"Inter", "Helvetica Neue", Helvetica, Arial, system-ui`,
    letterSpacing: "-0.035em",
    weight: 700,
  },
  {
    label: "IBM Plex",
    fontFamily: `"IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, system-ui`,
    letterSpacing: "-0.03em",
    weight: 650,
  },
  {
    label: "Space Grotesk",
    fontFamily: `"Space Grotesk", "Helvetica Neue", Helvetica, Arial, system-ui`,
    letterSpacing: "-0.03em",
    weight: 650,
  },
];

export default function GoTypeAnimated({
  text = "GO",
  size = "4.5rem",
  loopSeconds = 6,
  dwellFinal = 2.2,
  className,
  overlay = false,
}: GoTypeAnimatedProps) {
  // We create one stacked layer per frame; each layer animates opacity/transform
  // via a staggered delay. The final frame gets extra dwell by repeating it.
  const frames = [...FRAMES, ...Array(Math.max(0, Math.round(dwellFinal) - 1)).fill(FRAMES[0])];

  const styleVars: React.CSSProperties & {
    "--go-size"?: string;
    "--go-loop"?: string;
    "--go-count"?: number;
  } = {
    "--go-size": typeof size === "number" ? `${size}px` : size,
    "--go-loop": `${loopSeconds}s`,
    "--go-count": frames.length,
  };

  const rootClass = [
    styles.root,
    overlay ? styles.overlay : "",
    className ?? "",
  ].join(" ").trim();

  return (
    <span className={rootClass} style={styleVars} aria-label={text} role="img">
      {frames.map((f, i) => (
        <span
          key={`${f.label}-${i}`}
          className={styles.layer}
          style={{
            fontFamily: f.fontFamily,
            letterSpacing: f.letterSpacing ?? "-0.04em",
            fontWeight: f.weight ?? 700,
            "--i": i,
          } as React.CSSProperties & { "--i": number }}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

