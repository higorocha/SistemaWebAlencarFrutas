//src/components/Icons/PaymentIcons.js
import React from 'react';

// Ícone do PIX
export const PixIcon = ({ width = 16, height = 16, style = {} }) => (
  <img
    src="/icons/pix.svg"
    alt="PIX"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone de Boleto
export const BoletoIcon = ({ width = 16, height = 16, style = {} }) => (
  <img
    src="/icons/boleto.png"
    alt="Boleto"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
);

// Ícone de Transferência
export const TransferenciaIcon = ({ width = 16, height = 16, style = {} }) => (
  <img
    src="/icons/transferencia.png"
    alt="Transferência"
    width={width}
    height={height}
    style={{
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    }}
  />
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