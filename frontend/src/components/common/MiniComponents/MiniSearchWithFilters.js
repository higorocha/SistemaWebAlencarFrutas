import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Divider, CircularProgress } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon, FilterListOff as FilterListOffIcon, Business as BusinessIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import MiniInputSearchWithChips from './MiniInputSearchWithChips';
import axiosInstance from '../../../api/axiosConfig';
import { capitalizeName } from '../../../utils/formatters';

/**
 * Componente reutilizável de busca com filtros avançados opcionais
 * Extraída toda a lógica do FaturasModal.js para reutilização
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onFilterApplied - Callback quando filtro é aplicado (suggestion, tipo, id)
 * @param {Function} props.onFilterCleared - Callback quando filtro é limpo
 * @param {Function} props.onChipDelete - Callback quando um chip específico é deletado (chipIndex)
 * @param {Array} props.advancedFilters - Array de componentes JSX para filtros avançados
 * @param {boolean} props.showAdvancedFilters - Se deve mostrar seção de filtros avançados
 * @param {string} props.placeholder - Placeholder do input de busca
 * @param {Object} props.style - Estilos do container
 * @param {string} props.title - Título da seção de busca (default: "Buscar")
 */
const MiniSearchWithFilters = ({
  onFilterApplied = () => {},
  onFilterCleared = () => {},
  onChipDelete = () => {},
  advancedFilters = [],
  showAdvancedFilters = false,
  placeholder = 'Digite o nome do irrigante ou lote...',
  style = {},
  title = 'Buscar'
}) => {
  // Estados para busca - extraídos do FaturasModal
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [filtrosAtivos, setFiltrosAtivos] = useState([]); // Array de filtros (máximo 2)
  
  // Estados para filtros avançados
  const [filtrosAvancadosAtivos, setFiltrosAvancadosAtivos] = useState(false);

  // Ref para controlar o debounce
  const debounceRef = useRef(null);

  // Fechar sugestões quando clicar fora - lógica do FaturasModal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions) {
        const searchContainer = event.target.closest('[data-search-container]');
        if (!searchContainer) {
          setShowSuggestions(false);
        }
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Função para gerar sugestões de busca - adaptada do FaturasModal
  const gerarSugestoes = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    if (!showSuggestions) {
      setShowSuggestions(true);
    }

    const uniqueItems = new Set();
    const results = [];

    try {
      // Usar sempre a rota geral de filtros para manter a reutilização
      const response = await axiosInstance.get('/api/filtros/buscar', {
        params: { termo: searchTerm }
      });

      if (response.data.success) {
        // Processar irrigantes
        const irrigantes = response.data.irrigantes || [];
        irrigantes.forEach(irrigante => {
          const key = `irrigante_sistema_${irrigante.nome}`;
          if (!uniqueItems.has(key)) {
            results.push({
              type: 'Irrigante',
              value: irrigante.id,
              label: `Irrigante: ${capitalizeName(irrigante.nome)}`,
              sistemaNome: irrigante.nome,
              sistemaId: irrigante.id,
              sistemaTipo: 'irrigante',
              isLocal: false
            });
            uniqueItems.add(key);
          }
        });

        // Processar lotes
        const lotes = response.data.lotes || [];
        lotes.forEach(lote => {
          const key = `lote_sistema_${lote.nome}`;
          if (!uniqueItems.has(key)) {
            results.push({
              type: 'Lote',
              value: lote.id,
              label: `Lote: ${lote.nome.toUpperCase()}`,
              sistemaNome: lote.nome,
              sistemaId: lote.id,
              sistemaTipo: 'lote',
              sistemaIrrigante: lote.irrigante,
              isLocal: false
            });
            uniqueItems.add(key);
          }
        });
      }
    } catch (error) {
      console.error('❌ [BUSCA] Erro na busca abrangente:', error);
    }

    // Ordenar resultados alfabeticamente - lógica do FaturasModal
    results.sort((a, b) => a.label.localeCompare(b.label));

    // Limitar resultados
    const limitedResults = results.slice(0, 15);
    setSuggestions(limitedResults);
    setLoadingSuggestions(false);
  };

  // Função para lidar com mudanças na busca (com debounce) - do FaturasModal
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (value.trim()) {
      // Mostrar o dropdown imediatamente quando começar a digitar
      if (value.length >= 2) {
        setShowSuggestions(true);
        setLoadingSuggestions(true);
      }
      
      // Aplicar debounce de 500ms para a chamada da API - mesmo do FaturasModal
      debounceRef.current = setTimeout(() => {
        gerarSugestoes(value.trim());
      }, 500);
    } else {
      // Limpar tudo imediatamente quando campo for limpo
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      // Não limpar os filtros quando apenas o texto é limpo
    }
  };

  // Função para selecionar uma sugestão - lógica do FaturasModal
  const handleSelectSuggestion = async (suggestion) => {
    console.log('🔍 [SUGESTAO] Aplicando filtro:', suggestion.sistemaTipo, suggestion.sistemaNome);
    
    // Evitar duplicar o mesmo filtro
    const jaExiste = filtrosAtivos.some(filtro => 
      filtro.sistemaTipo === suggestion.sistemaTipo && filtro.value === suggestion.sistemaId
    );
    
    if (jaExiste) {
      console.log('⚠️ [FILTRO] Filtro já existe, ignorando');
      setSearchQuery('');
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }
    
    // Verificar limite de 2 filtros
    if (filtrosAtivos.length >= 2) {
      console.log('⚠️ [FILTRO] Limite de 2 filtros atingido');
      setSearchQuery('');
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    const novoFiltro = {
      type: suggestion.type,
      label: capitalizeName(suggestion.sistemaNome), // Apenas o nome, sem prefixo
      sistemaNome: suggestion.sistemaNome,
      sistemaTipo: suggestion.sistemaTipo,
      value: suggestion.sistemaId
    };

    // Atualizar filtros ativos PRIMEIRO
    const novosFiltros = [...filtrosAtivos, novoFiltro];
    setFiltrosAtivos(novosFiltros);
    
    // Depois limpar campos de busca
    setSearchQuery(''); // Limpar o texto do input
    setShowSuggestions(false);
    setSuggestions([]);

    // Chamar callback para aplicar filtro
    onFilterApplied(suggestion, suggestion.sistemaTipo, suggestion.sistemaId);
  };

  // Função para deletar um chip específico
  const handleChipDelete = (chipIndex) => {
    const novosFiltros = filtrosAtivos.filter((_, index) => index !== chipIndex);
    setFiltrosAtivos(novosFiltros);
    
    // Chamar callback específico para deletar chip
    onChipDelete(chipIndex);
    
    if (novosFiltros.length === 0) {
      // Se não há mais filtros ativos, limpar completamente
      onFilterCleared();
    }
  };

  // Função para limpar todos os filtros
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFiltrosAtivos([]);
    setShowSuggestions(false);
    setSuggestions([]);
    onFilterCleared();
  };

  // Função para toggle dos filtros avançados
  const handleToggleFiltrosAvancados = () => {
    setFiltrosAvancadosAtivos(!filtrosAvancadosAtivos);
  };

  return (
    <Box sx={{ 
      mb: 3,
      bgcolor: 'white',
      borderRadius: 2,
      p: 3,
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      ...style
    }}>
      {title && (
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 2, 
          color: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SearchIcon /> {title}
        </Typography>
      )}
      
      {/* Linha principal de busca e filtros */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        alignItems: 'center', 
        width: '100%',
        overflow: 'visible'
      }}>
        {/* Campo de busca com chips internos */}
        <Box 
          data-search-container
          sx={{ 
            position: 'relative', 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            height: '40px',
            zIndex: 1001
          }}
        >
          <MiniInputSearchWithChips
            value={searchQuery}
            onChange={handleSearchChange}
            chips={filtrosAtivos}
            onChipDelete={handleChipDelete}
            placeholder={placeholder}
            style={{ width: '100%' }}
            icon={<SearchIcon />}
          />
          
          {/* Sugestões de busca - interface do FaturasModal */}
          {showSuggestions && ( 
            <Box 
              data-search-container
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                bgcolor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 1002
              }}
            >
              {loadingSuggestions ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  gap: 2
                }}>
                  <CircularProgress size={20} sx={{ color: '#128C7E' }} />
                  <Typography variant="body2" sx={{ color: '#128C7E' }}>
                    Buscando...
                  </Typography>
                </Box>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <Box
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectSuggestion(suggestion);
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      userSelect: 'none'
                    }}
                  >
                    {suggestion.type === 'Lote' ? 
                      <BusinessIcon fontSize="small" sx={{ color: '#f57c00' }} /> :
                      <CheckCircleIcon fontSize="small" sx={{ color: '#f57c00' }} />
                    }
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography variant="body2">
                        {suggestion.label}
                      </Typography>
                      {suggestion.sistemaIrrigante && (
                        <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                          Irrigante: {capitalizeName(suggestion.sistemaIrrigante)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3
                }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Nenhum resultado encontrado
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
        
        {/* Filtros avançados (se fornecidos) */}
        {advancedFilters && advancedFilters.length > 0 && filtrosAvancadosAtivos && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1.5,
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': { opacity: 0, transform: 'translateX(-20px)' },
              '100%': { opacity: 1, transform: 'translateX(0)' }
            }
          }}>
            <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center' }} />
            {advancedFilters.map((FilterComponent, index) => (
              <FilterComponent key={index} />
            ))}
          </Box>
        )}
        
        {/* Botão de filtros avançados */}
        {showAdvancedFilters && (
          <Box sx={{ 
            flexShrink: 0,
            width: '100px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <Button
              variant={filtrosAvancadosAtivos ? "contained" : "outlined"}
              size="small"
              onClick={handleToggleFiltrosAvancados}
              startIcon={filtrosAvancadosAtivos ? <FilterListIcon /> : <FilterListOffIcon />}
              sx={{
                width: '100px',
                px: 3,
                py: 1,
                height: 40,
                borderColor: filtrosAvancadosAtivos ? '#128C7E' : '#e0e0e0',
                color: filtrosAvancadosAtivos ? 'white' : '#128C7E',
                bgcolor: filtrosAvancadosAtivos ? '#128C7E' : 'transparent',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#128C7E',
                  bgcolor: filtrosAvancadosAtivos ? '#0d7169' : 'rgba(18, 140, 126, 0.1)'
                },
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
              }}
            >
              Filtros
            </Button>
          </Box>
        )}
      </Box>


    </Box>
  );
};

export default MiniSearchWithFilters; 