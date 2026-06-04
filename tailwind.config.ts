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
          ink: "#10231f",
          moss: "#1f6b57",
          leaf: "#4f9a76",
          paper: "#f6f2e8",
          blue: "#1d5f8d",
          gold: "#b95f16",
          red: "#b42318"
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
