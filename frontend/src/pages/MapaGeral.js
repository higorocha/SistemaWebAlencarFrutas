// src/pages/MapaGeral.js

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Typography, Button, Space, Alert } from "antd";
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
  background: rgba(220, 38, 38, 0.9); /* Vermelho semi-transparente */
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  min-width: 80px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(220, 38, 38, 0.8);
  z-index: 5;
  letter-spacing: 0.5px;
`;

const { Title } = Typography;

const formatarNumero = (numero) => {
  if (numero === null || numero === undefined || isNaN(numero)) return "-";
  return Number(numero).toFixed(2);
};

const MapaGeral = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  
  // Estados do mapa
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centralizedLoading, setCentralizedLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Carregando mapa...");
  
  // Estados do mapa
  const [mapCenter, setMapCenter] = useState({ lat: -3.052397, lng: -40.083981 });
  const [mapZoom, setMapZoom] = useState(14);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [areaHovered, setAreaHovered] = useState(null);
  
  const mapRef = useRef(null);
  const zoomParaExibicaoDetalhes = 15; // Zoom necessário para mostrar detalhes

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

  // Estilo para áreas existentes
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2
      }}
    >
      {/* Header com título */}
      <Box sx={{ mb: 0 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: '1.500rem'
          }}
        >
          <Icon
            icon="mdi:map-marker-multiple"
            style={{
              marginRight: 12,
              fontSize: isMobile ? '31px' : '31px',
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
        gap: 1,
        mb: 1
      }}>
        <Space wrap size={isMobile ? "small" : "middle"}>
          <Button
            type="default"
            icon={<HomeOutlined />}
            size={isMobile ? "small" : "middle"}
            onClick={centralizarMapa}
            disabled={areas.length === 0}
            style={{
              fontSize: isMobile ? "0.75rem" : "0.875rem",
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
              fontSize: isMobile ? "0.75rem" : "0.875rem",
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
              fontSize: isMobile ? "0.75rem" : "0.875rem",
            }}
          >
            {isMobile ? "Atualizar" : "Atualizar Dados"}
          </Button>
        </Space>

        {!isMobile && (
          <Typography.Text type="secondary" style={{ fontSize: "0.75rem" }}>
            <InfoCircleOutlined /> {areas.length} área{areas.length !== 1 ? 's' : ''} carregada{areas.length !== 1 ? 's' : ''}
          </Typography.Text>
        )}
      </Box>

      {/* Container do mapa */}
      <Box sx={{ 
        flex: 1, 
        position: "relative",
        minHeight: isMobile ? "400px" : "500px"
      }}>
        <GoogleMap
          mapContainerStyle={{
            height: "100%",
            width: "100%",
            minHeight: isMobile ? "400px" : "500px"
          }}
          center={mapCenter}
          zoom={mapZoom}
          onLoad={onLoad}
          onZoomChanged={onZoomChanged}
          onDragEnd={onDragEnd}
          options={{
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
          {/* Renderizar áreas existentes */}
          {areas.map((area, index) => {
            if (!area.coordenadas || !Array.isArray(area.coordenadas) || area.coordenadas.length < 3) {
              return null;
            }

            const center = getPolygonCenter(area.coordenadas);
            const isHovered = areaHovered === area.id;
            
            return (
              <React.Fragment key={`area-${area.id}`}>
                <Polygon
                  paths={area.coordenadas}
                  options={{
                    ...existingPolygonOptions,
                    fillOpacity: isHovered ? 0.4 : 0.2,
                    strokeOpacity: isHovered ? 1 : 0.6,
                    strokeWeight: isHovered ? 3 : 2,
                  }}
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

                {/* Overlay estático com NOME da área - sempre visível */}
                <OverlayView
                  position={center}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={getPixelPositionOffset}
                >
                  <StaticNameOverlay>
                    {area.nome}
                  </StaticNameOverlay>
                </OverlayView>

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
              backgroundColor: "#dc2626",
              flexShrink: 0
            }}></span>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              whiteSpace: isMobile ? "nowrap" : "normal"
            }}>
              {isMobile ? "Áreas" : "Áreas Agrícolas"}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              color: "#666"
            }}>
              {areas.length} área{areas.length !== 1 ? 's' : ''} carregada{areas.length !== 1 ? 's' : ''}
            </span>
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
