import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-hover": "var(--accent-hover)",
        "accent-2": "var(--accent-2)",
        "accent-3": "var(--accent-3)",
        "accent-4": "var(--accent-4)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        monad: {
          purple: "#6E54FF",
          soft: "#DDD7FE",
          ink: "#0E091C",
          cyan: "#85E6FF",
          pink: "#FF8EE4",
          orange: "#FFAE45",
        },
      },
      boxShadow: {
        sm: "var(--shadow)",
        md: "var(--shadow-md)",
      },
      fontFamily: {
        body: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Roboto Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
