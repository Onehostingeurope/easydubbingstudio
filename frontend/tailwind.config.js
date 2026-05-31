/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-variant": "#333539",
        "on-secondary-container": "#c4abff",
        "surface-container": "#1e2024",
        "on-error-container": "#ffdad6",
        "on-secondary": "#3c0091",
        "surface-container-low": "#1a1c20",
        "primary": "#adc6ff",
        "on-tertiary-fixed": "#001f26",
        "secondary": "#d0bcff",
        "surface-container-highest": "#333539",
        "on-secondary-fixed": "#23005c",
        "surface": "#111318",
        "surface-dim": "#111318",
        "tertiary-container": "#009eb9",
        "on-surface": "#e2e2e8",
        "tertiary-fixed-dim": "#4cd7f6",
        "on-error": "#690005",
        "primary-container": "#4d8eff",
        "secondary-fixed": "#e9ddff",
        "on-background": "#e2e2e8",
        "on-primary-container": "#00285d",
        "on-secondary-fixed-variant": "#5516be",
        "outline-variant": "#424754",
        "inverse-on-surface": "#2f3035",
        "surface-container-high": "#282a2e",
        "inverse-primary": "#005ac2",
        "on-primary": "#002e6a",
        "surface-tint": "#adc6ff",
        "tertiary-fixed": "#acedff",
        "error-container": "#93000a",
        "inverse-surface": "#e2e2e8",
        "on-primary-fixed": "#001a42",
        "surface-container-lowest": "#0c0e12",
        "on-tertiary-fixed-variant": "#004e5c",
        "secondary-container": "#571bc1",
        "on-surface-variant": "#c2c6d6",
        "on-primary-fixed-variant": "#004395",
        "error": "#ffb4ab",
        "surface-bright": "#37393e",
        "outline": "#8c909f",
        "secondary-fixed-dim": "#d0bcff",
        "background": "#111318",
        "on-tertiary-container": "#002f38",
        "primary-fixed-dim": "#adc6ff",
        "primary-fixed": "#d8e2ff",
        "on-tertiary": "#003640",
        "tertiary": "#4cd7f6"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "margin-md": "32px",
        "margin-sm": "16px",
        "margin-lg": "64px",
        "gutter": "24px",
        "stack-unit": "8px"
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        technical: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
