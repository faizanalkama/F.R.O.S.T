export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { 
    extend: {
      colors: {
        surface: 'var(--bg-primary)',
        border: 'var(--border)',
        foreground: 'var(--text-primary)',
        muted: 'var(--text-secondary)'
      }
    } 
  },
  plugins: []
}