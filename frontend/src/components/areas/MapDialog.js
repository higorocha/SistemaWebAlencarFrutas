// src/components/areas/MapDialog.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Modal, Button, Space, Typography, Card, Row, Col, Input, Form, Alert, Switch } from "antd";
import { useTheme } from "@mui/material/styles";
import {
  EnvironmentOutlined,
  AimOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  SaveOutlined,
  UndoOutlined,
  PlusOutlined,
  MinusOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CompressOutlined,
  HomeOutlined,
  SearchOutlined,
  MyLocationOutlined,
  GlobalOutlined,
  ArrowsAltOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import useResponsive from "../../hooks/useResponsive";
import {
  GoogleMap,
  Marker,
  Polygon,
  DrawingManager,
  InfoWindow,
  Polyline,
  OverlayView,
} from "@react-google-maps/api";
import PropTypes from 'prop-types';
import styled from "styled-components";
import axiosInstance from "../../api/axiosConfig";
import { StyledNumericFormat, InputWithIconContainer } from "../common/inputs/StyledInputComponents";
import todosDibauData from "../../assets/geojson/lotesdibau/todosDibau.json";
import { debounce } from 'lodash';

// Estilo para o overlay de informações da área
const OverlayBox = styled.div`
  background: ${props => props.theme?.palette?.background?.paper || 'white'};
  padding: 8px;
  border: 1px solid ${props => props.theme?.palette?.ui?.border || '#ccc'};
  border-radius: 4px;
  box-shadow: 0 2px 6px ${props => props.theme?.palette?.ui?.shadow || 'rgba(0, 0, 0, 0.3)'};
  min-width: 200px;
  text-align: center;
  z-index: 10;
  color: ${props => props.theme?.palette?.text?.primary || '#333333'};
`;

// Estilo para o overlay estático do nome da área
const StaticNameOverlay = styled.div`
  background: ${props => props.theme?.palette?.primary?.main || '#059669'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  width: fit-content;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
  border: 1px solid ${props => props.theme?.palette?.primary?.dark || '#047857'};
  z-index: 5;
  letter-spacing: 0.3px;
  line-height: 1.2;
  backdrop-filter: blur(2px);
`;

// Estilo para o tooltip simples dos lotes DIBAU
const LoteTooltip = styled.div`
  color: #333;
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.9), -1px -1px 2px rgba(255, 255, 255, 0.9);
  pointer-events: none;
  z-index: 3;
  letter-spacing: 0.2px;
  line-height: 1.2;
`;

// Estilo para o tooltip destacado dos lotes DIBAU
const LoteTooltipDestacado = styled.div`
  background: ${props => props.bgColor || '#FF6B6B'};
  border: 1px solid ${props => props.borderColor || '#DC2626'};
  border-radius: 6px;
  padding: 6px 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  min-width: 100px;
  text-align: center;
  z-index: 1000;
  pointer-events: none;
  max-width: 200px;
  backdrop-filter: blur(4px);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(255, 107, 107, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
    }
  }
`;

// Container do componente de busca
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-bottom: 16px;
`;

// Dropdown de resultados da busca
const SearchDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

// Item individual do resultado da busca
const SearchResultItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

// Ícone do resultado
const ResultIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  background-color: ${props => props.bgColor || '#059669'};
  flex-shrink: 0;
`;

// Conteúdo do resultado
const ResultContent = styled.div`
  flex: 1;
  min-width: 0;
`;

// Título do resultado
const ResultTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Subtítulo do resultado
const ResultSubtitle = styled.div`
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Badge de tipo
const TypeBadge = styled.div`
  background-color: ${props => props.bgColor || '#f0f0f0'};
  color: ${props => props.color || '#666'};
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
`;

  const MapDialog = React.memo(({
  open,
  onClose,
  mapMode,
  setMapMode,
  isDrawing,
  setIsDrawing,
  mapCenter,
  setMapCenter,
  mapZoom,
  setMapZoom,
  loteAtual = null,
  setLoteAtual,
  tempCoordinates,
  setTempCoordinates,
  markers,
  setMarkers,
  midpoints,
  setMidpoints,
  handlePolygonComplete,
  handleMarkerDragEnd,
  handleMarkerClick,
  handleMidpointDragEnd,
  deleteMarker,
  selectedMarker = null,
  handleCloseInfoWindow,
  calculateAreaPolygon,
  setAreaPoligono,
  areaPoligono,
  lotesExistentes = [],
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  const isEditableMode = mapMode === "edit" || mapMode === "create";
  const [manualArea, setManualArea] = useState(areaPoligono);
  const [originalArea, setOriginalArea] = useState(areaPoligono);
  const [isManualAreaValid, setIsManualAreaValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [isDraggingSegment, setIsDraggingSegment] = useState(false);
  
  // Novas variáveis para exibição das áreas existentes
  const [currentZoom, setCurrentZoom] = useState(mapZoom);
  const mapRef = useRef(null);
  const centerRef = useRef(mapCenter);
  const zoomParaExibicaoDetalhes = 17; // Zoom necessário para mostrar detalhes
  const [areaHovered, setAreaHovered] = useState(null);
  const [mostrarLotesDibau, setMostrarLotesDibau] = useState(true); // Switch para controlar exibição dos lotes DIBAU
  const [mostrarNomesLotesDibau, setMostrarNomesLotesDibau] = useState(false); // Switch para controlar exibição dos nomes dos lotes DIBAU
  const [mostrarNomesAreas, setMostrarNomesAreas] = useState(true); // Switch para controlar exibição dos nomes das áreas
  const [mostrarAreas, setMostrarAreas] = useState(true); // Switch para controlar exibição das áreas existentes

  // Estados para busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [areaDestacada, setAreaDestacada] = useState(null);
  const [loteDestacado, setLoteDestacado] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setCurrentZoom(mapZoom);
  }, [mapZoom]);
  
  // Atualiza o estado quando areaPoligono mudar
  useEffect(() => {
    setManualArea(areaPoligono);
    setOriginalArea(areaPoligono);
  }, [areaPoligono]);

  // Garantir que quando o modal abre no modo create sem coordenadas, o drawing seja habilitado
  useEffect(() => {
    if (open && mapMode === "create" && tempCoordinates.length === 0) {
      setIsDrawing(true);
    }
  }, [open, mapMode, tempCoordinates.length, setIsDrawing]);

  // CORREÇÃO: Carregar coordenadas existentes quando editar área
  useEffect(() => {
    if (open && mapMode === "edit" && loteAtual && loteAtual.coordenadas && loteAtual.coordenadas.length > 0) {
      // Verificar se as coordenadas já não foram carregadas para evitar loop
      if (tempCoordinates.length === 0 || 
          tempCoordinates.length !== loteAtual.coordenadas.length || 
          JSON.stringify(tempCoordinates) !== JSON.stringify(loteAtual.coordenadas)) {
        
        setTempCoordinates(loteAtual.coordenadas);
        setIsDrawing(false); // Desabilitar desenho para modo edit
        
        // Calcular e setar a área
        const area = calculateAreaPolygon(loteAtual.coordenadas);
        setAreaPoligono(area);
        setManualArea(area);
        setOriginalArea(area);
        
      }
    }
  }, [open, mapMode, loteAtual?.id, calculateAreaPolygon]); // Removido tempCoordinates da dependência

  // Sincronizar markers sempre que tempCoordinates mudar
  useEffect(() => {
    if (tempCoordinates.length > 0) {
      const novosMarkers = tempCoordinates.map((coord, index) => ({
        id: index,
        lat: coord.lat,
        lng: coord.lng,
      }));
      setMarkers(novosMarkers);
      
      // Calcular midpoints apenas se for um polígono válido (3+ pontos)
      if (tempCoordinates.length >= 3) {
        const midpointsArray = [];
        for (let i = 0; i < tempCoordinates.length; i++) {
          const startPoint = tempCoordinates[i];
          const endPoint = tempCoordinates[(i + 1) % tempCoordinates.length];
          
          // Calcular ponto médio
          const midLat = (startPoint.lat + endPoint.lat) / 2;
          const midLng = (startPoint.lng + endPoint.lng) / 2;
          
          midpointsArray.push({
            id: `midpoint-${i}`,
            lat: midLat,
            lng: midLng,
            originalIndex: i
          });
        }
        setMidpoints(midpointsArray);
      } else {
        setMidpoints([]);
      }
    } else {
      setMarkers([]);
      setMidpoints([]);
    }
  }, [tempCoordinates]);

  // Callbacks para controlar o mapa
  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom();
      setCurrentZoom(newZoom);
      setMapZoom(newZoom);
    }
  }, [setMapZoom]);

  const onDragEnd = useCallback(() => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter();
      const center = { lat: newCenter.lat(), lng: newCenter.lng() };
      centerRef.current = center;
      setMapCenter(center);
    }
  }, [setMapCenter]);

  // Função auxiliar para posicionar overlays
  const getPixelPositionOffset = useCallback((width, height) => ({
    x: -(width / 2),
    y: -(height / 2),
  }), []);

  // Função para calcular o centro de um polígono
  const getPolygonCenter = useCallback((coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return mapCenter;
    }
    
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    const center = bounds.getCenter();
    return { lat: center.lat(), lng: center.lng() };
  }, [mapCenter]);

  // Função auxiliar para extrair nomenclatura do HTML da description
  const extrairNomenclatura = useCallback((description) => {
    try {
      if (!description || !description.value) return null;
      
      // Buscar o valor de Nomenclatu no HTML usando regex
      const match = description.value.match(/<td>Nomenclatu<\/td>\s*<td>([^<]+)<\/td>/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }, []);

  // Função auxiliar para extrair área (ha) do HTML da description
  const extrairArea = useCallback((description) => {
    try {
      if (!description || !description.value) return null;
      
      // Buscar o valor de Area no HTML usando regex
      const match = description.value.match(/<td>Area<\/td>\s*<td>([^<]+)<\/td>/);
      if (!match) return null;
      
      // Converter vírgula para ponto e parsear para número
      const areaStr = match[1].trim().replace(',', '.');
      const area = parseFloat(areaStr);
      
      return isNaN(area) ? null : area;
    } catch (error) {
      return null;
    }
  }, []);

  // Função para processar as coordenadas dos lotes DIBAU (FeatureCollection)
  const processTodosDibauCoordinates = useCallback(() => {
    try {
      if (!todosDibauData || !todosDibauData.features) {
        return [];
      }
      
      const lotes = [];
      
      todosDibauData.features.forEach((feature, index) => {
        if (!feature.geometry || !feature.geometry.coordinates) {
          return;
        }
        
        const geometry = feature.geometry;
        const properties = feature.properties || {};
        
        // Extrair dados do lote
        const loteNome = properties.name || '';
        const nomenclatura = extrairNomenclatura(properties.description);
        const areaHa = extrairArea(properties.description);
        
        if (geometry.type === 'Polygon') {
          // Converter coordenadas para o formato do Google Maps
          const paths = geometry.coordinates.map(ring => 
            ring.map(coord => ({
              lat: coord[1], // latitude
              lng: coord[0]  // longitude
            }))
          );
          
          // Calcular centro do polígono
          const bounds = new window.google.maps.LatLngBounds();
          paths[0].forEach(coord => bounds.extend(coord));
          const center = bounds.getCenter();
          
          lotes.push({
            paths,
            loteNome,
            nomenclatura,
            areaHa,
            center: { lat: center.lat(), lng: center.lng() }
          });
        } else if (geometry.type === 'MultiPolygon') {
          // Processar múltiplos polígonos
          geometry.coordinates.forEach((polygon, polyIndex) => {
            const paths = polygon.map(ring => 
              ring.map(coord => ({
                lat: coord[1], // latitude
                lng: coord[0]  // longitude
              }))
            );
            
            // Calcular centro do polígono
            const bounds = new window.google.maps.LatLngBounds();
            paths[0].forEach(coord => bounds.extend(coord));
            const center = bounds.getCenter();
            
            lotes.push({
              paths,
              loteNome,
              nomenclatura,
              areaHa,
              center: { lat: center.lat(), lng: center.lng() }
            });
          });
        }
      });
      
      return lotes;
    } catch (error) {
      console.error('Erro ao processar coordenadas dos lotes DIBAU:', error);
      return [];
    }
  }, [extrairNomenclatura, extrairArea]);
  
  // Processar coordenadas dos lotes DIBAU
  const todosDibauLotes = useMemo(() => {
    return processTodosDibauCoordinates();
  }, [processTodosDibauCoordinates]);

  // Função de busca
  const buscarAreas = useCallback(async (termo) => {
    const trimmedTerm = termo.trim();
    
    if (trimmedTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      // 1. Buscar no backend
      let areasBackend = [];
      try {
        const response = await axiosInstance.get(`/api/areas-agricolas/buscar?termo=${encodeURIComponent(trimmedTerm)}`);
        areasBackend = response.data || [];
      } catch (error) {
        console.error('Erro ao buscar áreas no backend:', error);
        // Continuar mesmo se der erro no backend
      }

      // 2. Buscar nos lotes DIBAU localmente
      const lotesFiltrados = todosDibauLotes
        .map((lote, originalIndex) => ({ ...lote, originalIndex })) // Add originalIndex
        .filter(lote => {
          const nomeMatch = lote.loteNome && lote.loteNome.toLowerCase().includes(trimmedTerm.toLowerCase());
          const nomenclaturaMatch = lote.nomenclatura && lote.nomenclatura.toLowerCase().includes(trimmedTerm.toLowerCase());
          return nomeMatch || nomenclaturaMatch;
        });

      // 3. Combinar resultados
      const resultados = [
        // Áreas do sistema (backend)
        ...areasBackend.map((area) => ({
          tipo: 'area-sistema',
          id: area.id,
          nome: area.nome,
          nomenclatura: area.nomenclatura,
          coordenadas: area.coordenadas,
          categoria: area.categoria,
          areaTotal: area.areaTotal,
          culturas: area.culturas
        })),
        // Lotes DIBAU (local)
        ...lotesFiltrados.map((lote) => ({
          tipo: 'lote-dibau',
          id: `lote-${lote.originalIndex}`, // Use originalIndex here
          nome: lote.loteNome,
          nomenclatura: lote.nomenclatura,
          areaHa: lote.areaHa,
          paths: lote.paths,
          center: lote.center
        }))
      ];

      setSearchResults(resultados);
      setSearchDropdownOpen(resultados.length > 0);
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchResults([]);
      setSearchDropdownOpen(false);
    } finally {
      setSearchLoading(false);
    }
  }, [todosDibauLotes]);

  // Debounced search function
  const debouncedBuscarAreas = useMemo(
    () => debounce(buscarAreas, 300),
    [buscarAreas]
  );

  // Handler para mudança no input de busca
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length >= 2) {
      debouncedBuscarAreas(value);
    } else {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      setSearchLoading(false);
    }
  };

  // Handler para selecionar resultado da busca
  const handleSelectSearchResult = (resultado) => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchDropdownOpen(false);
    
    if (resultado.tipo === 'area-sistema') {
      // Área do sistema
      const center = getPolygonCenter(resultado.coordenadas);
      setMapCenter(center);
      setMapZoom(15); // Zoom adequado
      setAreaDestacada(resultado.id);
      setAreaHovered(resultado.id);
      
      // Remover destaque após 10 segundos
      setTimeout(() => {
        setAreaDestacada(null);
        setAreaHovered(null);
      }, 10000);

    } else if (resultado.tipo === 'lote-dibau') {
      // Lote DIBAU
      setMapCenter(resultado.center);
      setMapZoom(15); // Zoom adequado
      setLoteDestacado(resultado.id);
      
      // Remover destaque após 10 segundos
      setTimeout(() => {
        setLoteDestacado(null);
      }, 10000);
    }
  };

  // Handler para clicar fora do componente de busca
  const handleClickOutside = (event) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
      setSearchDropdownOpen(false);
    }
  };

  // useEffect para detectar cliques fora
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatarNumero = (numero) => {
    if (numero === null || numero === undefined || isNaN(numero)) return "-";
    return Number(numero).toFixed(2);
  };

  const validateManualArea = (value) => {
    if (!originalArea || originalArea <= 0) return true;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    const minAllowed = originalArea * 0.9; // -10%
    const maxAllowed = originalArea * 1.1; // +10%
    
    if (numValue < minAllowed || numValue > maxAllowed) {
      setErrorMessage(`O valor deve estar entre ${formatarNumero(minAllowed)} e ${formatarNumero(maxAllowed)} ha (±10% da área original)`);
      return false;
    }
    
    setErrorMessage("");
    return true;
  };

  const handleManualAreaChange = (values) => {
    const { value } = values;
    const numValue = parseFloat(value);
    setManualArea(numValue);
    
    const isValid = validateManualArea(numValue);
    setIsManualAreaValid(isValid);
    
    if (isValid) {
      setAreaPoligono(numValue);
    }
  };

  const dialogTitle =
    mapMode === "edit" ? "Editar Polígono no Mapa" : "Criar Polígono no Mapa";

  const handleFinalizar = () => {
    setLoteAtual((prevState) => ({
      ...prevState,
      coordenadas: tempCoordinates,
      areaTotal: formatarNumero(manualArea),
    }));
    onClose();
  };

  const handleExcluirPoligono = () => {
    // Limpar tudo em sequência para garantir re-renderização
    setTempCoordinates([]);
    setMarkers([]);
    setMidpoints([]);
    setAreaPoligono(0);
    setManualArea(0);
    setOriginalArea(0);
    setIsDrawing(true);

    if (mapMode === "edit") {
      setMapMode("create");
    }
  };

  // Função para arrastar um segmento inteiro (linha entre dois pontos)
  const handleSegmentDragStart = (index) => {
    setIsDraggingSegment(true);
    setHoveredSegment(index);
  };

  const handleSegmentDragEnd = (index, e) => {
    const dx = e.latLng.lat() - tempCoordinates[index].lat;
    const dy = e.latLng.lng() - tempCoordinates[index].lng;
    
    // Encontrar o próximo índice
    const nextIndex = (index + 1) % tempCoordinates.length;
    
    // Criar novas coordenadas com os pontos movidos
    const newCoordinates = [...tempCoordinates];
    newCoordinates[index] = {
      lat: tempCoordinates[index].lat + dx,
      lng: tempCoordinates[index].lng + dy
    };
    newCoordinates[nextIndex] = {
      lat: tempCoordinates[nextIndex].lat + dx,
      lng: tempCoordinates[nextIndex].lng + dy
    };
    
    setTempCoordinates(newCoordinates);
    
    // Atualizar também os marcadores
    const newMarkers = newCoordinates.map((coord, i) => ({
      id: i,
      lat: coord.lat, 
      lng: coord.lng
    }));
    setMarkers(newMarkers);
    
    // Recalcular midpoints
    const midpointsArray = [];
    for (let i = 0; i < newCoordinates.length; i++) {
      const startPoint = newCoordinates[i];
      const endPoint = newCoordinates[(i + 1) % newCoordinates.length];
      
      // Calcular ponto médio
      const midLat = (startPoint.lat + endPoint.lat) / 2;
      const midLng = (startPoint.lng + endPoint.lng) / 2;
      
      midpointsArray.push({
        id: `midpoint-${i}`,
        lat: midLat,
        lng: midLng,
        originalIndex: i
      });
    }
    setMidpoints(midpointsArray);
    
    // Atualizar área do polígono
    const newArea = calculateAreaPolygon(newCoordinates);
    setAreaPoligono(newArea);
    setManualArea(newArea);
    setOriginalArea(newArea);
    
    setIsDraggingSegment(false);
    setHoveredSegment(null);
  };

  const footerButtons = () => {
    if (!isEditableMode) {
      return [
        <Button
          key="close"
          onClick={onClose}
          size={isMobile ? "small" : "middle"}
          style={{
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          Fechar
        </Button>,
      ];
    }

    // isEditableMode = true
    const buttons = [
      <Button
        key="cancel"
        onClick={onClose}
        size={isMobile ? "small" : "middle"}
        style={{
          fontSize: isMobile ? "0.75rem" : "0.875rem",
        }}
      >
        Cancelar
      </Button>,
    ];

    if (!isDrawing && tempCoordinates.length > 0) {
      buttons.push(
        <Button
          key="finalizar"
          type="primary"
          onClick={handleFinalizar}
          disabled={!isManualAreaValid}
          size={isMobile ? "small" : "middle"}
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          {isMobile ? "Finalizar" : `Finalizar ${mapMode === "edit" ? "Edição" : "Criação"}`}
        </Button>
      );
    }

    if (isEditableMode && !isDrawing && tempCoordinates.length > 0) {
      buttons.push(
        <Button
          key="excluir"
          danger
          onClick={handleExcluirPoligono}
          size={isMobile ? "small" : "middle"}
          style={{
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          {isMobile ? "Excluir" : "Excluir Polígono"}
        </Button>
      );
    }

    return buttons;
  };

  // Estilos para polígonos e marcadores
  const polygonOptions = {
    fillColor: "#059669", // Verde principal do tema
    fillOpacity: 0.4,
    strokeColor: "#059669", // Verde principal do tema
    strokeOpacity: 1,
    strokeWeight: 2,
    editable: false,
    draggable: false,
  };

  // Estilo para áreas existentes (diferente da área atual)
  const existingPolygonOptions = {
    fillColor: "#dc2626", // Vermelho do tema para áreas existentes
    fillOpacity: 0.2,
    strokeColor: "#dc2626", // Vermelho do tema
    strokeOpacity: 0.6,
    strokeWeight: 2,
    clickable: true,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1,
  };

  // Opções do polígono dos lotes DIBAU
  const getLotesDibauPolygonOptions = () => {
    return {
      fillColor: '#FF6B6B', // Vermelho coral
      fillOpacity: 0.15, // Extremamente transparente (15%)
      strokeColor: '#000000', // Preto para borda
      strokeOpacity: 0.9, // Bordas visíveis (90%)
      strokeWeight: 0.5,
      clickable: false,
      draggable: false,
      editable: false,
      geodesic: false,
      zIndex: 0, // Abaixo de tudo
    };
  };

  const markerOptions = {
    draggable: isEditableMode,
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      scaledSize: new window.google.maps.Size(36, 36),
    }
  };

  const midpointOptions = {
    draggable: isEditableMode,
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      scaledSize: new window.google.maps.Size(28, 28),
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span style={{
          color: "#ffffff",
          fontWeight: "600",
          fontSize: isMobile ? "0.875rem" : "1rem",
          backgroundColor: "#059669",
          padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
          margin: "-1.25rem -1.5rem 0 -1.5rem",
          display: "block",
          borderRadius: "0.5rem 0.5rem 0 0",
        }}>
          {dialogTitle}
        </span>
      }
      width={isMobile ? '95vw' : '70%'}
      style={{ maxWidth: isMobile ? '95vw' : '90%' }}
      footer={footerButtons()}
      styles={{
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        body: {
          padding: isMobile ? 12 : 20,
        }
      }}
      centered
      destroyOnClose
    >
      {isEditableMode && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              marginBottom: isMobile ? 8 : 12,
              gap: isMobile ? "8px" : "12px",
            }}
          >
            <Space wrap size={isMobile ? "small" : "middle"}>
              {mapMode === "create" && (
                <Button
                  type={isDrawing ? "primary" : "default"}
                  icon={<GlobalOutlined />}
                  size={isMobile ? "small" : "middle"}
                  onClick={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                    } else {
                      setTempCoordinates([]);
                      setMarkers([]);
                      setMidpoints([]);
                      setAreaPoligono(0);
                      setManualArea(0);
                      setOriginalArea(0);
                      setIsDrawing(true);
                    }
                  }}
                  style={{
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  {isDrawing ? (isMobile ? "Cancelar" : "Cancelar Desenho") : (isMobile ? "Desenhar" : "Desenhar Área")}
                </Button>
              )}
              <Button
                type="default"
                icon={<ArrowsAltOutlined />}
                size={isMobile ? "small" : "middle"}
                onClick={() => setIsDrawing(false)}
                style={{
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                }}
              >
                {isMobile ? "Mover" : "Mover Mapa"}
              </Button>

              {/* Componente unificado Alencar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "4px" : "10px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                padding: isMobile ? "4px 6px" : "8px 14px",
                borderRadius: isMobile ? "16px" : "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                transition: "all 0.2s ease",
                flex: "none"
              }}>
                <HomeOutlined 
                  style={{ 
                    fontSize: isMobile ? "12px" : "18px",
                    color: (mostrarAreas || mostrarNomesAreas) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }} 
                />
                <Typography.Text 
                  style={{ 
                    fontSize: isMobile ? "0.5625rem" : "0.8125rem",
                    fontWeight: "600",
                    margin: 0,
                    whiteSpace: "nowrap",
                    color: (mostrarAreas || mostrarNomesAreas) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }}
                >
                  Alencar
                </Typography.Text>
                
                {/* Separador visual */}
                <div style={{
                  width: "1px",
                  height: isMobile ? "14px" : "20px",
                  backgroundColor: "rgba(5, 150, 105, 0.3)",
                  margin: isMobile ? "0 2px" : "0 4px"
                }} />
                
                {/* Toggle para Áreas */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "6px",
                  padding: isMobile ? "2px 4px" : "4px 8px",
                  borderRadius: isMobile ? "8px" : "12px",
                  backgroundColor: mostrarAreas ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: isMobile ? "0.5rem" : "0.75rem",
                      fontWeight: "500",
                      margin: 0,
                      color: mostrarAreas ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    Áreas
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarAreas}
                    onChange={setMostrarAreas}
                    style={{
                      backgroundColor: mostrarAreas ? "#059669" : undefined,
                      transform: isMobile ? "scale(0.8)" : undefined
                    }}
                  />
                </div>
                
                {/* Toggle para Nomes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "6px",
                  padding: isMobile ? "2px 4px" : "4px 8px",
                  borderRadius: isMobile ? "8px" : "12px",
                  backgroundColor: mostrarNomesAreas ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: isMobile ? "0.5rem" : "0.75rem",
                      fontWeight: "500",
                      margin: 0,
                      color: mostrarNomesAreas ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    Nomes
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarNomesAreas}
                    onChange={setMostrarNomesAreas}
                    style={{
                      backgroundColor: mostrarNomesAreas ? "#059669" : undefined,
                      transform: isMobile ? "scale(0.8)" : undefined
                    }}
                  />
                </div>
              </div>

              {/* Componente unificado DIBAU */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "4px" : "10px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                padding: isMobile ? "4px 6px" : "8px 14px",
                borderRadius: isMobile ? "16px" : "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                transition: "all 0.2s ease"
              }}>
                <GlobalOutlined 
                  style={{ 
                    fontSize: isMobile ? "12px" : "18px",
                    color: mostrarLotesDibau ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }} 
                />
                <Typography.Text 
                  style={{ 
                    fontSize: isMobile ? "0.5625rem" : "0.8125rem",
                    fontWeight: "600",
                    margin: 0,
                    whiteSpace: "nowrap",
                    color: mostrarLotesDibau ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }}
                >
                  DIBAU
                </Typography.Text>
                
                {/* Separador visual */}
                <div style={{
                  width: "1px",
                  height: isMobile ? "14px" : "20px",
                  backgroundColor: "rgba(5, 150, 105, 0.3)",
                  margin: isMobile ? "0 2px" : "0 4px"
                }} />
                
                {/* Toggle para Lotes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "6px",
                  padding: isMobile ? "2px 4px" : "4px 8px",
                  borderRadius: isMobile ? "8px" : "12px",
                  backgroundColor: mostrarLotesDibau ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: isMobile ? "0.5rem" : "0.75rem",
                      fontWeight: "500",
                      margin: 0,
                      color: mostrarLotesDibau ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    Lotes
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarLotesDibau}
                    onChange={setMostrarLotesDibau}
                    style={{
                      backgroundColor: mostrarLotesDibau ? "#059669" : undefined,
                      transform: isMobile ? "scale(0.8)" : undefined
                    }}
                  />
                </div>
                
                {/* Toggle para Nomes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "2px" : "6px",
                  padding: isMobile ? "2px 4px" : "4px 8px",
                  borderRadius: isMobile ? "8px" : "12px",
                  backgroundColor: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                  opacity: mostrarLotesDibau ? 1 : 0.5
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: isMobile ? "0.5rem" : "0.75rem",
                      fontWeight: "500",
                      margin: 0,
                      color: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    Nomes
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarNomesLotesDibau}
                    onChange={setMostrarNomesLotesDibau}
                    disabled={!mostrarLotesDibau}
                    style={{
                      backgroundColor: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "#059669" : undefined,
                      transform: isMobile ? "scale(0.8)" : undefined
                    }}
                  />
                </div>
              </div>
            </Space>

            {/* Divider e Componente de busca no desktop */}
            {!isMobile && (
              <>
                {/* Divider vertical */}
                <div style={{
                  width: "1px",
                  height: "32px",
                  backgroundColor: "rgba(5, 150, 105, 0.2)",
                  margin: "0 8px"
                }} />

                {/* Componente de busca ocupando espaço restante */}
                <SearchContainer ref={searchContainerRef} style={{ 
                  marginBottom: 0, 
                  flex: 1,
                  maxWidth: '100%'
                }}>
                  <Input
                    placeholder="Buscar área por nome..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    prefix={<SearchOutlined />}
                    suffix={searchLoading ? <LoadingOutlined /> : null}
                    size="middle"
                    style={{
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #d9d9d9',
                    }}
                  />
                  
                  {/* Dropdown de resultados */}
                  {searchDropdownOpen && searchResults.length > 0 && (
                    <SearchDropdown>
                      {searchResults.map((resultado) => (
                        <SearchResultItem
                          key={resultado.id}
                          onClick={() => handleSelectSearchResult(resultado)}
                        >
                          <ResultIcon bgColor={resultado.tipo === 'area-sistema' ? '#059669' : '#FF6B6B'}>
                            {resultado.tipo === 'area-sistema' ? <EnvironmentOutlined /> : <AimOutlined />}
                          </ResultIcon>
                          
                          <ResultContent>
                            <ResultTitle>{resultado.nome}</ResultTitle>
                            <ResultSubtitle>
                              {resultado.tipo === 'area-sistema' ? (
                                <>
                                  <TypeBadge color={resultado.categoria === 'COLONO' ? '#52c41a' : resultado.categoria === 'TECNICO' ? '#1890ff' : resultado.categoria === 'EMPRESARIAL' ? '#722ed1' : '#fa8c16'}>
                                    {resultado.categoria}
                                  </TypeBadge>
                                  {' • '}
                                  {formatarNumero(resultado.areaTotal)} ha
                                </>
                              ) : (
                                <>
                                  <TypeBadge color="#FF6B6B">Lote DIBAU</TypeBadge>
                                  {resultado.nomenclatura && (
                                    <> • {resultado.nomenclatura}</>
                                  )}
                                  {resultado.areaHa && (
                                    <> • {formatarNumero(resultado.areaHa)} ha</>
                                  )}
                                </>
                              )}
                            </ResultSubtitle>
                          </ResultContent>
                        </SearchResultItem>
                      ))}
                    </SearchDropdown>
                  )}
                </SearchContainer>
              </>
            )}
          </div>

          {/* Dica informativa abaixo dos controles - apenas desktop */}
          {!isMobile && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <Typography.Text type="secondary" style={{ fontSize: "0.7rem" }}>
                  <InfoCircleOutlined /> Arraste pontos azuis para ajustar vértices ou pontos verdes para adicionar novos.
                </Typography.Text>
                
                {/* Divider vertical */}
                <div style={{
                  width: "1px",
                  height: "20px",
                  backgroundColor: "#d9d9d9"
                }} />
                
                <Typography.Text type="warning" style={{ fontSize: "0.7rem" }}>
                  <ExclamationCircleOutlined /> Dados dos lotes DIBAU (nome e área) são do KML do distrito e apenas referência, podendo apresentar erros.
                </Typography.Text>
              </div>
            </div>
          )}
        </>
      )}

      {/* Componente de busca mobile */}
      {isMobile && (
        <SearchContainer ref={searchContainerRef}>
          <Input
            placeholder="Buscar por nome da área..."
            value={searchTerm}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            suffix={searchLoading ? <LoadingOutlined /> : null}
            size="middle"
            style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #d9d9d9',
            }}
          />
          
          {/* Dropdown de resultados */}
          {searchDropdownOpen && searchResults.length > 0 && (
            <SearchDropdown>
              {searchResults.map((resultado) => (
                <SearchResultItem
                  key={resultado.id}
                  onClick={() => handleSelectSearchResult(resultado)}
                >
                  <ResultIcon bgColor={resultado.tipo === 'area-sistema' ? '#059669' : '#FF6B6B'}>
                    {resultado.tipo === 'area-sistema' ? <EnvironmentOutlined /> : <AimOutlined />}
                  </ResultIcon>
                  
                  <ResultContent>
                    <ResultTitle>{resultado.nome}</ResultTitle>
                    <ResultSubtitle>
                      {resultado.tipo === 'area-sistema' ? (
                        <>
                          <TypeBadge color={resultado.categoria === 'COLONO' ? '#52c41a' : resultado.categoria === 'TECNICO' ? '#1890ff' : resultado.categoria === 'EMPRESARIAL' ? '#722ed1' : '#fa8c16'}>
                            {resultado.categoria}
                          </TypeBadge>
                          {' • '}
                          {formatarNumero(resultado.areaTotal)} ha
                        </>
                      ) : (
                        <>
                          <TypeBadge color="#FF6B6B">Lote DIBAU</TypeBadge>
                          {resultado.nomenclatura && (
                            <> • {resultado.nomenclatura}</>
                          )}
                          {resultado.areaHa && (
                            <> • {formatarNumero(resultado.areaHa)} ha</>
                          )}
                        </>
                      )}
                    </ResultSubtitle>
                  </ResultContent>
                </SearchResultItem>
              ))}
            </SearchDropdown>
          )}
        </SearchContainer>
      )}
      
      <div style={{ position: "relative" }}>

        <GoogleMap
          mapContainerStyle={{
            height: isMobile ? "350px" : "450px",
            width: "100%",
            minHeight: isMobile ? "350px" : "auto"
          }}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={onLoad}
          onZoomChanged={onZoomChanged}
          onDragEnd={onDragEnd}
          options={{
            styles: [
              // Ocultar rótulos de todos os pontos de interesse primeiro
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar pontos de interesse comerciais (restaurantes, supermercados, postos, hotéis)
              {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar edifícios governamentais
              {
                featureType: "poi.government",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar instalações médicas
              {
                featureType: "poi.medical",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar escolas
              {
                featureType: "poi.school",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar complexos esportivos
              {
                featureType: "poi.sports_complex",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar locais de culto
              {
                featureType: "poi.place_of_worship",
                stylers: [{ visibility: "off" }]
              },
              // Ocultar atrações turísticas
              {
                featureType: "poi.attraction",
                stylers: [{ visibility: "off" }]
              }
            ],
            disableDefaultUI: false,
            mapTypeControl: true,
            gestureHandling: "greedy",
            mapTypeControlOptions: {
              style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: window.google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: [
                window.google.maps.MapTypeId.ROADMAP,
                window.google.maps.MapTypeId.SATELLITE,
                window.google.maps.MapTypeId.HYBRID,
                window.google.maps.MapTypeId.TERRAIN,
              ],
            },
            clickableIcons: false,
          }}
        >
          {/* Renderizar polígonos dos lotes DIBAU */}
          {mostrarLotesDibau && todosDibauLotes.map((lote, index) => {
            // Calcular o centro do lote para o tooltip
            const center = getPolygonCenter(lote.paths[0]); // Usar o primeiro ring
            
            // Formatar o texto do tooltip (com área apenas no zoom, não no switch)
            const tooltipTextSwitch = lote.nomenclatura 
              ? `${lote.loteNome} (${lote.nomenclatura})`
              : lote.loteNome;
            
            const tooltipTextZoom = (() => {
              let text = lote.loteNome;
              if (lote.nomenclatura) text += ` (${lote.nomenclatura})`;
              if (lote.areaHa) text += ` - ${formatarNumero(lote.areaHa)} ha`;
              return text;
            })();
            
            // Verificar se este lote está destacado
            const isDestacado = loteDestacado === `lote-${index}`;
            
            // Buscar dados do resultado da busca para tooltip destacado
            const resultadoBusca = searchResults.find(r => r.id === `lote-${index}` && r.tipo === 'lote-dibau');
            
            return (
              <React.Fragment key={`lote-dibau-${index}`}>
                {/* Polígono do lote */}
                <Polygon
                  paths={lote.paths}
                  options={{
                    ...getLotesDibauPolygonOptions(),
                    fillOpacity: isDestacado ? 0.4 : 0.15,
                    strokeWeight: isDestacado ? 2 : 0.5,
                    strokeOpacity: isDestacado ? 0.9 : 0.5,
                    zIndex: isDestacado ? 3 : 1
                  }}
                />

                {/* Marcador central para lote destacado */}
                {isDestacado && (
                  <Marker
                    position={center}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      scaledSize: new window.google.maps.Size(16, 16),
                    }}
                  />
                )}

                {/* Tooltip destacado para lote selecionado na busca */}
                {isDestacado && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={getPixelPositionOffset}
                  >
                    <LoteTooltipDestacado
                      bgColor="#FF6B6B"
                      borderColor="#DC2626"
                      isMobile={isMobile}
                      theme={theme}
                    >
                      <div style={{ marginBottom: '4px' }}>
                        <Typography.Text strong style={{
                          fontSize: isMobile ? '11px' : '13px',
                          color: 'white',
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {resultadoBusca?.nome || lote.loteNome}
                        </Typography.Text>
                      </div>

                      {(resultadoBusca?.nomenclatura || lote.nomenclatura) && (
                        <div>
                          <Typography.Text style={{
                            fontSize: isMobile ? '10px' : '11px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            display: 'block'
                          }}>
                            {resultadoBusca?.nomenclatura || lote.nomenclatura}
                          </Typography.Text>
                        </div>
                      )}

                      {(resultadoBusca?.areaHa || lote.areaHa) && (
                        <div style={{ marginTop: '4px' }}>
                          <Typography.Text style={{
                            fontSize: isMobile ? '10px' : '11px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            display: 'block'
                          }}>
                            {formatarNumero(resultadoBusca?.areaHa || lote.areaHa)} ha
                          </Typography.Text>
                        </div>
                      )}

                      <div style={{
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <Typography.Text style={{
                          fontSize: isMobile ? '9px' : '10px',
                          color: 'rgba(255, 255, 255, 0.8)',
                          display: 'block',
                          fontStyle: 'italic'
                        }}>
                          Lote DIBAU
                        </Typography.Text>
                      </div>
                    </LoteTooltipDestacado>
                  </OverlayView>
                )}

                {/* Tooltip simples com nome do lote - controlado pelo switch (sem área) */}
                {!isDestacado && mostrarNomesLotesDibau && currentZoom < zoomParaExibicaoDetalhes && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(width, height) => ({
                      x: -(width / 2),
                      y: -(height / 2)
                    })}
                  >
                    <LoteTooltip>
                      {tooltipTextSwitch}
                    </LoteTooltip>
                  </OverlayView>
                )}

                {/* Tooltip com área quando zoom é suficiente (não mostra se destacado) */}
                {!isDestacado && currentZoom >= zoomParaExibicaoDetalhes && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(width, height) => ({
                      x: -(width / 2),
                      y: -(height / 2)
                    })}
                  >
                    <LoteTooltip>
                      {tooltipTextZoom}
                    </LoteTooltip>
                  </OverlayView>
                )}
              </React.Fragment>
            );
          })}

          {/* Renderizar áreas existentes */}
          {mostrarAreas && lotesExistentes.map((area, index) => {
            if (!area.coordenadas || !Array.isArray(area.coordenadas) || area.coordenadas.length < 3) {
              return null;
            }

            const center = getPolygonCenter(area.coordenadas);
            const isHovered = areaHovered === area.id;
            const isDestacada = areaDestacada === area.id;
            
            return (
              <React.Fragment key={`existing-area-${area.id}`}>
                <Polygon
                  paths={area.coordenadas}
                  options={{
                    ...existingPolygonOptions,
                    fillOpacity: (isHovered || isDestacada) ? 0.4 : 0.2,
                    strokeOpacity: (isHovered || isDestacada) ? 1 : 0.6,
                    strokeWeight: (isHovered || isDestacada) ? 3 : 2,
                    zIndex: isDestacada ? 3 : 1,
                  }}
                  onMouseOver={() => setAreaHovered(area.id)}
                  onMouseOut={() => setAreaHovered(null)}
                />

                {/* Marcador especial para área destacada */}
                {isDestacada && (
                  <Marker
                    position={center}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      scaledSize: new window.google.maps.Size(20, 20),
                    }}
                    zIndex={4}
                  />
                )}

                {/* Marcador normal para área não destacada */}
                {!isDestacada && (
                  <Marker
                    position={center}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      scaledSize: new window.google.maps.Size(12, 12),
                    }}
                  />
                )}

                {/* Overlay estático com NOME da área - controlado pelo switch */}
                {mostrarNomesAreas && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={getPixelPositionOffset}
                  >
                    <StaticNameOverlay theme={theme}>
                      {area.nome}
                    </StaticNameOverlay>
                  </OverlayView>
                )}

                {/* Overlay com informações detalhadas da área quando zoom é suficiente */}
                {(currentZoom >= zoomParaExibicaoDetalhes || isHovered) && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={getPixelPositionOffset}
                  >
                    <OverlayBox>
                      <Typography.Text strong>
                        {area.nome}
                      </Typography.Text>
                      <br />
                      <Typography.Text>
                        Categoria: {area.categoria}
                      </Typography.Text>
                      <br />
                      <Typography.Text>
                        Área total: {formatarNumero(area.areaTotal)} ha
                      </Typography.Text>
                      <br />
                      <Typography.Text>
                        {Array.isArray(area.culturas) && area.culturas.length > 0
                          ? area.culturas.map((cultura) => (
                              `${cultura.nome}: ${formatarNumero(cultura.areaPlantada)} ha`
                            )).join(" | ")
                          : "Nenhuma cultura registrada"}
                      </Typography.Text>
                    </OverlayBox>
                  </OverlayView>
                )}
              </React.Fragment>
            );
          })}

          {/* Ferramenta de desenho para o modo de criação */}
          {mapMode === "create" && isDrawing && (
            <DrawingManager
              key={`drawing-${isDrawing}-${tempCoordinates.length}`}
              onPolygonComplete={handlePolygonComplete}
              options={{
                drawingControl: false,
                polygonOptions: {
                  ...polygonOptions,
                  editable: true,
                },
              }}
              drawingMode={
                isDrawing ? window.google.maps.drawing.OverlayType.POLYGON : null
              }
            />
          )}

          {/* Renderizar segmentos de linha para interatividade */}
          {isEditableMode && tempCoordinates.length > 2 && !isDrawing &&
            tempCoordinates.map((coord, index) => {
              const nextIndex = (index + 1) % tempCoordinates.length;
              const nextCoord = tempCoordinates[nextIndex];
              
              return (
                <Polyline
                  key={`segment-${index}`}
                  path={[coord, nextCoord]}
                  options={{
                    strokeColor: hoveredSegment === index ? "#fbbf24" : "#059669", // Amarelo hover, verde normal
                    strokeOpacity: hoveredSegment === index ? 1 : 0.8,
                    strokeWeight: hoveredSegment === index ? 4 : 3,
                    clickable: true,
                    draggable: isEditableMode,
                    zIndex: 3, // Acima dos polígonos existentes
                  }}
                  onMouseOver={() => !isDraggingSegment && setHoveredSegment(index)}
                  onMouseOut={() => !isDraggingSegment && setHoveredSegment(null)}
                  onDragStart={() => handleSegmentDragStart(index)}
                  onDragEnd={(e) => handleSegmentDragEnd(index, e)}
                />
              );
            })
          }

          {/* Renderizar o polígono atual sendo editado/criado */}
          {tempCoordinates.length > 0 && (
            <Polygon
              key={`polygon-${tempCoordinates.length}-${JSON.stringify(tempCoordinates[0] || {})}`}
              paths={tempCoordinates}
              options={{
                ...polygonOptions,
                fillColor: "#10b981", // Verde claro do tema
                strokeColor: "#10b981", // Verde claro do tema
                zIndex: 2, // Acima dos polígonos existentes
              }}
            />
          )}

          {/* Marcadores para os vértices do polígono atual */}
          {isEditableMode &&
            markers.map((marker, index) => (
              <Marker
                key={`vertex-${index}-${marker.lat}-${marker.lng}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                draggable={true}
                onDragEnd={(e) => handleMarkerDragEnd(index, e)}
                onClick={() => handleMarkerClick(index)}
                icon={markerOptions.icon}
                animation={window.google.maps.Animation.DROP}
                title="Arrastar para ajustar o vértice"
                zIndex={4} // Acima de tudo
              />
            ))}

          {/* Marcadores para os pontos médios do polígono atual */}
          {isEditableMode &&
            midpoints.map((midpoint, index) => (
              <Marker
                key={`midpoint-${index}-${midpoint.lat}-${midpoint.lng}`}
                position={{ lat: midpoint.lat, lng: midpoint.lng }}
                draggable={true}
                onDragEnd={(e) => handleMidpointDragEnd(midpoint.id, e)}
                onClick={() => handleMarkerClick(midpoint.id)}
                icon={midpointOptions.icon}
                title="Arrastar para adicionar um novo vértice"
                zIndex={4} // Acima de tudo
              />
            ))}

          {/* Janela de informação para o marcador selecionado */}
          {selectedMarker !== null && (
            <InfoWindow
              position={
                typeof selectedMarker === "number"
                  ? {
                      lat: markers[selectedMarker].lat,
                      lng: markers[selectedMarker].lng,
                    }
                  : {
                      lat: midpoints.find((m) => m.id === selectedMarker).lat,
                      lng: midpoints.find((m) => m.id === selectedMarker).lng,
                    }
              }
              onCloseClick={handleCloseInfoWindow}
            >
              <div style={{ padding: '5px' }}>
                {isEditableMode && typeof selectedMarker === "number" ? (
                  <Space>
                    <Typography.Text>Vértice {selectedMarker + 1}</Typography.Text>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        deleteMarker(selectedMarker);
                      }}
                      title="Remover vértice"
                    />
                  </Space>
                ) : (
                  <Typography.Text>
                    Arraste para criar um novo vértice
                  </Typography.Text>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        
        {/* Controles de zoom personalizados */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: isMobile ? "20px" : "10px",
          backgroundColor: "white",
          padding: isMobile ? "6px" : "5px",
          borderRadius: "0.25rem",
          boxShadow: "0 0.125rem 0.375rem rgba(0,0,0,0.3)",
          border: "0.0625rem solid #e0e0e0",
          zIndex: 100
        }}>
          <Space direction="vertical" size={isMobile ? 2 : 0}>
            <Button
              icon={<ZoomInOutlined style={{ fontSize: isMobile ? '1rem' : '0.875rem' }} />}
              type="text"
              size="small"
              onClick={() => {
                const newZoom = Math.min(currentZoom + 1, 20);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
              }}
              style={{
                width: isMobile ? '32px' : '28px',
                height: isMobile ? '32px' : '28px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Button
              icon={<ZoomOutOutlined style={{ fontSize: isMobile ? '1rem' : '0.875rem' }} />}
              type="text"
              size="small"
              onClick={() => {
                const newZoom = Math.max(currentZoom - 1, 1);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
              }}
              style={{
                width: isMobile ? '32px' : '28px',
                height: isMobile ? '32px' : '28px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Space>
        </div>
        
        {/* Legenda do mapa */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "white",
          padding: isMobile ? "6px 8px" : "8px",
          borderRadius: "0.25rem",
          boxShadow: "0 0.125rem 0.375rem rgba(0,0,0,0.3)",
          fontSize: isMobile ? "0.6875rem" : "0.75rem",
          border: "0.0625rem solid #e0e0e0",
          zIndex: 100,
          maxWidth: isMobile ? "calc(100% - 80px)" : "auto"
        }}>
          <div style={{
            marginBottom: "2px",
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              display: "inline-block",
              width: isMobile ? "8px" : "12px",
              height: isMobile ? "8px" : "12px",
              backgroundColor: "#10b981",
              flexShrink: 0
            }}></span>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              whiteSpace: isMobile ? "nowrap" : "normal"
            }}>
              {isMobile ? "Atual" : "Área atual"}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              display: "inline-block",
              width: isMobile ? "8px" : "12px",
              height: isMobile ? "8px" : "12px",
              backgroundColor: "#dc2626",
              flexShrink: 0
            }}></span>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              whiteSpace: isMobile ? "nowrap" : "normal"
            }}>
              {isMobile ? "Existentes" : "Áreas existentes"}
            </span>
          </div>
          {/* Entrada dos lotes DIBAU na legenda */}
          {mostrarLotesDibau && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px',
              paddingTop: '2px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <span style={{
                display: "inline-block",
                width: isMobile ? "8px" : "12px",
                height: isMobile ? "8px" : "12px",
                backgroundColor: "#000000",
                flexShrink: 0
              }}></span>
              <span style={{
                fontSize: isMobile ? "0.625rem" : "0.75rem",
                whiteSpace: isMobile ? "nowrap" : "normal"
              }}>
                {isMobile ? "Lotes" : "Lotes DIBAU"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Seção de ajuste manual da área */}
      <div style={{ marginTop: isMobile ? "12px" : "16px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? "8px" : "12px",
            padding: isMobile ? "8px" : "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "0.25rem",
            flexWrap: "wrap",
            border: "0.0625rem solid #e0e0e0"
          }}
        >
          {/* Área Original */}
          <div style={{ flex: isMobile ? "1" : "0 0 auto" }}>
            <Typography.Text type="secondary" style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              Área Original: <Typography.Text strong>{formatarNumero(originalArea)} ha</Typography.Text>
            </Typography.Text>
          </div>

          {/* Separador visual - apenas desktop */}
          {!isMobile && (
            <div style={{ width: "1px", height: "24px", backgroundColor: "#d9d9d9" }} />
          )}

          {/* Label e Input na mesma linha */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "4px" : "8px",
            whiteSpace: "nowrap",
            flex: isMobile ? "1" : "0 0 auto"
          }}>
            <Typography.Text strong style={{
              whiteSpace: "nowrap",
              fontSize: isMobile ? "0.75rem" : "0.875rem"
            }}>
              Área {isMobile ? "" : "do Polígono"}:
            </Typography.Text>

            {/* Input estilizado com ícone - largura reduzida */}
            <InputWithIconContainer iconPosition="right" width={isMobile ? "100px" : "120px"}>
              <StyledNumericFormat
                value={manualArea}
                onValueChange={handleManualAreaChange}
                decimalScale={2}
                fixedDecimalScale
                suffix=" ha"
                thousandSeparator="."
                decimalSeparator=","
                disabled={!isEditableMode || tempCoordinates.length < 3}
                hasRightAlignedText={false}
              />
              <EditOutlined className="input-icon" />
            </InputWithIconContainer>
          </div>

          {/* Indicador de erro */}
          {!isManualAreaValid && (
            <Typography.Text type="danger" style={{ fontSize: isMobile ? "0.6875rem" : "0.75rem" }}>
              Valor fora do limite (±10%)
            </Typography.Text>
          )}
        </div>

        {/* Alerta informativo */}
        {tempCoordinates.length > 0 && (
          <Alert
            message={isMobile ? "Ajuste manual: até ±10%" : "Você pode ajustar manualmente a área em até 10% para mais ou para menos."}
            type="info"
            showIcon
            style={{
              marginTop: "8px",
              fontSize: isMobile ? "0.6875rem" : "0.875rem"
            }}
          />
        )}
      </div>
    </Modal>
  );
});

MapDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapMode: PropTypes.string.isRequired,
  setMapMode: PropTypes.func.isRequired,
  isDrawing: PropTypes.bool.isRequired,
  setIsDrawing: PropTypes.func.isRequired,
  mapCenter: PropTypes.object.isRequired,
  setMapCenter: PropTypes.func.isRequired,
  mapZoom: PropTypes.number.isRequired,
  setMapZoom: PropTypes.func.isRequired,
  loteAtual: PropTypes.object,
  setLoteAtual: PropTypes.func.isRequired,
  tempCoordinates: PropTypes.array.isRequired,
  setTempCoordinates: PropTypes.func.isRequired,
  markers: PropTypes.array.isRequired,
  setMarkers: PropTypes.func.isRequired,
  midpoints: PropTypes.array.isRequired,
  setMidpoints: PropTypes.func.isRequired,
  handlePolygonComplete: PropTypes.func.isRequired,
  handleMarkerDragEnd: PropTypes.func.isRequired,
  handleMarkerClick: PropTypes.func.isRequired,
  handleMidpointDragEnd: PropTypes.func.isRequired,
  deleteMarker: PropTypes.func.isRequired,
  selectedMarker: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.oneOf([null])
  ]),
  handleCloseInfoWindow: PropTypes.func.isRequired,
  calculateAreaPolygon: PropTypes.func.isRequired,
  setAreaPoligono: PropTypes.func.isRequired,
  areaPoligono: PropTypes.number.isRequired,
  lotesExistentes: PropTypes.array
};


export default MapDialog;