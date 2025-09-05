// src/components/common/buttons/PDFButton.js

import React from "react";
import { Button, Tooltip } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const PDFButton = ({
  onClick,
  loading = false,
  disabled = false,
  size = "middle",
  type = "default",
  style = {},
  children,
  tooltip = "Exportar PDF",
  showTooltip = true,
  icon = true,
  ...props
}) => {
  const buttonContent = (
    <Button
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      icon={icon ? <FilePdfOutlined /> : null}
      style={{
        backgroundColor: "#dc2626",
        borderColor: "#dc2626",
        color: "#ffffff",
        ...style,
        ...(type === "default" && {
          backgroundColor: "#dc2626",
          borderColor: "#dc2626",
          color: "#ffffff",
        }),
        ...(disabled && {
          backgroundColor: "#f5f5f5",
          borderColor: "#d9d9d9",
          color: "#bfbfbf",
        }),
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = "#b91c1c";
          e.target.style.borderColor = "#b91c1c";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = "#dc2626";
          e.target.style.borderColor = "#dc2626";
        }
      }}
      {...props}
    >
      {children || "PDF"}
    </Button>
  );

  if (showTooltip && tooltip) {
    return (
      <Tooltip title={tooltip} placement="top">
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
};

PDFButton.propTypes = {
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["small", "middle", "large"]),
  type: PropTypes.oneOf(["default", "primary", "ghost", "dashed", "link", "text"]),
  style: PropTypes.object,
  children: PropTypes.node,
  tooltip: PropTypes.string,
  showTooltip: PropTypes.bool,
  icon: PropTypes.bool,
};

export default PDFButton;
