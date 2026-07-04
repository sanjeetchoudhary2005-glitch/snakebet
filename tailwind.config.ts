import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./games/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "bv-bg": "#0D0B14",
        "bv-surface": "#15121F",
        "bv-surface-2": "#1C1830",
        "bv-gold": "#D4A647",
        "bv-teal": "#2DD4BF",
        "bv-coral": "#FF6B6B",
        "bv-text": "#EDEAF5",
        "bv-text-dim": "#A39FB5",
        background: "#0B0B0B",
        secondary: "#141414",
        "secondary-light": "#1A1A1A",
        primary: "#FFFFFF",
        "primary-dark": "#E5E7EB",
        accent: "#FFFFFF",
        "accent-light": "#F3F4F6",
        muted: "#717686",
        "muted-light": "#94A3B8",
        border: "#2A2A2A",
        "border-light": "#333333"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', "Inter", "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "glow-green": "0 0 35px rgba(255, 255, 255, 0.25)",
        "glow-green-sm": "0 0 20px rgba(255, 255, 255, 0.18)",
        "glow-gold": "0 0 28px rgba(255, 255, 255, 0.22)",
        "glow-teal": "0 0 24px rgba(255, 255, 255, 0.2)",
        "card-premium": "0 10px 35px -12px rgba(0, 0, 0, 0.7)"
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" }
        }
      }
    },
  },
  plugins: [],
};

export default config;
