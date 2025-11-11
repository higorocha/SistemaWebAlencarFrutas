import React from 'react';
import { Typography } from 'antd';
import { styled } from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import useResponsive from '../../../hooks/useResponsive';

const { Title } = Typography;

const CardStyled = styled.div`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  background: white;
  padding: ${props => props.$isMobile ? '12px' : '16px'};
  height: 100%;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ReceitaMensalSection = ({ receitaMensal = [] }) => {
  const { isMobile } = useResponsive();

  return (
    <CardStyled $isMobile={isMobile}>
      <Title
        level={4}
        style={{
          color: '#2E7D32',
          marginBottom: isMobile ? '8px' : '12px',
          fontSize: '1rem',
          marginTop: 0
        }}
      >
        📊 {isMobile ? 'Receita Mensal (6 Meses)' : 'Receita Mensal (Últimos 6 Meses)'}
      </Title>
      {isMobile ? (
        // Mobile: Gráfico de Pizza compacto
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={receitaMensal}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="valor"
              nameKey="mes"
            >
              {receitaMensal.map((entry, index) => {
                const colors = ['#52c41a', '#1890ff', '#722ed1', '#faad14', '#fa8c16', '#f5222d'];
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                );
              })}
            </Pie>
            <Tooltip
              formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
              labelStyle={{ color: '#666', fontSize: '0.75rem' }}
              contentStyle={{
                fontSize: '0.75rem',
                padding: '8px',
                borderRadius: '6px'
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '0.6875rem',
                paddingTop: '10px'
              }}
              formatter={(value) => (
                <span style={{ fontSize: '0.625rem', color: '#666' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        // Desktop: Gráfico de Barras original
        <ResponsiveContainer width="100%" height={540}>
          <BarChart data={receitaMensal} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="mes"
              fontSize={12}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              fontSize={11}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                'Receita'
              ]}
              labelStyle={{ color: '#666', fontSize: '0.875rem' }}
              contentStyle={{
                fontSize: '0.875rem',
                padding: '12px'
              }}
            />
            <Bar dataKey="valor" fill="#52c41a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardStyled>
  );
};

export default ReceitaMensalSection;
