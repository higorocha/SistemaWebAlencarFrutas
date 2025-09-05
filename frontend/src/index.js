// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from '@mui/material';
import getTheme from "./theme";
import './config/momentConfig';

// Criar tema inicial
const initialTheme = getTheme('light');

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ThemeProvider theme={initialTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);