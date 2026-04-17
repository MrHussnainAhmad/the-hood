/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f3f0e8",
        mist: "#ece7dd",
        ink: "#121417",
        line: "#d6d1c5",
        primary: {
          50: "#f8ede8",
          100: "#efd2c5",
          200: "#e1af95",
          300: "#d28964",
          400: "#c56f48",
          500: "#b85c38",
          600: "#a14f30",
          700: "#8f4428",
          800: "#713420",
          900: "#532618",
        },
        accent: {
          50: "#e7f0ed",
          100: "#cedfd9",
          200: "#9ebeb3",
          300: "#6b9d8d",
          400: "#4a7e70",
          500: "#2f5d50",
          600: "#274d42",
          700: "#1f3d35",
          800: "#182d27",
          900: "#101d19",
        },
        neutral: {
          50: "#f7f7f6",
          100: "#efeff0",
          200: "#dadde0",
          300: "#b8bec4",
          400: "#919aa3",
          500: "#6b7681",
          600: "#545e68",
          700: "#434b53",
          800: "#2f353b",
          900: "#1f2429",
          950: "#121417",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-dm-serif)", "serif"],
      },
      screens: {
        xs: "360px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      boxShadow: {
        premium: "0 12px 50px rgba(20, 17, 15, 0.08)",
        "premium-lg": "0 24px 80px rgba(20, 17, 15, 0.14)",
        soft: "0 8px 30px rgba(47, 122, 102, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(.2,.8,.2,1)",
        "slide-up": "slideUp 0.7s cubic-bezier(.2,.8,.2,1)",
        "slide-down": "slideDown 0.6s cubic-bezier(.2,.8,.2,1)",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
