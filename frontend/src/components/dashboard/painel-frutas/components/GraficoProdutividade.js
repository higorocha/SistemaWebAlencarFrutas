import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { numberFormatter, capitalizeName, formataLeitura } from '../../../../utils/formatters';

const GraficoProdutividade = ({ data, keys, type = 'line', unidade }) => {
  
  const categories = data.map(d => d.name); 
  
  const series = keys.map((keyObj) => {
    return {
      name: capitalizeName(keyObj.key),
      data: data.map(d => d[keyObj.key] || 0)
    };
  });

  // Paleta de cores "Data Visualization" (não confundir com semântica de status)
  // Tons de Verde, Teal e Azul que combinam com a identidade da marca
  const chartPalette = [
    '#059669', // Verde Principal (Brand)
    '#0ea5e9', // Azul Céu
    '#8b5cf6', // Violeta Suave
    '#f59e0b', // Amber (Destaque, mas não erro)
    '#10b981', // Emerald
    '#6366f1', // Indigo
  ];

  const options = {
    chart: {
      type: type,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: { download: true, zoom: true, pan: true, reset: true },
        autoSelected: 'zoom' 
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    },
    colors: chartPalette,
    stroke: {
      width: type === 'line' ? 3 : 0,
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories,
      labels: { style: { fontSize: '12px', colors: '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { 
        text: unidade || 'Quantidade',
        style: { color: '#94a3b8', fontSize: '12px', fontWeight: 500 }
      },
      labels: {
        formatter: (value) => formataLeitura ? formataLeitura(Math.round(value)) : value.toLocaleString('pt-BR'),
        style: { colors: '#64748b' }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `${formataLeitura ? formataLeitura(Math.round(value)) : value.toLocaleString('pt-BR')} ${unidade || ''}`
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -20,
      itemMargin: { horizontal: 10, vertical: 5 }
    },
    fill: {
      opacity: type === 'bar' ? 0.9 : 1,
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactApexChart
        options={options}
        series={series}
        type={type}
        height={328}
      />
    </div>
  );
};

export default GraficoProdutividade;
