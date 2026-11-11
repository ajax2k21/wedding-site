/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg':  '#4A0013', // Royal Burgundy
        'secondary-bg':'#5B0018', // Deep Maroon
        'gold':        '#d4af37', // Classic Antique Gold
        'gold-light':  '#F4D03F', // Royal Gold
        'gold-dark':   '#aa7c11', // Deep Warm Gold
        'text-main':   '#FFF8E7', // Warm Ivory
        'text-muted':  '#d6c9b0', // Muted Ivory
        'card-bg':     'rgba(74, 0, 19, 0.45)', // Maroon glass
        'accent':      '#d4af37', // Gold accent
        'accent-light':'#F4D03F', // Light Gold accent
      },
      fontFamily: {
        // `font-serif` is used for every heading — point it at the display face
        serif: ['Cormorant Garamond', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        playfair: ['Playfair Display', 'serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        devanagari: ['Noto Serif Devanagari', 'serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite alternate',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'bounce-bar': 'bounce-bar 1.2s ease infinite alternate',
        'particle': 'particle 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        'glow-pulse': { '0%': { opacity: '0.4' }, '100%': { opacity: '0.9' } },
        'fade-in-up': { 'from': { opacity: '0', transform: 'translateY(30px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
        'bounce-bar': { '10%': { height: '4px' }, '100%': { height: '18px' } },
        'particle': { '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.7' }, '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' } },
        'shimmer': { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
