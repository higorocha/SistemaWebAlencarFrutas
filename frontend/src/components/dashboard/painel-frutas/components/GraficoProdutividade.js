import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { numberFormatter } from '../../../../utils/formatters';

const GraficoProdutividade = ({ data, keys, type = 'line', colorBase, unidade }) => {
  const theme = useTheme(); // Para acessar cores do tema se necessário

  // 1. Transformação de Dados (Recharts -> ApexCharts)
  // O formato anterior era: [{ name: '1', 'Prata': 100, 'Nanica': 200 }, ...]
  // Apex precisa de: series: [{ name: 'Prata', data: [100, ...] }] e categories: ['1', ...]
  
  const categories = data.map(d => d.name); // Eixo X (Dias/Meses)
  
  const series = keys.map((keyObj, index) => {
    return {
      name: keyObj.key,
      data: data.map(d => d[keyObj.key] || 0)
    };
  });

  // 2. Definição de Cores
  // Geramos variações da cor base da cultura ou usamos uma paleta fixa se forem muitas frutas
  // Aqui usamos a corBase da cultura como principal e geramos variações ou usamos cores fixas do tema
  const generateColors = () => {
    // Se tivermos apenas uma série, usa a cor base. 
    // Se forem várias, podemos usar uma paleta complementar ou variações.
    // Para simplificar e manter bonito, vamos usar uma paleta fixa que começa com a corBase
    const defaultColors = [
      colorBase, 
      '#faad14', // Amarelo
      '#1890ff', // Azul
      '#722ed1', // Roxo
      '#f5222d', // Vermelho
      '#13c2c2', // Ciano
      '#fa541c'  // Laranja
    ];
    return defaultColors.slice(0, keys.length);
  };

  // 3. Configurações do ApexCharts
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
        autoSelected: 'pan' 
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      fontFamily: 'Roboto, sans-serif' // Fonte padrão do Material UI
    },
    colors: generateColors(),
    stroke: {
      width: type === 'line' ? 3 : 0, // Linha mais grossa se for gráfico de linha
      curve: 'smooth' // Curvatura suave conforme solicitado
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
        dataLabels: {
          position: 'top', // Para barras
        },
      }
    },
    dataLabels: {
      enabled: false // Desabilita labels em cima de cada ponto para limpar o visual
    },
    xaxis: {
      categories: categories,
      labels: {
        style: { fontSize: '12px', colors: '#666' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      title: { 
        text: unidade || 'Quantidade',
        style: { color: '#888', fontSize: '12px' }
      },
      labels: {
        formatter: (value) => numberFormatter ? numberFormatter(value) : value.toLocaleString(),
        style: { colors: '#666' }
      }
    },
    grid: {
      borderColor: '#f0f0f0',
      strokeDashArray: 3, // Grade tracejada suave
      xaxis: { lines: { show: false } }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `${numberFormatter ? numberFormatter(value) : value.toLocaleString()} ${unidade || ''}`
      },
      style: { fontSize: '13px' }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -20,
      markers: { radius: 12 }, // Marcadores redondos
      itemMargin: { horizontal: 10 }
    },
    fill: {
      opacity: type === 'bar' ? 0.9 : 1,
      type: type === 'bar' ? 'solid' : 'gradient', // Gradiente suave nas linhas fica elegante
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.2,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactApexChart
        options={options}
        series={series}
        type={type}
        height={320} // Altura fixa consistente
      />
    </div>
  );
};

export default GraficoProdutividade;
