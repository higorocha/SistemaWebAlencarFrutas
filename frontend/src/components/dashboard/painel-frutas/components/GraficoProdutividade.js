import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { capitalizeName, formataLeitura, numberFormatter } from '../../../../utils/formatters';

const GraficoProdutividade = ({ data, keys, type = 'line', unidade, dadosUnidades = [], areaTotalHa = 0, onMesClick, mesesSelecionados = [] }) => {
  
  // LOG: Dados recebidos no componente do gráfico
  console.log('[GraficoProdutividade] Dados recebidos:', JSON.stringify(data, null, 2));
  console.log('[GraficoProdutividade] Keys recebidas:', JSON.stringify(keys, null, 2));
  console.log('[GraficoProdutividade] Unidade:', unidade);
  console.log('[GraficoProdutividade] Dados unidades:', JSON.stringify(dadosUnidades, null, 2));
  console.log('[GraficoProdutividade] Área total (ha):', areaTotalHa);
  
  // Validação: garantir que data e keys sejam arrays válidos
  const dataArray = Array.isArray(data) ? data : [];
  const keysArray = Array.isArray(keys) ? keys : [];
  
  // Se não houver dados, retornar mensagem
  if (dataArray.length === 0 || keysArray.length === 0) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        minHeight: "320px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
      }}>
        Sem dados para exibir
      </div>
    );
  }
  
  // Paleta de Cores Institucional (Alencar Frutas)
  const SYSTEM_COLORS = [
    '#059669', // Verde Principal
    '#1890ff', // Azul Sistema
    '#faad14', // Amarelo
    '#722ed1', // Roxo
    '#f5222d', // Vermelho
    '#13c2c2', // Ciano
    '#eb2f96', // Rosa
    '#2f54eb', // Azul Escuro
  ];

  // Helper para opacidade de cor Hex
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Transformação de Dados: Recharts -> ApexCharts
  const categories = dataArray.map(d => d.name || String(d)); 
  
  const series = keysArray.map((keyObj, index) => {
    const baseColor = SYSTEM_COLORS[index % SYSTEM_COLORS.length];
    
    return {
      name: capitalizeName(keyObj.key),
      data: dataArray.map(d => {
        const value = d[keyObj.key] || 0;
        
        // Lógica de Highlight Visual para Múltiplas Seleções
        if (type === 'bar') {
          // Se houver meses selecionados, aplicamos a lógica visual
          if (mesesSelecionados && mesesSelecionados.length > 0) {
            const isSelected = mesesSelecionados.some(m => m.mes === d.mes && m.ano === d.ano);
            
            return {
              x: d.name || String(d),
              y: value,
              fillColor: isSelected ? baseColor : hexToRgba(baseColor, 0.3), // Selecionado = Normal, Não selecionado = Pálido
              strokeColor: isSelected ? baseColor : 'transparent' // Borda apenas no selecionado
            };
          }
        }
        
        // Comportamento padrão (sem highlight específico ou não é barra)
        return value;
      })
    };
  });

  // Configurações do ApexCharts
  const options = {
    chart: {
      type: type,
      background: 'transparent',
      events: {
        dataPointClick: (event, chartContext, config) => {
          if (onMesClick && config.dataPointIndex !== undefined) {
            const dataPoint = dataArray[config.dataPointIndex];
            if (dataPoint && dataPoint.mes && dataPoint.ano) {
              onMesClick(dataPoint.mes, dataPoint.ano);
            }
          }
        },
        markerClick: (event, chartContext, { seriesIndex, dataPointIndex }) => {
          if (onMesClick && dataPointIndex !== undefined) {
            const dataPoint = dataArray[dataPointIndex];
            if (dataPoint && dataPoint.mes && dataPoint.ano) {
              onMesClick(dataPoint.mes, dataPoint.ano);
            }
          }
        }
      },
      // Desabilitar o filtro padrão de 'active' para controlar visualmente via fillColor
      states: {
        active: {
          filter: {
            type: 'none', 
          }
        },
        hover: {
          filter: {
            type: 'lighten',
            value: 0.1,
          }
        }
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'pan',
        export: {
          csv: {
            filename: 'grafico-produtividade',
            headerCategory: 'Período',
            headerValue: 'Quantidade',
          },
          svg: {
            filename: 'grafico-produtividade',
          },
          png: {
            filename: 'grafico-produtividade',
          }
        }
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
        zoomedArea: {
          fill: {
            color: '#90CAF9',
            opacity: 0.4
          },
          stroke: {
            color: '#0D47A1',
            opacity: 0.4,
            width: 1
          }
        }
      },
      selection: {
        enabled: true,
        type: 'x',
        fill: {
          color: '#24292e',
          opacity: 0.1
        },
        stroke: {
          width: 1,
          dashArray: 3,
          color: '#24292e',
          opacity: 0.4
        }
      }
    },
    colors: SYSTEM_COLORS,
    stroke: {
      // Se for linha, espessura 3. Se for barra, espessura 0 (sem borda)
      width: type === 'line' ? 3 : 0, 
      curve: 'smooth',
      lineCap: 'round',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
        dataLabels: {
          position: 'top',
        },
        // Destacar colunas selecionadas com borda mais espessa
        distributed: false,
      }
    },
    dataLabels: {
      enabled: false // Remove números poluindo o gráfico
    },
    xaxis: {
      categories: categories,
      tickPlacement: 'on', // Fix para toolbar aparecer com múltiplos gráficos
      title: {
        text: 'Período da Colheita',
        style: { fontSize: '12px', fontWeight: 600, color: '#94a3b8' },
        offsetY: 5
      },
      labels: {
        style: { fontSize: '12px', colors: '#64748b' },
        rotate: -45,
        trim: true
      },
      tooltip: {
        enabled: false // Desabilita tooltip do eixo X para usar o geral
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { 
        text: `Quantidade (${unidade || 'Unidade'})`,
        style: { color: '#94a3b8', fontSize: '12px', fontWeight: 600 }
      },
      labels: {
        formatter: (value) => numberFormatter(value), // Formata milhar (1.000)
        style: { colors: '#64748b' }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const dataPoint = dataArray[dataPointIndex];
        if (!dataPoint) return '';
        
        const periodo = dataPoint.name || '';
        const unidadesMes = dataPoint.unidades || {};
        
        // Função para encontrar média global de uma unidade (Meta/Referência)
        const getMediaGlobal = (unidade) => {
          const dadoUnidade = dadosUnidades.find(d => d.unidade === unidade);
          return dadoUnidade?.produtividadeMedia || 0;
        };
        
        let html = `<div style="padding: 10px; background: #fff; border-radius: 6px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">`;
        html += `<div style="font-weight: 600; margin-bottom: 12px; color: #333; border-bottom: 2px solid #059669; padding-bottom: 6px; font-size: 14px;">${periodo}</div>`;
        
        // Exibir unidades físicas do mês
        if (Object.keys(unidadesMes).length > 0) {
          Object.keys(unidadesMes).forEach((und, index) => {
            const totalUnidade = unidadesMes[und];
            
            // Calcular produtividade igual à seção "Produtividade por Área/Período"
            // Na seção, a produtividade é: (totalColhido / numeroMeses) / areaTotal
            // Para um único mês no gráfico: mediaMensal = totalUnidade / 1, então:
            // produtividadeMes = mediaMensal / areaTotalHa = totalUnidade / areaTotalHa
            const mediaMensal = totalUnidade / 1; // Um único mês
            const produtividadeMes = areaTotalHa > 0 ? mediaMensal / areaTotalHa : 0;
            
            // Eficiência sempre usa a média global do sistema (não a média dos meses em exibição)
            // A média global vem de dadosUnidades que é calculada no backend com todos os pedidos
            // e representa a "Produtividade Média Total" do sistema
            const mediaGlobal = getMediaGlobal(und);
            const eficiencia = mediaGlobal > 0 ? (produtividadeMes / mediaGlobal) * 100 : 0;
            
            // Cor da eficiência
            let colorEficiencia = '#f59e0b'; // Médio
            if (eficiencia >= 100) colorEficiencia = '#059669'; // Bom
            if (eficiencia < 60) colorEficiencia = '#dc2626'; // Ruim
            
            html += `<div style="margin-bottom: ${index < Object.keys(unidadesMes).length - 1 ? '16px' : '0'};">`;
            
            // Cabeçalho da Unidade
            html += `<div style="font-weight: 700; color: #059669; margin-bottom: 6px; font-size: 13px; background-color: #f0fdf4; padding: 2px 6px; border-radius: 4px; display: inline-block;">${und}</div>`;
            
            // 1. Volume
            html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">`;
            html += `<span style="color: #64748b; font-size: 12px;">Volume Total:</span>`;
            html += `<span style="font-weight: 600; color: #333; font-size: 13px;">${formataLeitura(totalUnidade)} ${und}</span>`;
            html += `</div>`;
            
            // 2. Produtividade Mês
            html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">`;
            html += `<span style="color: #64748b; font-size: 12px;">Produtividade Mês:</span>`;
            html += `<span style="font-weight: 600; color: #333; font-size: 13px;">${formataLeitura(Math.round(produtividadeMes))} ${und}/ha</span>`;
            html += `</div>`;
            
            // 3. Eficiência
            html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">`;
            html += `<span style="color: #64748b; font-size: 12px;">Eficiência:</span>`;
            html += `<span style="font-weight: 700; color: ${colorEficiencia}; font-size: 13px;">${eficiencia.toFixed(0)}% <span style="font-weight: 400; font-size: 10px; color: #94a3b8;">(da média)</span></span>`;
            html += `</div>`;
            
            // Explicação detalhada dos cálculos (dentro do escopo do forEach)
            html += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; padding: 10px; border-radius: 4px;">`;
            
            // Explicação da Produtividade
            html += `<div style="margin-bottom: 10px;">`;
            html += `<div style="display: flex; gap: 6px; margin-bottom: 6px; align-items: flex-start;">`;
            html += `<div style="font-size: 12px; color: #059669; font-weight: bold; margin-top: 2px;">📊</div>`;
            html += `<div style="font-size: 10px; color: #475569; line-height: 1.4; flex: 1;">`;
            html += `<strong style="color: #1e293b;">Produtividade:</strong> Calculada como média mensal dividida pela área total, igual à seção "Produtividade por Área/Período". `;
            html += `<span style="color: #64748b;">Fórmula: (${formataLeitura(totalUnidade)} ${und} ÷ 1 mês) ÷ ${areaTotalHa.toFixed(2)} ha = ${formataLeitura(Math.round(produtividadeMes))} ${und}/ha</span>`;
            html += `</div>`;
            html += `</div>`;
            html += `</div>`;
            
            // Explicação da Eficiência
            html += `<div style="margin-bottom: 8px;">`;
            html += `<div style="display: flex; gap: 6px; align-items: flex-start;">`;
            html += `<div style="font-size: 12px; color: #059669; font-weight: bold; margin-top: 2px;">⚡</div>`;
            html += `<div style="font-size: 10px; color: #475569; line-height: 1.4; flex: 1;">`;
            html += `<strong style="color: #1e293b;">Eficiência:</strong> Compara a produtividade deste mês com a "Produtividade Média Total" do sistema (média global, não dos meses em exibição). `;
            html += `<span style="color: #64748b;">Fórmula: (${formataLeitura(Math.round(produtividadeMes))} ${und}/ha ÷ ${formataLeitura(Math.round(mediaGlobal))} ${und}/ha) × 100 = ${eficiencia.toFixed(0)}%</span>`;
            html += `</div>`;
            html += `</div>`;
            html += `</div>`;
            
            // Legenda de cores da eficiência (apenas na última unidade)
            if (index === Object.keys(unidadesMes).length - 1) {
              html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">`;
              html += `<div style="font-size: 9px; color: #64748b; margin-bottom: 4px; font-weight: 600;">Legenda de Eficiência:</div>`;
              html += `<div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
              html += `<div style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background-color: #059669; border-radius: 50%;"></span><span style="font-size: 9px; color: #64748b;">≥100% (Acima da média)</span></div>`;
              html += `<div style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%;"></span><span style="font-size: 9px; color: #64748b;">60-99% (Abaixo da média)</span></div>`;
              html += `<div style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; background-color: #dc2626; border-radius: 50%;"></span><span style="font-size: 9px; color: #64748b;"><60% (Muito abaixo)</span></div>`;
              html += `</div>`;
              html += `</div>`;
            }
            
            html += `</div>`;
            html += `</div>`;
          });
          
          html += `<div style="font-size: 10px; color: #94a3b8; font-style: italic; text-align: center; margin-top: 10px;">`;
          html += `Clique na coluna para detalhar o período.`;
          html += `</div>`;
          html += `</div>`;
        } else {
          html += `<div style="color: #94a3b8; font-size: 12px; font-style: italic;">Sem dados para este período</div>`;
        }
        
        html += `</div>`;
        return html;
      },
      style: { fontSize: '13px' },
    },
    legend: {
      show: true, // Força a exibição mesmo com uma única série
      showForSingleSeries: true, // Exibe legenda mesmo quando há apenas uma série
      position: 'bottom', // Mudei para baixo para não sobrepor a Toolbar
      horizontalAlign: 'center',
      offsetY: 5,
      itemMargin: { horizontal: 10, vertical: 5 },
      markers: { 
        radius: 12,
        width: 12,
        height: 12
      }
    },
    fill: {
      opacity: 1, // Opacidade total para linhas e barras
      type: 'solid' // Simplificado: solid para ambos, sem gradient que pode afetar a visibilidade da linha
    },
    noData: {
      text: 'Sem dados para exibir',
      align: 'center',
      verticalAlign: 'middle',
      style: { color: '#94a3b8', fontSize: '16px' }
    }
  };

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      minHeight: "320px",
      position: 'relative'
    }}>
      <ReactApexChart
        options={options}
        series={series}
        type={type}
        height={360}
      />
    </div>
  );
};

export default GraficoProdutividade;

