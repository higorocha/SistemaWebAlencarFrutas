// src/config/notificationConfig.js

import { notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import React from 'react';

// Função para detectar se é mobile (sem dependências externas)
const isMobileScreen = () => window.innerWidth < 576;

// Configuração global para notificações
notification.config({
  placement: 'top', // SEMPRE centralizado (mobile e desktop)
  top: 50,
  duration: 5,
  maxCount: 3,
});

// Função personalizada para exibir notificações normais
export const showNotification = (type, title, description) => {
  const isMobile = isMobileScreen();

  const icons = {
    success: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: isMobile ? '18px' : '24px' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? '18px' : '24px' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />,
    warning: <WarningOutlined style={{ color: '#faad14', fontSize: isMobile ? '18px' : '24px' }} />,
  };

  notification[type]({
    message: title,
    description: description,
    className: 'custom-notification',
    icon: icons[type],
    style: isMobile ? {
      fontSize: '11px', // Texto menor
      padding: '12px', // Padding menor
      minHeight: '60px', // Container menor
      maxWidth: '90vw', // Ajusta à tela
    } : undefined,
  });
};

// Função específica para notificações do WhatsApp
export const showWhatsAppNotification = (type, title, description) => {
  const isMobile = isMobileScreen();

  notification[type]({
    message: (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: isMobile ? '12px' : '16px', // Texto menor em mobile
        fontWeight: '600',
        color: '#1e7e34'
      }}>
        {title}
      </div>
    ),
    description: (
      <div style={{
        fontSize: isMobile ? '10px' : '14px', // Texto menor em mobile
        color: '#495057',
        marginTop: '4px',
        lineHeight: '1.4'
      }}>
        {description}
      </div>
    ),
    className: 'whatsapp-notification',
    icon: (
      <WhatsAppIcon style={{
        color: '#25D366',
        fontSize: isMobile ? '20px' : '28px', // Ícone menor em mobile
        backgroundColor: '#f0f9f0',
        borderRadius: '50%',
        padding: isMobile ? '4px' : '6px', // Padding menor em mobile
        border: '2px solid #25D366'
      }} />
    ),
    style: {
      backgroundColor: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%)',
      border: '1px solid #25D366',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.25)',
      minHeight: isMobile ? '60px' : '80px', // Container menor em mobile
      padding: isMobile ? '10px' : '16px', // Padding menor em mobile
      maxWidth: isMobile ? '90vw' : undefined, // Ajusta à tela em mobile
    },
    duration: 6 // Duração um pouco maior para notificações WhatsApp
  });
};
