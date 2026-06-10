import tailwindcssAnimate from "tailwindcss-animate";

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
        border: "#E5E5E5",
        "border-strong": "#D4D4D4",
        input: "#E5E5E5",
        ring: "#A50034",
        background: "#FFFFFF",
        foreground: "#404040",
        heading: "#262626",
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#6B6B6B",
        },
        primary: {
          DEFAULT: "#A50034",
          hover: "#8A002B",
          soft: "#FDF2F4",
          foreground: "#FFFFFF",
        },
        surface: {
          DEFAULT: "#FAFAFA",
          2: "#F5F5F5",
        },
        status: {
          open: "#0EA5E9",
          progress: "#A50034",
          waiting: "#F59E0B",
          hold: "#8B5CF6",
          done: "#16A34A",
          archived: "#737373",
          canceled: "#A3A3A3",
        },
        danger: "#DC2626",
        success: "#16A34A",
        secondary: {
          DEFAULT: "#FAFAFA",
          foreground: "#262626",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#262626",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#262626",
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
  plugins: [tailwindcssAnimate],
}
