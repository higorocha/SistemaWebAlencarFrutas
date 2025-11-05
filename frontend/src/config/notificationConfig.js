// src/config/notificationConfig.js

import { App } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import React from 'react';

// Função para detectar se é mobile (sem dependências externas)
const isMobileScreen = () => window.innerWidth < 576;

// Variável global para armazenar a instância do App do antd
let antAppInstance = null;

// Função para definir a instância do App
export const setAntAppInstance = (instance) => {
  antAppInstance = instance;
};

// Função personalizada para exibir notificações normais
export const showNotification = (type, title, description) => {
  const isMobile = isMobileScreen();

  const icons = {
    success: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: isMobile ? '18px' : '24px' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? '18px' : '24px' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />,
    warning: <WarningOutlined style={{ color: '#faad14', fontSize: isMobile ? '18px' : '24px' }} />,
  };

  // Usar a API do App se disponível, senão usar a API estática (fallback)
  if (antAppInstance && antAppInstance.notification) {
    antAppInstance.notification[type]({
      message: title,
      description: description,
      className: 'custom-notification',
      icon: icons[type],
      placement: 'top',
      top: 50,
      duration: 5,
      maxCount: 3,
      style: isMobile ? {
        fontSize: '11px',
        padding: '12px',
        minHeight: '60px',
        maxWidth: '90vw',
      } : undefined,
    });
  } else {
    // Fallback para API estática (compatibilidade)
    const { notification } = require('antd');
    notification[type]({
      message: title,
      description: description,
      className: 'custom-notification',
      icon: icons[type],
      placement: 'top',
      top: 50,
      duration: 5,
      maxCount: 3,
      style: isMobile ? {
        fontSize: '11px',
        padding: '12px',
        minHeight: '60px',
        maxWidth: '90vw',
      } : undefined,
    });
  }
};

// Função específica para notificações de pedido com JSX
export const showPedidoNotification = (type, title, cliente, frutas, frutasComDados = []) => {
  const isMobile = isMobileScreen();
  
  // Importar getFruitIcon dinamicamente para usar ícones
  let getFruitIcon = null;
  try {
    const fruitIconsModule = require('../utils/fruitIcons');
    getFruitIcon = fruitIconsModule.getFruitIcon;
  } catch (e) {
    // Se não conseguir importar, continuar sem ícones
    console.warn('Não foi possível importar getFruitIcon:', e);
  }
  
  // Função auxiliar para encontrar o nome da fruta em uma linha
  const encontrarNomeFruta = (linha) => {
    if (!linha.includes(' - ')) return null;
    const partes = linha.split(' - ');
    if (partes.length > 0) {
      const nomeFrutaLinha = partes[0].trim();
      
      if (!frutasComDados || frutasComDados.length === 0) {
        return nomeFrutaLinha;
      }
      
      const frutaEncontrada = frutasComDados.find(f => {
        if (!f || !f.nome) return false;
        const nomeFrutaLista = f.nome.toLowerCase().trim();
        const nomeFrutaLinhaLower = nomeFrutaLinha.toLowerCase().trim();
        return nomeFrutaLista === nomeFrutaLinhaLower || 
               nomeFrutaLinhaLower.includes(nomeFrutaLista) ||
               nomeFrutaLista.includes(nomeFrutaLinhaLower);
      });
      
      return frutaEncontrada ? frutaEncontrada.nome : nomeFrutaLinha;
    }
    return null;
  };
  
  // Usar a API do App se disponível, senão usar a API estática (fallback)
  const notificationApi = antAppInstance && antAppInstance.notification 
    ? antAppInstance.notification 
    : require('antd').notification;

  const icons = {
    success: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: isMobile ? '18px' : '24px' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: isMobile ? '18px' : '24px' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />,
    warning: <WarningOutlined style={{ color: '#faad14', fontSize: isMobile ? '18px' : '24px' }} />,
  };

  notificationApi[type]({
    message: (
      <span style={{ fontWeight: 'bold' }}>
        {title}
      </span>
    ),
    description: (
      <div style={{
        fontSize: isMobile ? '12px' : '14px',
        color: '#495057',
        lineHeight: '1.6'
      }}>
        {/* Cliente */}
        <div style={{
          fontWeight: '600',
          marginBottom: '8px',
          color: '#212529'
        }}>
          {cliente}
        </div>
        
        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: '#dee2e6',
          margin: '8px 0',
        }} />
        
        {/* Frutas */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {frutas.map((fruta, index) => {
            const nomeFruta = encontrarNomeFruta(fruta);
            const FruitIcon = getFruitIcon && nomeFruta ? getFruitIcon(nomeFruta, { width: 16, height: 16 }) : null;
            
            return (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: isMobile ? '11px' : '13px',
                  color: '#495057'
                }}
              >
                {FruitIcon && (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    flexShrink: 0
                  }}>
                    {FruitIcon}
                  </span>
                )}
                <span>{fruta}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    className: 'pedido-notification',
    icon: icons[type],
    placement: 'top',
    top: 50,
    duration: 5,
    maxCount: 3,
    style: isMobile ? {
      fontSize: '11px',
      padding: '12px',
      minHeight: '60px',
      maxWidth: '90vw',
    } : {
      padding: '16px',
      minWidth: '320px',
    },
  });
};

// Função específica para notificações do WhatsApp
export const showWhatsAppNotification = (type, title, description) => {
  const isMobile = isMobileScreen();

  // Usar a API do App se disponível, senão usar a API estática (fallback)
  const notificationApi = antAppInstance && antAppInstance.notification 
    ? antAppInstance.notification 
    : require('antd').notification;

  notificationApi[type]({
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
