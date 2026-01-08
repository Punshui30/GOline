import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: "#FAFAF7",
        lightgray: "#E9ECE9",
        sage: {
          DEFAULT: "#5B6E5A",
          light: "#6B806A",
          dark: "#4A5A49",
        },
        nearblack: "#0A0A0A", // New Premium Base
        charcoal: "#1F1F1F",
        // Functional Role Colors
        energy: "#D4AF37",    // Warm Amber/Gold (Action/Primary)
        balance: "#94A3B8",   // Cool Slate (Equilibrium/Support)
        grounding: "#4A5D23", // Deep Forest/Olive (Foundation)
        calm: "#9F9EB3",      // Muted Lavender/Thistle (Relaxation)

        // Single accent color - use sparingly for emphasis
        accent: {
          DEFAULT: "#D4AF37", // Matching Energy
          hover: "#E5C158",
          active: "#B89555",
          light: "#E5C158",
        },
        // GLEAF brand color - use very sparingly, only for GLEAF name/source indicators
        gleaf: {
          DEFAULT: "#7ED321", // GLEAF's signature green - muted for UI
          muted: "#8EB868", // More muted version for subtle use
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        relaxed: '1.75',
        loose: '2',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'image': '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
        'refined': '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
export default config;



