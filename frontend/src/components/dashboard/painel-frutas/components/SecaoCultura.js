// src/components/dashboard/painel-frutas/components/SecaoCultura.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Segmented, Divider, Space, Select, Tooltip, Button, Spin, Tag } from 'antd';
import { BarChartOutlined, LineChartOutlined, EnvironmentOutlined, CalendarOutlined, ClearOutlined } from '@ant-design/icons';
import axiosInstance from '../../../../api/axiosConfig';
import CulturaHeader from './CulturaHeader';
import GraficoProdutividade from './GraficoProdutividade';
import TabelaDesempenhoAreas from './TabelaDesempenhoAreas';
import { getCulturaIconPath } from '../../../../utils/fruitIcons';
import useResponsive from '../../../../hooks/useResponsive';
import moment from '../../../../config/momentConfig';
import { MiniSelectPersonalizavel } from '../../../common/MiniComponents';
import 'moment/locale/pt-br';
import './SecaoCultura.css';

const { Option } = Select;

const SecaoCultura = ({ culturaId, dadosIniciais, periodosDisponiveis, filtroAreas = [] }) => {
  const { isMobile } = useResponsive();
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [loading, setLoading] = useState(false);
  
  // Separação de Estados:
  // dadosPrincipal: Alimenta o Gráfico e o Header (KPIs). Mantém o histórico (ex: 12 meses).
  const [dadosPrincipal, setDadosPrincipal] = useState(dadosIniciais);
  // dadosTabela: Alimenta a Tabela de Áreas. Pode ser um recorte específico (ex: apenas Março) do clique no gráfico.
  const [dadosTabela, setDadosTabela] = useState(dadosIniciais);
  
  // Filtros locais do Header (Ano/Mês)
  const [filtros, setFiltros] = useState({
    mes: null,
    ano: null
  });
  
  // Estado para número de meses a exibir no gráfico (padrão: 12)
  const [mesesGrafico, setMesesGrafico] = useState(12);
  
  // Estado para mês selecionado no gráfico (Drill-down)
  const [mesSelecionadoGrafico, setMesSelecionadoGrafico] = useState(null); // { mes, ano } 

  // Efeito 1: Sincronizar com props do pai (Carregamento inicial ou atualização global)
  useEffect(() => {
    if (dadosIniciais) {
      setDadosPrincipal(dadosIniciais);
      setDadosTabela(dadosIniciais);
    }
  }, [dadosIniciais]);

  // Função auxiliar de busca na API
  const fetchDadosAPI = async (params) => {
    const response = await axiosInstance.get('/api/dashboard/painel-frutas', { params });
    const todasCulturas = response.data.dados || response.data;
    return todasCulturas.find(c => c.culturaId === culturaId);
  };

  // Efeito 2: Atualizar DADOS PRINCIPAIS (Header Filtros ou MesesGrafico)
  // Isso acontece quando o usuário muda o Ano/Mês lá em cima ou o range de meses (3, 6, 12)
  useEffect(() => {
    // Função para carregar dados principais
    const carregarPrincipal = async () => {
      // Se não temos culturaId, não faz sentido buscar
      if (!culturaId) return;

      setLoading(true);
      try {
        const params = {};
        
        // Prioridade: Filtros manuais do Header
        if (filtros.mes) {
          params.mes = filtros.mes;
          params.ano = filtros.ano;
        } else if (filtros.ano) {
          params.ano = filtros.ano;
        }
        
        // Se não tem filtro de mês/ano específico, usa o range
        if (!params.mes && !params.ano) {
          params.meses = mesesGrafico;
        }

        const dadosNovos = await fetchDadosAPI(params);
        if (dadosNovos) {
          setDadosPrincipal(dadosNovos);
          
          // Importante: Se NÃO tiver mês selecionado no gráfico (drill-down),
          // a tabela deve mostrar o mesmo panorama do gráfico (dados principais).
          // Se TIVER mês selecionado, NÃO mexemos na tabela aqui (ela será gerida pelo Efeito 3).
          if (!mesSelecionadoGrafico) {
            setDadosTabela(dadosNovos);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados principais:', error);
      } finally {
        setLoading(false);
      }
    };

    // Lógica de disparo:
    // 1. Se já temos dadosIniciais e nenhum filtro foi alterado pelo usuário, NÃO recarregamos na montagem.
    // 2. Se o usuário alterou filtros (filtros.ano/mes) ou mesesGrafico, recarregamos.
    // 3. Verificação simples: se dadosPrincipal é igual a dadosIniciais e filtros estão vazios, pulamos.
    
    const filtrosPadrao = !filtros.ano && !filtros.mes && mesesGrafico === 12;
    const dadosSaoIniciais = dadosPrincipal === dadosIniciais;

    if (filtrosPadrao && dadosSaoIniciais) {
      // Não faz nada, usa os dados iniciais passados pelo pai
    } else {
      carregarPrincipal();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, mesesGrafico]); // Removemos dependências instáveis

  // Efeito 3: Atualizar DADOS TABELA (Clique no Gráfico)
  useEffect(() => {
    const carregarTabela = async () => {
      // Se tiver um mês clicado no gráfico, buscamos dados específicos para a tabela
      if (mesSelecionadoGrafico) {
        try {
          const params = {
            mes: mesSelecionadoGrafico.mes,
            ano: mesSelecionadoGrafico.ano
          };
          const dadosMes = await fetchDadosAPI(params);
          if (dadosMes) {
            setDadosTabela(dadosMes);
          }
        } catch (error) {
          console.error('Erro ao carregar dados da tabela:', error);
        }
      } else {
        // Se limpou a seleção do gráfico, a tabela volta a espelhar o principal
        setDadosTabela(dadosPrincipal);
      }
    };

    carregarTabela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionadoGrafico, dadosPrincipal]); // Depende do principal para resetar quando limpar


  // Prepara dados para o GRÁFICO (Usa dadosPrincipal)
  const prepararDadosGrafico = () => {
    if (!dadosPrincipal?.frutas || dadosPrincipal.frutas.length === 0) return [];
    const map = new Map();
    dadosPrincipal.frutas.forEach(fruta => {
      if (fruta.dadosGrafico) {
        fruta.dadosGrafico.forEach(d => {
          let key, nomeFormatado;
          
          if (d.mes && d.ano) {
            key = `${d.ano}-${String(d.mes).padStart(2, '0')}`;
            const mesNome = moment().month(d.mes - 1).locale('pt-br').format('MMM');
            nomeFormatado = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${d.ano}`;
          } else if (d.periodo) {
            const [mesStr, anoStr] = d.periodo.split('/');
            const mes = parseInt(mesStr, 10);
            const ano = parseInt(anoStr, 10);
            key = `${ano}-${String(mes).padStart(2, '0')}`;
            const mesNome = moment().month(mes - 1).locale('pt-br').format('MMM');
            nomeFormatado = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}/${ano}`;
          } else {
            key = String(d.dia || d.mes || 'N/A');
            nomeFormatado = key;
          }
          
          if (!map.has(key)) {
            map.set(key, { 
              name: nomeFormatado,
              mes: d.mes,
              ano: d.ano,
              dia: d.dia,
              unidades: d.unidades || {},
              _sortKey: key
            }); 
          }
          map.get(key)[fruta.nome] = (map.get(key)[fruta.nome] || 0) + (d.qtd || 0);
          
          if (d.unidades && Object.keys(d.unidades).length > 0) {
            Object.keys(d.unidades).forEach(unidade => {
              const atual = map.get(key).unidades[unidade] || 0;
              map.get(key).unidades[unidade] = atual + (d.unidades[unidade] || 0);
            });
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a._sortKey && b._sortKey) return a._sortKey.localeCompare(b._sortKey);
      if (a.ano && b.ano) {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return (a.mes || 0) - (b.mes || 0);
      }
      return String(a.name).localeCompare(String(b.name));
    });
  };

  const dadosGrafico = prepararDadosGrafico();
  const chavesFrutas = dadosPrincipal?.frutas ? dadosPrincipal.frutas.map(f => ({ key: f.nome })) : [];

  // Ícone principal
  const culturaNome = dadosPrincipal?.cultura || dadosIniciais?.cultura;
  const [iconMain, setIconMain] = React.useState(() => getCulturaIconPath(culturaNome));

  // Obter anos e meses disponíveis
  const anosDisponiveis = periodosDisponiveis?.anos || [];
  const mesesPorAno = periodosDisponiveis?.mesesPorAno || {};
  const mesesDisponiveis = filtros?.ano ? (mesesPorAno[filtros.ano] || []) : [];

  // Handlers de Filtros
  const handleAnoChange = (ano) => {
    const novoMes = ano && filtros?.mes && mesesPorAno[ano]?.includes(filtros.mes) ? filtros.mes : null;
    setFiltros(prev => ({ ...prev, ano, mes: novoMes }));
    setMesSelecionadoGrafico(null); // Reseta drill-down ao mudar filtro global
  };
  
  const handleMesChange = (mes) => {
    setFiltros(prev => ({ ...prev, mes }));
    setMesSelecionadoGrafico(null); // Reseta drill-down ao mudar filtro global
  };
  
  const handleLimparFiltros = () => {
    setFiltros({ mes: null, ano: null });
    setMesSelecionadoGrafico(null);
  };
  
  const handleMesClicado = (mes, ano) => {
    setMesSelecionadoGrafico({ mes, ano });
  };
  
  const handleLimparFiltroGrafico = () => {
    setMesSelecionadoGrafico(null);
  };

  // Prepara dados para a TABELA (Usa dadosTabela e Filtro de Áreas)
  const getFrutasFiltradasPorArea = () => {
    // Usa dadosTabela como fonte, pois ela reflete o clique no gráfico
    if (!filtroAreas || filtroAreas.length === 0) return dadosTabela?.frutas || [];
    
    return (dadosTabela?.frutas || []).map(fruta => ({
      ...fruta,
      areas: (fruta.areas || []).filter(area => filtroAreas.includes(area.nome))
    })).filter(fruta => fruta.areas.length > 0);
  };

  const frutasParaTabela = getFrutasFiltradasPorArea();

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
                alt={culturaNome} 
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
              {culturaNome}
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
              onChange={handleMesChange}
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
                  onClick={handleLimparFiltros}
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
          <CulturaHeader dados={dadosPrincipal} />

          <Divider style={{ margin: '24px 0', borderColor: '#f0f0f0' }} />

          <Row gutter={[32, 24]}>
        {/* Coluna Principal: Gráficos */}
        <Col xs={24} lg={15}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12
          }}>
            <Typography.Title level={5} style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChartOutlined /> Evolução da Produção
            </Typography.Title>
            
            <Space size="middle" wrap align="center">
              {/* Select de período (apenas quando não há filtro específico) */}
              {!filtros.mes && !filtros.ano && (
                <MiniSelectPersonalizavel
                  value={mesesGrafico}
                  onChange={setMesesGrafico}
                  options={[
                    { value: 3, label: '3 meses' },
                    { value: 6, label: '6 meses' },
                    { value: 9, label: '9 meses' },
                    { value: 12, label: '12 meses' },
                  ]}
                  height="28px"
                  fontSize="13px"
                  customPadding="4px 8px 4px 28px"
                  icon={<CalendarOutlined style={{ fontSize: 14 }} />}
                  iconColor="#059669"
                  style={{ width: 120, minWidth: 120 }}
                />
              )}
              
              <Segmented
                options={[
                  { value: 'bar', icon: <BarChartOutlined /> },
                  { value: 'line', icon: <LineChartOutlined /> },
                ]}
                value={tipoGrafico}
                onChange={setTipoGrafico}
                size="small"
              />
            </Space>
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
              unidade={dadosPrincipal?.resumo?.unidade}
              dadosUnidades={dadosPrincipal?.resumo?.dadosUnidades || []}
              areaTotalHa={dadosPrincipal?.resumo?.areaTotalHa || 0}
              onMesClick={handleMesClicado}
            />
          </div>
        </Col>

        {/* Coluna Lateral: Detalhamento */}
        <Col xs={24} lg={9}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Title level={5} style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined /> Produtividade por Área
              {mesSelecionadoGrafico && (
                <Tag 
                  closable 
                  onClose={handleLimparFiltroGrafico}
                  color="green"
                  style={{ marginLeft: 8, fontSize: 12 }}
                >
                  {moment().month(mesSelecionadoGrafico.mes - 1).locale('pt-br').format('MMM').charAt(0).toUpperCase() + moment().month(mesSelecionadoGrafico.mes - 1).locale('pt-br').format('MMM').slice(1)}/{mesSelecionadoGrafico.ano}
                </Tag>
              )}
            </Typography.Title>
          </div>
          
          <div style={{ 
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            <TabelaDesempenhoAreas 
              frutas={frutasParaTabela} 
              dadosUnidades={dadosTabela?.resumo?.dadosUnidades || []}
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