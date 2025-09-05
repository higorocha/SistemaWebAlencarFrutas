// src/utils/BackButton.js
import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';

// Estilização do botão
const StyledBackButton = styled(Button)`
  background-color: ${props => props.theme.palette.primary.dark};
  border-color: ${props => props.theme.palette.primary.dark};
  color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease; /* Suaviza as transições */
  margin-bottom: 0px;

  &:hover {
    background-color: ${props => props.theme.palette.primary.light}; /* Cor mais clara no hover */
    border-color: ${props => props.theme.palette.primary.light};
    box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.15); /* Sombra mais forte */
  }

  & .anticon {
    font-size: 16px; /* Tamanho padrão */
    transition: transform 0.3s ease; /* Suaviza o crescimento no hover */
  }

  &:hover .anticon {
    transform: scale(1.3); /* Aumenta o ícone no hover */
  }

  &:focus {
    background-color: ${props => props.theme.palette.primary.dark}; /* Mantém a cor ao focar */
    border-color: ${props => props.theme.palette.primary.dark};
  }
`;

// Componente BackButton
const BackButton = ({ onClick, ...props }) => {
  const theme = useTheme();
  
  return (
    <StyledBackButton
      type="primary"
      shape="circle"
      onClick={onClick}
      theme={theme}
      {...props} // Permite passar propriedades adicionais
    >
      <ArrowLeftOutlined />
    </StyledBackButton>
  );
};

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default BackButton;
