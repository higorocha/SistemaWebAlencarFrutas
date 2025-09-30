// src/components/common/ResponsiveTable.js

import React from 'react';
import { Table } from 'antd';
import styled from 'styled-components';
import useResponsive from '../../hooks/useResponsive';

// Styled component para container da tabela com scroll horizontal responsivo
const ResponsiveTableContainer = styled.div`
  width: 100%;
  position: relative;

  ${props => props.$isMobile && `
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch; /* Scroll suave no iOS */

    /* Estilização da scrollbar horizontal */
    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f0f0f0;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #059669;
      border-radius: 3px;
      transition: background 0.2s ease;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #047857;
    }

    /* SOLUÇÃO DEFINITIVA: Configuração correta do scroll horizontal */
    .ant-table-wrapper {
      overflow: auto;
    }

    .ant-table {
      min-width: ${props => props.$minWidth || 1000}px !important;
      border-spacing: 0 !important;
      border-collapse: separate !important;
    }

    /* FIX PRINCIPAL: Evitar overflow nos containers internos */
    .ant-table-container {
      overflow: visible !important;
      border-spacing: 0 !important;
    }

    .ant-table-content {
      overflow: visible !important;
      border-spacing: 0 !important;
    }

    .ant-table-body {
      overflow: visible !important;
      border-spacing: 0 !important;
    }

    .ant-table-header {
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* CORREÇÃO LINHA BRANCA: Remover espaços em branco extras */
    .ant-table-tbody {
      border-spacing: 0 !important;
    }

    .ant-table-thead {
      border-spacing: 0 !important;
    }

    /* Garantir alinhamento correto entre header e body */
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      border-spacing: 0 !important;
      margin: 0 !important;
      vertical-align: middle !important;
    }

    /* Remover qualquer margem que cause linha branca */
    .ant-table-thead > tr,
    .ant-table-tbody > tr {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Adicionar indicador visual de scroll (apenas se necessário) */
    &::after {
      content: "Deslize para ver mais →";
      position: absolute;
      right: 10px;
      top: 20px;
      background: rgba(5, 150, 105, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      z-index: 10;
      pointer-events: none;
      opacity: 0;
      animation: scrollHint 4s ease-in-out;
    }

    @keyframes scrollHint {
      0% { opacity: 0; }
      25% { opacity: 0.8; }
      75% { opacity: 0.8; }
      100% { opacity: 0; }
    }
  `}

  ${props => !props.$isMobile && `
    overflow: visible;
  `}
`;

// Styled component para tabela com headers padrão do sistema
const StyledResponsiveTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: ${props => props.$isMobile ? '8px' : '16px'};
    font-size: ${props => props.$isMobile ? '12px' : '14px'};
    text-align: center;
    line-height: ${props => props.$isMobile ? '1.2' : '1.5'};
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
  }

  .ant-table-tbody > tr > td {
    padding: ${props => props.$isMobile ? '6px 8px' : '12px 16px'};
    font-size: ${props => props.$isMobile ? '12px' : '14px'};
    line-height: ${props => props.$isMobile ? '1.2' : '1.5'};
  }

  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }

  /* CORREÇÃO: Remove sombras de ping (scroll horizontal) do Ant Design */
  .ant-table.ant-table-ping-left:not(.ant-table-has-fix-left) > .ant-table-container::before,
  .ant-table.ant-table-ping-right:not(.ant-table-has-fix-right) > .ant-table-container::after {
    box-shadow: none !important;
  }

  /* Remove sombras de ping em todas as variações */
  .ant-table-ping-right .ant-table-container::after {
    box-shadow: none !important;
  }

  .ant-table-ping-left .ant-table-container::before {
    box-shadow: none !important;
  }

  /* CORREÇÃO DEFINITIVA PARA LINHA BRANCA COM SCROLL HORIZONTAL */
  ${props => props.$isMobile && `
    /* Comportamento das células */
    .ant-table-cell {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-spacing: 0 !important;
      vertical-align: middle !important;
    }

    /* FIX CRÍTICO: Evitar espaços em branco entre header e body */
    .ant-table-thead {
      margin: 0 !important;
      border-spacing: 0 !important;
      border-collapse: separate !important;
    }

    .ant-table-tbody {
      margin: 0 !important;
      border-spacing: 0 !important;
      border-collapse: separate !important;
    }

    /* SOLUÇÃO PRINCIPAL: Garantir que não haja espaço entre header e primeira linha */
    .ant-table-thead > tr > th {
      margin: 0 !important;
      padding: ${props => props.$isMobile ? '12px 8px' : '16px'} !important;
      border-bottom: 1px solid #f0f0f0 !important;
      vertical-align: middle !important;
      border-spacing: 0 !important;
    }

    .ant-table-tbody > tr:first-child > td {
      border-top: none !important;
      margin: 0 !important;
      padding: ${props => props.$isMobile ? '8px' : '12px 16px'} !important;
    }

    /* Remove placeholders e elementos vazios */
    .ant-table-placeholder {
      display: none !important;
    }

    .ant-table-measure-row {
      display: none !important;
    }

    /* Força layout sem espaços */
    .ant-table-container {
      line-height: 1 !important;
    }

    .ant-table-content {
      line-height: 1 !important;
    }

    /* Configuração correta de bordas */
    .ant-table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      line-height: 1 !important;
    }

    /* CORREÇÃO ESPECÍFICA MOBILE: Remove sombras de ping que ficam grudadas */
    .ant-table-ping-right .ant-table-container::after {
      box-shadow: none !important;
      display: none !important;
    }

    .ant-table-ping-left .ant-table-container::before {
      box-shadow: none !important;
      display: none !important;
    }

    /* Remove qualquer pseudo-elemento de sombra */
    .ant-table-container::before,
    .ant-table-container::after {
      box-shadow: none !important;
      display: none !important;
    }
  `}
`;

/**
 * Componente de tabela responsiva que pode ser usado em todo o sistema
 *
 * @param {Object} props - Props da tabela
 * @param {Array} props.columns - Colunas da tabela
 * @param {Array} props.dataSource - Dados da tabela
 * @param {number} props.minWidthMobile - Largura mínima no mobile (padrão: 1000px)
 * @param {boolean} props.showScrollHint - Mostrar dica de scroll (padrão: true)
 * @param {...Object} otherProps - Outras props do Ant Design Table
 */
const ResponsiveTable = ({
  columns,
  dataSource,
  minWidthMobile = 1000,
  showScrollHint = true,
  ...otherProps
}) => {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveTableContainer
      $isMobile={isMobile}
      $minWidth={minWidthMobile}
      $showHint={showScrollHint}
    >
      <StyledResponsiveTable
        columns={columns}
        dataSource={dataSource}
        scroll={isMobile ? {
          x: minWidthMobile,
          scrollToFirstRowOnChange: false
        } : undefined}
        size={isMobile ? "small" : "middle"}
        bordered={true}
        pagination={false}
        $isMobile={isMobile}
        tableLayout="fixed"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          borderSpacing: 0,
          borderCollapse: "separate"
        }}
        {...otherProps}
      />
    </ResponsiveTableContainer>
  );
};

export default ResponsiveTable;