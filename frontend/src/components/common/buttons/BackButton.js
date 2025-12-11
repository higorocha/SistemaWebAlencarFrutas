// src/components/common/buttons/BackButton.js
// Componente reutilizável de botão "Voltar" com ícone de seta

import React from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { SecondaryButton } from "./index";
import PropTypes from "prop-types";
import useResponsive from "../../../hooks/useResponsive";

const BackButton = ({ onClick, title = "Voltar", size, style, ...props }) => {
  const { isMobile } = useResponsive();

  return (
    <SecondaryButton
      icon={<ArrowLeftOutlined />}
      onClick={onClick}
      size={size || (isMobile ? "small" : "middle")}
      style={{
        height: isMobile ? "32px" : "40px",
        padding: isMobile ? '0 12px' : '0 16px',
        fontSize: isMobile ? '0.75rem' : undefined,
        ...style
      }}
      title={title}
      {...props}
    />
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  style: PropTypes.object,
};

export default BackButton;

