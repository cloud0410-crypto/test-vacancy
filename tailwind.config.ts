import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        muted: "#667085",
        canvas: "#f6f7fb",
        brand: "#6258e8"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(16, 24, 40, .06)"
      }
    }
  },
  plugins: []
};
export default config;
