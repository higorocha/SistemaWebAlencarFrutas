// Placeholder - será implementado na próxima fase
import React from 'react';
import { Card, Typography } from 'antd';
import { Icon } from '@iconify/react';

const { Title } = Typography;

const ListagemAreas = () => {
  return (
    <Card title="Listagem de Áreas" style={{ minHeight: '400px' }}>
      <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
        <Icon icon="mdi:map-marker" style={{ fontSize: '64px', marginBottom: '16px', color: '#d9d9d9' }} />
        <Title level={4} type="secondary">
          Em desenvolvimento
        </Title>
      </div>
    </Card>
  );
};

export default ListagemAreas;

