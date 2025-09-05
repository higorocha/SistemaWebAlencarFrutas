// src/config/notificationConfig.js

import { notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import React from 'react';

// Configuração global para notificações
notification.config({
  placement: 'top',
  top: 50,
  duration: 5,
  maxCount: 3,
});

// Função personalizada para exibir notificações normais
export const showNotification = (type, title, description) => {
  const icons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  warning: <WarningOutlined style={{ color: '#faad14' }} />,
  };

  notification[type]({
    message: title,
    description: description,
    className: 'custom-notification',
    icon: icons[type],
  });
};

// Função específica para notificações do WhatsApp
export const showWhatsAppNotification = (type, title, description) => {
  notification[type]({
    message: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e7e34'
      }}>
        {title}
      </div>
    ),
    description: (
      <div style={{
        fontSize: '14px',
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
        fontSize: '28px',
        backgroundColor: '#f0f9f0',
        borderRadius: '50%',
        padding: '6px',
        border: '2px solid #25D366'
      }} />
    ),
    style: {
      backgroundColor: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%)',
      border: '1px solid #25D366',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.25)',
      minHeight: '80px'
    },
    duration: 6 // Duração um pouco maior para notificações WhatsApp
  });
};
