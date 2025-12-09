// src/components/dashboard/painel-frutas/components/SecaoCultura.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Segmented, Divider, Space, Select, Tooltip, Button, Spin, Tag } from 'antd';
import { BarChartOutlined, LineChartOutlined, EnvironmentOutlined, CalendarOutlined, ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  
  // Estado para meses selecionados no gráfico (Drill-down) - Array para permitir múltipla seleção
  const [mesesSelecionadosGrafico, setMesesSelecionadosGrafico] = useState([]); // [{ mes, ano }, ...]
  
  // Estado para controlar se a tabela está carregando dados de meses selecionados
  const [loadingTabela, setLoadingTabela] = useState(false); 

  // Efeito 1: Sincronizar com props do pai (Carregamento inicial ou atualização global)
  useEffect(() => {
    if (dadosIniciais) {
      // LOG: Dados iniciais recebidos do componente pai
      console.log(`[SecaoCultura] Dados iniciais recebidos (culturaId: ${culturaId}):`, JSON.stringify(dadosIniciais, null, 2));
      setDadosPrincipal(dadosIniciais);
      setDadosTabela(dadosIniciais);
    }
  }, [dadosIniciais, culturaId]);

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
          // LOG: Dados principais atualizados
          console.log(`[SecaoCultura] Dados principais atualizados (culturaId: ${culturaId}):`, JSON.stringify(dadosNovos, null, 2));
          console.log(`[SecaoCultura] Parâmetros da busca:`, JSON.stringify(params, null, 2));
          setDadosPrincipal(dadosNovos);
          
          // Importante: Se NÃO tiver meses selecionados no gráfico (drill-down),
          // a tabela deve mostrar o mesmo panorama do gráfico (dados principais).
          // Se TIVER meses selecionados, NÃO mexemos na tabela aqui (ela será gerida pelo Efeito 3).
          if (mesesSelecionadosGrafico.length === 0) {
            console.log(`[SecaoCultura] Atualizando dadosTabela com dados principais (sem meses selecionados)`);
            setDadosTabela(dadosNovos);
          } else {
            console.log(`[SecaoCultura] Mantendo dadosTabela (${mesesSelecionadosGrafico.length} mês(es) selecionado(s))`);
          }
        }
      } catch (error) {
        console.error('[SecaoCultura] Erro ao carregar dados principais:', error);
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
      // Se tiver meses selecionados no gráfico, buscamos dados específicos para a tabela
      if (mesesSelecionadosGrafico.length > 0) {
        setLoadingTabela(true);
        try {
          // Buscar dados de cada mês selecionado e agregar
          const promessasDados = mesesSelecionadosGrafico.map(mesAno => {
            const params = {
              mes: mesAno.mes,
              ano: mesAno.ano
            };
            return fetchDadosAPI(params);
          });
          
          const dadosMeses = await Promise.all(promessasDados);
          const dadosValidos = dadosMeses.filter(d => d !== undefined);
          
          if (dadosValidos.length > 0) {
            // Agregar dados de múltiplos meses
            // Pegar o primeiro como base e somar os totais
            const dadosAgregados = { ...dadosValidos[0] };
            
            // Agregar totais e áreas de todas as frutas
            // Primeiro, coletar todas as frutas únicas de todos os meses
            const todasFrutasUnicas = new Map();
            
            dadosValidos.forEach(dadosMes => {
              dadosMes.frutas?.forEach(fruta => {
                if (!todasFrutasUnicas.has(fruta.id)) {
                  todasFrutasUnicas.set(fruta.id, {
                    ...fruta,
                    areas: []
                  });
                }
              });
            });
            
            // Agora processar cada fruta única, coletando todas as áreas de todos os meses
            if (dadosAgregados.frutas && dadosAgregados.frutas.length > 0) {
              dadosAgregados.frutas = Array.from(todasFrutasUnicas.values()).map(frutaBase => {
                // Coletar todas as frutas desta mesma fruta de todos os meses
                const todasFrutas = dadosValidos.flatMap(d => 
                  d.frutas?.filter(f => f.id === frutaBase.id) || []
                );
                
                // Agregar áreas (somar totais por unidade e valorTotal)
                // Coletar todas as áreas únicas de TODOS os meses
                const todasAreasUnicas = new Map();
                
                // Processar todas as frutas de todos os meses para coletar todas as áreas
                todasFrutas.forEach(fruta => {
                  fruta.areas?.forEach(area => {
                    const chave = `${area.nome}-${area.tipo}`;
                    
                    if (todasAreasUnicas.has(chave)) {
                      // Área já existe, agregar valores
                      const areaExistente = todasAreasUnicas.get(chave);
                      areaExistente.valorTotal += area.valorTotal || 0;
                      
                      // Agregar dadosUnidades
                      if (area.dadosUnidades) {
                        Object.keys(area.dadosUnidades).forEach(unidade => {
                          if (!areaExistente.dadosUnidades[unidade]) {
                            areaExistente.dadosUnidades[unidade] = {
                              total: 0,
                              produtividade: 0
                            };
                          }
                          areaExistente.dadosUnidades[unidade].total += area.dadosUnidades[unidade].total || 0;
                        });
                      }
                    } else {
                      // Nova área, adicionar
                      todasAreasUnicas.set(chave, {
                        ...area,
                        valorTotal: area.valorTotal || 0,
                        dadosUnidades: { ...area.dadosUnidades }
                      });
                    }
                  });
                });
                
                console.log(`[SecaoCultura] Áreas coletadas para fruta ${frutaBase.nome}:`, Array.from(todasAreasUnicas.keys()));
                
                // Recalcular produtividade como média mensal para todas as áreas
                const areasAgregadas = Array.from(todasAreasUnicas.values()).map(area => {
                  const dadosUnidadesRecalculados = {};
                  
                  Object.keys(area.dadosUnidades || {}).forEach(unidade => {
                    const dados = area.dadosUnidades[unidade];
                    const totalAgregado = dados.total || 0;
                    const numeroMeses = mesesSelecionadosGrafico.length;
                    const mediaMensal = totalAgregado / numeroMeses;
                    
                    dadosUnidadesRecalculados[unidade] = {
                      total: totalAgregado,
                      produtividade: area.tamanhoHa > 0 
                        ? (mediaMensal / area.tamanhoHa) 
                        : 0
                    };
                  });
                  
                  return {
                    ...area,
                    dadosUnidades: dadosUnidadesRecalculados
                  };
                });
                
                // Recalcular total da fruta
                const novoTotal = areasAgregadas.reduce((sum, area) => {
                  const totalArea = Object.values(area.dadosUnidades || {}).reduce((areaSum, dados) => 
                    areaSum + (dados.total || 0), 0
                  );
                  return sum + totalArea;
                }, 0);
                
                return {
                  ...frutaBase,
                  total: novoTotal,
                  areas: areasAgregadas
                };
              });
            }
            
            // NOTA: Não recalculamos resumo.dadosUnidades aqui
            // A produtividade média sempre será calculada no TabelaDesempenhoAreas usando numeroMesesEmExibicao
            // que considera todos os meses em exibição no gráfico, não apenas os selecionados
            // Isso garante consistência: a média sempre reflete todos os meses visíveis no gráfico
            
            // LOG: Dados da tabela atualizados (drill-down do gráfico)
            const mesesStr = mesesSelecionadosGrafico.map(m => `${m.mes}/${m.ano}`).join(', ');
            console.log(`[SecaoCultura] Dados da tabela atualizados (drill-down - meses: ${mesesStr}):`, JSON.stringify(dadosAgregados, null, 2));
            setDadosTabela(dadosAgregados);
          }
        } catch (error) {
          console.error('[SecaoCultura] Erro ao carregar dados da tabela:', error);
        } finally {
          setLoadingTabela(false);
        }
      } else {
        // Se limpou a seleção do gráfico, a tabela volta a espelhar o principal
        setDadosTabela(dadosPrincipal);
        setLoadingTabela(false);
      }
    };

    carregarTabela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesesSelecionadosGrafico, dadosPrincipal]); // Depende do principal para resetar quando limpar


  // Prepara dados para o GRÁFICO (Usa dadosPrincipal ou dadosGraficoFiltrado se houver filtro de áreas)
  const prepararDadosGrafico = () => {
    // Usar dados filtrados se houver filtro de áreas, senão usar dados principais
    const dadosParaGrafico = filtroAreas && filtroAreas.length > 0 && dadosGraficoFiltrado
      ? dadosGraficoFiltrado
      : dadosPrincipal;
    
    if (!dadosParaGrafico?.frutas || dadosParaGrafico.frutas.length === 0) return [];
    
    // LOG: Dados que serão processados para o gráfico
    console.log(`[SecaoCultura] Preparando dados do gráfico (culturaId: ${culturaId}):`, JSON.stringify(dadosParaGrafico, null, 2));
    console.log(`[SecaoCultura] Filtro de áreas para gráfico:`, JSON.stringify(filtroAreas, null, 2));
    
    // Se há filtro de áreas, os dados já vêm filtrados de dadosGraficoFiltrado
    // Se não há filtro, usar dados principais normalmente
    const frutasParaGrafico = dadosParaGrafico.frutas;
    
    const map = new Map();
    frutasParaGrafico.forEach(fruta => {
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
              unidades: {}, // Inicializar vazio, será preenchido abaixo
              _sortKey: key
            }); 
          }
          map.get(key)[fruta.nome] = (map.get(key)[fruta.nome] || 0) + (d.qtd || 0);
          
          // Somar unidades (evita duplicação ao não copiar na criação inicial)
          if (d.unidades && Object.keys(d.unidades).length > 0) {
            Object.keys(d.unidades).forEach(unidade => {
              const atual = map.get(key).unidades[unidade] || 0;
              map.get(key).unidades[unidade] = atual + (d.unidades[unidade] || 0);
            });
          }
        });
      }
    });
    const dadosProcessados = Array.from(map.values()).sort((a, b) => {
      if (a._sortKey && b._sortKey) return a._sortKey.localeCompare(b._sortKey);
      if (a.ano && b.ano) {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return (a.mes || 0) - (b.mes || 0);
      }
      return String(a.name).localeCompare(String(b.name));
    });
    
    // LOG: Dados processados para o gráfico
    console.log(`[SecaoCultura] Dados processados para o gráfico:`, JSON.stringify(dadosProcessados, null, 2));
    
    return dadosProcessados;
  };

  // Estado para dados do gráfico quando há filtro de áreas
  const [dadosGraficoFiltrado, setDadosGraficoFiltrado] = useState(null);
  
  // Efeito para carregar dados do gráfico quando há filtro de áreas
  useEffect(() => {
    if (filtroAreas && filtroAreas.length > 0 && dadosPrincipal?.frutas) {
      // Coletar todos os meses únicos que aparecem no gráfico
      const mesesNoGrafico = new Set();
      dadosPrincipal.frutas.forEach(fruta => {
        if (fruta.dadosGrafico) {
          fruta.dadosGrafico.forEach(d => {
            if (d.mes && d.ano) {
              mesesNoGrafico.add(`${d.ano}-${String(d.mes).padStart(2, '0')}`);
            } else if (d.periodo) {
              const [mesStr, anoStr] = d.periodo.split('/');
              mesesNoGrafico.add(`${anoStr}-${String(mesStr).padStart(2, '0')}`);
            }
          });
        }
      });
      
      // Fazer requisições para cada mês que aparece no gráfico
      const carregarDadosGraficoFiltrado = async () => {
        try {
          const promessas = Array.from(mesesNoGrafico).map(async (chaveMes) => {
            const [ano, mes] = chaveMes.split('-');
            const params = {
              mes: parseInt(mes, 10),
              ano: parseInt(ano, 10)
            };
            const dadosMes = await fetchDadosAPI(params);
            return { chaveMes, dadosMes };
          });
          
          const resultados = await Promise.all(promessas);
          
          // Agregar dados de todos os meses, filtrando apenas áreas filtradas
          const dadosAgregados = resultados.reduce((acc, { chaveMes, dadosMes }) => {
            if (!dadosMes || !dadosMes.frutas) return acc;
            
            dadosMes.frutas.forEach(fruta => {
              if (!acc[fruta.id]) {
                acc[fruta.id] = {
                  ...fruta,
                  dadosGrafico: []
                };
              }
              
              // Filtrar áreas da fruta
              const areasFiltradas = (fruta.areas || []).filter(area => filtroAreas.includes(area.nome));
              
              if (areasFiltradas.length > 0 && fruta.dadosGrafico) {
                // Adicionar dados do gráfico deste mês
                fruta.dadosGrafico.forEach(d => {
                  acc[fruta.id].dadosGrafico.push(d);
                });
                acc[fruta.id].areas = areasFiltradas;
              }
            });
            
            return acc;
          }, {});
          
          const frutasFiltradas = Object.values(dadosAgregados).filter(fruta => 
            fruta.dadosGrafico && fruta.dadosGrafico.length > 0
          );
          
          setDadosGraficoFiltrado({ frutas: frutasFiltradas });
        } catch (error) {
          console.error('[SecaoCultura] Erro ao carregar dados do gráfico filtrado:', error);
          setDadosGraficoFiltrado(null);
        }
      };
      
      carregarDadosGraficoFiltrado();
    } else {
      setDadosGraficoFiltrado(null);
    }
  }, [filtroAreas, dadosPrincipal, culturaId]);
  
  const dadosGrafico = prepararDadosGrafico();
  const chavesFrutas = dadosPrincipal?.frutas ? dadosPrincipal.frutas.map(f => ({ key: f.nome })) : [];
  
  // Calcular número de meses em exibição no gráfico que realmente têm dados (colheita)
  // Contar apenas meses que têm dados (qtd > 0 ou unidades com valores)
  const mesesComDados = new Set();
  dadosGrafico.forEach(d => {
    // Verificar se tem dados (qtd > 0 ou unidades com valores)
    const temDados = (d.qtd && d.qtd > 0) || 
                    (d.unidades && Object.keys(d.unidades).length > 0 && 
                     Object.values(d.unidades).some(v => v > 0));
    if (temDados && d.mes && d.ano) {
      const chaveMes = `${d.ano}-${String(d.mes).padStart(2, '0')}`;
      mesesComDados.add(chaveMes);
    }
  });
  
  const numeroMesesEmExibicao = mesesComDados.size > 0 
    ? mesesComDados.size 
    : (dadosPrincipal?.resumo?.dadosUnidades?.[0] ? 1 : 0);
  
  console.log(`[SecaoCultura] Número de meses em exibição com dados: ${numeroMesesEmExibicao}`, Array.from(mesesComDados));

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
    setMesesSelecionadosGrafico([]); // Reseta drill-down ao mudar filtro global
  };
  
  const handleMesChange = (mes) => {
    setFiltros(prev => ({ ...prev, mes }));
    setMesesSelecionadosGrafico([]); // Reseta drill-down ao mudar filtro global
  };
  
  const handleLimparFiltros = () => {
    setFiltros({ mes: null, ano: null });
    setMesesSelecionadosGrafico([]);
  };
  
  const handleMesClicado = (mes, ano) => {
    setLoadingTabela(true);
    setMesesSelecionadosGrafico(prev => {
      // Verificar se o mês já está selecionado
      const jaSelecionado = prev.some(m => m.mes === mes && m.ano === ano);
      
      if (jaSelecionado) {
        // Remover se já estiver selecionado
        return prev.filter(m => !(m.mes === mes && m.ano === ano));
      } else {
        // Adicionar se não estiver selecionado
        return [...prev, { mes, ano }];
      }
    });
  };
  
  const handleLimparFiltroGrafico = () => {
    setLoadingTabela(true);
    setMesesSelecionadosGrafico([]);
  };
  
  const handleRemoverMes = (mes, ano) => {
    setLoadingTabela(true);
    setMesesSelecionadosGrafico(prev => prev.filter(m => !(m.mes === mes && m.ano === ano)));
  };

  // Prepara dados para a TABELA (Usa dadosTabela e Filtro de Áreas)
  const getFrutasFiltradasPorArea = () => {
    // Usa dadosTabela como fonte, pois ela reflete o clique no gráfico
    
    // LOG: Dados da tabela antes do filtro de áreas
    console.log(`[SecaoCultura] Dados da tabela (antes do filtro de áreas):`, JSON.stringify(dadosTabela, null, 2));
    console.log(`[SecaoCultura] Filtro de áreas aplicado:`, JSON.stringify(filtroAreas, null, 2));
    
    // Se não há mês selecionado no gráfico (drill-down), recalcular totais das áreas
    // baseado na soma dos meses do gráfico para garantir consistência
    let frutasProcessadas = dadosTabela?.frutas || [];
    
    // Nota: A produtividade média agora é calculada como média mensal no backend
    // Quando há meses selecionados, a produtividade dos meses é comparada com a média mensal global
    // Não precisamos mais ajustar a produtividade aqui
    
    if (mesesSelecionadosGrafico.length === 0 && dadosPrincipal?.frutas) {
      console.log(`[SecaoCultura] Recalculando totais das áreas baseado no gráfico (sem mês selecionado)`);
      
      frutasProcessadas = frutasProcessadas.map(frutaTabela => {
        const frutaGrafico = dadosPrincipal.frutas.find(f => f.id === frutaTabela.id);
        
        if (!frutaGrafico || !frutaGrafico.dadosGrafico || !frutaTabela.areas || frutaTabela.areas.length === 0) {
          return frutaTabela;
        }
        
        // Calcular totais por unidade do gráfico (soma de todos os meses)
        const totaisPorUnidadeGrafico = {};
        const mesesComDados = new Set(); // Para contar meses únicos com colheita
        
        frutaGrafico.dadosGrafico.forEach(d => {
          // Contar meses únicos com dados
          if (d.mes && d.ano) {
            const chaveMes = `${d.ano}-${String(d.mes).padStart(2, '0')}`;
            // Verificar se tem dados (qtd > 0 ou unidades com valores)
            const temDados = (d.qtd && d.qtd > 0) || (d.unidades && Object.keys(d.unidades).length > 0 && 
              Object.values(d.unidades).some(v => v > 0));
            if (temDados) {
              mesesComDados.add(chaveMes);
            }
          }
          
          if (d.unidades) {
            Object.keys(d.unidades).forEach(unidade => {
              if (!totaisPorUnidadeGrafico[unidade]) {
                totaisPorUnidadeGrafico[unidade] = 0;
              }
              totaisPorUnidadeGrafico[unidade] += d.unidades[unidade] || 0;
            });
          }
        });
        
        const numeroMesesComColheita = mesesComDados.size || 1; // Evitar divisão por zero
        
        console.log(`[SecaoCultura] Totais do gráfico para ${frutaTabela.nome}:`, JSON.stringify(totaisPorUnidadeGrafico, null, 2));
        console.log(`[SecaoCultura] Número de meses com colheita: ${numeroMesesComColheita}`);
        
        // Recalcular áreas: ajustar proporcionalmente para que a soma seja igual ao gráfico
        const areasRecalculadas = frutaTabela.areas.map(area => {
          const dadosUnidadesRecalculados = {};
          
          // Para cada unidade encontrada no gráfico
          Object.keys(totaisPorUnidadeGrafico).forEach(unidade => {
            const totalGrafico = totaisPorUnidadeGrafico[unidade];
            const totalAreaAtual = area.dadosUnidades?.[unidade]?.total || 0;
            
            // Calcular a soma atual de todas as áreas para esta unidade
            const totalTodasAreas = frutaTabela.areas.reduce((sum, a) => {
              return sum + (a.dadosUnidades?.[unidade]?.total || 0);
            }, 0);
            
            let novoTotal = totalAreaAtual;
            
            // Se há apenas uma área, usar o total do gráfico diretamente
            if (frutaTabela.areas.length === 1) {
              novoTotal = totalGrafico;
            } else if (totalTodasAreas > 0) {
              // Ajustar proporcionalmente: manter a proporção relativa entre áreas
              // mas garantir que a soma total seja igual ao gráfico
              const proporcao = totalAreaAtual / totalTodasAreas;
              novoTotal = totalGrafico * proporcao;
            } else if (totalGrafico > 0) {
              // Se não há totais nas áreas mas há no gráfico, distribuir igualmente
              novoTotal = totalGrafico / frutaTabela.areas.length;
            }
            
            // Calcular produtividade como média mensal: (total / número de meses) / área
            const mediaMensal = novoTotal / numeroMesesComColheita;
            dadosUnidadesRecalculados[unidade] = {
              total: novoTotal,
              produtividade: area.tamanhoHa > 0 ? (mediaMensal / area.tamanhoHa) : 0
            };
          });
          
          // Manter unidades que não estão no gráfico mas estão na área
          // Recalcular produtividade considerando o número de meses
          if (area.dadosUnidades) {
            Object.keys(area.dadosUnidades).forEach(unidade => {
              if (!dadosUnidadesRecalculados[unidade]) {
                const total = area.dadosUnidades[unidade].total;
                const mediaMensal = total / numeroMesesComColheita;
                dadosUnidadesRecalculados[unidade] = {
                  total: total,
                  produtividade: area.tamanhoHa > 0 ? (mediaMensal / area.tamanhoHa) : 0
                };
              }
            });
          }
          
          return {
            ...area,
            dadosUnidades: dadosUnidadesRecalculados
          };
        });
        
        // Verificar se a soma das áreas corresponde ao gráfico após recálculo
        Object.keys(totaisPorUnidadeGrafico).forEach(unidade => {
          const totalGrafico = totaisPorUnidadeGrafico[unidade];
          const totalAreas = areasRecalculadas.reduce((sum, a) => {
            return sum + (a.dadosUnidades?.[unidade]?.total || 0);
          }, 0);
          
          const diferenca = Math.abs(totalGrafico - totalAreas);
          console.log(`[SecaoCultura] ${frutaTabela.nome} - ${unidade}: Gráfico=${totalGrafico}, Áreas=${totalAreas.toFixed(2)}, Diferença=${diferenca.toFixed(2)}`);
        });
        
        return {
          ...frutaTabela,
          areas: areasRecalculadas
        };
      });
    }
    
    // LOG: Comparação - Totais do gráfico vs Totais das áreas
    if (frutasProcessadas && dadosPrincipal?.frutas) {
      frutasProcessadas.forEach(frutaTabela => {
        const frutaGrafico = dadosPrincipal.frutas.find(f => f.id === frutaTabela.id);
        if (frutaGrafico && frutaGrafico.dadosGrafico) {
          // Calcular total de KG do gráfico (soma de todos os meses)
          const totalKGGrafico = frutaGrafico.dadosGrafico.reduce((sum, d) => {
            return sum + (d.unidades?.KG || 0);
          }, 0);
          
          // Calcular total de KG das áreas
          const totalKGAreas = frutaTabela.areas.reduce((sum, area) => {
            return sum + (area.dadosUnidades?.KG?.total || 0);
          }, 0);
          
          console.log(`[SecaoCultura] COMPARAÇÃO ${frutaTabela.nome}:`);
          console.log(`  - Total KG do gráfico (soma de todos os meses): ${totalKGGrafico}`);
          console.log(`  - Total KG das áreas (soma de todas as áreas): ${totalKGAreas}`);
          console.log(`  - Diferença: ${totalKGGrafico - totalKGAreas}`);
          
          // Detalhar por mês
          frutaGrafico.dadosGrafico.forEach(d => {
            if (d.unidades?.KG) {
              console.log(`  - Mês ${d.periodo}: ${d.unidades.KG} KG`);
            }
          });
        }
      });
    }
    
    // Aplicar filtro de áreas se houver
    if (filtroAreas && filtroAreas.length > 0) {
      const frutasFiltradas = frutasProcessadas.map(fruta => ({
        ...fruta,
        areas: (fruta.areas || []).filter(area => filtroAreas.includes(area.nome))
      })).filter(fruta => fruta.areas.length > 0);
      
      console.log(`[SecaoCultura] Frutas para tabela (com filtro de áreas):`, JSON.stringify(frutasFiltradas, null, 2));
      return frutasFiltradas;
    }
    
    console.log(`[SecaoCultura] Frutas para tabela (sem filtro de áreas):`, JSON.stringify(frutasProcessadas, null, 2));
    return frutasProcessadas;
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
              variant="borderless"
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
                variant="borderless"
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
              mesesSelecionados={mesesSelecionadosGrafico}
            />
          </div>
        </Col>

        {/* Coluna Lateral: Detalhamento */}
        <Col xs={24} lg={9}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Title level={5} style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined /> Produtividade por Área/Período
              <Tooltip title="Produtividade calculada com base no total colhido nos meses selecionados no gráfico (ou período total) dividido pela área. A eficiência compara este resultado com a média geral do sistema.">
                <InfoCircleOutlined style={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
              </Tooltip>
              {mesesSelecionadosGrafico.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 8 }}>
                  {mesesSelecionadosGrafico.map((mesAno, index) => {
                    const mesNome = moment().month(mesAno.mes - 1).locale('pt-br').format('MMM');
                    const mesFormatado = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
                    return (
                      <Tag 
                        key={`${mesAno.mes}-${mesAno.ano}-${index}`}
                        closable 
                        onClose={() => handleRemoverMes(mesAno.mes, mesAno.ano)}
                        color="green"
                        style={{ fontSize: 12 }}
                      >
                        {mesFormatado}/{mesAno.ano}
                      </Tag>
                    );
                  })}
                  {mesesSelecionadosGrafico.length > 1 && (
                    <Tag 
                      closable 
                      onClose={handleLimparFiltroGrafico}
                      color="default"
                      style={{ fontSize: 12 }}
                    >
                      Limpar todos
                    </Tag>
                  )}
                </div>
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
              dadosUnidades={
                // IMPORTANTE: Sempre usar dadosPrincipal.resumo.dadosUnidades (média global do sistema)
                // A produtividade média será recalculada no TabelaDesempenhoAreas usando numeroMesesEmExibicao
                // que considera todos os meses em exibição no gráfico, não apenas os selecionados
                dadosPrincipal?.resumo?.dadosUnidades || []
              }
              culturaIcon={iconMain}
              numeroMesesSelecionados={
                // Sempre passar o número de meses em exibição no gráfico (não apenas os selecionados)
                // Isso garante que a produtividade média seja calculada com base em todos os meses visíveis
                !loadingTabela ? numeroMesesEmExibicao : null
              }
              resumo={
                // Passar resumo completo para exibir no card de resumo global
                mesesSelecionadosGrafico.length > 0 && dadosTabela?.resumo
                  ? dadosTabela.resumo
                  : dadosPrincipal?.resumo
              }
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