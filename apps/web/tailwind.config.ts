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
      },
      boxShadow: {
        sm: "var(--shadow)",
        md: "var(--shadow-md)",
      },
      fontFamily: {
        body: [
          "var(--font-body)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "Roboto Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
};
export default config;
