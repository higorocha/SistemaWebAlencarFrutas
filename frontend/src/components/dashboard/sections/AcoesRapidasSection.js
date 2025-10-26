import React from 'react';
import { Typography, Card, Button, Space } from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  AppleOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { styled } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import useResponsive from '../../../hooks/useResponsive';

const { Title } = Typography;

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  background: white;
  padding: ${props => props.$isMobile ? '12px' : '16px'};
  height: 100%;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ActionButton = styled(Button)`
  height: auto !important;
  padding: ${props => props.$isMobile ? '12px' : '16px'} !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: 2px solid #e8e8e8 !important;
  transition: all 0.3s ease !important;

  &:hover {
    border-color: #059669 !important;
    transform: translateY(-4px) !important;
    box-shadow: 0 8px 16px rgba(5, 150, 105, 0.2) !important;

    .action-icon {
      color: #059669 !important;
      transform: scale(1.15) !important;
    }

    .action-text {
      color: #059669 !important;
      font-weight: 600 !important;
    }
  }
`;

const AcoesRapidasSection = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const acoes = [
    {
      titulo: 'Novo Pedido',
      icone: <ShoppingCartOutlined className="action-icon" style={{ fontSize: isMobile ? '24px' : '28px', color: '#1890ff', transition: 'all 0.3s' }} />,
      onClick: () => navigate('/pedidos/dashboard')
    },
    {
      titulo: 'Nova Área',
      icone: <EnvironmentOutlined className="action-icon" style={{ fontSize: isMobile ? '24px' : '28px', color: '#52c41a', transition: 'all 0.3s' }} />,
      onClick: () => navigate('/areas-agricolas')
    },
    {
      titulo: 'Nova Fruta',
      icone: <AppleOutlined className="action-icon" style={{ fontSize: isMobile ? '24px' : '28px', color: '#fa8c16', transition: 'all 0.3s' }} />,
      onClick: () => navigate('/frutas')
    },
    {
      titulo: 'Novo Cliente',
      icone: <TeamOutlined className="action-icon" style={{ fontSize: isMobile ? '24px' : '28px', color: '#722ed1', transition: 'all 0.3s' }} />,
      onClick: () => navigate('/clientes')
    },
    {
      titulo: 'Novo Fornecedor',
      icone: <UserAddOutlined className="action-icon" style={{ fontSize: isMobile ? '24px' : '28px', color: '#eb2f96', transition: 'all 0.3s' }} />,
      onClick: () => navigate('/fornecedores')
    },
  ];

  return (
    <CardStyled $isMobile={isMobile}>
      <Title
        level={4}
        style={{
          color: '#2E7D32',
          marginBottom: isMobile ? '12px' : '16px',
          fontSize: '1rem',
          marginTop: 0
        }}
      >
        ⚡ Ações Rápidas
      </Title>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: isMobile ? '8px' : '12px',
        maxHeight: isMobile ? '300px' : '450px',
        overflowY: 'auto'
      }}>
        {acoes.map((acao, index) => (
          <ActionButton
            key={index}
            $isMobile={isMobile}
            onClick={acao.onClick}
            type="default"
          >
            {acao.icone}
            <span className="action-text" style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: '500',
              color: '#333',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              {acao.titulo}
            </span>
          </ActionButton>
        ))}
      </div>
    </CardStyled>
  );
};

export default AcoesRapidasSection;
