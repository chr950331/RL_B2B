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
        ink: "#171717",
        line: "#d8ddd7",
        field: "#f7f8f6",
        moss: "#58735f",
        cedar: "#8f4f3a",
        gold: "#b98f43"
      }
    }
  },
  plugins: []
};

export default config;
