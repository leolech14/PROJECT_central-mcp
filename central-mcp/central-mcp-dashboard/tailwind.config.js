/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'scaffold-0': 'var(--scaffold-0)',
        'scaffold-1': 'var(--scaffold-1)',
        'scaffold-2': 'var(--scaffold-2)',
        'scaffold-3': 'var(--scaffold-3)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'metric-cpu': 'var(--metric-cpu)',
        'metric-memory': 'var(--metric-memory)',
        'metric-disk': 'var(--metric-disk)',
        'metric-network': 'var(--metric-network)',
      },
    },
  },
  plugins: [],
}

