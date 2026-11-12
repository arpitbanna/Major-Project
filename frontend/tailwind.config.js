/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        slateText: {
          DEFAULT: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        borderLight: '#E5E7EB',
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        }
      }
    },
  },
  plugins: [],
};
