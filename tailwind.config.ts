import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: "#7C3AED",
          amber: "#F59E0B",
          dark: "#0C0C15",
          sidebar: "#08080F",
          card: "#111120",
          border: "#1C1C2E",
          text: "#EEEEFF",
          muted: "#6B6B8A",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          glow: "rgba(124,58,237,0.15)",
        },
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        premium:
          "0 0 0 1px rgba(124,58,237,0.06), 0 4px 32px rgba(0,0,0,0.5)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(124,58,237,0.4)" },
          "70%": { boxShadow: "0 0 0 10px rgba(124,58,237,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0)" },
        },
        "bounce-dot": {
          "0%,80%,100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        shake: "shake 0.3s ease-in-out",
        "pulse-ring": "pulse-ring 1.8s infinite",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #EEEEFF 0%, #7C3AED 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
