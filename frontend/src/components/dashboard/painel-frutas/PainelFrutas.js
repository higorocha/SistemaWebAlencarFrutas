// src/components/dashboard/painel-frutas/PainelFrutas.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Select, Spin, Empty, Typography, Space, Tooltip, Avatar } from 'antd';
import { ReloadOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import axiosInstance from '../../../api/axiosConfig';
import SecaoCultura from './components/SecaoCultura';
import moment from '../../../config/momentConfig';
import { getCulturaIconPath } from '../../../utils/fruitIcons';

const { Option } = Select;
const { Text } = Typography;

// Componente auxiliar para Avatar com tratamento de erro seguro
const SafeAvatar = ({ src, size, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = () => {
    setImgSrc('/icons/frutas_64x64.png');
  };

  return (
    <Avatar 
      src={imgSrc} 
      size={size}
      onError={handleError}
      {...props}
    />
  );
};

const PainelFrutas = () => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [culturaFiltro, setCulturaFiltro] = useState('todas'); // Valor padrão com ícone

  // Estado para períodos disponíveis (compartilhado entre todas as seções)
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState({ 
    anos: [], 
    mesesPorAno: {} 
  });

  const fetchDados = async () => {
    setLoading(true);
    try {
      // Busca todos os dados sem filtros para obter períodos disponíveis e lista de culturas
      const response = await axiosInstance.get('/api/dashboard/painel-frutas');
      
      // O backend retorna { dados, periodosDisponiveis }
      setDados(response.data.dados || response.data); // Compatibilidade: se não vier no novo formato, usa o antigo
      
      // Atualizar períodos disponíveis se vierem na resposta
      if (response.data.periodosDisponiveis) {
        setPeriodosDisponiveis({
          anos: response.data.periodosDisponiveis.anos || [],
          mesesPorAno: response.data.periodosDisponiveis.mesesPorAno || {}
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []); // Carrega apenas uma vez na montagem

  // Filtrar culturas baseado no select
  const culturasFiltradas = culturaFiltro && culturaFiltro !== 'todas'
    ? dados.filter(c => c.culturaId === culturaFiltro)
    : dados;

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
                <Text strong style={{ fontSize: 16 }}>Filtrar por Cultura:</Text>
              </Space>
              
              <Select 
                value={culturaFiltro} 
                onChange={setCulturaFiltro}
                style={{ width: 250, borderBottom: '1px solid #d9d9d9' }}
                bordered={false}
                showSearch
                optionLabelProp="label"
                filterOption={(input, option) => {
                  // Busca pelo nome da cultura no texto da opção
                  const cultura = dados.find(c => c.culturaId === option.value);
                  if (cultura) {
                    return cultura.cultura.toLowerCase().includes(input.toLowerCase());
                  }
                  if (option.value === 'todas') {
                    return 'todas as culturas'.includes(input.toLowerCase());
                  }
                  return false;
                }}
              >
                <Option value="todas" label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafeAvatar size={20} src="/icons/frutas_64x64.png" shape="square" /> 
                    <span style={{ fontWeight: 500 }}>Todas as Culturas</span>
                  </div>
                }>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafeAvatar size={20} src="/icons/frutas_64x64.png" shape="square" /> 
                    <span style={{ fontWeight: 500 }}>Todas as Culturas</span>
                  </div>
                </Option>
                {dados.map((cultura) => (
                  <Option 
                    key={cultura.culturaId} 
                    value={cultura.culturaId}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SafeAvatar size={20} src={getCulturaIconPath(cultura.cultura)} /> 
                        <span>{cultura.cultura}</span>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SafeAvatar size={20} src={getCulturaIconPath(cultura.cultura)} /> 
                      <span>{cultura.cultura}</span>
                    </div>
                  </Option>
                ))}
              </Select>

              {culturaFiltro && culturaFiltro !== 'todas' && (
                <Tooltip title="Mostrar todas as culturas">
                  <Button 
                    type="text" 
                    icon={<ClearOutlined />} 
                    onClick={() => setCulturaFiltro('todas')}
                    danger
                  >
                    Limpar
                  </Button>
                </Tooltip>
              )}
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
          {culturasFiltradas.map((cultura) => (
            <SecaoCultura 
              key={cultura.culturaId} 
              culturaId={cultura.culturaId}
              dadosIniciais={cultura}
              periodosDisponiveis={periodosDisponiveis}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PainelFrutas;
