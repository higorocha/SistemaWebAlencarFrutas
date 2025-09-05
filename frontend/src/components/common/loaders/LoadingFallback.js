//src/components/common/loaders/LoadingFallback.js
import React from "react";
import { Box, Typography } from "@mui/material";
import { Spin } from "antd";
import styled from "styled-components";

// Container estilizado que aceita a prop compact
const LoadingContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: ${props => props.$compact ? 'transparent' : '#f5f5f5'};
  padding: ${props => props.$compact ? '8px' : '20px'};
`;

// Texto estilizado que aceita a prop compact
const LoadingText = styled(Typography)`
  margin-top: ${props => props.$compact ? '8px' : '16px'};
  color: #595959;
  font-weight: 500;
  font-size: ${props => props.$compact ? '12px' : '16px'};
`;

const LoadingFallback = ({ message = "Carregando...", compact = false }) => {
  return (
    <LoadingContainer $compact={compact}>
      <Spin 
        size={compact ? "small" : "large"} 
        style={{ color: "#1890ff" }}
      />
      <LoadingText $compact={compact}>
        {message}
      </LoadingText>
    </LoadingContainer>
  );
};

export default React.memo(LoadingFallback); 