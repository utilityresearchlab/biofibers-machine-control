import * as React from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';

// See: https://mui.com/material-ui/customization/dark-mode/ for theme info
// Creating custom themes can be done with:https://bareynol.github.io/mui-theme-creator/
// Color Palette generator: https://material.io/inline-tools/color/

let theme = createTheme({
	// Theme customization goes here as usual, including tonalOffset and/or
	// contrastThreshold as the augmentColor() function relies on these
  });


// https://material.io/resources/color/#!/?view.left=0&view.right=0&primary.color=7c1ea3&secondary.color=2E7D32&primary.text.color=ffffff
const customPurpleTheme = createTheme(theme, {
	palette: {
		primary: {
			main: '#7c1ea3'
		},
		secondary: {
			main: '#2e7d32'
		},
		tertiary: {
			main: '#f44336'
		},
		special: {
			// values from: https://v5-0-6.mui.com/customization/palette/
			info: '#0288d1',
			info2: '#006064',
			info3: '#29b6f6',
			success: '#2e7d32',
			success2: '#66bb6a',
			warning: '#ffa726',
			error: '#f44336',
			gray: 'gray'
		}
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
