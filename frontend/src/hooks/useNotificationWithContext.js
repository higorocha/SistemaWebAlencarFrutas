// hooks/useNotificationWithContext.js
// Hook personalizado para notificações que respeitam ConfigProvider
// Mantém API familiar do showNotification mas com z-index correto

import { notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import React from 'react';

const useNotificationWithContext = () => {
  const [api, contextHolder] = notification.useNotification();

  // Ícones padronizados (igual showNotification)
  const icons = {
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    warning: <WarningOutlined style={{ color: '#faad14' }} />,
  };

  // API compatível com showNotification
  const showNotificationWithContext = (type, title, description) => {
    api[type]({
      message: title,
      description: description,
      icon: icons[type],
      className: 'custom-notification',
      placement: 'top',
      duration: 5,
      // Remove style customizado - deixa o CSS global cuidar da aparência
    });
  };

  // Retorna API familiar + contextHolder
  return {
    showNotificationWithContext,
    contextHolder,
    // APIs individuais para uso direto
    success: (title, description) => showNotificationWithContext('success', title, description),
    error: (title, description) => showNotificationWithContext('error', title, description),
    info: (title, description) => showNotificationWithContext('info', title, description),
    warning: (title, description) => showNotificationWithContext('warning', title, description),
  };
};

export default useNotificationWithContext;