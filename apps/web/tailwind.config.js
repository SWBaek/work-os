import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
        input: "rgb(var(--color-border) / <alpha-value>)",
        ring: "rgb(var(--color-primary) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        heading: "rgb(var(--color-heading) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          soft: "rgb(var(--color-primary-soft) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          2: "rgb(var(--color-surface-2) / <alpha-value>)",
        },
        status: {
          open: "rgb(var(--color-status-open) / <alpha-value>)",
          progress: "rgb(var(--color-status-progress) / <alpha-value>)",
          waiting: "rgb(var(--color-status-waiting) / <alpha-value>)",
          hold: "rgb(var(--color-status-hold) / <alpha-value>)",
          done: "rgb(var(--color-status-done) / <alpha-value>)",
          archived: "rgb(var(--color-status-archived) / <alpha-value>)",
          canceled: "rgb(var(--color-status-canceled) / <alpha-value>)",
        },
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        secondary: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          foreground: "rgb(var(--color-heading) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--color-background) / <alpha-value>)",
          foreground: "rgb(var(--color-heading) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--color-background) / <alpha-value>)",
          foreground: "rgb(var(--color-heading) / <alpha-value>)",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        full: "9999px",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssTypography,
  ],
}
