import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { capitalizeName, formataLeitura, numberFormatter } from '../../../../utils/formatters';

const GraficoProdutividade = ({ data, keys, type = 'line', unidade }) => {
  
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
  
  // Transformação de Dados: Recharts -> ApexCharts
  const categories = dataArray.map(d => d.name || String(d)); 
  
  const series = keysArray.map((keyObj) => {
    return {
      name: capitalizeName(keyObj.key),
      data: dataArray.map(d => d[keyObj.key] || 0)
    };
  });

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

  // Configurações do ApexCharts
  const options = {
    chart: {
      type: type,
      background: 'transparent',
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
      y: {
        formatter: (value) => {
          // Formatação de inteiro com separador de milhar
          return `${formataLeitura(value)} ${unidade || ''}`;
        }
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
