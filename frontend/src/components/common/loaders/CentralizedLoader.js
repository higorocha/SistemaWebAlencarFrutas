// src/components/common/loaders/CentralizedLoader.js
// Componente de loading centralizado que cobre toda a tela
// Uso: Loading global para operações que afetam toda a página

import React from "react";
import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import styled from "styled-components";
import PropTypes from "prop-types";

const { Text } = Typography;

// Overlay que cobre toda a tela
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  transition: opacity 0.3s ease;
`;

// Container do spinner centralizado
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  min-width: 200px;
  text-align: center;
`;

// Spinner customizado
const CustomSpin = styled(Spin)`
  .ant-spin-dot {
    font-size: 32px;
  }
  
  .ant-spin-dot i {
    background-color: #059669;
    width: 12px;
    height: 12px;
  }
`;

// Texto de loading
const LoadingText = styled(Text)`
  color: #059669;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
`;

// Texto secundário (opcional)
const LoadingSubtext = styled(Text)`
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
`;

const CentralizedLoader = ({ 
  visible = false, 
  message = "Carregando...", 
  subMessage = "",
  size = "large" 
}) => {
  if (!visible) return null;

  return (
    <LoadingOverlay>
      <LoadingContainer>
        <CustomSpin 
          indicator={
            <LoadingOutlined 
              style={{ 
                fontSize: size === "large" ? 32 : 24, 
                color: "#059669" 
              }} 
              spin 
            />
          }
        />
        <LoadingText>{message}</LoadingText>
        {subMessage && <LoadingSubtext>{subMessage}</LoadingSubtext>}
      </LoadingContainer>
    </LoadingOverlay>
  );
};

CentralizedLoader.propTypes = {
  visible: PropTypes.bool.isRequired,
  message: PropTypes.string,
  subMessage: PropTypes.string,
  size: PropTypes.oneOf(["small", "default", "large"]),
};

export default React.memo(CentralizedLoader);
