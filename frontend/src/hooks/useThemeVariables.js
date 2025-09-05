// src/hooks/useThemeVariables.js
import { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

export const useThemeVariables = () => {
  const theme = useTheme();

  useEffect(() => {
    // Aplicar CSS Variables baseadas no tema atual
    const root = document.documentElement;
    
    // Cores de Input
    root.style.setProperty('--input-text-color', theme.palette.inputs?.textColor || '#065f46');
    root.style.setProperty('--input-placeholder-color', theme.palette.inputs?.placeholderColor || '#059669');
    root.style.setProperty('--input-border-color', theme.palette.inputs?.borderColor || '#d1fae5');
    root.style.setProperty('--input-focus-border-color', theme.palette.inputs?.focusBorderColor || '#059669');
    root.style.setProperty('--input-focus-shadow-color', theme.palette.inputs?.focusBorderColor ? `${theme.palette.inputs.focusBorderColor}33` : 'rgba(5, 150, 105, 0.2)');
    root.style.setProperty('--input-background-color', theme.palette.inputs?.backgroundColor || '#ffffff');
    root.style.setProperty('--input-icon-color', theme.palette.inputs?.placeholderColor || '#059669');
    root.style.setProperty('--input-error-color', theme.palette.inputs?.errorTextColor || '#ff4d4f');
    root.style.setProperty('--input-error-hover-color', '#ff7875');
    
  }, [theme.palette.inputs, theme.palette.mode]);
}; 