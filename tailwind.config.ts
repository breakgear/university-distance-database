import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17191f",
        line: "#e8e2e0",
        field: "#faf7f5",
        sash: {
          red: "#b3263a",
          deepRed: "#8f1d2d",
          blue: "#164a9f",
          sky: "#23a6d5",
          green: "#1c9b63",
          gold: "#d99a22",
          navy: "#12345c",
          violet: "#6750a4"
        }
      },
      boxShadow: {
        soft: "0 14px 36px rgba(143, 29, 45, 0.10)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans JP",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic",
          "Meiryo",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
