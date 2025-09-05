// src/components/common/inputs/StyledInputComponents.js
import styled from "styled-components";
import { NumericFormat } from "react-number-format";
import { Input } from "antd";

// Componente estilizado para NumericFormat
export const StyledNumericFormat = styled(NumericFormat).withConfig({
  shouldForwardProp: (prop) => !['hasRightAlignedText'].includes(prop),
})`
  width: 100%;
  height: 32px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover,
  &:focus {
    border-color: #40a9ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  &:disabled {
    background-color: #f5f5f5;
    color: #bfbfbf;
    cursor: not-allowed;
  }
`;

// Container para input com ícone
export const InputWithIconContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['iconPosition', 'width'].includes(prop),
})`
  position: relative;
  width: ${props => props.width || '100%'};

  .input-icon {
    position: absolute;
    ${props => props.iconPosition === 'right' ? 'right: 12px;' : 'left: 12px;'}
    top: 50%;
    transform: translateY(-50%);
    color: #1890ff;
    font-size: 16px;
    z-index: 1;
    pointer-events: none;
  }

  ${StyledNumericFormat} {
    ${props => props.iconPosition === 'right' ? 'padding-right: 36px;' : 'padding-left: 36px;'}
  }
`;

// Componente NumericFormat customizado com ícone
export const NumericFormatWithIcon = ({ icon, ...props }) => (
  <InputWithIconContainer>
    <span className="input-icon">{icon}</span>
    <StyledNumericFormat {...props} />
  </InputWithIconContainer>
);

// Componente Input customizado com ícone
export const InputWithIcon = ({ icon, ...props }) => (
  <InputWithIconContainer>
    <span className="input-icon">{icon}</span>
    <Input {...props} style={{ paddingLeft: 36, ...props.style }} />
  </InputWithIconContainer>
); 