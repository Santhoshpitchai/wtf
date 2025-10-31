import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5ECFB1',
          dark: '#4AB89A',
        },
        danger: '#FF6B6B',
        success: '#51CF66',
        warning: '#FFD93D',
      },
    },
  },
  plugins: [],
}
export default config
