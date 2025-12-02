// src/components/dashboard/painel-frutas/PainelFrutas.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Select, Spin, Empty, Typography, Space, Tooltip } from 'antd';
import { ReloadOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import axiosInstance from '../../../api/axiosConfig';
import SecaoCultura from './components/SecaoCultura';
import moment from 'moment';

const { Option } = Select;
const { Text } = Typography;

const PainelFrutas = () => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  
  // Filtros inicializados como NULL (busca tudo)
  const [filtros, setFiltros] = useState({
    mes: null,
    ano: null
  });

  const fetchDados = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.mes) params.mes = filtros.mes;
      if (filtros.ano) params.ano = filtros.ano;

      const response = await axiosInstance.get('/api/dashboard/painel-frutas', { params });
      setDados(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [filtros]); // Recarrega sempre que mudar filtro

  const limparFiltros = () => {
    setFiltros({ mes: null, ano: null });
  };

  // Helper para pegar cor do tema de forma cíclica
  const getCorCultura = (index) => {
    const cores = ['#52c41a', '#fadb14', '#fa8c16', '#722ed1', '#1890ff', '#f5222d'];
    return cores[index % cores.length];
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', padding: '24px' }}>
      {/* Barra de Controle Refinada */}
      <Card 
        bordered={false} 
        style={{ 
          marginBottom: 24, 
          borderRadius: 12, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space size="large" wrap>
              <Space align="center">
                <FilterOutlined style={{ color: '#059669', fontSize: 18 }} />
                <Text strong style={{ fontSize: 16 }}>Filtros:</Text>
              </Space>
              
              <Space>
                <Select 
                  placeholder="Todos os Meses"
                  value={filtros.mes} 
                  onChange={(v) => setFiltros(prev => ({ ...prev, mes: v }))}
                  style={{ width: 160, borderBottom: '1px solid #d9d9d9' }}
                  allowClear
                  bordered={false}
                >
                  {moment.months().map((mes, i) => (
                    <Option key={i + 1} value={i + 1}>{mes}</Option>
                  ))}
                </Select>

                <Select 
                  placeholder="Todos os Anos"
                  value={filtros.ano} 
                  onChange={(v) => setFiltros(prev => ({ ...prev, ano: v }))}
                  style={{ width: 120, borderBottom: '1px solid #d9d9d9' }}
                  allowClear
                  bordered={false}
                >
                  {[0, 1, 2, 3, 4].map(i => {
                    const ano = moment().year() - i;
                    return <Option key={ano} value={ano}>{ano}</Option>;
                  })}
                </Select>

                {(filtros.mes || filtros.ano) && (
                  <Tooltip title="Limpar filtros e ver tudo">
                    <Button 
                      type="text" 
                      icon={<ClearOutlined />} 
                      onClick={limparFiltros}
                      danger
                    >
                      Limpar
                    </Button>
                  </Tooltip>
                )}
              </Space>
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button 
              type="primary"
              icon={<ReloadOutlined />} 
              onClick={fetchDados} 
              loading={loading}
              style={{ borderRadius: 6, fontWeight: 500, backgroundColor: '#059669', borderColor: '#059669' }}
            >
              Atualizar Dados
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" tip="Processando colheitas..." />
        </div>
      ) : dados.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={
            <div style={{ color: '#888' }}>
              <Text strong>Nenhum dado encontrado.</Text>
              <br/>
              Tente ajustar os filtros ou registre novas colheitas.
            </div>
          } 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {dados.map((cultura, index) => (
            <SecaoCultura 
              key={cultura.culturaId} 
              dados={cultura} 
              corTema={getCorCultura(index)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PainelFrutas;
