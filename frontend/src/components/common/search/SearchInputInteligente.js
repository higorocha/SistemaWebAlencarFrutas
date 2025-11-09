// src/components/common/search/SearchInputInteligente.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Spin, Tooltip } from 'antd';
import { SearchOutlined, LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { debounce } from 'lodash';
import axiosInstance from '../../../api/axiosConfig';
import { PixIcon, BoletoIcon, TransferenciaIcon } from '../../Icons/PaymentIcons';
import { getFruitIcon } from '../../../utils/fruitIcons';
import { capitalizeName } from '../../../utils/formatters';

// Container principal
const SearchContainer = styled.div`
  position: relative;
  width: 100%;

  .ant-input {
    marginBottom: 16px;
    borderRadius: 6px;
    fontSize: 14px;
    fontWeight: 500;
    transition: all 0.2s ease;
  }

  .ant-input-affix-wrapper {
    transition: all 0.2s ease;

    &.loading-state {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
`;

// Dropdown de sugestões
const SuggestionsDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05);
  z-index: 1050;
  max-height: 300px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

// Item de sugestão
const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.isSelected && `
    background-color: #e6f7ff;
    border-left: 3px solid #1890ff;
  `}
`;

// Cabeçalho da sugestão
const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

// Ícone do tipo de busca
const TypeIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 12px;
  color: #333333;
  background-color: #ffffff;
  border: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
`;

// Texto do tipo
const TypeText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Texto da sugestão
const SuggestionText = styled.div`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

// Texto secundário (ex: nome do cliente)
const SuggestionSubtext = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

// Loading
const LoadingContainer = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .loading-text {
    font-size: 14px;
    color: #1890ff;
    font-weight: 500;
  }
`;

// Container de busca vazia
const EmptyContainer = styled.div`
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
`;

