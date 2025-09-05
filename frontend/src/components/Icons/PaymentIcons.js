//src/components/Icons/PaymentIcons.js
import React from 'react';

// Ícone do PIX
export const PixIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.9 1.4C12.1 0.6 10.9 0.6 10.1 1.4L1.4 10.1C0.6 10.9 0.6 12.1 1.4 12.9L10.1 21.6C10.9 22.4 12.1 22.4 12.9 21.6L21.6 12.9C22.4 12.1 22.4 10.9 21.6 10.1L12.9 1.4Z" fill="#32BCAD" />
    <path d="M13.4 7.3L12 5.9L7.3 10.6C6.9 11 6.9 11.7 7.3 12.1L12 16.8L13.4 15.4L9.3 11.3L13.4 7.3Z" fill="white" />
    <path d="M16.7 10.6L15.3 9.2L11.2 13.3L15.3 17.4L16.7 16L13.9 13.3L16.7 10.6Z" fill="white" />
  </svg>
);

// Ícone de Boleto
export const BoletoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="18" rx="2" stroke="#1D4ED8" strokeWidth="2" fill="none" />
    <path d="M5 7H19" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 11H19" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 15H13" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Ícone de Transferência
export const TransferenciaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12L20 12" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 7L2 12L6 17" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17L20 12L16 7" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Ícone de Cartão
export const CartaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#9333EA" strokeWidth="2" fill="none" />
    <path d="M2 10H22" stroke="#9333EA" strokeWidth="2" />
    <path d="M6 14H10" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Ícone de Espécie/Dinheiro
export const EspecieIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#D97706" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" stroke="#D97706" strokeWidth="2" fill="none" />
    <path d="M5 6H5.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 6H19.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 18H19.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 18H5.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Ícone genérico para quando a forma de pagamento não for reconhecida
export const DefaultPaymentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="2" fill="none" />
    <path d="M12 7V13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 16V16.5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
  </svg>
);