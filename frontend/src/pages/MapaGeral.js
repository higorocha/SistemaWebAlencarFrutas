// src/pages/MapaGeral.js

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Typography, Button, Space, Alert, Switch, Tooltip, Input } from "antd";
import { useTheme } from "@mui/material/styles";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  HomeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SwapOutlined,
  SearchOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import useResponsive from "../hooks/useResponsive";
import { numberFormatter } from "../utils/formatters";
import areadoImovelData from "../assets/geojson/cardibau/AreadoImovel.json";
import todosDibauData from "../assets/geojson/lotesdibau/todosDibau.json";
import {
  GoogleMap,
  Marker,
  Polygon,
  OverlayView,
} from "@react-google-maps/api";
import styled from "styled-components";
import axiosInstance from "../api/axiosConfig";
import { CentralizedLoader } from "components/common/loaders";
import { useLoadScript } from "@react-google-maps/api";
import { Box } from "@mui/material";
import DetalhesAreaModal from "../components/areas/DetalhesAreaModal";
import { showNotification } from "../config/notificationConfig";
import { debounce } from "lodash";

// Funções auxiliares do MapDialog
const API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_DEFAULT_API_KEY_HERE";

const GOOGLE_MAPS_LIBRARIES = ["geometry"];

// Estilo para o overlay de informações da área
const OverlayBox = styled.div`
  background: ${props => props.bgColor || (props.theme?.palette?.background?.paper || 'white')};
  padding: ${props => props.isMobile ? '10px 12px' : '12px 16px'};
  border: 2px solid ${props => props.borderColor || (props.theme?.palette?.ui?.border || '#ccc')};
  border-radius: 8px;
  box-shadow: 0 4px 12px ${props => props.shadowColor || (props.theme?.palette?.ui?.shadow || 'rgba(0, 0, 0, 0.3)')};
  min-width: ${props => props.isMobile ? '160px' : '200px'};
  max-width: ${props => props.isMobile ? '240px' : '280px'};
  text-align: left;
  z-index: 10;
  color: ${props => props.textColor || (props.theme?.palette?.text?.primary || '#333333')};
  font-family: ${props => props.theme?.typography?.fontFamily || 'inherit'};
  backdrop-filter: blur(4px);
  position: relative;
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

// Estilo para o tooltip destacado dos lotes DIBAU (quando selecionado na busca)
const LoteTooltipDestacado = styled.div`
  background: ${props => props.bgColor || '#FF6B6B'};
  padding: ${props => props.isMobile ? '8px 10px' : '10px 14px'};
  border: 2px solid ${props => props.borderColor || '#DC2626'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  min-width: ${props => props.isMobile ? '140px' : '180px'};
  max-width: ${props => props.isMobile ? '220px' : '260px'};
  text-align: center;
  z-index: 10;
  color: white;
  font-family: ${props => props.theme?.typography?.fontFamily || 'inherit'};
  backdrop-filter: blur(4px);
  position: relative;
  animation: pulse 1.5s ease-in-out infinite;
`;

// Estilo para o container de busca
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

// Estilo para o dropdown de resultados de busca
const SearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08);
  z-index: 1050;
  max-height: 300px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

// Item de resultado de busca
const SearchResultItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

// Ícone do tipo de área
const ResultIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: ${props => props.bgColor || '#f0f0f0'};
  color: ${props => props.color || '#666'};
  flex-shrink: 0;
`;

// Conteúdo do resultado
const ResultContent = styled.div`
  flex: 1;
  min-width: 0;
`;

// Título do resultado
const ResultTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
`;

// Subtítulo do resultado
const ResultSubtitle = styled.div`
  font-size: 12px;
  color: #666;
`;

// Badge do tipo
const TypeBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: white;
  background-color: ${props => props.color || '#666'};
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const { Title } = Typography;

// Adicionar animação pulse globalmente
const GlobalStyle = styled.div`
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
`;

const MapaGeral = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  
  // Estados do mapa
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando mapa...");
  const [mostrarNomesAreas, setMostrarNomesAreas] = useState(false); // Switch para controlar exibição dos nomes
  const [mostrarAreaImovel, setMostrarAreaImovel] = useState(false); // Switch para controlar exibição da área do imóvel
  const [mostrarLotesDibau, setMostrarLotesDibau] = useState(true); // Switch para controlar exibição dos lotes DIBAU
  const [mostrarNomesLotesDibau, setMostrarNomesLotesDibau] = useState(false); // Switch para controlar exibição dos nomes dos lotes DIBAU
  const [mostrarSede, setMostrarSede] = useState(true); // Switch para controlar exibição da sede
  const [modolezenda, setModoLegenda] = useState('cultura'); // 'categoria' ou 'cultura' - padrão: cultura
  const [transitioning, setTransitioning] = useState(false); // Estado para controlar animação de transição
  const [culturasVisiveis, setCulturasVisiveis] = useState({}); // Estado para controlar visibilidade de culturas
  const [rotationCount, setRotationCount] = useState(0); // Contador de rotações do botão toggle
  
  // Estados do mapa
  const [mapCenter, setMapCenter] = useState({ lat: -3.052397, lng: -40.083981 });
  const [mapZoom, setMapZoom] = useState(13);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [areaHovered, setAreaHovered] = useState(null);

  // Estados do modal de detalhes
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [dadosDetalhesArea, setDadosDetalhesArea] = useState(null);
  const [loadingDetalhesArea, setLoadingDetalhesArea] = useState(false);
  
  // Estados da busca de áreas
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [areaDestacada, setAreaDestacada] = useState(null); // Área ou lote selecionado pela busca
  const [loteDestacado, setLoteDestacado] = useState(null); // Lote DIBAU destacado
  const searchContainerRef = useRef(null);
  
  // Função para processar as coordenadas da área do imóvel
  const processAreaDoImovelCoordinates = useCallback(() => {
    try {
      const geometries = areadoImovelData.geometries;
      const polygons = [];
      
      geometries.forEach(geometry => {
        if (geometry.type === 'Polygon') {
          // Converter coordenadas para o formato do Google Maps
          const paths = geometry.coordinates.map(ring => 
            ring.map(coord => ({
              lat: coord[1], // latitude
              lng: coord[0]  // longitude
            }))
          );
          polygons.push(paths);
        } else if (geometry.type === 'MultiPolygon') {
          // Processar múltiplos polígonos
          geometry.coordinates.forEach(polygon => {
            const paths = polygon.map(ring => 
              ring.map(coord => ({
                lat: coord[1], // latitude
                lng: coord[0]  // longitude
              }))
            );
            polygons.push(paths);
          });
        }
      });
      
      return polygons;
    } catch (error) {
      console.error('Erro ao processar coordenadas da área do imóvel:', error);
      return [];
    }
  }, []);
  
  // Processar coordenadas da área do imóvel
  const areaDoImovelPolygons = useMemo(() => {
    return processAreaDoImovelCoordinates();
  }, [processAreaDoImovelCoordinates]);
  
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
      
      todosDibauData.features.forEach(feature => {
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
          
          lotes.push({
            paths,
            loteNome,
            nomenclatura,
            areaHa
          });
        } else if (geometry.type === 'MultiPolygon') {
          // Processar múltiplos polígonos
          geometry.coordinates.forEach(polygon => {
            const paths = polygon.map(ring => 
              ring.map(coord => ({
                lat: coord[1], // latitude
                lng: coord[0]  // longitude
              }))
            );
            
            lotes.push({
              paths,
              loteNome,
              nomenclatura,
              areaHa
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
  
  const mapRef = useRef(null);
  const zoomParaExibicaoDetalhes = 16; // Zoom necessário para mostrar detalhes

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    onLoad: () => {},
    onError: (error) => console.error("Erro ao carregar Google Maps:", error),
  });

  // Carregar áreas agrícolas
  const carregarAreas = useCallback(async () => {
    try {
      setCentralizedLoading(true);
      setLoadingMessage("Carregando áreas agrícolas...");
      setLoading(true);
      
      const response = await axiosInstance.get("/api/areas-agricolas");
      const areasCarregadas = response.data;
      setAreas(areasCarregadas);
      
      // Calcular bounds e centro das áreas carregadas
      if (areasCarregadas.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        areasCarregadas.forEach(area => {
          if (area.coordenadas && Array.isArray(area.coordenadas)) {
            area.coordenadas.forEach(coord => bounds.extend(coord));
          }
        });
        
        if (!bounds.isEmpty()) {
          const center = bounds.getCenter();
          setMapCenter({ lat: center.lat(), lng: center.lng() });
          
          // Calcular zoom apropriado baseado nos bounds
          // Nota: zoom será ajustado pelo fitBounds no primeiro render
          setMapZoom(13); // Zoom base, será ajustado pelo mapa
        }
      }
    } catch (error) {
      console.error("Erro ao buscar áreas agrícolas:", error);
    } finally {
      setLoading(false);
      setCentralizedLoading(false);
    }
  }, []);

  // Carregar dados quando o Google Maps estiver pronto
  useEffect(() => {
    if (isLoaded && !loadError) {
      carregarAreas();
    }
  }, [isLoaded, loadError, carregarAreas]);

  // Inicializar culturas como visíveis quando as áreas forem carregadas
  useEffect(() => {
    if (areas.length > 0) {
      const culturasIniciais = {};
      areas.forEach(area => {
        if (area.culturas && Array.isArray(area.culturas) && area.culturas.length > 0) {
          // Área tem culturas
          area.culturas.forEach(cultura => {
            const culturaDescricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
            if (!(culturaDescricao in culturasIniciais)) {
              culturasIniciais[culturaDescricao] = true; // Todas iniciam como visíveis
            }
          });
        } else {
          // Área sem cultura
          const semCulturaKey = 'Sem Cultura';
          if (!(semCulturaKey in culturasIniciais)) {
            culturasIniciais[semCulturaKey] = true;
          }
        }
      });
      setCulturasVisiveis(culturasIniciais);
    }
  }, [areas]);

  // Callbacks para controlar o mapa
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Aplicar fitBounds uma única vez se houver áreas
    if (areas.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      areas.forEach(area => {
        if (area.coordenadas && Array.isArray(area.coordenadas)) {
          area.coordenadas.forEach(coord => bounds.extend(coord));
        }
      });
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        // Ajustar zoom máximo após fitBounds
        const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() > 16) {
            map.setZoom(16);
          }
        });
      }
    }
  }, [areas]);

  // Função para buscar detalhes da área e abrir modal
  const handleClickArea = useCallback(async (area) => {
    try {
      setLoadingDetalhesArea(true);
      setDetalhesModalOpen(true);
      setDadosDetalhesArea(null);

      // Buscar detalhes completos do backend
      const response = await axiosInstance.get(`/api/areas-agricolas/${area.id}/detalhes`);
      setDadosDetalhesArea(response.data);

    } catch (error) {
      console.error("Erro ao buscar detalhes da área:", error);
      showNotification("error", "Erro", "Erro ao carregar detalhes da área");
      setDetalhesModalOpen(false);
    } finally {
      setLoadingDetalhesArea(false);
    }
  }, []);

  // Função para fechar modal de detalhes
  const handleCloseDetalhesModal = useCallback(() => {
    setDetalhesModalOpen(false);
    setDadosDetalhesArea(null);
  }, []);

  // Função para calcular o centro de um polígono (MOVED HERE - antes de ser usada)
  const getPolygonCenter = useCallback((coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return mapCenter;
    }
    
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    const center = bounds.getCenter();
    return { lat: center.lat(), lng: center.lng() };
  }, [mapCenter]);

  // Função para buscar áreas (backend + lotes DIBAU)
  const buscarAreas = useCallback(async (termo) => {
    const trimmedTerm = termo?.trim() || '';
    
    if (!trimmedTerm || trimmedTerm.length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchDropdownOpen(true);

      // 1. Buscar nas áreas do sistema (backend)
      const responseBackend = await axiosInstance.get(`/api/areas-agricolas/buscar?termo=${encodeURIComponent(trimmedTerm)}`);
      const areasBackend = responseBackend.data || [];

      // 2. Buscar nos lotes DIBAU localmente
      const lotesFiltrados = todosDibauLotes
        .map((lote, originalIndex) => ({ ...lote, originalIndex }))
        .filter(lote => {
          const nomeMatch = lote.loteNome && lote.loteNome.toLowerCase().includes(trimmedTerm.toLowerCase());
          const nomenclaturaMatch = lote.nomenclatura && lote.nomenclatura.toLowerCase().includes(trimmedTerm.toLowerCase());
          return nomeMatch || nomenclaturaMatch;
        });

      // 3. Combinar resultados
      const resultados = [
        ...areasBackend.map(area => ({
          tipo: 'area-sistema',
          id: area.id,
          nome: area.nome,
          categoria: area.categoria,
          areaTotal: area.areaTotal,
          coordenadas: area.coordenadas,
          culturas: area.culturas
        })),
        ...lotesFiltrados.map((lote) => ({
          tipo: 'lote-dibau',
          id: `lote-${lote.originalIndex}`, // Usar o índice original do array todosDibauLotes
          nome: lote.loteNome,
          nomenclatura: lote.nomenclatura,
          areaHa: lote.areaHa,
          paths: lote.paths
        }))
      ];

      setSearchResults(resultados);

      if (resultados.length === 0) {
        setSearchResults([{
          tipo: 'no-results',
          nome: `Nenhum resultado encontrado para "${trimmedTerm}"`
        }]);
      }

    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      setSearchResults([{
        tipo: 'error',
        nome: 'Erro ao buscar. Tente novamente.'
      }]);
    } finally {
      setSearchLoading(false);
    }
  }, [todosDibauLotes]);

  // Debounced search
  const debouncedBuscarAreas = useCallback(
    debounce((termo) => {
      buscarAreas(termo);
    }, 300),
    [buscarAreas]
  );

  // Handle busca input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value) {
      setSearchDropdownOpen(false);
      setSearchResults([]);
    } else {
      debouncedBuscarAreas(value);
    }
  }, [debouncedBuscarAreas]);

  // Handle seleção de resultado de busca
  const handleSelectSearchResult = useCallback((resultado) => {
    if (resultado.tipo === 'no-results' || resultado.tipo === 'error') {
      return;
    }

    // Limpar busca
    setSearchTerm("");
    setSearchDropdownOpen(false);

    if (resultado.tipo === 'area-sistema') {
      // Centralizar no centro da área
      const center = getPolygonCenter(resultado.coordenadas);
      setMapCenter(center);
      setMapZoom(15);
      
      if (mapRef.current) {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(15);
      }

      // Destacar área (usar o hover existente)
      setAreaDestacada(resultado.id);
      setAreaHovered(resultado.id);

      // Remover destaque após 10 segundos
      setTimeout(() => {
        setAreaDestacada(null);
        setAreaHovered(null);
      }, 10000);

    } else if (resultado.tipo === 'lote-dibau') {
      // Centralizar no centro do lote
      const center = getPolygonCenter(resultado.paths[0]);
      setMapCenter(center);
      setMapZoom(15);
      
      if (mapRef.current) {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(15);
      }

      // Destacar lote temporariamente
      setLoteDestacado(resultado.id);

      // Remover destaque após 10 segundos
      setTimeout(() => {
        setLoteDestacado(null);
      }, 10000);
    }

  }, [getPolygonCenter]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função para alternar modo de legenda com animação
  const handleToggleLegenda = useCallback(() => {
    setTransitioning(true);
    setRotationCount(prev => prev + 1); // Incrementar contador de rotações
    setTimeout(() => {
      setModoLegenda(modolezenda === 'categoria' ? 'cultura' : 'categoria');
      setTimeout(() => {
        setTransitioning(false);
      }, 150);
    }, 150);
  }, [modolezenda]);

  // Filtrar áreas com base na visibilidade das culturas
  const areasVisiveis = useMemo(() => {
    return areas.filter(area => {
      // Se o modo for cultura, filtrar pela visibilidade da cultura
      if (modolezenda === 'cultura') {
        // Uma área pode ter múltiplas culturas
        if (area.culturas && Array.isArray(area.culturas) && area.culturas.length > 0) {
          // Mostrar a área se PELO MENOS UMA de suas culturas estiver visível
          return area.culturas.some(cultura => {
            const culturaDescricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
            return culturasVisiveis[culturaDescricao] !== false;
          });
        } else {
          // Área sem cultura - verificar visibilidade de "Sem Cultura"
          const semCulturaKey = 'Sem Cultura';
          return culturasVisiveis[semCulturaKey] !== false;
        }
      }
      // Se for categoria, mostrar todas
      return true;
    });
  }, [areas, modolezenda, culturasVisiveis]);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const newZoom = mapRef.current.getZoom();
      setCurrentZoom(newZoom);
      setMapZoom(newZoom);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    if (mapRef.current) {
      const newCenter = mapRef.current.getCenter();
      const center = { lat: newCenter.lat(), lng: newCenter.lng() };
      setMapCenter(center);
    }
  }, []);

  // Função auxiliar para posicionar overlays
  const getPixelPositionOffset = useCallback((width, height) => ({
    x: -(width / 2),
    y: -(height / 2),
  }), []);

  // Função para centralizar o mapa em todas as áreas
  const centralizarMapa = useCallback(() => {
    if (areas.length === 0 || !mapRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    areas.forEach(area => {
      if (area.coordenadas && Array.isArray(area.coordenadas)) {
        area.coordenadas.forEach(coord => bounds.extend(coord));
      }
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
      // Ajustar zoom se necessário
      const listener = window.google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 16) {
          mapRef.current.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [areas]);

  // Função para ir para localização atual
  const irParaLocalizacaoAtual = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(pos);
          setMapZoom(16);
          if (mapRef.current) {
            mapRef.current.setCenter(pos);
            mapRef.current.setZoom(16);
          }
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }, []);

// Função para obter cor da categoria usando o theme
const getCategoriaColor = (categoria, theme) => {
  const coresCategoria = {
    'COLONO': theme?.palette?.areaCategorias?.COLONO?.primary || '#52c41a',
    'TECNICO': theme?.palette?.areaCategorias?.TECNICO?.primary || '#1890ff',
    'EMPRESARIAL': theme?.palette?.areaCategorias?.EMPRESARIAL?.primary || '#722ed1',
    'ADJACENTE': theme?.palette?.areaCategorias?.ADJACENTE?.primary || '#fa8c16'
  };
  return coresCategoria[categoria] || '#dc2626'; // Fallback para vermelho
};

  // Função para obter nome da categoria
  const getCategoriaNome = (categoria) => {
    const nomesCategoria = {
      'COLONO': 'Colono',
      'TECNICO': 'Técnico',
      'EMPRESARIAL': 'Empresarial',
      'ADJACENTE': 'Adjacente'
    };
    return nomesCategoria[categoria] || categoria;
  };

  // Função para agrupar áreas por cultura e calcular totais
  const agruparAreasPorCultura = useMemo(() => {
    const agrupamento = {};
    
    areas.forEach(area => {
      if (area.culturas && Array.isArray(area.culturas) && area.culturas.length > 0) {
        // Área tem culturas plantadas
        area.culturas.forEach(cultura => {
          const culturaDescricao = cultura.descricao || `Cultura ${cultura.culturaId}`;
          
          if (!agrupamento[culturaDescricao]) {
            agrupamento[culturaDescricao] = {
              nome: culturaDescricao,
              totalHa: 0,
              areas: []
            };
          }
          
          agrupamento[culturaDescricao].totalHa += cultura.areaPlantada || 0;
          agrupamento[culturaDescricao].areas.push({
            areaId: area.id,
            culturaId: cultura.culturaId,
            areaPlantada: cultura.areaPlantada
          });
        });
      } else {
        // Área SEM cultura plantada
        const semCulturaKey = 'Sem Cultura';
        
        if (!agrupamento[semCulturaKey]) {
          agrupamento[semCulturaKey] = {
            nome: semCulturaKey,
            totalHa: 0,
            areas: []
          };
        }
        
        // Adicionar a área total da área ao agrupamento "Sem Cultura"
        agrupamento[semCulturaKey].totalHa += area.areaTotal || 0;
        agrupamento[semCulturaKey].areas.push({
          areaId: area.id,
          culturaId: null,
          areaPlantada: area.areaTotal || 0
        });
      }
    });
    
    return agrupamento;
  }, [areas]);

  // Função para criar mapeamento de cultura para cor
  const mapeamentoCulturaCor = useMemo(() => {
    const culturas = Object.keys(agruparAreasPorCultura);
    const coresCulturas = theme?.palette?.culturas || {};
    const todasAsCores = Object.values(coresCulturas);
    
    // Cores fixas das categorias que NÃO devem ser usadas para culturas
    const coresCategorias = [
      theme?.palette?.areaCategorias?.COLONO?.primary || '#52c41a',
      theme?.palette?.areaCategorias?.TECNICO?.primary || '#1890ff',
      theme?.palette?.areaCategorias?.EMPRESARIAL?.primary || '#722ed1',
      theme?.palette?.areaCategorias?.ADJACENTE?.primary || '#fa8c16'
    ];
    
    // Cores adicionais a excluir (rosa)
    const coresExcluidas = [
      '#eb2f96' // Rosa vibrante
    ];
    
    // Filtrar cores disponíveis excluindo as cores de categorias e cores indesejadas
    const coresDisponiveis = todasAsCores.filter(cor => 
      !coresCategorias.includes(cor) && !coresExcluidas.includes(cor)
    );
    
    const mapeamento = {};
    
    culturas.forEach((cultura, index) => {
      // "Sem Cultura" sempre recebe cor cinza
      if (cultura === 'Sem Cultura') {
        mapeamento[cultura] = '#999999';
      } else {
        // Usar cores que não são de categorias nem excluídas
        mapeamento[cultura] = coresDisponiveis[index % coresDisponiveis.length] || '#999999';
      }
    });
    
    return mapeamento;
  }, [agruparAreasPorCultura, theme]);

  // Função para obter cor da cultura de uma área
  const getCorCultura = useCallback((area) => {
    if (!area.culturas || !Array.isArray(area.culturas) || area.culturas.length === 0) {
      return '#999999'; // Cinza para áreas sem cultura
    }
    
    // Pega a primeira cultura da área
    const primeiraCultura = area.culturas[0];
    const culturaDescricao = primeiraCultura.descricao || `Cultura ${primeiraCultura.culturaId}`;
    
    return mapeamentoCulturaCor[culturaDescricao] || '#999999';
  }, [mapeamentoCulturaCor]);

// Função para obter opções do polígono baseadas na categoria ou cultura
const getPolygonOptions = (area, isHovered = false, theme, modoLegenda) => {
  let cor;
  
  if (modoLegenda === 'cultura') {
    // Modo cultura: usa cor baseada na cultura da área
    cor = getCorCultura(area);
  } else {
    // Modo categoria: usa cor baseada na categoria
    cor = getCategoriaColor(area.categoria, theme);
  }
  
  return {
    fillColor: cor,
    fillOpacity: isHovered ? 0.6 : 0.4,
    strokeColor: cor,
    strokeOpacity: isHovered ? 1 : 0.8,
    strokeWeight: isHovered ? 4 : 3,
    clickable: true,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: isHovered ? 4 : 2, // Maior zIndex quando hover
  };
};


// Opções do polígono da área do imóvel
const getAreaDoImovelPolygonOptions = (theme) => {
  return {
    fillColor: '#8FBC8F', // Verde musgo
    fillOpacity: 0.2, // Extremamente transparente
    strokeColor: '#FFD700', // Amarelo verdadeiro para borda
    strokeOpacity: 1, // Bordas mais visíveis
    strokeWeight: 1,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 0, // Abaixo das áreas agrícolas
  };
};

// Opções do polígono dos lotes DIBAU
const getLotesDibauPolygonOptions = (theme) => {
  return {
    fillColor: '#FF6B6B', // Vermelho coral
    fillOpacity: 0.15, // Extremamente transparente (15%)
    strokeColor: '#000000', // Preto para borda
    strokeOpacity: 0.5, // Bordas visíveis (90%)
    strokeWeight: 0.5,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1, // Acima da área do imóvel, mas abaixo das áreas agrícolas
  };
};

  if (loadError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          message="Erro ao carregar o Google Maps"
          description="Verifique se a chave da API está configurada corretamente no arquivo .env como REACT_APP_GOOGLE_MAPS_API_KEY."
          type="error"
          showIcon
        />
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ p: 2 }}>
        <CentralizedLoader
          visible={true}
          message="Carregando mapa..."
          subMessage="Aguarde enquanto carregamos o Google Maps..."
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: isMobile ? "calc(100vh - 130px)" : "calc(100vh - 140px)", // Ajustado para evitar scroll
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 0.5 : 1,
        p: isMobile ? 0.5 : 1.5,
        overflow: "hidden"
      }}
    >
      {/* Header com título */}
      <Box sx={{ mb: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: isMobile ? 1 : 1.5
        }}>
          <Title
            level={2}
            style={{
              margin: 0,
              color: "#059669",
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              fontSize: isMobile ? '1rem' : '1.25rem'
            }}
          >
            <Icon
              icon="mdi:map-marker-multiple"
              style={{
                marginRight: isMobile ? 6 : 10,
                fontSize: isMobile ? '20px' : '26px',
                color: "#059669"
              }}
            />
            {isMobile ? "Mapa Geral" : "Mapa Geral das Áreas Agrícolas"}
          </Title>
        </Box>
      </Box>

      {/* Controles do mapa */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? 0.25 : 1,
        mb: isMobile ? 0.25 : 0.5,
        minHeight: isMobile ? "auto" : "40px"
      }}>
        {/* Botões de ação */}
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Button
            type="default"
            icon={<HomeOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={centralizarMapa}
            disabled={areas.length === 0}
            style={{
              fontSize: isMobile ? "0.6875rem" : "0.875rem",
              height: isMobile ? "28px" : "40px",
              padding: isMobile ? "0 6px" : "0 12px",
            }}
          >
            {isMobile ? "Centralizar" : "Centralizar Áreas"}
          </Button>
          
          <Button
            type="default"
            icon={<Icon icon="mdi:map" />}
            size={isMobile ? "small" : "middle"}
            onClick={irParaLocalizacaoAtual}
            style={{
              fontSize: isMobile ? "0.6875rem" : "0.875rem",
              height: isMobile ? "28px" : "40px",
              padding: isMobile ? "0 6px" : "0 12px",
            }}
          >
            {isMobile ? "Minha Localização" : "Minha Localização"}
          </Button>

          <Button
            type="default"
            icon={<ReloadOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={carregarAreas}
            loading={loading}
            style={{
              fontSize: isMobile ? "0.6875rem" : "0.875rem",
              height: isMobile ? "28px" : "40px",
              padding: isMobile ? "0 6px" : "0 12px",
            }}
          >
            {isMobile ? "Atualizar" : "Atualizar Dados"}
          </Button>
        </Space>

        {/* Divider e Campo de Busca - Desktop */}
        {!isMobile && (
          <>
            {/* Divider vertical */}
            <div style={{
              width: "1px",
              height: "32px",
              backgroundColor: "rgba(5, 150, 105, 0.2)",
              margin: "0 12px"
            }} />

            {/* Campo de Busca */}
            <SearchContainer ref={searchContainerRef} style={{ flex: 1 }}>
              <Input
                placeholder="Buscar área por nome..."
                value={searchTerm}
                onChange={handleSearchChange}
                allowClear
                prefix={searchLoading ? <LoadingOutlined spin /> : <SearchOutlined />}
                size="middle"
                style={{
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />

              {/* Dropdown de Resultados */}
              <SearchDropdown $isOpen={searchDropdownOpen}>
                {searchLoading ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#1890ff'
                  }}>
                    <LoadingOutlined spin style={{ marginRight: '8px' }} />
                    <span>Buscando...</span>
                  </div>
                ) : (
                  searchResults.map((resultado, index) => {
                    if (resultado.tipo === 'no-results') {
                      return (
                        <div key="no-results" style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#999',
                          fontStyle: 'italic'
                        }}>
                          {resultado.nome}
                        </div>
                      );
                    }

                    if (resultado.tipo === 'error') {
                      return (
                        <div key="error" style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#f5222d'
                        }}>
                          ⚠️ {resultado.nome}
                        </div>
                      );
                    }

                    if (resultado.tipo === 'area-sistema') {
                      const categoriaConfig = {
                        'COLONO': { cor: theme?.palette?.areaCategorias?.COLONO?.primary || '#52c41a', nome: 'Colono', icon: '🌱' },
                        'TECNICO': { cor: theme?.palette?.areaCategorias?.TECNICO?.primary || '#1890ff', nome: 'Técnico', icon: '🔧' },
                        'EMPRESARIAL': { cor: theme?.palette?.areaCategorias?.EMPRESARIAL?.primary || '#722ed1', nome: 'Empresarial', icon: '🏢' },
                        'ADJACENTE': { cor: theme?.palette?.areaCategorias?.ADJACENTE?.primary || '#fa8c16', nome: 'Adjacente', icon: '📍' }
                      };

                      const config = categoriaConfig[resultado.categoria] || { cor: '#999', nome: resultado.categoria, icon: '📍' };

                      return (
                        <SearchResultItem key={`area-${resultado.id}`} onClick={() => handleSelectSearchResult(resultado)}>
                          <ResultIcon bgColor={`${config.cor}20`} color={config.cor}>
                            {config.icon}
                          </ResultIcon>
                          <ResultContent>
                            <ResultTitle>{resultado.nome}</ResultTitle>
                            <ResultSubtitle>
                              <TypeBadge color={config.cor}>{config.nome}</TypeBadge>
                              {' • '}
                              {numberFormatter(resultado.areaTotal)} ha
                              {resultado.culturas && resultado.culturas.length > 0 && (
                                <> • {resultado.culturas.map(c => c.descricao).join(', ')}</>
                              )}
                            </ResultSubtitle>
                          </ResultContent>
                        </SearchResultItem>
                      );
                    }

                    if (resultado.tipo === 'lote-dibau') {
                      return (
                        <SearchResultItem key={resultado.id} onClick={() => handleSelectSearchResult(resultado)}>
                          <ResultIcon bgColor="#FFF0F0" color="#FF6B6B">
                            🏞️
                          </ResultIcon>
                          <ResultContent>
                            <ResultTitle>{resultado.nome}</ResultTitle>
                            <ResultSubtitle>
                              <TypeBadge color="#FF6B6B">Lote DIBAU</TypeBadge>
                              {resultado.nomenclatura && (
                                <> • {resultado.nomenclatura}</>
                              )}
                              {resultado.areaHa && (
                                <> • {numberFormatter(resultado.areaHa)} ha</>
                              )}
                            </ResultSubtitle>
                          </ResultContent>
                        </SearchResultItem>
                      );
                    }

                    return null;
                  })
                )}
              </SearchDropdown>
            </SearchContainer>

            {/* Divider vertical */}
            <div style={{
              width: "1px",
              height: "32px",
              backgroundColor: "rgba(5, 150, 105, 0.2)",
              margin: "0 12px"
            }} />
          </>
        )}

        {/* Switches para controlar exibição */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? "4px" : "12px",
          flexWrap: "nowrap"
        }}>
          {/* Primeira linha no mobile / Todos no desktop */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "4px" : "12px",
            flexWrap: "nowrap"
          }}>
            {/* Componente unificado Alencar - Desktop e Mobile */}
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
              <Icon 
                icon="mdi:home-outline" 
                style={{ 
                  fontSize: isMobile ? "12px" : "18px",
                  color: (mostrarNomesAreas || mostrarSede) ? "#059669" : "#666",
                  transition: "color 0.2s ease"
                }} 
              />
              <Typography.Text 
                style={{ 
                  fontSize: isMobile ? "0.5625rem" : "0.8125rem",
                  fontWeight: "600",
                  margin: 0,
                  whiteSpace: "nowrap",
                  color: (mostrarNomesAreas || mostrarSede) ? "#059669" : "#666",
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
              
              {/* Toggle para Sede */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "2px" : "6px",
                padding: isMobile ? "2px 4px" : "4px 8px",
                borderRadius: isMobile ? "8px" : "12px",
                backgroundColor: mostrarSede ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                transition: "all 0.2s ease"
              }}>
                <Typography.Text 
                  style={{ 
                    fontSize: isMobile ? "0.5rem" : "0.75rem",
                    fontWeight: "500",
                    margin: 0,
                    color: mostrarSede ? "#059669" : "#999",
                    transition: "color 0.2s ease"
                  }}
                >
                  Sede
                </Typography.Text>
                <Switch
                  size="small"
                  checked={mostrarSede}
                  onChange={setMostrarSede}
                  style={{
                    backgroundColor: mostrarSede ? "#059669" : undefined,
                    transform: isMobile ? "scale(0.8)" : undefined
                  }}
                />
              </div>
            </div>

            {/* Componente unificado DIBAU - Desktop */}
            {!isMobile && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                padding: "8px 14px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                transition: "all 0.2s ease"
              }}>
                <Icon 
                  icon="mdi:map-legend" 
                  style={{ 
                    fontSize: "18px",
                    color: (mostrarLotesDibau || mostrarAreaImovel) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }} 
                />
                <Typography.Text 
                  style={{ 
                    fontSize: "0.8125rem",
                    fontWeight: "600",
                    margin: 0,
                    whiteSpace: "nowrap",
                    color: (mostrarLotesDibau || mostrarAreaImovel) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }}
                >
                  DIBAU
                </Typography.Text>
                
                {/* Separador visual */}
                <div style={{
                  width: "1px",
                  height: "20px",
                  backgroundColor: "rgba(5, 150, 105, 0.3)",
                  margin: "0 4px"
                }} />
                
                {/* Toggle para Lotes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  backgroundColor: mostrarLotesDibau ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.75rem",
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
                      backgroundColor: mostrarLotesDibau ? "#059669" : undefined
                    }}
                  />
                </div>
                
                {/* Toggle para Nomes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  backgroundColor: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                  opacity: mostrarLotesDibau ? 1 : 0.5
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.75rem",
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
                      backgroundColor: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "#059669" : undefined
                    }}
                  />
                </div>
                
                {/* Toggle para CAR */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  backgroundColor: mostrarAreaImovel ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      margin: 0,
                      color: mostrarAreaImovel ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    CAR
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarAreaImovel}
                    onChange={setMostrarAreaImovel}
                    style={{
                      backgroundColor: mostrarAreaImovel ? "#059669" : undefined
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Segunda linha no mobile apenas */}
          {isMobile && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flexWrap: "nowrap"
            }}>
              {/* Componente unificado DIBAU - Mobile */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                padding: "4px 6px",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                transition: "all 0.2s ease",
                flex: "1"
              }}>
                <Icon 
                  icon="mdi:map-legend" 
                  style={{ 
                    fontSize: "12px",
                    color: (mostrarLotesDibau || mostrarAreaImovel) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }} 
                />
                <Typography.Text 
                  style={{ 
                    fontSize: "0.5625rem",
                    fontWeight: "600",
                    margin: 0,
                    whiteSpace: "nowrap",
                    color: (mostrarLotesDibau || mostrarAreaImovel) ? "#059669" : "#666",
                    transition: "color 0.2s ease"
                  }}
                >
                  DIBAU
                </Typography.Text>
                
                {/* Separador visual mini */}
                <div style={{
                  width: "1px",
                  height: "14px",
                  backgroundColor: "rgba(5, 150, 105, 0.3)",
                  margin: "0 2px"
                }} />
                
                {/* Toggle compacto para Lotes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  backgroundColor: mostrarLotesDibau ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.5rem",
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
                      transform: "scale(0.8)"
                    }}
                  />
                </div>
                
                {/* Toggle compacto para Nomes */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  backgroundColor: (mostrarLotesDibau && mostrarNomesLotesDibau) ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                  opacity: mostrarLotesDibau ? 1 : 0.5
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.5rem",
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
                      transform: "scale(0.8)"
                    }}
                  />
                </div>
                
                {/* Toggle compacto para CAR */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "2px 4px",
                  borderRadius: "8px",
                  backgroundColor: mostrarAreaImovel ? "rgba(5, 150, 105, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease"
                }}>
                  <Typography.Text 
                    style={{ 
                      fontSize: "0.5rem",
                      fontWeight: "500",
                      margin: 0,
                      color: mostrarAreaImovel ? "#059669" : "#999",
                      transition: "color 0.2s ease"
                    }}
                  >
                    CAR
                  </Typography.Text>
                  <Switch
                    size="small"
                    checked={mostrarAreaImovel}
                    onChange={setMostrarAreaImovel}
                    style={{
                      backgroundColor: mostrarAreaImovel ? "#059669" : undefined,
                      transform: "scale(0.8)"
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campo de Busca Mobile - Após os switches */}
        {isMobile && (
          <SearchContainer ref={searchContainerRef} style={{ width: '100%', marginTop: '8px' }}>
            <Input
              placeholder="Buscar área..."
              value={searchTerm}
              onChange={handleSearchChange}
              allowClear
              prefix={searchLoading ? <LoadingOutlined spin /> : <SearchOutlined />}
              size="small"
              style={{
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />

            {/* Dropdown de Resultados */}
            <SearchDropdown $isOpen={searchDropdownOpen}>
              {searchLoading ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#1890ff'
                }}>
                  <LoadingOutlined spin style={{ marginRight: '8px' }} />
                  <span>Buscando...</span>
                </div>
              ) : (
                searchResults.map((resultado, index) => {
                  if (resultado.tipo === 'no-results') {
                    return (
                      <div key="no-results" style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        {resultado.nome}
                      </div>
                    );
                  }

                  if (resultado.tipo === 'error') {
                    return (
                      <div key="error" style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#f5222d'
                      }}>
                        ⚠️ {resultado.nome}
                      </div>
                    );
                  }

                  if (resultado.tipo === 'area-sistema') {
                    const categoriaConfig = {
                      'COLONO': { cor: theme?.palette?.areaCategorias?.COLONO?.primary || '#52c41a', nome: 'Colono', icon: '🌱' },
                      'TECNICO': { cor: theme?.palette?.areaCategorias?.TECNICO?.primary || '#1890ff', nome: 'Técnico', icon: '🔧' },
                      'EMPRESARIAL': { cor: theme?.palette?.areaCategorias?.EMPRESARIAL?.primary || '#722ed1', nome: 'Empresarial', icon: '🏢' },
                      'ADJACENTE': { cor: theme?.palette?.areaCategorias?.ADJACENTE?.primary || '#fa8c16', nome: 'Adjacente', icon: '📍' }
                    };

                    const config = categoriaConfig[resultado.categoria] || { cor: '#999', nome: resultado.categoria, icon: '📍' };

                    return (
                      <SearchResultItem key={`area-${resultado.id}`} onClick={() => handleSelectSearchResult(resultado)}>
                        <ResultIcon bgColor={`${config.cor}20`} color={config.cor}>
                          {config.icon}
                        </ResultIcon>
                        <ResultContent>
                          <ResultTitle>{resultado.nome}</ResultTitle>
                          <ResultSubtitle>
                            <TypeBadge color={config.cor}>{config.nome}</TypeBadge>
                            {' • '}
                            {numberFormatter(resultado.areaTotal)} ha
                            {resultado.culturas && resultado.culturas.length > 0 && (
                              <> • {resultado.culturas.map(c => c.descricao).join(', ')}</>
                            )}
                          </ResultSubtitle>
                        </ResultContent>
                      </SearchResultItem>
                    );
                  }

                  if (resultado.tipo === 'lote-dibau') {
                    return (
                      <SearchResultItem key={resultado.id} onClick={() => handleSelectSearchResult(resultado)}>
                        <ResultIcon bgColor="#FFF0F0" color="#FF6B6B">
                          🏞️
                        </ResultIcon>
                        <ResultContent>
                          <ResultTitle>{resultado.nome}</ResultTitle>
                          <ResultSubtitle>
                            <TypeBadge color="#FF6B6B">Lote DIBAU</TypeBadge>
                            {resultado.nomenclatura && (
                              <> • {resultado.nomenclatura}</>
                            )}
                            {resultado.areaHa && (
                              <> • {numberFormatter(resultado.areaHa)} ha</>
                            )}
                          </ResultSubtitle>
                        </ResultContent>
                      </SearchResultItem>
                    );
                  }

                  return null;
                })
              )}
            </SearchDropdown>
          </SearchContainer>
        )}
      </Box>

      {/* Container do mapa */}
      <Box sx={{
        flex: 1,
        position: "relative",
        minHeight: isMobile ? "200px" : "300px", // Altura mínima segura
        overflow: "hidden" // Evita scroll desnecessário
      }}>
        <GoogleMap
          mapContainerStyle={{
            height: "100%",
            width: "100%",
            overflow: "hidden" // Evita overflow
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
          {/* Renderizar polígonos da área do imóvel */}
          {mostrarAreaImovel && areaDoImovelPolygons.map((polygonPaths, index) => (
            <Polygon
              key={`area-imovel-${index}`}
              paths={polygonPaths}
              options={getAreaDoImovelPolygonOptions(theme)}
            />
          ))}

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
              if (lote.areaHa) text += ` - ${numberFormatter(lote.areaHa)} ha`;
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
                    ...getLotesDibauPolygonOptions(theme),
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
                            {numberFormatter(resultadoBusca?.areaHa || lote.areaHa)} ha
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
          
          {/* Marcador da Sede Alencar Frutas */}
          {mostrarSede && (
            <>
              <Marker
                position={{ lat: -3.052074, lng: -40.083108 }}
                icon={{
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg width="20" height="28" viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 0C4.477 0 0 4.477 0 10c0 10 10 18 10 18s10-8 10-18c0-5.523-4.477-10-10-10z" fill="#d32f2f"/>
                      <circle cx="10" cy="10" r="5" fill="#ffffff"/>
                      <circle cx="10" cy="10" r="2.5" fill="#d32f2f"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(20, 28),
                  anchor: new window.google.maps.Point(10, 28)
                }}
              />
              
              {/* Nome da Sede Alencar Frutas - OverlayView customizado */}
              <OverlayView
                position={{ lat: -3.052074, lng: -40.083108 }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({
                  x: -(width / 2),
                  y: -height - 35
                })}
              >
                <div style={{
                  color: "black",
                  fontSize: "11px",
                  fontWeight: "600",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.3px",
                  lineHeight: "1.2",
                  textShadow: "1px 1px 2px rgba(255, 255, 255, 0.9)",
                  pointerEvents: "none",
                  position: "absolute",
                  zIndex: 1000,
                  fontFamily: "Arial, sans-serif",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  width: "auto",
                  height: "auto",
                  minWidth: "auto",
                  maxWidth: "none"
                }}>
                  Sede Alencar Frutas
                </div>
              </OverlayView>
            </>
          )}
          
          {/* Renderizar áreas existentes */}
          {areasVisiveis.map((area, index) => {
            if (!area.coordenadas || !Array.isArray(area.coordenadas) || area.coordenadas.length < 3) {
              return null;
            }

            const center = getPolygonCenter(area.coordenadas);
            const isHovered = areaHovered === area.id;
            
            return (
              <React.Fragment key={`area-${area.id}`}>
                {/* Área principal */}
                <Polygon
                  paths={area.coordenadas}
                  options={getPolygonOptions(area, isHovered, theme, modolezenda)}
                  onMouseOver={() => setAreaHovered(area.id)}
                  onMouseOut={() => setAreaHovered(null)}
                  onClick={() => handleClickArea(area)}
                />

                <Marker
                  position={center}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize: new window.google.maps.Size(12, 12),
                  }}
                />

                        {/* Overlay estático com NOME da área - controlado pelo switch */}
                        {mostrarNomesAreas && (
                          <OverlayView
                            position={center}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={getPixelPositionOffset}
                          >
                            <StaticNameOverlay>
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
                    <OverlayBox
                      bgColor={theme?.palette?.areaCategorias?.[area.categoria]?.background}
                      borderColor={theme?.palette?.areaCategorias?.[area.categoria]?.primary}
                      textColor={theme?.palette?.areaCategorias?.[area.categoria]?.text}
                      shadowColor={`${theme?.palette?.areaCategorias?.[area.categoria]?.primary}40`}
                      isMobile={isMobile}
                      theme={theme}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <Typography.Text strong style={{ 
                          fontSize: isMobile ? '10px' : '12px',
                          color: theme?.palette?.areaCategorias?.[area.categoria]?.text || '#333'
                        }}>
                          {`${area.nome.toUpperCase()} - ${numberFormatter(area.areaTotal)} HA`}
                        </Typography.Text>
                      </div>
                      
                      {/* Listagem de Culturas */}
                      <div style={{ marginBottom: '8px' }}>
                        <Typography.Text style={{ 
                          fontSize: isMobile ? '09px' : '10px',
                          color: theme?.palette?.areaCategorias?.[area.categoria]?.text || '#666',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          CULTURAS:
                        </Typography.Text>
                        
                        {area.culturas && area.culturas.length > 0 ? (
                          <div style={{ paddingLeft: '8px' }}>
                            {area.culturas.map((cultura, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                marginBottom: '2px'
                              }}>
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  backgroundColor: theme?.palette?.areaCategorias?.[area.categoria]?.primary,
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  opacity: 0.8
                                }}></div>
                                <Typography.Text style={{ 
                                  fontSize: isMobile ? '10px' : '11px',
                                  color: theme?.palette?.areaCategorias?.[area.categoria]?.text || '#888',
                                  lineHeight: '1.2'
                                }}>
                                  {cultura.descricao || `Cultura ${cultura.culturaId}`}
                                  {cultura.areaPlantada && (
                                    <span style={{ opacity: 0.7 }}>
                                      {' '}({numberFormatter(cultura.areaPlantada)} ha)
                                    </span>
                                  )}
                                </Typography.Text>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Typography.Text style={{ 
                            fontSize: isMobile ? '10px' : '11px',
                            color: theme?.palette?.areaCategorias?.[area.categoria]?.text || '#999',
                            fontStyle: 'italic',
                            paddingLeft: '8px'
                          }}>
                            Nenhuma cultura vinculada
                          </Typography.Text>
                        )}
                      </div>
                    </OverlayBox>
                  </OverlayView>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
        
        {/* Controles de zoom personalizados */}
        <div style={{
          position: "absolute",
          bottom: isMobile ? "8px" : "10px",
          right: isMobile ? "12px" : "10px",
          backgroundColor: "white",
          padding: isMobile ? "4px" : "5px",
          borderRadius: "0.25rem", // Convertido para rem
          boxShadow: "0 0.125rem 0.375rem rgba(0,0,0,0.3)", // Convertido para rem
          border: "0.0625rem solid #e0e0e0", // Convertido para rem
          zIndex: 100
        }}>
          <Space direction="vertical" size={isMobile ? 1 : 0}>
            <Button
              icon={<ZoomInOutlined style={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }} />}
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
                width: isMobile ? '28px' : '28px', // Altura responsiva (px para estabilidade)
                height: isMobile ? '28px' : '28px', // Altura responsiva (px para estabilidade)
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Button
              icon={<ZoomOutOutlined style={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }} />}
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
                width: isMobile ? '28px' : '28px', // Altura responsiva (px para estabilidade)
                height: isMobile ? '28px' : '28px', // Altura responsiva (px para estabilidade)
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
          bottom: isMobile ? "8px" : "10px",
          left: isMobile ? "8px" : "10px",
          backgroundColor: "white",
          padding: isMobile ? "6px 8px" : "10px 12px",
          borderRadius: "0.25rem",
          boxShadow: "0 0.125rem 0.375rem rgba(0,0,0,0.3)",
          fontSize: isMobile ? "0.625rem" : "0.75rem",
          border: "0.0625rem solid #e0e0e0",
          zIndex: 100,
          maxWidth: isMobile ? "calc(100% - 60px)" : "auto"
        }}>
          {/* Cabeçalho com toggle */}
          <div style={{
            marginBottom: "6px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              fontWeight: "600",
              color: "#333"
            }}>
              {modolezenda === 'categoria' 
                ? (isMobile ? "Por Categoria" : "Legenda por Categoria")
                : (isMobile ? "Por Cultura" : "Legenda por Cultura")
              }
            </span>
            
            {/* Toggle para alternar modo */}
            <Tooltip title={`Alternar para ${modolezenda === 'categoria' ? 'Cultura' : 'Categoria'}`}>
              <Button
                type="text"
                icon={<SwapOutlined style={{ fontSize: '12px' }} />}
                onClick={handleToggleLegenda}
                style={{
                  color: '#059669',
                  border: '1px solid #059669',
                  borderRadius: '6px',
                  padding: '4px',
                  height: 'auto',
                  minWidth: 'auto',
                  transform: `rotate(${rotationCount * 180}deg)`,
                  transition: 'transform 0.3s ease-in-out'
                }}
              >
              </Button>
            </Tooltip>
          </div>
          
          {/* Legenda das categorias ou culturas */}
          <div style={{ 
            marginBottom: "4px",
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out'
          }}>
            {modolezenda === 'categoria' ? (
              // Modo Categoria - Layout em cards
              (() => {
                const categoriasPresentes = [...new Set(areas.map(area => area.categoria))];
                
                const categoriasConfig = {
                  'COLONO': { 
                    cor: theme?.palette?.areaCategorias?.COLONO?.primary || '#52c41a', 
                    nome: 'Colono' 
                  },
                  'TECNICO': { 
                    cor: theme?.palette?.areaCategorias?.TECNICO?.primary || '#1890ff', 
                    nome: 'Técnico' 
                  },
                  'EMPRESARIAL': { 
                    cor: theme?.palette?.areaCategorias?.EMPRESARIAL?.primary || '#722ed1', 
                    nome: 'Empresarial' 
                  },
                  'ADJACENTE': { 
                    cor: theme?.palette?.areaCategorias?.ADJACENTE?.primary || '#fa8c16', 
                    nome: 'Adjacente' 
                  }
                };
                
                const categoriasParaExibir = Object.entries(categoriasConfig)
                  .filter(([categoria]) => categoriasPresentes.includes(categoria))
                  .map(([categoria, config]) => {
                    const totalHa = areas
                      .filter(area => area.categoria === categoria)
                      .reduce((total, area) => total + (area.areaTotal || 0), 0);
                    
                    return {
                      categoria,
                      ...config,
                      totalHa
                    };
                  });
                
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '4px' : '6px'
                  }}>
                    {categoriasParaExibir.map((config) => (
                      <div 
                        key={config.categoria}
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '10px 1fr' : '12px 1fr',
                          alignItems: 'center',
                          gap: isMobile ? '6px' : '8px',
                          padding: isMobile ? '4px 6px' : '6px 8px',
                          backgroundColor: 'rgba(5, 150, 105, 0.05)',
                          borderRadius: '4px',
                          border: '1px solid rgba(5, 150, 105, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Coluna 1: Cor da categoria */}
                        <span style={{
                          display: "block",
                          width: isMobile ? "10px" : "12px",
                          height: isMobile ? "10px" : "12px",
                          backgroundColor: config.cor,
                          flexShrink: 0,
                          borderRadius: "2px"
                        }}></span>
                        
                        {/* Coluna 2: Nome da categoria + Área */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: 0
                        }}>
                          <span style={{
                            fontSize: isMobile ? "0.625rem" : "0.6875rem",
                            fontWeight: "600",
                            color: '#333',
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {config.nome}
                          </span>
                          <span style={{
                            fontSize: isMobile ? "0.5rem" : "0.5625rem",
                            color: '#666'
                          }}>
                            {numberFormatter(config.totalHa)} ha
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              // Modo Cultura - Tabela organizada
              (() => {
                const culturas = Object.entries(agruparAreasPorCultura)
                  .sort((a, b) => {
                    // "Sem Cultura" sempre vai para o final
                    if (a[0] === 'Sem Cultura') return 1;
                    if (b[0] === 'Sem Cultura') return -1;
                    // Demais culturas ordenadas por hectares (maior primeiro)
                    return b[1].totalHa - a[1].totalHa;
                  });
                
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '4px' : '6px'
                  }}>
                    {culturas.map(([culturaNome, dados]) => {
                      const culturaKey = culturaNome;
                      const isVisible = culturasVisiveis[culturaKey] !== false;
                      
                      return (
                        <div 
                          key={culturaNome}
                          style={{ 
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '10px 1fr 28px' : '12px 1fr 32px',
                            alignItems: 'center',
                            gap: isMobile ? '6px' : '8px',
                            padding: isMobile ? '4px 6px' : '6px 8px',
                            backgroundColor: isVisible ? 'rgba(5, 150, 105, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '4px',
                            border: `1px solid ${isVisible ? 'rgba(5, 150, 105, 0.15)' : 'rgba(0, 0, 0, 0.06)'}`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Coluna 1: Cor da cultura */}
                          <span style={{
                            display: "block",
                            width: isMobile ? "10px" : "12px",
                            height: isMobile ? "10px" : "12px",
                            backgroundColor: mapeamentoCulturaCor[culturaNome] || '#999999',
                            flexShrink: 0,
                            borderRadius: "2px",
                            opacity: isVisible ? 1 : 0.3,
                            transition: 'opacity 0.2s ease'
                          }}></span>
                          
                          {/* Coluna 2: Nome da cultura + Área */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            minWidth: 0
                          }}>
                            <span style={{
                              fontSize: isMobile ? "0.625rem" : "0.6875rem",
                              fontWeight: "600",
                              color: isVisible ? '#333' : '#999',
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              transition: 'color 0.2s ease'
                            }}>
                              {culturaNome}
                            </span>
                            <span style={{
                              fontSize: isMobile ? "0.5rem" : "0.5625rem",
                              color: isVisible ? '#666' : '#aaa',
                              transition: 'color 0.2s ease'
                            }}>
                              {numberFormatter(dados.totalHa)} ha
                            </span>
                          </div>
                          
                          {/* Coluna 3: Switch */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                          }}>
                            <Switch
                              size="small"
                              checked={isVisible}
                              onChange={(checked) => {
                                setCulturasVisiveis(prev => ({
                                  ...prev,
                                  [culturaKey]: checked
                                }));
                              }}
                              style={{
                                backgroundColor: isVisible ? "#059669" : undefined,
                                minWidth: isMobile ? '28px' : '32px'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
            
            {/* Entrada da área do imóvel na legenda */}
            {mostrarAreaImovel && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                marginTop: '4px',
                paddingTop: '4px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <span style={{
                  display: "inline-block",
                  width: isMobile ? "8px" : "10px",
                  height: isMobile ? "8px" : "10px",
                  backgroundColor: '#FFD700',
                  flexShrink: 0,
                  borderRadius: "2px"
                }}></span>
                <span style={{
                  fontSize: isMobile ? "0.5625rem" : "0.6875rem",
                  whiteSpace: "nowrap"
                }}>
                  Área DIBAU
                </span>
              </div>
            )}

            {/* Entrada dos lotes DIBAU na legenda */}
            {mostrarLotesDibau && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                marginTop: '4px',
                paddingTop: '4px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <span style={{
                  display: "inline-block",
                  width: isMobile ? "8px" : "10px",
                  height: isMobile ? "8px" : "10px",
                  backgroundColor: '#000000',
                  flexShrink: 0,
                  borderRadius: "2px"
                }}></span>
                <span style={{
                  fontSize: isMobile ? "0.5625rem" : "0.6875rem",
                  whiteSpace: "nowrap"
                }}>
                  Lotes DIBAU
                </span>
              </div>
            )}
            
          </div>

          {/* Contador de áreas */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            paddingTop: "4px",
            borderTop: "1px solid #f0f0f0"
          }}>
            {(() => {
              // Calcular total de hectares de todas as áreas
              const totalHa = areas.reduce((total, area) => total + (area.areaTotal || 0), 0);
              
              return (
                <span style={{
                  fontSize: isMobile ? "0.5625rem" : "0.75rem", // Responsivo em rem
                  color: "#666"
                }}>
                  {areas.length} área{areas.length !== 1 ? 's' : ''} - {numberFormatter(totalHa)} ha
                </span>
              );
            })()}
          </div>
        </div>
      </Box>

      {/* Informação sobre dados dos lotes DIBAU */}
      {!isMobile && mostrarLotesDibau && (
        <Box sx={{ mt: 1, px: 1.5 }}>
          <Alert
            message={
              <span style={{ fontSize: '0.75rem' }}>
                <ExclamationCircleOutlined /> Dados dos lotes DIBAU (nome e área) são do KML do distrito e apenas referência, podendo apresentar erros.
              </span>
            }
            type="warning"
            showIcon={false}
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem'
            }}
          />
        </Box>
      )}

      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />

      {/* Modal de Detalhes da Área */}
      <DetalhesAreaModal
        open={detalhesModalOpen}
        onClose={handleCloseDetalhesModal}
        area={dadosDetalhesArea}
        loading={loadingDetalhesArea}
      />
    </Box>
  );
};

export default MapaGeral;
