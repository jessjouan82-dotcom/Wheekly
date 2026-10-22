/** Tailwind build config (moved out of index.html). Build: see BUILD.md */
module.exports = {
  content: ['./index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      colors: {
        blush: { 50: '#FFF1F2', 100: '#FFE4E6', 200: '#FECDD3', 300: '#FDA4AF', 500: '#F43F5E', 600: '#E11D48' },
        matcha: { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC', 500: '#22C55E', 600: '#16A34A' },
        lavender: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 500: '#64748B', 700: '#334155' },
        butter: { 50: '#FEFCE8', 100: '#FEF08A', 200: '#FDE047', 500: '#EAB308', 700: '#A16207' },
        sky: { 50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 500: '#0EA5E9', 700: '#0369A1' },
        cocoa: { 800: '#0F172A', 600: '#475569', 400: '#94A3B8', 200: '#E2E8F0', 50: '#F8FAFC' }
      },
      boxShadow: {
        'squish-pink': '0 2px 4px rgba(244, 63, 94, 0.2)',
        'squish-matcha': '0 2px 4px rgba(34, 197, 94, 0.2)',
        'squish-card': '0 1px 3px rgba(0, 0, 0, 0.08)'
      },
      borderRadius: {
        'squish': '12px',
        'squish-lg': '16px'
      }
    }
  }
};
