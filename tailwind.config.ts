import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          coral: "#ff6b61",
          pink: "#fa416a",
          red: "#e93459",
          light: "#fff0f3",
          surface: "#fafafa",
          footer: "#1d1e25",
          line: "#e9e9ed",
          muted: "#73737d",
          text: "#19191f",
        },
        primary: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(100deg, #ff7961 0%, #ff456f 100%)",
      },
      boxShadow: {
        card: "0 3px 18px rgba(20, 20, 30, 0.07)",
        button: "0 10px 25px rgba(247, 65, 100, 0.20)",
        subtle: "0 2px 10px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        card: "15px",
      },
      maxWidth: {
        content: "1440px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
