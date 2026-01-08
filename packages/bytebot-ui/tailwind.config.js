/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kronos: {
          obsidian: '#0A0A0A',
          glass: 'rgba(10, 10, 10, 0.9)',
          border: 'rgba(255, 255, 255, 0.1)',
          'text-primary': '#F5F5F5',
          'text-secondary': '#E5E7EB',
          'status-green': 'rgba(74, 222, 128, 0.5)',
        },
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'glass-md': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      borderWidth: {
        'thin': '1px',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
