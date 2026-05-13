/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#F0F7F2",
          100: "#D8EDE0",
          200: "#B0DABC",
          300: "#7DC096",
          400: "#4EA36E",
          500: "#2D8653",
          600: "#1E6B3F",
          700: "#165230",
          800: "#0F3C23",
          900: "#0A2718",
          950: "#061710",
        },
        surface: "#FFFFFF",
        "surface-2": "#F5F5F7",
        "surface-3": "#EBEBED",
        border: "rgba(0,0,0,0.08)",
        "border-strong": "rgba(0,0,0,0.14)",
        ink: "#1D1D1F",
        "ink-2": "#3D3D3F",
        "ink-3": "#6E6E73",
        "ink-4": "#AEAEB2",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md": "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        "card-lg": "0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};
