/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parker: {
          cream: '#FCF5E2',        // heyparker.ai signature warm cream background
          beige: '#EDE4CE',        // PC monitor bezel beige
          darkbeige: '#D8CEB6',
          red: '#F42615',          // heyparker.ai signature bright red accent
          purple: '#7F78C5',       // floppy disk purple accent
          darkpurple: '#5C4EB2',
          yellow: '#EEBF12',       // floppy shutter yellow accent
          screenBg: '#111111',     // 90s TV black screen
          screenText: '#E5E5E5',   // 90s B&W TV silver white text
          black: '#191919',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FCF5E2',
          200: '#EFE6CD',
        },
        retro: {
          beige: '#EDE4CE',
          crimson: '#F42615',
          red: '#F42615',
          black: '#191919',
          screen: '#111111',
          screenText: '#E5E5E5',
          floppyPurple: '#7F78C5',
        }
      },
      fontFamily: {
        sans: ['"Radio Canada"', '"Radio Canada Big"', 'sans-serif'],
        radio: ['"Radio Canada"', '"Radio Canada Big"', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"Fragment Mono"', 'monospace'],
      },
      boxShadow: {
        'parker': '0 10px 30px -10px rgba(25, 25, 25, 0.15)',
        'floppy': '0 25px 50px -12px rgba(127, 120, 197, 0.4)',
        'crt-screen': 'inset 0 0 50px rgba(0,0,0,0.9), 0 0 25px rgba(255, 255, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
