import type { Config } from "tailwindcss";

// Colours are driven by CSS variables (defined in globals.css for both the
// dark and light themes), so every semantic token flips with html[data-theme].
// Each var holds an "R G B" triple, consumed via rgb(var(--x) / <alpha-value>)
// so Tailwind opacity modifiers (bg-card/70, text-signal/30) keep working.
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds / surfaces
        ink: rgb("--ink"),
        panel: rgb("--panel"),
        card: rgb("--card"),
        line: rgb("--line"),
        // Text
        fg: rgb("--fg"),
        mut: rgb("--mut"),
        soft: rgb("--soft"),
        // Signal + accents
        signal: rgb("--signal"),
        "signal-dim": rgb("--signal-dim"),
        amber: rgb("--amber"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        arabic: ["var(--font-arabic)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { shell: "1240px" },
      borderRadius: { xl2: "20px" },
    },
  },
  plugins: [],
};

export default config;
