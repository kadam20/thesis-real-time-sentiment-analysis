import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const CustomPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          50: '{zinc.50}',
          100: '{zinc.200}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.700}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
          red: '{red.500}',
          blue: '{blue.500}',
          orange: '{orange.500}',
          green: '{green.500}'
        },
        highlight: {
          background: 'rgba(0, 0, 0, 0.99)',
          focusBackground: 'rgba(0, 0, 0, 0.99)',
          color: 'rgba(255, 255, 255, 0.99)',
          focusColor: 'rgba(255, 255, 255, 0.99)',
        },
        custom: {
          cardcolor: '{zinc.300}', // Light gray
        },
      },
      dark: {
        primary: {
          50: '{zinc.900}',
          100: '{zinc.800}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.100}',
          500: '{zinc.100}',
          600: '{zinc.600}',
          700: '{zinc.200}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
          red: '{red.500}',
          blue: '{blue.500}',
          orange: '{orange.500}',
          green: '{green.500}'
        },
        highlight: {
          background: 'rgba(0, 0, 0, 0.99)',
          focusBackground: 'rgba(0, 0, 0, 0.99)',
          color: 'rgba(255, 255, 255, 0.99)',
          focusColor: 'rgba(255, 255, 255, 0.99)',
        },
        custom: {
          cardcolor: '{zinc.800}', // Dark gray
        },
      },
    },
  },
  components: {
    card: {
      colorScheme: {
        light: {
          root: {
            background: '{custom.cardcolor}',
            borderRadius: '4px',
          },
        },
        dark: {
          root: {
            background: '{custom.cardcolor}',
            borderRadius: '4px',
          },
        },
      },
    },
  },
});