const SearchInputInteligente = ({
  placeholder = "Buscar pedidos...",
  value = "",
  onChange,
  onSearch,
  onSuggestionSelect,
  loading = false,
  style = {},
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState('idle'); // 'idle', 'loading', 'success', 'no-results', 'error'
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Função para processar ícones de pagamento em sugestões de vale
  const processPaymentIcon = (suggestion) => {
    // Verificar se é um vale e tem metadata com método de pagamento
    if (suggestion.type === 'vale' && suggestion.metadata?.metodoPagamento) {
      const metodo = suggestion.metadata.metodoPagamento;

      switch (metodo) {
        case 'PIX':
          return <PixIcon width={16} height={16} />;
        case 'BOLETO':
          return <BoletoIcon width={16} height={16} />;
        case 'TRANSFERENCIA':
          return <TransferenciaIcon width={16} height={16} />;
        case 'DINHEIRO':
          return '💰';
        case 'CHEQUE':
          return '📄';
        default:
          return suggestion.icon;
      }
    }

    // Retornar ícone original se não for vale ou não tiver método reconhecido
    // Mapear ícones de frutas/culturas usando fruitIcons
    if (suggestion.type === 'fruta') {
      return getFruitIcon(suggestion.value, { width: 16, height: 16 });
    }
    if (suggestion.type === 'cultura') {
      return getFruitIcon(suggestion.value, { width: 16, height: 16 });
    }
    if (suggestion.type === 'turma') {
      return '🧑‍🌾';
    }

    return suggestion.icon;
  };

  // Função para processar descrição com ícones de pagamento
  const processDescription = (suggestion) => {
    if (suggestion.type === 'vale' && suggestion.metadata?.metodoPagamento) {
      let description = suggestion.description;
      const metodo = suggestion.metadata.metodoPagamento;

      // Substituir placeholders pelos emojis corretos na descrição
      switch (metodo) {
        case 'PIX':
          description = description.replace('PIX_ICON', '🔷'); // Emoji diamante azul para PIX
          break;
        case 'BOLETO':
          description = description.replace('BOLETO_ICON', '🧾');
          break;
        case 'TRANSFERENCIA':
          description = description.replace('TRANSFERENCIA_ICON', '🏦');
          break;
        case 'DINHEIRO':
          description = description.replace('DINHEIRO_ICON', '💰');
          break;
        case 'CHEQUE':
          description = description.replace('CHEQUE_ICON', '📄');
          break;
      }

      return description;
    }

    if (suggestion.type === 'turma') {
      const total = suggestion.metadata?.totalPedidos ?? suggestion.metadata?.quantidadePedidos;
      if (typeof total === 'number') {
        return `Pedidos vinculados: ${total}`;
      }
      return suggestion.description || 'Pedidos vinculados';
    }

    return suggestion.description;
  };


  // Sincronizar value externo com estado interno
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Função para buscar sugestões em tempo real do backend
  const fetchSuggestions = useCallback(async (term) => {
    // Remover espaços no início e fim da string antes de validar
    const trimmedTerm = term?.trim() || '';
    
    if (!trimmedTerm || trimmedTerm.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setSearchStatus('idle');
      return;
    }

    try {
      setIsLoading(true);
      setSearchStatus('loading');
      setIsOpen(true); // Mostrar dropdown com loading

      // Buscar sugestões do backend com termo limpo
      const response = await axiosInstance.get(`/api/pedidos/busca-inteligente?term=${encodeURIComponent(trimmedTerm)}`);
      const backendSuggestions = response.data || [];

      setSuggestions(backendSuggestions);

      // Se não há sugestões, mostrar mensagem de "sem resultados"
      if (backendSuggestions.length === 0) {
        setSearchStatus('no-results');
        setSuggestions([{
          type: 'no-results',
          label: 'Sem resultados',
          value: trimmedTerm,
          icon: '🔍',
          color: '#999',
          description: `Nenhum resultado encontrado para "${trimmedTerm}"`
        }]);
      } else {
        setSearchStatus('success');
      }

      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSearchStatus('error');
      // Em caso de erro, mostrar mensagem de erro
      setSuggestions([{
        type: 'error',
        label: 'Erro',
        value: trimmedTerm,
        icon: '⚠️',
        color: '#f5222d',
        description: 'Erro ao buscar sugestões. Tente novamente.'
      }]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      fetchSuggestions(term);
    }, 300),
    [fetchSuggestions]
  );

  // Gerar sugestões mock baseadas no termo
  const generateMockSuggestions = (term) => {
    const suggestions = [];
    const lowerTerm = term.toLowerCase();

    // Sugestões por tipo
    if (lowerTerm.includes('ped') || /^\d+/.test(term)) {
      suggestions.push({
        type: 'numero',
        label: 'Nº Pedido',
        value: term,
        icon: '📋',
        color: '#1890ff',
        description: `Buscar pelo número ${term}`
      });
    }

    if (lowerTerm.includes('lessa') || lowerTerm.includes('joão') || lowerTerm.includes('maria')) {
      suggestions.push({
        type: 'cliente',
        label: 'Cliente',
        value: term,
        icon: '👤',
        color: '#52c41a',
        description: `Buscar por cliente: ${term}`
      });
    }

    // Detecção para vale (sequência numérica)
    if (/^\d+/.test(term)) {
      suggestions.push({
        type: 'vale',
        label: 'Vale',
        value: term,
        icon: '💳',
        color: '#722ed1',
        description: `Buscar por vale: ${term}`
      });
    }

    if (lowerTerm.includes('motorista') || lowerTerm.includes('joão') || lowerTerm.includes('carlos')) {
      suggestions.push({
        type: 'motorista',
        label: 'Motorista',
        value: term,
        icon: '🚛',
        color: '#fa8c16',
        description: `Buscar por motorista: ${term}`
      });
    }

    if (lowerTerm.includes('abc') || lowerTerm.includes('def') || /[A-Z]{3}[0-9]{4}/.test(term.toUpperCase())) {
      suggestions.push({
        type: 'placa',
        label: 'Placa',
        value: term.toUpperCase(),
        icon: '🚗',
        color: '#eb2f96',
        description: `Buscar por placa: ${term.toUpperCase()}`
      });
    }

    return suggestions.slice(0, 5); // Limitar a 5 sugestões
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Reset status se campo for limpo
    if (!value) {
      setSearchStatus('idle');
      setIsOpen(false);
    } else {
      debouncedSearch(value);
    }

    // Chamar onChange se fornecido
    if (onChange) {
      onChange(value);
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion) => {
    // Não permitir seleção de items especiais (erro ou sem resultados)
    if (suggestion.type === 'no-results' || suggestion.type === 'error') {
      return;
    }

    // Limpar o campo de busca imediatamente após seleção para permitir nova busca
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchStatus('idle'); // Reset status

    // Chamar onChange para sincronizar com o valor externo
    if (onChange) {
      onChange("");
    }

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    if (e.key === 'Enter' && !isOpen) {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SearchContainer ref={containerRef} style={style}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onKeyPress={handleSearch}
        allowClear
        prefix={(() => {
          if (isLoading) {
            return <LoadingOutlined style={{ color: '#1890ff' }} spin />;
          }

          if (searchStatus === 'success' && searchTerm.length >= 2) {
            return (
              <Tooltip title="Resultados encontrados">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            );
          }

          if (searchStatus === 'no-results' && searchTerm.length >= 2) {
            return (
              <Tooltip title="Nenhum resultado encontrado">
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            );
          }

          if (searchStatus === 'error') {
            return (
              <Tooltip title="Erro na busca">
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
              </Tooltip>
            );
          }

          return <SearchOutlined style={{ color: searchTerm ? '#1890ff' : '#bfbfbf' }} />;
        })()}
        size="large"
        className={isLoading ? 'loading-state' : ''}
        style={{
          marginBottom: 16,
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          ...style,
        }}
        {...props}
      />

      <SuggestionsDropdown $isOpen={isOpen}>
        {isLoading ? (
          <LoadingContainer>
            <LoadingOutlined style={{ color: '#1890ff' }} spin />
            <span className="loading-text">Buscando sugestões...</span>
          </LoadingContainer>
        ) : (
          suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`${suggestion.type}-${index}`}
              isSelected={index === selectedIndex}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                cursor: suggestion.type === 'no-results' || suggestion.type === 'error' ? 'default' : 'pointer',
                opacity: suggestion.type === 'no-results' || suggestion.type === 'error' ? 0.7 : 1
              }}
            >
              <SuggestionHeader>
                <TypeIcon color={suggestion.color}>
                  {processPaymentIcon(suggestion)}
                </TypeIcon>
                <TypeText>{suggestion.label}</TypeText>
              </SuggestionHeader>
            <SuggestionText>{
              ['cliente', 'fruta', 'cultura', 'area', 'motorista', 'fornecedor', 'turma'].includes(suggestion.type)
                ? capitalizeName(suggestion.value)
                : suggestion.value
            }</SuggestionText>
              <SuggestionSubtext>{processDescription(suggestion)}</SuggestionSubtext>
            </SuggestionItem>
          ))
        )}
      </SuggestionsDropdown>
    </SearchContainer>
  );
};

export default SearchInputInteligente;
