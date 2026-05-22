import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ef",
          100: "#d6eed7",
          200: "#aedcb1",
          500: "#2f7d36",
          600: "#256429",
          700: "#1c4d20",
          900: "#0f2a11",
        },
      },
    },
  },
  plugins: [],
};
export default config;
