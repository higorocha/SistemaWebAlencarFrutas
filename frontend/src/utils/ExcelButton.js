import React from 'react';
import { Button, Tooltip } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const StyledExcelButton = styled(Button)`
  background: #00733b !important;
  border: 1px solid #00733b !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 4px rgba(0, 115, 59, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative !important;
  overflow: hidden !important;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: #005f30 !important;
    border-color: #005f30 !important;
    color: white !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(0, 115, 59, 0.25) !important;
  }

  &:hover:before {
    left: 100%;
  }
  
  &:active {
    transform: translateY(0px) !important;
    box-shadow: 0 2px 4px rgba(0, 115, 59, 0.3) !important;
  }
  
  &:focus {
    background: #00733b !important;
    border-color: #00733b !important;
    color: white !important;
    box-shadow: 0 0 0 2px rgba(0, 115, 59, 0.2) !important;
  }

  &[disabled] {
    background: #f5f5f5 !important;
    border-color: #d9d9d9 !important;
    color: #bfbfbf !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .anticon {
    transition: transform 0.2s ease;
  }

  &:hover .anticon {
    transform: scale(1.1);
  }
`;

const ExcelButton = ({
  onClick,
  loading = false,
  disabled = false,
  children = "Excel",
  tooltip = "Exportar para Excel",
  size = "default",
  width,
  height,
  iconSize = "14px",
  style = {},
  ...props
}) => {
  const buttonContent = (
    <StyledExcelButton
      icon={<FileExcelOutlined style={{ fontSize: iconSize }} />}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      size={size}
      style={{
        width,
        height,
        ...style
      }}
      {...props}
    >
      {children}
    </StyledExcelButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

export default ExcelButton; 