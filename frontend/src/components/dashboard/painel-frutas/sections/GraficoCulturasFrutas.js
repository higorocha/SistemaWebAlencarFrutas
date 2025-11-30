import React, { useState, useEffect } from 'react';
import { Card, Segmented, Divider, Button, Spin, Typography, Space } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../../../api/axiosConfig';
import useResponsive from '../../../../hooks/useResponsive';
import { Icon } from '@iconify/react';
import { getFruitIcon } from '../../../../utils/fruitIcons';
import { capitalizeName, intFormatter } from '../../../../utils/formatters';
import { getIconForCultura } from '../../../Icons/CulturaIconMap';

const { Title, Text } = Typography;

const GraficoCulturasFrutas = () => {
  const { isMobile } = useResponsive();
  const [tipoVisualizacao, setTipoVisualizacao] = useState('culturas'); // 'culturas' | 'frutas'
  const [itensSelecionados, setItensSelecionados] = useState([]); // IDs selecionados
  const [itensDisponiveis, setItensDisponiveis] = useState([]); // Lista completa de itens
  const [dadosGrafico, setDadosGrafico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingItens, setLoadingItens] = useState(true);

  // Carregar lista de itens disponíveis e selecionar todos por padrão
  useEffect(() => {
    const fetchItens = async () => {
      try {
        setLoadingItens(true);
        let itens = [];
        if (tipoVisualizacao === 'culturas') {
          const response = await axiosInstance.get('/api/culturas');
          itens = response.data || [];
        } else {
          const response = await axiosInstance.get('/api/frutas');
          itens = response.data?.data || response.data || [];
        }
        setItensDisponiveis(itens);
        // Selecionar todos os itens por padrão
        setItensSelecionados(itens.map(item => item.id));
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setItensDisponiveis([]);
        setItensSelecionados([]);
      } finally {
        setLoadingItens(false);
      }
    };

    fetchItens();
  }, [tipoVisualizacao]);

  // Carregar dados do gráfico
  useEffect(() => {
    const fetchDados = async () => {
      if (itensSelecionados.length === 0) {
        setDadosGrafico(null);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('tipo', tipoVisualizacao);
        itensSelecionados.forEach(id => params.append('ids', id.toString()));

        const response = await axiosInstance.get(
          `/api/dashboard/painel-frutas/culturas-frutas?${params.toString()}`
        );
        setDadosGrafico(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error);
        setDadosGrafico(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [tipoVisualizacao, itensSelecionados]);

  const handleToggleItem = (itemId) => {
    setItensSelecionados(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleToggleTipo = (value) => {
    setTipoVisualizacao(value);
    // A seleção será atualizada automaticamente pelo useEffect quando os itens carregarem
  };

  // Preparar dados para o gráfico
  // Transformar: [{ periodo: valor1, valor2, ... }, { periodo: valor1, valor2, ... }]
  const dadosFormatados = dadosGrafico?.periodos.map((periodo, periodoIndex) => {
    const dados = { periodo };
    dadosGrafico.series.forEach(serie => {
      dados[`${serie.nome} (${serie.unidadePrecificada})`] = serie.dados[periodoIndex] || 0;
    });
    return dados;
  }) || [];

  // Função para obter ícone de cultura (emoji)
  const getCulturaIcon = (culturaNome) => {
    const emoji = getIconForCultura(culturaNome);
    return <span style={{ fontSize: '16px' }}>{emoji}</span>;
  };

  // Tooltip customizado com ícones de frutas e culturas
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '14px' }}>
            {label}
          </p>
          {payload.map((entry, index) => {
            const nomeCompleto = entry.dataKey || entry.name || '';
            // Extrair nome (antes do " (unidade)")
            const partes = nomeCompleto.split(' (');
            const nomeItem = partes[0] || nomeCompleto;
            const unidade = partes[1] ? partes[1].replace(')', '') : '';
            const valor = entry.value;
            const nomeFormatado = capitalizeName(nomeItem);
            
            return (
              <div key={index} style={{ 
                marginBottom: '4px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '13px'
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: entry.color || entry.stroke,
                  borderRadius: '2px'
                }} />
                {tipoVisualizacao === 'frutas' 
                  ? getFruitIcon(nomeItem, { width: 16, height: 16 })
                  : getCulturaIcon(nomeItem)
                }
                <span style={{ fontWeight: 500 }}>{nomeFormatado}</span>
                {unidade && <span style={{ color: '#666' }}>({unidade})</span>}
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                  {typeof valor === 'number' ? intFormatter(valor) : valor}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={
        <Space>
          <Icon icon="mdi:chart-line" style={{ fontSize: '20px', color: '#059669' }} />
          <span>Gráfico de Culturas/Frutas</span>
        </Space>
      }
      style={{
        height: isMobile ? '432px' : '612px',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '12px' : '16px',
      }}
    >
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '16px', minHeight: 0 }}>
        {/* Linha superior: Toggle + Divider + Lista de Seleção */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <Text style={{
            fontSize: isMobile ? '0.8125rem' : '0.875rem',
            fontWeight: 500,
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            Tipo:
          </Text>
          <Segmented
            options={[
              { label: 'Culturas', value: 'culturas' },
              { label: 'Frutas', value: 'frutas' },
            ]}
            value={tipoVisualizacao}
            onChange={handleToggleTipo}
            size={isMobile ? 'small' : 'middle'}
            style={{
              fontWeight: "500"
            }}
          />
          
          <Divider type="vertical" style={{ height: '24px', margin: 0 }} />

          {/* Lista de Seleção na mesma linha */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
            {loadingItens ? (
              <Spin size="small" />
            ) : (
              <Space size="small" wrap>
                {itensDisponiveis.map(item => {
                  const isSelected = itensSelecionados.includes(item.id);
                  const itemNome = tipoVisualizacao === 'culturas' ? item.descricao : item.nome;
                  const itemNomeFormatado = capitalizeName(itemNome);
                  
                  return (
                    <Button
                      key={item.id}
                      type={isSelected ? 'primary' : 'default'}
                      size="small"
                      onClick={() => handleToggleItem(item.id)}
                      style={{
                        fontSize: isMobile ? '12px' : '13px',
                        height: '28px',
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '6px',
                        borderColor: isSelected ? '#059669' : '#d9d9d9',
                        backgroundColor: isSelected ? '#059669' : '#fff',
                        color: isSelected ? '#fff' : '#666',
                      }}
                    >
                      {tipoVisualizacao === 'frutas' 
                        ? getFruitIcon(itemNome, { width: 14, height: 14 })
                        : getCulturaIcon(itemNome)
                      }
                      {itemNomeFormatado}
                    </Button>
                  );
                })}
              </Space>
            )}
          </div>
        </div>

        {/* Área do gráfico */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          ) : dadosFormatados.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '8px' }}>
              <Icon icon="mdi:chart-line" style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Text type="secondary">Carregando dados do gráfico...</Text>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosFormatados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: isMobile ? '10px' : '12px' }}
                />
                <YAxis style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {dadosGrafico?.series.map((serie, index) => {
                  const dataKey = `${serie.nome} (${serie.unidadePrecificada})`;
                  return (
                    <Line
                      key={dataKey}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={`hsl(${(index * 360) / dadosGrafico.series.length}, 70%, 50%)`}
                      strokeWidth={2}
                      name={dataKey}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GraficoCulturasFrutas;

