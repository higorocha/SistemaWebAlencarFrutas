// src/pages/MapaGeral.js

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Typography, Button, Space, Alert, Switch } from "antd";
import { useTheme } from "@mui/material/styles";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  HomeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import useResponsive from "../hooks/useResponsive";
import { numberFormatter } from "../utils/formatters";
import areadoImovelData from "../assets/geojson/cardibau/AreadoImovel.json";
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

const { Title } = Typography;

const MapaGeral = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  
  // Estados do mapa
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando mapa...");
  const [mostrarNomesAreas, setMostrarNomesAreas] = useState(false); // Switch para controlar exibição dos nomes
  const [mostrarAreaImovel, setMostrarAreaImovel] = useState(true); // Switch para controlar exibição da área do imóvel
  const [mostrarSede, setMostrarSede] = useState(true); // Switch para controlar exibição da sede
  
  // Estados do mapa
  const [mapCenter, setMapCenter] = useState({ lat: -3.052397, lng: -40.083981 });
  const [mapZoom, setMapZoom] = useState(13);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [areaHovered, setAreaHovered] = useState(null);
  
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
      setAreas(response.data);
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

// Função para obter opções do polígono baseadas na categoria
const getPolygonOptions = (categoria, isHovered = false, theme) => {
  const corCategoria = getCategoriaColor(categoria, theme);
  return {
    fillColor: corCategoria,
    fillOpacity: isHovered ? 0.6 : 0.4,
    strokeColor: corCategoria, // Mesma cor da categoria
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
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: isMobile ? 8 : 12, // Margin reduzido
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: isMobile ? '1rem' : '1.25rem' // FontSize reduzido
          }}
        >
          <Icon
            icon="mdi:map-marker-multiple"
            style={{
              marginRight: isMobile ? 6 : 10, // Margin reduzido
              fontSize: isMobile ? '20px' : '26px', // FontSize reduzido
              color: "#059669"
            }}
          />
          {isMobile ? "Mapa Geral" : "Mapa Geral das Áreas Agrícolas"}
        </Title>
      </Box>

      {/* Controles do mapa */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: isMobile ? 0.25 : 0.5, // Gap ainda mais reduzido
        mb: isMobile ? 0.25 : 0.5, // Margin bottom reduzido
        minHeight: isMobile ? "auto" : "40px" // Altura mínima reduzida
      }}>
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Button
            type="default"
            icon={<HomeOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={centralizarMapa}
            disabled={areas.length === 0}
            style={{
              fontSize: isMobile ? "0.6875rem" : "0.875rem", // FontSize reduzido no mobile
              height: isMobile ? "28px" : "40px", // Altura reduzida no mobile
              padding: isMobile ? "0 6px" : "0 12px", // Padding reduzido no mobile
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
              fontSize: isMobile ? "0.6875rem" : "0.875rem", // FontSize reduzido no mobile
              height: isMobile ? "28px" : "40px", // Altura reduzida no mobile
              padding: isMobile ? "0 6px" : "0 12px", // Padding reduzido no mobile
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
              fontSize: isMobile ? "0.6875rem" : "0.875rem", // FontSize reduzido no mobile
              height: isMobile ? "28px" : "40px", // Altura reduzida no mobile
              padding: isMobile ? "0 6px" : "0 12px", // Padding reduzido no mobile
            }}
          >
            {isMobile ? "Atualizar" : "Atualizar Dados"}
          </Button>
        </Space>

        {/* Switches para controlar exibição */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "4px" : "12px",
          flexWrap: "nowrap"
        }}>
          {/* Switch para nomes das áreas */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "3px" : "8px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: isMobile ? "4px 6px" : "8px 14px",
            borderRadius: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid rgba(5, 150, 105, 0.2)",
            transition: "all 0.2s ease",
            flex: isMobile ? "1" : "none"
          }}>
            <Icon 
              icon="mdi:label" 
              style={{ 
                fontSize: isMobile ? "12px" : "18px",
                color: mostrarNomesAreas ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }} 
            />
            <Typography.Text 
              style={{ 
                fontSize: isMobile ? "0.6rem" : "0.8125rem",
                fontWeight: "600",
                margin: 0,
                whiteSpace: "nowrap",
                color: mostrarNomesAreas ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }}
            >
              {isMobile ? "Nomes" : "Mostrar Nomes"}
            </Typography.Text>
            <Switch
              size={isMobile ? "small" : "default"}
              checked={mostrarNomesAreas}
              onChange={setMostrarNomesAreas}
              style={{
                backgroundColor: mostrarNomesAreas ? "#059669" : undefined
              }}
            />
          </div>

          {/* Switch para área do imóvel */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "3px" : "8px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: isMobile ? "4px 6px" : "8px 14px",
            borderRadius: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid rgba(5, 150, 105, 0.2)",
            transition: "all 0.2s ease",
            flex: isMobile ? "1" : "none"
          }}>
            <Icon 
              icon="mdi:map-marker" 
              style={{ 
                fontSize: isMobile ? "12px" : "18px",
                color: mostrarAreaImovel ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }} 
            />
            <Typography.Text 
              style={{ 
                fontSize: isMobile ? "0.6rem" : "0.8125rem",
                fontWeight: "600",
                margin: 0,
                whiteSpace: "nowrap",
                color: mostrarAreaImovel ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }}
            >
              {isMobile ? "DIBAU" : "Área DIBAU"}
            </Typography.Text>
            <Switch
              size={isMobile ? "small" : "default"}
              checked={mostrarAreaImovel}
              onChange={setMostrarAreaImovel}
              style={{
                backgroundColor: mostrarAreaImovel ? "#059669" : undefined
              }}
            />
          </div>

          {/* Switch para sede */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "3px" : "8px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: isMobile ? "4px 6px" : "8px 14px",
            borderRadius: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid rgba(5, 150, 105, 0.2)",
            transition: "all 0.2s ease",
            flex: isMobile ? "1" : "none"
          }}>
            <Icon 
              icon="mdi:home-outline" 
              style={{ 
                fontSize: isMobile ? "12px" : "18px",
                color: mostrarSede ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }} 
            />
            <Typography.Text 
              style={{ 
                fontSize: isMobile ? "0.6rem" : "0.8125rem",
                fontWeight: "600",
                margin: 0,
                whiteSpace: "nowrap",
                color: mostrarSede ? "#059669" : "#666",
                transition: "color 0.2s ease"
              }}
            >
              {isMobile ? "Sede" : "Sede Alencar"}
            </Typography.Text>
            <Switch
              size={isMobile ? "small" : "default"}
              checked={mostrarSede}
              onChange={setMostrarSede}
              style={{
                backgroundColor: mostrarSede ? "#059669" : undefined
              }}
            />
          </div>
        </div>
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
          {areas.map((area, index) => {
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
                  options={getPolygonOptions(area.categoria, isHovered, theme)}
                  onMouseOver={() => setAreaHovered(area.id)}
                  onMouseOut={() => setAreaHovered(null)}
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
          borderRadius: "0.25rem", // Convertido para rem
          boxShadow: "0 0.125rem 0.375rem rgba(0,0,0,0.3)", // Convertido para rem
          fontSize: isMobile ? "0.625rem" : "0.75rem", // Responsivo em rem
          border: "0.0625rem solid #e0e0e0", // Convertido para rem
          zIndex: 100,
          maxWidth: isMobile ? "calc(100% - 60px)" : "auto" // Ajustado para não sobrepor controles
        }}>
          <div style={{
            marginBottom: "4px",
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem", // Responsivo em rem
              fontWeight: "600",
              color: "#333"
            }}>
              {isMobile ? "Legenda" : "Legenda das Categorias"}
            </span>
          </div>
          
          {/* Legenda das categorias - apenas as que possuem áreas */}
          <div style={{ marginBottom: "4px" }}>
            {(() => {
              // Obter categorias únicas das áreas carregadas
              const categoriasPresentes = [...new Set(areas.map(area => area.categoria))];
              
              // Configuração das categorias com cores e nomes do theme
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
              
              // Filtrar apenas categorias presentes e calcular total de hectares por categoria
              const categoriasParaExibir = Object.entries(categoriasConfig)
                .filter(([categoria]) => categoriasPresentes.includes(categoria))
                .map(([categoria, config]) => {
                  // Calcular total de hectares para esta categoria
                  const totalHa = areas
                    .filter(area => area.categoria === categoria)
                    .reduce((total, area) => total + (area.areaTotal || 0), 0);
                  
                  return {
                    categoria,
                    ...config,
                    totalHa
                  };
                });
              
              return categoriasParaExibir.map((config, index) => (
                <div 
                  key={config.categoria}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: index < categoriasParaExibir.length - 1 ? '2px' : '0'
                  }}
                >
                  <span style={{
                    display: "inline-block",
                    width: isMobile ? "8px" : "10px",
                    height: isMobile ? "8px" : "10px",
                    backgroundColor: config.cor,
                    flexShrink: 0,
                    borderRadius: "2px"
                  }}></span>
                  <span style={{
                    fontSize: isMobile ? "0.5625rem" : "0.6875rem",
                    whiteSpace: "nowrap"
                  }}>
                    {config.nome} - {numberFormatter(config.totalHa)} ha
                  </span>
                </div>
              ));
            })()}
            
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

      {/* CentralizedLoader */}
      <CentralizedLoader
        visible={centralizedLoading}
        message={loadingMessage}
        subMessage="Aguarde enquanto processamos sua solicitação..."
      />
    </Box>
  );
};

export default MapaGeral;
