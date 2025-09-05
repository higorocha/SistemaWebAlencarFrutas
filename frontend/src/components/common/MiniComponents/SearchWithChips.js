import React, { useState, useRef, useEffect } from 'react';
import { Input, Tag, AutoComplete, Space } from 'antd';
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const StyledTag = styled(Tag)`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin: 0;
  font-size: 12px;
  
  .anticon {
    margin-left: 4px;
    cursor: pointer;
  }
`;

const searchCategories = [
  { value: 'cliente:', label: 'Buscar por Nome do Cliente' },
  { value: 'cpf:', label: 'Buscar por CPF do Responsável' },
  { value: 'lote:', label: 'Buscar por Nome do Lote' },
  { value: 'hidrometro:', label: 'Buscar por Código do Hidrômetro' },
];

const categoryColors = {
  'cliente': 'blue',
  'cpf': 'orange', 
  'lote': 'green',
  'hidrometro': 'purple'
};

const SearchWithChips = ({ onSearch }) => {
  const [value, setValue] = useState('');
  const [chips, setChips] = useState([]);
  const [options, setOptions] = useState([]);
  const inputRef = useRef(null);

  // Gerar opções de autocomplete baseadas no texto atual
  useEffect(() => {
    if (!value) {
      setOptions(searchCategories);
      return;
    }

    // Se já tem um prefixo de categoria (cliente:, cpf:, etc)
    if (value.includes(':')) {
      setOptions([]);
      return;
    }

    // Filtrar categorias que correspondem ao texto digitado
    const filtered = searchCategories.filter(option => 
      option.value.toLowerCase().includes(value.toLowerCase()) ||
      option.label.toLowerCase().includes(value.toLowerCase())
    );
    setOptions(filtered);
  }, [value]);

  // Processar chips para pesquisa
  useEffect(() => {
    // Construir objeto de busca a partir dos chips
    const searchParams = {};
    
    chips.forEach(chip => {
      const [category, term] = chip.split(':');
      if (category && term && term.trim()) {
        searchParams[category] = term.trim();
      }
    });
    
    // Chamar a função de busca com os parâmetros
    onSearch(searchParams);
  }, [chips, onSearch]);

  const handleSelect = (selectedValue) => {
    setValue(selectedValue);
  };

  const handleInputChange = (text) => {
    setValue(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value) {
      // Verificar se já é um formato de categoria
      if (!value.includes(':')) {
        // Assumir busca por cliente se nenhuma categoria especificada
        addChip(`cliente:${value}`);
      } else {
        addChip(value);
      }
      setValue('');
    }
  };

  const addChip = (chipText) => {
    // Evitar chips duplicados
    if (!chips.includes(chipText)) {
      setChips([...chips, chipText]);
    }
    setValue('');
  };

  const removeChip = (chipToRemove) => {
    setChips(chips.filter(chip => chip !== chipToRemove));
  };

  const clearAll = () => {
    setChips([]);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <SearchContainer>
        <AutoComplete
          value={value}
          options={options}
          style={{ width: '100%' }}
          onChange={handleInputChange}
          onSelect={handleSelect}
          placeholder="Buscar por cliente, CPF do responsável, lote ou hidrômetro..."
        >
          <Input 
            prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            style={{ height: '36px' }}
            suffix={
              (chips.length > 0 || value) ? (
                <CloseCircleOutlined 
                  style={{ cursor: 'pointer', color: 'rgba(0,0,0,0.45)' }} 
                  onClick={clearAll}
                />
              ) : null
            }
          />
        </AutoComplete>
      </SearchContainer>
      
      {chips.length > 0 && (
        <ChipsContainer>
          {chips.map((chip, index) => {
            const [category, ...terms] = chip.split(':');
            const term = terms.join(':'); // Reunir o resto do texto caso haja mais de um ':'
            const color = categoryColors[category] || 'default';
            
            return (
              <StyledTag 
                key={index} 
                color={color}
                closable
                onClose={() => removeChip(chip)}
              >
                <strong>{category}:</strong> {term}
              </StyledTag>
            );
          })}
        </ChipsContainer>
      )}
      
      {chips.length === 0 && (
        <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
          Digite um termo e pressione Enter. Use prefixos cliente:, cpf:, lote: ou hidrometro: para buscas específicas.
        </div>
      )}
    </div>
  );
};

export default SearchWithChips;