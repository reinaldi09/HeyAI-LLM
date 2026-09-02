import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: {
          50: "#f5f7fb",
          100: "#e8eef7",
          200: "#cfdbec",
          300: "#aebfd8",
          400: "#8296b6",
          500: "#60728e",
          600: "#485870",
          700: "#344157",
          800: "#1f2b3d",
          900: "#101828",
          950: "#07111f",
        },
        sage: {
          50: "#f3f7fd",
          100: "#dce8f8",
          200: "#bfd3f3",
          300: "#95b6e7",
          400: "#638ed3",
          500: "#3d6fb8",
          600: "#2f5b9e",
          700: "#284b83",
          800: "#213e6b",
          900: "#102449",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f2e4c3",
          200: "#e6cb8f",
          300: "#d6b676",
          400: "#bc9142",
          500: "#9c7330",
        },
        cream: "#f6f8fc",
        parchment: "#edf3fb",
        porcelain: "#fbfdff",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "scan": "scan 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(400%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
