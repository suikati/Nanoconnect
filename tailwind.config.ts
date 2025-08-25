import type { Config } from 'tailwindcss';

// レトロゲーム風拡張: 8bitパレットとピクセルフォントを追加
export default <Partial<Config>>{
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retroMono: ['VT323', 'monospace'],
      },
      colors: {
        // 8-bit inspired palette
        retro: {
          black: '#0d0d0d',
          dark: '#1c1c1c',
          panel: '#22252b',
          accent: '#ffcc00',
          accent2: '#ff4d6d',
          cyan: '#38e8ff',
          green: '#5dff4d',
          magenta: '#ff4dff',
          warning: '#ff9f1c',
        },
      },
      boxShadow: {
        pixel: '0 0 0 2px #000, 0 0 0 4px #ffcc00',
        innerpixel: 'inset 0 0 0 2px #000, 0 0 0 2px #000, 0 0 0 4px #ffcc00',
      },
      spacing: {
        1.25: '0.3125rem',
      },
      animation: {
        blink: 'blink 1.2s steps(2,start) infinite',
        scan: 'scan 8s linear infinite',
        sparkle: 'sparkle 3s linear infinite',
      },
      keyframes: {
        blink: { '0%,50%': { opacity: '1' }, '50.01%,100%': { opacity: '0' } },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        sparkle: {
          '0%,100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.4)' },
        },
      },
    },
  },
};
