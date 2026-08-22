/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ─── Colors from design.md ───
      colors: {
        primary: {
          DEFAULT: '#0064E0',
          deep: '#0457CB',
          soft: '#0091FF',
        },
        'fb-blue': '#1876F2',
        'meta-link': '#385898',
        ink: {
          DEFAULT: '#1C1E21',
          deep: '#0A1317',
          button: '#000000',
        },
        charcoal: '#444950',
        slate: '#4B4C4F',
        steel: '#5D6C7B',
        stone: '#8595A4',
        hairline: {
          DEFAULT: '#CED0D4',
          soft: '#DEE3E9',
        },
        'disabled-text': '#BCC0C4',
        canvas: '#FFFFFF',
        'surface-soft': '#F1F4F7',
        success: {
          DEFAULT: '#31A24C',
          bg: '#24E400',
        },
        attention: '#F2A918',
        warning: {
          DEFAULT: '#F7B928',
          bg: '#FFE200',
        },
        critical: {
          DEFAULT: '#E41E3F',
          strong: '#F0284A',
        },
      },

      // ─── Typography from design.md ───
      fontFamily: {
        display: ['Montserrat', 'Helvetica', 'Arial', 'Noto Sans', 'sans-serif'],
        body: ['Montserrat', 'Helvetica', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      fontSize: {
        'hero-display': ['64px', { lineHeight: '1.16', fontWeight: '500' }],
        'display-lg': ['48px', { lineHeight: '1.17', fontWeight: '500' }],
        'heading-lg': ['36px', { lineHeight: '1.28', fontWeight: '500' }],
        'heading-md': ['28px', { lineHeight: '1.21', fontWeight: '300' }],
        'heading-sm': ['24px', { lineHeight: '1.25', fontWeight: '500' }],
        'subtitle-lg': ['18px', { lineHeight: '1.44', fontWeight: '700' }],
        'subtitle-md': ['18px', { lineHeight: '1.44', fontWeight: '400' }],
        'body-md-bold': ['16px', { lineHeight: '1.50', fontWeight: '700', letterSpacing: '-0.16px' }],
        'body-md': ['16px', { lineHeight: '1.50', fontWeight: '400', letterSpacing: '-0.16px' }],
        'body-sm-bold': ['14px', { lineHeight: '1.43', fontWeight: '700', letterSpacing: '-0.14px' }],
        'body-sm': ['14px', { lineHeight: '1.43', fontWeight: '400', letterSpacing: '-0.14px' }],
        'caption-bold': ['12px', { lineHeight: '1.33', fontWeight: '700' }],
        caption: ['12px', { lineHeight: '1.33', fontWeight: '400' }],
        'button-md': ['14px', { lineHeight: '1.43', fontWeight: '700', letterSpacing: '-0.14px' }],
      },

      // ─── Border radius from design.md ───
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        feature: '40px',
        full: '100px',
      },

      // ─── Spacing from design.md ───
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm-sp': '10px',
        'md-sp': '12px',
        'base': '16px',
        'lg-sp': '20px',
        'xl-sp': '24px',
        'xxl': '32px',
        'xxxl': '40px',
        'section-sm': '48px',
        section: '64px',
        'section-lg': '80px',
        hero: '120px',
      },

      // ─── Shadows from design.md ───
      boxShadow: {
        'pill-active': 'rgba(0, 0, 0, 0.2) 1px 1px 0px 0px',
        'sticky-panel': 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px',
      },
    },
  },
  plugins: [],
};
