import * as React from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';

// See: https://mui.com/material-ui/customization/dark-mode/ for theme info
// Creating custom themes can be done with:https://bareynol.github.io/mui-theme-creator/
// Color Palette generator: https://material.io/inline-tools/color/

// https://material.io/resources/color/#!/?view.left=0&view.right=0&primary.color=7c1ea3&secondary.color=2E7D32&primary.text.color=ffffff
const customPurpleTheme = createTheme({
	palette: {
		primary: {
			light: '#af52d5',
			main: '#7c1ea3',
			dark: '#4a0073',
			contrastText: '#fff',
			text: '#ffffff'
		},
		secondary: {
			light: '#60ad5e',
			main: '#2e7d32',
			dark: '#005005',
			contrastText: '#000',
			text: '#ffffff'
		},
	},
});

const customLightBlueTheme = createTheme({
		palette: {
			primary: {
				light: '#757ce8',
				main: '#3f50b5',
				dark: '#002884',
				contrastText: '#fff',
			},
			secondary: {
				light: '#ff7961',
				main: '#f44336',
				dark: '#ba000d',
				contrastText: '#000',
			},
		},
});


const darkGrayTheme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#212121',
      paper: '#424242',
    },
  }
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

function applyTheme(rendered) {
	return (
    <ThemeProvider theme={customPurpleTheme}>
      <CssBaseline />
      <main>{rendered}</main>
    </ThemeProvider>
  );
}

export default applyTheme;
