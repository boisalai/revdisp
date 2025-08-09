/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GOV.UK Design System colors
        'govuk-blue': '#1d70b8',
        'govuk-dark-blue': '#003078',
        'govuk-light-blue': '#5694ca',
        'govuk-black': '#0b0c0c',
        'govuk-dark-grey': '#505a5f',
        'govuk-mid-grey': '#b1b4b6',
        'govuk-light-grey': '#f3f2f1',
        'govuk-white': '#ffffff',
        'govuk-yellow': '#ffdd00',
        'govuk-green': '#00703c',
        'govuk-red': '#d4351c',
        
        // Quebec government colors (keeping some for branding)
        'quebec-blue': {
          50: '#eff6ff',
          500: '#1d70b8',
          600: '#1d70b8',
          700: '#003078',
          900: '#003078'
        }
      },
      fontFamily: {
        'govuk': ['"GDS Transport"', 'arial', 'sans-serif'],
        'sans': ['Open Sans', 'sans-serif']
      },
      fontSize: {
        'govuk-body': ['14px', { lineHeight: '1.25' }],
        'govuk-caption': ['14px', { lineHeight: '1.25' }],
        'govuk-small': ['14px', { lineHeight: '1.14' }]
      },
      spacing: {
        'govuk-gutter': '30px'
      }
    },
  },
  plugins: [],
}