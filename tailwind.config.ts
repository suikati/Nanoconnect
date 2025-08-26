import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Press Start 2P"', 'DotGothic16', ...defaultTheme.fontFamily.sans],
        sans: ['DotGothic16', '"Press Start 2P"', ...defaultTheme.fontFamily.sans],
        pixel: ['"Press Start 2P"', 'monospace']
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843'
        },
        limey: {
          400: '#a3e635',
          500: '#84cc16'
        },
        playful: {
          pink: '#ff5fa2',
          yellow: '#ffe66d',
          green: '#5dff89',
          blue: '#5fa8ff',
          purple: '#c084fc'
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#f8fafc'
        }
      },
      boxShadow: {
        pop: '0 8px 24px -6px rgba(99,102,241,0.35),0 2px 6px rgba(0,0,0,0.08)'
      },
      borderRadius: {
        xl: '22px',
        '2xl': '28px'
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4,0.6,0.2,1)',
        pop: 'pop-in 0.25s cubic-bezier(0.4,0.6,0.2,1)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pop-in': {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '70%': { transform: 'scale(1.02)', opacity: '1' },
          '100%': { transform: 'scale(1)' }
        }
      },
      backgroundImage: {
        'fun-gradient': 'radial-gradient(circle at 20% 20%, #ffecd2 0, #ffe6f7 25%, #e0f2fe 55%, #f5d0fe 85%)',
        'mesh': 'linear-gradient(115deg, #ffffff 0%, #f0f9ff 25%, #fff5f7 50%, #f5f3ff 75%, #fff 100%)'
      }
    }
  },
  plugins: [
    function(pluginApi: any) {
      const { addUtilities, addVariant } = pluginApi
      addVariant('hocus', ['&:hover', '&:focus-visible'])
      addUtilities({
        '.glass': {
          'background': 'rgba(255,255,255,0.82)',
          'box-shadow': '0 4px 18px -4px rgba(30,41,59,0.14)',
          'backdrop-filter': 'blur(16px) saturate(1.5)'
        },
        '.text-gradient': {
          'background': 'linear-gradient(92deg,#4f46e5 0%,#6366f1 30%,#d946ef 70%,#ec4899 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          'color': 'transparent'
        },
        '.text-ink-strong': {
          'color': '#1f2937'
        },
        '.text-ink-soft': {
          'color': '#374151'
        }
      })
    }
  ]
}
