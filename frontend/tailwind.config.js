/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6fb",
          100: "#e6ebf5",
          200: "#c7d1e6",
          400: "#7287b3",
          600: "#3d4f7d",
          800: "#1d2742",
          900: "#0f1525",
        },
        brand: {
          50: "#eef4ff",
          100: "#dde9ff",
          300: "#8ab0ff",
          500: "#3b6dff",
          600: "#2a55e0",
          700: "#1f3fb3",
          900: "#142473",
        },
        accent: {
          400: "#9bf2c5",
          500: "#3fd99b",
          600: "#1eb37c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(59,109,255,0.45)",
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
