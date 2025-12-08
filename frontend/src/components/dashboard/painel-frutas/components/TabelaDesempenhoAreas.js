import React, { useState } from 'react';
import { List, Progress, Tooltip, Select, Avatar, Typography, Empty } from 'antd';
import { getFruitIconPath } from '../../../../utils/fruitIcons';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { capitalizeName, formataLeitura } from '../../../../utils/formatters';

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

const TabelaDesempenhoAreas = ({ frutas, dadosUnidades, culturaIcon }) => {
  const [frutaSelecionada, setFrutaSelecionada] = useState('Todas');
  
  // Debug: verificar estrutura dos dados
  // console.log('TabelaDesempenhoAreas frutas:', frutas);
  // console.log('TabelaDesempenhoAreas dadosUnidades:', dadosUnidades);

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
    
    if (frutaSelecionada === 'Todas') {
      const mapa = new Map();
      frutas.forEach(f => {
        f.areas.forEach(a => {
          const id = `${a.nome}-${a.tipo}`;
          if (!mapa.has(id)) {
            mapa.set(id, { 
              nome: a.nome,
              tipo: a.tipo,
              tamanhoHa: a.tamanhoHa,
              dadosUnidades: {} // Objeto para agrupar por unidade
            });
          }
          
          // Agrupar dados de todas as unidades
          if (a.dadosUnidades) {
            Object.keys(a.dadosUnidades).forEach(unidade => {
              const dados = a.dadosUnidades[unidade];
              if (!mapa.get(id).dadosUnidades[unidade]) {
                mapa.get(id).dadosUnidades[unidade] = { total: 0, produtividade: 0 };
              }
              mapa.get(id).dadosUnidades[unidade].total += dados.total || 0;
              // Produtividade será recalculada depois
            });
          }
        });
      });
      
      // Recalcular produtividade após agrupar
      todasAreas = Array.from(mapa.values()).map(a => {
        const dadosUnidadesRecalculados = {};
        Object.keys(a.dadosUnidades).forEach(unidade => {
          const dados = a.dadosUnidades[unidade];
          dadosUnidadesRecalculados[unidade] = {
            total: dados.total,
            produtividade: a.tamanhoHa > 0 ? (dados.total / a.tamanhoHa) : 0
          };
        });
        return {
          ...a,
          dadosUnidades: dadosUnidadesRecalculados
        };
      });
    } else {
      const fruta = frutas.find(f => f.nome === frutaSelecionada);
      todasAreas = fruta ? fruta.areas : [];
    }

    // Ordenar pela maior produtividade de qualquer unidade
    return todasAreas.sort((a, b) => {
      const valoresA = Object.values(a.dadosUnidades || {}).map((d: any) => d.produtividade || 0);
      const valoresB = Object.values(b.dadosUnidades || {}).map((d: any) => d.produtividade || 0);
      const maxA = valoresA.length > 0 ? Math.max(...valoresA) : 0;
      const maxB = valoresB.length > 0 ? Math.max(...valoresB) : 0;
      return maxB - maxA;
    });
  };

  const dataSource = getDadosTabela();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Seletor Estilizado */}
      <div style={{ marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <Select 
          value={frutaSelecionada} 
          onChange={setFrutaSelecionada} 
          style={{ width: '100%' }}
          bordered={false}
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
                      <Text strong style={{ color: '#333' }}>
                        {item.tipo === 'Propria' ? <EnvironmentOutlined style={{ marginRight: 6, color: '#059669' }} /> : <UserOutlined style={{ marginRight: 6, color: '#888' }} />}
                        {item.nome}
                      </Text>
                      <div style={{ textAlign: 'right' }}>
                        {unidadesArea.map((unidade, idx) => {
                          const dados = item.dadosUnidades[unidade];
                          return (
                            <Text 
                              key={unidade}
                              strong={idx === 0}
                              style={{ 
                                color: idx === 0 ? '#333' : '#64748b',
                                fontSize: idx === 0 ? undefined : 12,
                                display: 'block' 
                              }}
                            >
                              {formataLeitura ? formataLeitura(dados.total) : dados.total.toLocaleString('pt-BR')} {unidade}
                            </Text>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      <span>{item.tamanhoHa} hectares</span>
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
                            <Tooltip title={`Produtividade: ${formataLeitura ? formataLeitura(Math.round(dados.produtividade)) : dados.produtividade.toFixed(0)} ${unidade}/ha (Média: ${formataLeitura ? formataLeitura(Math.round(mediaGeral)) : mediaGeral.toFixed(0)} ${unidade}/ha)`}>
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
                                {formataLeitura ? formataLeitura(Math.round(dados.produtividade)) : dados.produtividade.toFixed(0)} {unidade}/ha
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
