import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          ink: "rgb(var(--color-campus-ink) / <alpha-value>)",
          moss: "rgb(var(--color-campus-moss) / <alpha-value>)",
          leaf: "rgb(var(--color-campus-leaf) / <alpha-value>)",
          paper: "rgb(var(--color-campus-paper) / <alpha-value>)",
          blue: "rgb(var(--color-campus-blue) / <alpha-value>)",
          gold: "rgb(var(--color-campus-gold) / <alpha-value>)",
          red: "rgb(var(--color-campus-red) / <alpha-value>)"
        }
      },
      boxShadow: {
        lift: "0 18px 50px rgba(16, 35, 31, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
