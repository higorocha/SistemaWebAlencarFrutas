// src/components/dashboard/painel-frutas/components/SecaoCultura.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Segmented, Divider, Space, Select, Tooltip, Button, Spin } from 'antd';
import { BarChartOutlined, LineChartOutlined, EnvironmentOutlined, CalendarOutlined, ClearOutlined } from '@ant-design/icons';
import axiosInstance from '../../../../api/axiosConfig';
import CulturaHeader from './CulturaHeader';
import GraficoProdutividade from './GraficoProdutividade';
import TabelaDesempenhoAreas from './TabelaDesempenhoAreas';
import { getCulturaIconPath } from '../../../../utils/fruitIcons';
import useResponsive from '../../../../hooks/useResponsive';
import moment from '../../../../config/momentConfig';
import 'moment/locale/pt-br';
import './SecaoCultura.css';

const { Option } = Select;

const SecaoCultura = ({ culturaId, dadosIniciais, periodosDisponiveis }) => {
  const { isMobile } = useResponsive();
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(dadosIniciais);
  
  // Filtros locais para esta seção específica
  const [filtros, setFiltros] = useState({
    mes: null,
    ano: null
  }); 

  // Prepara dados para o gráfico
  const dadosAtuais = dados || dadosIniciais;
  const prepararDadosGrafico = () => {
    if (!dadosAtuais?.frutas || dadosAtuais.frutas.length === 0) return [];
    const map = new Map();
    dadosAtuais.frutas.forEach(fruta => {
      if (fruta.dadosGrafico) {
        fruta.dadosGrafico.forEach(d => {
          const key = d.dia; 
          if (!map.has(key)) map.set(key, { name: key }); 
          map.get(key)[fruta.nome] = d.qtd;
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name - b.name);
  };

  const dadosGrafico = prepararDadosGrafico();
  const chavesFrutas = dadosAtuais?.frutas ? dadosAtuais.frutas.map(f => ({ key: f.nome })) : [];

  // Ícone principal da cultura (Branco para o header)
  // Usa useState para gerenciar o ícone e permitir fallback em caso de erro
  const culturaNome = dados?.cultura || dadosIniciais?.cultura;
  const [iconMain, setIconMain] = React.useState(() => getCulturaIconPath(culturaNome));

  // Buscar dados específicos desta cultura com filtros
  const fetchDadosCultura = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.mes) params.mes = filtros.mes;
      if (filtros.ano) params.ano = filtros.ano;

      const response = await axiosInstance.get('/api/dashboard/painel-frutas', { params });
      const todasCulturas = response.data.dados || response.data;
      
      // Encontrar a cultura específica
      const culturaEncontrada = todasCulturas.find(c => c.culturaId === culturaId);
      if (culturaEncontrada) {
        setDados(culturaEncontrada);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da cultura:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar dados quando os filtros mudarem
  useEffect(() => {
    fetchDadosCultura();
  }, [filtros, culturaId]);

  // Obter anos e meses disponíveis
  const anosDisponiveis = periodosDisponiveis?.anos || [];
  const mesesPorAno = periodosDisponiveis?.mesesPorAno || {};
  
  // Obter meses disponíveis baseado no ano selecionado
  const mesesDisponiveis = filtros?.ano 
    ? (mesesPorAno[filtros.ano] || [])
    : [];

  // Quando o ano mudar, limpar o mês se ele não for válido para o novo ano
  const handleAnoChange = (ano) => {
    const novoMes = ano && filtros?.mes && mesesPorAno[ano]?.includes(filtros.mes)
      ? filtros.mes
      : null;
    setFiltros(prev => ({ ...prev, ano, mes: novoMes }));
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space>
            {/* Círculo branco para o ícone colorido no header verde */}
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)', 
              borderRadius: '50%', 
              width: 32,
              height: 32,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={iconMain} 
                alt={dados?.cultura || dadosIniciais?.cultura} 
                style={{ width: 20, height: 20, objectFit: 'contain' }} 
                onError={() => {
                  setIconMain('/icons/frutas_64x64.png');
                }}
              />
            </div>
            <span style={{ 
              color: "#ffffff", 
              fontWeight: "600", 
              fontSize: isMobile ? "0.9rem" : "1rem", 
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {dados?.cultura || dadosIniciais?.cultura}
            </span>
          </Space>
          
          {/* Filtros Compactos: Ano e Mês */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            marginLeft: 'auto'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.95)', 
              fontSize: '14px', 
              fontWeight: 700,
              lineHeight: '32px',
              whiteSpace: 'nowrap'
            }}>
              Filtros:
            </span>
            <Select 
              placeholder={
                <Space size={6}>
                  <CalendarOutlined style={{ fontSize: 12 }} />
                  <span>Ano</span>
                </Space>
              }
              value={filtros?.ano} 
              onChange={handleAnoChange}
              style={{ 
                width: isMobile ? 90 : 105,
                minWidth: isMobile ? 90 : 105
              }}
              allowClear
              bordered={false}
              size="small"
              className="compact-select-header"
              popupClassName="custom-select-dropdown"
              optionLabelProp="label"
            >
              {anosDisponiveis.length > 0 ? anosDisponiveis.map((ano) => (
                <Option key={ano} value={ano} label={
                  <Space size={6}>
                    <CalendarOutlined style={{ fontSize: 12 }} />
                    <span style={{ fontWeight: 600 }}>{ano}</span>
                  </Space>
                }>
                  <Space size={6}>
                    <CalendarOutlined style={{ fontSize: 12 }} />
                    <span style={{ fontWeight: 600 }}>{ano}</span>
                  </Space>
                </Option>
              )) : (
                <Option disabled value="sem-dados">
                  <span>Nenhum dado disponível</span>
                </Option>
              )}
            </Select>

            <Tooltip 
              title={!filtros?.ano ? "Selecione um ano primeiro" : mesesDisponiveis.length === 0 ? "Nenhum mês disponível para este ano" : ""}
              placement="top"
            >
            <Select 
              placeholder={
                <Space size={6}>
                  <CalendarOutlined style={{ fontSize: 12 }} />
                  <span>Mês</span>
                </Space>
              }
              value={filtros?.mes} 
              onChange={(v) => setFiltros(prev => ({ ...prev, mes: v }))}
                style={{ 
                  width: isMobile ? 120 : 140,
                  minWidth: isMobile ? 120 : 140
                }}
                allowClear
                bordered={false}
                size="small"
                className="compact-select-header"
                popupClassName="custom-select-dropdown"
                optionLabelProp="label"
                disabled={!filtros?.ano || mesesDisponiveis.length === 0}
              >
              {mesesDisponiveis.length > 0 ? mesesDisponiveis.map((mesNum) => {
                // Garantir que moment está em português
                const mesNome = moment().locale('pt-br').month(mesNum - 1).format('MMMM');
                return (
                  <Option key={mesNum} value={mesNum} label={
                    <Space size={6}>
                      <CalendarOutlined style={{ fontSize: 12 }} />
                      <span style={{ fontWeight: 600 }}>{mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}</span>
                    </Space>
                  }>
                    <Space size={6}>
                      <CalendarOutlined style={{ fontSize: 12 }} />
                      <span style={{ fontWeight: 600 }}>{mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}</span>
                    </Space>
                  </Option>
                );
              }) : (
                <Option disabled value="sem-meses">
                  <span>Selecione um ano primeiro</span>
                </Option>
              )}
              </Select>
            </Tooltip>

            {(filtros?.mes || filtros?.ano) && (
              <Tooltip title="Limpar filtros">
                <Button 
                  type="text" 
                  icon={<ClearOutlined />} 
                  onClick={() => setFiltros({ mes: null, ano: null })}
                  size="small"
                  style={{ 
                    color: 'rgba(255,255,255,0.85)',
                    height: '32px',
                    padding: '0 4px',
                    minWidth: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </Tooltip>
            )}
          </div>
        </div>
      }
      bordered={true}
      style={{ 
        marginBottom: 24,
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        overflow: 'visible' // Permite que a toolbar do gráfico apareça
      }}
      styles={{ 
        header: { 
          backgroundColor: "#059669", // Padrão do Projeto (Verde Principal)
          color: "#ffffff", 
          borderBottom: "2px solid #047857", // Borda inferior mais escura (Padrão VisualizarPedidoModal)
          padding: isMobile ? "8px 16px" : "12px 24px"
        },
        body: { 
          padding: isMobile ? "16px" : "24px",
          backgroundColor: "#ffffff"
        }
      }}
    >
      {/* KPIs Superiores */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Carregando dados..." />
        </div>
      ) : (
        <>
          <CulturaHeader dados={dadosAtuais} />

          <Divider style={{ margin: '24px 0', borderColor: '#f0f0f0' }} />

          <Row gutter={[32, 24]}>
        {/* Coluna Principal: Gráficos */}
        <Col xs={24} lg={15}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <Typography.Title level={5} style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChartOutlined /> Evolução da Produção
            </Typography.Title>
            
            <Segmented
              options={[
                { value: 'bar', icon: <BarChartOutlined /> },
                { value: 'line', icon: <LineChartOutlined /> },
              ]}
              value={tipoGrafico}
              onChange={setTipoGrafico}
              size="small"
            />
          </div>

          {/* Container do Gráfico com visual "clean" */}
          <div style={{ 
            minHeight: 400, 
            background: '#ffffff', 
            borderRadius: 8, 
            border: '1px solid #f0f0f0',
            padding: '16px',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.02)', // Sutil profundidade interna
            overflow: 'visible' // Permite que a toolbar apareça
          }}>
            <GraficoProdutividade 
              data={dadosGrafico} 
              keys={chavesFrutas} 
              type={tipoGrafico}
              unidade={dadosAtuais?.resumo?.unidade}
            />
          </div>
        </Col>

        {/* Coluna Lateral: Detalhamento */}
        <Col xs={24} lg={9}>
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined /> Produtividade por Área
            </Typography.Title>
          </div>
          
          <div style={{ 
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            <TabelaDesempenhoAreas 
              frutas={dadosAtuais?.frutas || []} 
              mediaGeral={dadosAtuais?.resumo?.produtividadeMedia || 0}
              unidade={dadosAtuais?.resumo?.unidade || 'Unidade'}
              culturaIcon={iconMain}
            />
          </div>
          </Col>
        </Row>
        </>
      )}
    </Card>
  );
};

export default SecaoCultura;
