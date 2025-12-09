import React, { useState } from 'react';
import { List, Progress, Tooltip, Select, Avatar, Typography, Empty, Card, Row, Col, Divider } from 'antd';
import { getFruitIconPath } from '../../../../utils/fruitIcons';
import { EnvironmentOutlined, UserOutlined, DollarOutlined, InboxOutlined, LineChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { capitalizeName, formataLeitura, formatCurrency } from '../../../../utils/formatters';

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

const TabelaDesempenhoAreas = ({ frutas, dadosUnidades, culturaIcon, numeroMesesSelecionados, resumo }) => {
  const [frutaSelecionada, setFrutaSelecionada] = useState('Todas');
  
  // LOG: Dados recebidos no componente da tabela
  console.log('[TabelaDesempenhoAreas] Frutas recebidas:', JSON.stringify(frutas, null, 2));
  console.log('[TabelaDesempenhoAreas] Dados unidades recebidos:', JSON.stringify(dadosUnidades, null, 2));
  console.log('[TabelaDesempenhoAreas] Número de meses selecionados (prop):', numeroMesesSelecionados);
  console.log('[TabelaDesempenhoAreas] Resumo recebido:', JSON.stringify(resumo, null, 2));

  // Obter todas as unidades únicas das áreas
  const getUnidadesUnicas = () => {
    const unidadesSet = new Set();
    frutas.forEach(f => {
      f.areas.forEach(a => {
        if (a.dadosUnidades) {
          Object.keys(a.dadosUnidades).forEach(unidade => unidadesSet.add(unidade));
        }
      });
    });
    return Array.from(unidadesSet);
  };

  const unidadesUnicas = getUnidadesUnicas();

  const getDadosTabela = () => {
    let todasAreas = [];
    
    // Usar número de meses selecionados se fornecido, senão calcular baseado no gráfico
    let numeroMesesParaCalculo;
    
    if (numeroMesesSelecionados !== null && numeroMesesSelecionados !== undefined) {
      // Quando há meses selecionados, usar o número fornecido
      numeroMesesParaCalculo = numeroMesesSelecionados;
    } else {
      // Calcular número de meses únicos com colheita baseado nos dados do gráfico
      const mesesComColheita = new Set();
      frutas.forEach(f => {
        if (f.dadosGrafico) {
          f.dadosGrafico.forEach(d => {
            if (d.mes && d.ano) {
              const chaveMes = `${d.ano}-${String(d.mes).padStart(2, '0')}`;
              // Verificar se tem dados (qtd > 0 ou unidades com valores)
              const temDados = (d.qtd && d.qtd > 0) || (d.unidades && Object.keys(d.unidades).length > 0 && 
                Object.values(d.unidades).some(v => v > 0));
              if (temDados) {
                mesesComColheita.add(chaveMes);
              }
            }
          });
        }
      });
      numeroMesesParaCalculo = mesesComColheita.size || 1;
    }
    
    // LOG: Dados brutos recebidos antes do processamento
    console.log('[TabelaDesempenhoAreas] getDadosTabela - Frutas recebidas:', JSON.stringify(frutas, null, 2));
    console.log('[TabelaDesempenhoAreas] getDadosTabela - Fruta selecionada:', frutaSelecionada);
    console.log('[TabelaDesempenhoAreas] Número de meses para cálculo:', numeroMesesParaCalculo);
    
    if (frutaSelecionada === 'Todas') {
      const mapa = new Map();
      frutas.forEach(f => {
        console.log(`[TabelaDesempenhoAreas] Processando fruta: ${f.nome}, áreas:`, JSON.stringify(f.areas, null, 2));
        f.areas.forEach(a => {
          const id = `${a.nome}-${a.tipo}`;
          console.log(`[TabelaDesempenhoAreas] Processando área: ${a.nome} (${a.tipo}), dadosUnidades:`, JSON.stringify(a.dadosUnidades, null, 2));
          
          if (!mapa.has(id)) {
            mapa.set(id, { 
              nome: a.nome,
              tipo: a.tipo,
              tamanhoHa: a.tamanhoHa,
              valorTotal: 0, // Inicializar valorTotal para somar receita de todas as frutas
              dadosUnidades: {} // Objeto para agrupar por unidade
            });
          }
          
          // Somar valorTotal da área (receita)
          const areaData = mapa.get(id);
          areaData.valorTotal += a.valorTotal || 0;
          
          // Agrupar dados de todas as unidades
          if (a.dadosUnidades) {
            Object.keys(a.dadosUnidades).forEach(unidade => {
              const dados = a.dadosUnidades[unidade];
              console.log(`[TabelaDesempenhoAreas] Área ${a.nome} - Unidade ${unidade}: total=${dados.total}, produtividade=${dados.produtividade}`);
              
              if (!mapa.get(id).dadosUnidades[unidade]) {
                mapa.get(id).dadosUnidades[unidade] = { total: 0, produtividade: 0 };
              }
              const totalAnterior = mapa.get(id).dadosUnidades[unidade].total;
              mapa.get(id).dadosUnidades[unidade].total += dados.total || 0;
              console.log(`[TabelaDesempenhoAreas] Área ${a.nome} - Unidade ${unidade}: total anterior=${totalAnterior}, somando=${dados.total || 0}, novo total=${mapa.get(id).dadosUnidades[unidade].total}`);
              // Produtividade será recalculada depois
            });
          }
        });
      });
      
      // Recalcular produtividade após agrupar - considerando número de meses
      // Se há meses selecionados e numeroMesesSelecionados foi fornecido, as áreas já vêm com produtividade correta
      // Mas ao agrupar áreas de múltiplas frutas, precisamos recalcular
      todasAreas = Array.from(mapa.values()).map(a => {
        const dadosUnidadesRecalculados = {};
        Object.keys(a.dadosUnidades).forEach(unidade => {
          const dados = a.dadosUnidades[unidade];
          
          // Se há meses selecionados e temos o número, recalcular baseado nisso
          // Caso contrário, usar o número de meses calculado do gráfico
          const mediaMensal = dados.total / numeroMesesParaCalculo;
          dadosUnidadesRecalculados[unidade] = {
            total: dados.total,
            produtividade: a.tamanhoHa > 0 ? (mediaMensal / a.tamanhoHa) : 0
          };
          console.log(`[TabelaDesempenhoAreas] Área ${a.nome} - Unidade ${unidade} FINAL: total=${dados.total}, meses=${numeroMesesParaCalculo}, mediaMensal=${mediaMensal}, produtividade=${dadosUnidadesRecalculados[unidade].produtividade}, tamanhoHa=${a.tamanhoHa}`);
        });
        return {
          ...a,
          dadosUnidades: dadosUnidadesRecalculados
        };
      });
      
      console.log('[TabelaDesempenhoAreas] Todas as áreas após agrupamento:', JSON.stringify(todasAreas, null, 2));
    } else {
      const fruta = frutas.find(f => f.nome === frutaSelecionada);
      todasAreas = fruta ? fruta.areas : [];
    }

    // Ordenar pela maior produtividade de qualquer unidade
    return todasAreas.sort((a, b) => {
      const valoresA = Object.values(a.dadosUnidades || {}).map((d) => d.produtividade || 0);
      const valoresB = Object.values(b.dadosUnidades || {}).map((d) => d.produtividade || 0);
      const maxA = valoresA.length > 0 ? Math.max(...valoresA) : 0;
      const maxB = valoresB.length > 0 ? Math.max(...valoresB) : 0;
      return maxB - maxA;
    });
  };

  const dataSource = getDadosTabela();
  
  // LOG: Dados processados para exibição na tabela
  console.log('[TabelaDesempenhoAreas] DataSource (dados processados):', JSON.stringify(dataSource, null, 2));

  // Calcular totais do período filtrado para o resumo
  // Sempre calcular baseado nas áreas do dataSource para garantir que reflete o período filtrado
  const calcularTotaisPeriodo = () => {
    const totaisPorUnidade = {};
    let totalReceita = 0;
    
    // Calcular totais baseado nas áreas do período filtrado
    dataSource.forEach(area => {
      // Somar receita da área
      totalReceita += area.valorTotal || 0;
      
      // Somar totais por unidade
      if (area.dadosUnidades) {
        Object.keys(area.dadosUnidades).forEach(unidade => {
          if (!totaisPorUnidade[unidade]) {
            totaisPorUnidade[unidade] = {
              totalColhido: 0,
              produtividadeMedia: 0
            };
          }
          totaisPorUnidade[unidade].totalColhido += area.dadosUnidades[unidade].total || 0;
        });
      }
    });
    
    // IMPORTANTE: A produtividade média NÃO deve ser recalculada aqui
    // Ela sempre deve vir de dadosUnidades (dadosPrincipal.resumo.dadosUnidades)
    // que já está calculada corretamente com base em todos os meses em exibição no gráfico
    // Apenas buscamos a produtividade média de dadosUnidades para cada unidade
    Object.keys(totaisPorUnidade).forEach(unidade => {
      // Buscar produtividade média de dadosUnidades (que vem do backend e já está correta)
      const dadoUnidade = dadosUnidades?.find(d => d.unidade === unidade);
      if (dadoUnidade) {
        totaisPorUnidade[unidade].produtividadeMedia = dadoUnidade.produtividadeMedia || 0;
      }
    });
    
    return { totaisPorUnidade, totalReceita };
  };

  const { totaisPorUnidade, totalReceita } = calcularTotaisPeriodo();
  
  // Converter totaisPorUnidade em array para exibição (mesmo formato de dadosUnidades)
  const dadosUnidadesExibicao = Object.keys(totaisPorUnidade).map(unidade => ({
    unidade,
    totalColhido: totaisPorUnidade[unidade].totalColhido,
    produtividadeMedia: totaisPorUnidade[unidade].produtividadeMedia
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Resumo do Período Filtrado */}
      {dadosUnidadesExibicao && dadosUnidadesExibicao.length > 0 && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16, 
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[16, 8]}>
            {/* Produção Total */}
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                  PRODUÇÃO TOTAL
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                  {dadosUnidadesExibicao.map((dado, idx) => (
                    <div key={dado.unidade} style={{ marginBottom: idx < dadosUnidadesExibicao.length - 1 ? 2 : 0 }}>
                      {formataLeitura ? formataLeitura(dado.totalColhido || 0) : (dado.totalColhido || 0).toLocaleString('pt-BR')} {dado.unidade}
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            
            {/* Receita Estimada */}
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                  RECEITA ESTIMADA
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                  {formatCurrency ? formatCurrency(totalReceita) : `R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
            </Col>
            
            {/* Produtividade Média */}
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  PRODUTIVIDADE MÉDIA
                  <Tooltip 
                    title={
                      <div style={{ maxWidth: 300 }}>
                        <div style={{ marginBottom: 8, fontWeight: 600 }}>Como é calculada:</div>
                        <div style={{ marginBottom: 4 }}>
                          A produtividade média é calculada com base em <strong>todos os meses em exibição no gráfico</strong> (não apenas os meses selecionados).
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Fórmula:</strong> (Total Colhido ÷ Número de Meses em Exibição) ÷ Área Total (ha)
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                          Exemplo: Se o gráfico mostra 3 meses (outubro, novembro, dezembro), a produtividade média considera os 3 meses, mesmo que você tenha clicado apenas em um deles.
                        </div>
                      </div>
                    }
                    placement="top"
                  >
                    <InfoCircleOutlined style={{ fontSize: 12, color: '#94a3b8', cursor: 'help' }} />
                  </Tooltip>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                  {dadosUnidadesExibicao.map((dado, idx) => (
                    <div key={dado.unidade} style={{ marginBottom: idx < dadosUnidadesExibicao.length - 1 ? 2 : 0 }}>
                      {formataLeitura ? formataLeitura(Math.round(dado.produtividadeMedia || 0)) : (dado.produtividadeMedia || 0).toFixed(0)} {dado.unidade}/ha
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Seletor Estilizado */}
      <div style={{ marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <Select 
          value={frutaSelecionada} 
          onChange={setFrutaSelecionada} 
          style={{ width: '100%' }}
          variant="borderless"
          className="custom-select-fruta"
        >
          <Select.Option value="Todas">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeAvatar size={20} src="/icons/frutas_64x64.png" shape="square" /> 
              <span style={{ fontWeight: 500 }}>Todas as Frutas</span>
            </div>
          </Select.Option>
          {frutas.map(f => (
            <Select.Option key={f.id} value={f.nome}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeAvatar size={20} src={culturaIcon || getFruitIconPath(f.nome)} /> 
                <span>{capitalizeName(f.nome)}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
        {dataSource.length === 0 ? (
          <Empty description="Sem dados de área" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={dataSource}
            split={false}
            renderItem={item => {
              // Obter unidades desta área
              const unidadesArea = item.dadosUnidades ? Object.keys(item.dadosUnidades) : [];
              
              // Encontrar média geral para cada unidade
              const getMediaGeral = (unidade) => {
                const dadoUnidade = dadosUnidades?.find(d => d.unidade === unidade);
                return dadoUnidade?.produtividadeMedia || 0;
              };

              return (
                <List.Item style={{ 
                  padding: '12px', 
                  marginBottom: 8, 
                  background: '#fafafa', 
                  borderRadius: 8,
                  border: '1px solid #f0f0f0' 
                }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div>
                        <Text strong style={{ color: '#333' }}>
                          {item.tipo === 'Propria' ? <EnvironmentOutlined style={{ marginRight: 6, color: '#059669' }} /> : <UserOutlined style={{ marginRight: 6, color: '#888' }} />}
                          {item.nome}
                        </Text>
                        {unidadesArea.length > 0 && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            {unidadesArea.map((unidade, idx) => {
                              // Pegar a produtividade da área (mesmo valor que aparece no tooltip como "Produtividade: X KG/ha")
                              const dados = item.dadosUnidades[unidade];
                              const produtividadeArea = dados?.produtividade || 0;
                              const totalArea = dados?.total || 0;
                              const numeroMeses = numeroMesesSelecionados || 1;
                              const mediaMensal = totalArea / numeroMeses;
                              
                              return (
                                <span key={unidade} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {idx > 0 && ' • '}
                                  <span>
                                    {formataLeitura ? formataLeitura(Math.round(produtividadeArea)) : produtividadeArea.toFixed(0)} {unidade}/ha
                                  </span>
                                  <Tooltip
                                    title={
                                      <div style={{ maxWidth: 300 }}>
                                        <div style={{ marginBottom: 8, fontWeight: 600 }}>Como é calculada:</div>
                                        <div style={{ marginBottom: 4 }}>
                                          A produtividade desta área é calculada como média mensal dividida pelo tamanho da área.
                                        </div>
                                        <div style={{ marginBottom: 4 }}>
                                          <strong>Fórmula:</strong> (Total Colhido ÷ Número de Meses em Exibição) ÷ Tamanho da Área (ha)
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                                          <div>Total colhido: {formataLeitura ? formataLeitura(totalArea) : totalArea.toLocaleString('pt-BR')} {unidade}</div>
                                          <div>Número de meses: {numeroMeses}</div>
                                          <div>Média mensal: {formataLeitura ? formataLeitura(Math.round(mediaMensal)) : mediaMensal.toFixed(0)} {unidade}/mês</div>
                                          <div>Tamanho da área: {item.tamanhoHa} ha</div>
                                          <div style={{ marginTop: 4, fontWeight: 600 }}>
                                            Produtividade: {formataLeitura ? formataLeitura(Math.round(produtividadeArea)) : produtividadeArea.toFixed(0)} {unidade}/ha
                                          </div>
                                        </div>
                                      </div>
                                    }
                                    placement="top"
                                  >
                                    <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8', cursor: 'help' }} />
                                  </Tooltip>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {/* Receita da área - vem diretamente do backend (valorTotal do frutasPedidos vinculado à área) */}
                        <Text 
                          strong
                          style={{ 
                            color: '#333',
                            fontSize: 14,
                            fontWeight: 700
                          }}
                        >
                          {formatCurrency ? formatCurrency(item.valorTotal || 0) : `R$ ${(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      <span>{item.tamanhoHa} hectares</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {unidadesArea.map((unidade, idx) => {
                          const dados = item.dadosUnidades[unidade];
                          return (
                            <span key={unidade} style={{ fontSize: 10 }}>
                              {idx > 0 && ' • '}
                              <strong>{formataLeitura ? formataLeitura(dados.total) : dados.total.toLocaleString('pt-BR')}</strong> {unidade}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Barras de Progresso - uma para cada unidade */}
                    {unidadesArea.length > 0 ? (
                      unidadesArea.map((unidade, idx) => {
                        const dados = item.dadosUnidades[unidade];
                        if (!dados) return null;
                        
                        const mediaGeral = getMediaGeral(unidade);
                        const percentual = mediaGeral > 0 ? (dados.produtividade / mediaGeral) * 100 : 0;
                        
                        // Cores baseadas no desempenho
                        let statusColor = '#f59e0b'; // Médio
                        if (percentual >= 100) statusColor = '#059669'; // Bom
                        if (percentual < 60) statusColor = '#dc2626'; // Ruim

                        return (
                          <div 
                            key={unidade}
                            style={{ 
                              marginBottom: idx < unidadesArea.length - 1 ? 8 : 0,
                              ...(idx > 0 && {
                                borderTop: '1px solid #e5e7eb',
                                paddingTop: 8,
                                marginTop: 8
                              })
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                              <span style={{ fontWeight: 500 }}>{unidade}</span>
                              <span>Eficiência: {percentual.toFixed(0)}% da média</span>
                            </div>
                            <Tooltip title={`Produtividade: ${formataLeitura ? formataLeitura(Math.round(dados.produtividade)) : dados.produtividade.toFixed(0)} ${unidade}/ha (${percentual.toFixed(0)}% da Média Geral: ${formataLeitura ? formataLeitura(Math.round(mediaGeral)) : mediaGeral.toFixed(0)} ${unidade}/ha)`}>
                              <Progress 
                                percent={Math.min(percentual, 100)} 
                                strokeColor={statusColor} 
                                showInfo={false} 
                                size="small" 
                                strokeWidth={8}
                                trailColor="#e2e8f0"
                              />
                            </Tooltip>
                            <div style={{ textAlign: 'right', marginTop: 2 }}>
                              <Text style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>
                                {formataLeitura ? formataLeitura(Math.round(dados.produtividade)) : dados.produtividade.toFixed(0)} / {formataLeitura ? formataLeitura(Math.round(mediaGeral)) : mediaGeral.toFixed(0)} {unidade}/ha
                              </Text>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                        Sem dados de unidades para esta área
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TabelaDesempenhoAreas;
