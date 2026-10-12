import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#131413",
        "surface-dark": "#090A0F",
        surface: "#131413",
        "surface-dim": "#131413",
        "surface-bright": "#393938",
        "surface-container-lowest": "#0d0e0d",
        "surface-container-low": "#1b1c1b",
        "surface-container": "#1f201f",
        "surface-container-high": "#292a29",
        "surface-container-highest": "#343534",
        "primary-container": "#aff755",
        "primary-fixed": "#aff755",
        "primary-fixed-dim": "#94da3a",
        "on-primary": "#1f3700",
        "on-primary-fixed": "#102000",
        "on-primary-container": "#447000",
        "on-surface": "#e4e2e0",
        "on-surface-variant": "#c1cab1",
        "on-secondary-container": "#acb8ab",
        "border-subtle": "#232738",
        "ai-indigo": "#6366F1",
        "podium-gold": "#F59E0B",
        "status-pass": "#10B981",
        "status-warn": "#F59E0B",
        "status-error": "#F43F5E",
      },
      fontFamily: {
        pixel: ["var(--font-pixelify)", "Pixelify Sans", "monospace"],
        headline: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        telemetry: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
      letterSpacing: {
        telemetry: "0.14em",
        bracket: "0.08em",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
