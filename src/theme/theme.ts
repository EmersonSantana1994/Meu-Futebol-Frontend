import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#137547",
      dark: "#0d4f31",
      light: "#2a9d65"
    },
    secondary: {
      main: "#1d4ed8",
      dark: "#173ea8",
      light: "#4f7ee8"
    },
    success: {
      main: "#1f9d55"
    },
    warning: {
      main: "#d97706"
    },
    error: {
      main: "#c2410c"
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#172033",
      secondary: "#657089"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 800
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 800
    },
    h3: {
      fontSize: "1.15rem",
      fontWeight: 700
    },
    button: {
      fontWeight: 700,
      textTransform: "none"
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(21, 32, 52, 0.08)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8
        }
      }
    }
  }
});
