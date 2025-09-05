// src/components/areas/MapDialog.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Modal, Button, Space, Typography, Card, Row, Col, Input, Form, Alert } from "antd";
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
} from "@ant-design/icons";
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
  loteAtual,
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
  selectedMarker,
  handleCloseInfoWindow,
  calculateAreaPolygon,
  setAreaPoligono,
  areaPoligono,
  lotesExistentes,
}) => {
  const theme = useTheme();
  

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
        
        console.log("DEBUG_MAP: Carregando coordenadas existentes no MapDialog:", loteAtual.coordenadas.length, "pontos");
        setTempCoordinates(loteAtual.coordenadas);
        setIsDrawing(false); // Desabilitar desenho para modo edit
        
        // Calcular e setar a área
        const area = calculateAreaPolygon(loteAtual.coordenadas);
        setAreaPoligono(area);
        setManualArea(area);
        setOriginalArea(area);
        
        console.log("DEBUG_MAP: Área calculada no MapDialog:", area);
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
      console.log("DEBUG_MAP: Markers sincronizados:", novosMarkers.length);
      
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
        console.log("DEBUG_MAP: Midpoints calculados no MapDialog:", midpointsArray.length);
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
    console.log("DEBUG_MAP: Finalizando captura com área:", manualArea);
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
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>,
      ];
    }

    // isEditableMode = true
    const buttons = [
      <Button key="cancel" onClick={onClose}>
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
        >
          Finalizar {mapMode === "edit" ? "Edição" : "Criação"}
        </Button>
      );
    }

    if (isEditableMode && !isDrawing && tempCoordinates.length > 0) {
      buttons.push(
        <Button key="excluir" danger onClick={handleExcluirPoligono}>
          Excluir Polígono
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
      visible={open}
      onCancel={onClose}
      title={
        <span style={{ 
          color: "#ffffff", 
          fontWeight: "600", 
          fontSize: "16px",
          backgroundColor: "#059669",
          padding: "12px 16px",
          margin: "-20px -24px 0 -24px",
          display: "block",
          borderRadius: "8px 8px 0 0",
        }}>
          {dialogTitle}
        </span>
      }
      width="70%"
      footer={footerButtons()}
      styles={{
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        }
      }}
      destroyOnClose
    >
      {isEditableMode && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Space>
            {mapMode === "create" && (
              <Button
                type={isDrawing ? "primary" : "default"}
                icon={<GlobalOutlined />}
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
              >
                {isDrawing ? "Cancelar Desenho" : "Desenhar Área"}
              </Button>
            )}
            <Button
              type="default"
              icon={<ArrowsAltOutlined />}
              onClick={() => setIsDrawing(false)}
            >
              Mover Mapa
            </Button>
          </Space>
          
          <div style={{ textAlign: "right" }}>
            <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
              <InfoCircleOutlined /> Dica: Clique e arraste os pontos azuis para ajustar os vértices. 
              Pontos verdes são para adicionar novos vértices.
            </Typography.Text>
          </div>
        </div>
      )}
      
      <div style={{ position: "relative" }}>
        
        <GoogleMap
          mapContainerStyle={{ height: "450px", width: "100%" }}
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
          {lotesExistentes.map((area, index) => {
            if (!area.coordenadas || !Array.isArray(area.coordenadas) || area.coordenadas.length < 3) {
              return null;
            }

            const center = getPolygonCenter(area.coordenadas);
            const isHovered = areaHovered === area.id;
            
            return (
              <React.Fragment key={`existing-area-${area.id}`}>
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
          right: "10px", 
          backgroundColor: theme?.palette?.background?.paper || "white", 
          padding: "5px", 
          borderRadius: "4px",
          boxShadow: theme?.palette?.ui?.shadow || "0 2px 6px rgba(0,0,0,0.3)",
          border: `1px solid ${theme?.palette?.ui?.border || "#e0e0e0"}`
        }}>
          <Space direction="vertical">
            <Button 
              icon="+" 
              type="text"
              onClick={() => {
                const newZoom = Math.min(currentZoom + 1, 20);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
              }}
            >+</Button>
            <Button 
              icon="-" 
              type="text"
              onClick={() => {
                const newZoom = Math.max(currentZoom - 1, 1);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
              }}
            >-</Button>
          </Space>
        </div>
        
        {/* Legenda do mapa */}
        <div style={{ 
          position: "absolute", 
          bottom: "10px", 
          left: "10px", 
          backgroundColor: theme?.palette?.background?.paper || "white", 
          padding: "8px", 
          borderRadius: "4px",
          boxShadow: theme?.palette?.ui?.shadow || "0 2px 6px rgba(0,0,0,0.3)",
          fontSize: "12px",
          border: `1px solid ${theme?.palette?.ui?.border || "#e0e0e0"}`
        }}>
                      <div style={{ marginBottom: "4px" }}>
              <span style={{ 
                display: "inline-block", 
                width: "12px", 
                height: "12px", 
                backgroundColor: "#10b981", // Verde claro do tema
                marginRight: "5px" 
              }}></span>
              Área atual
            </div>
            <div>
              <span style={{ 
                display: "inline-block", 
                width: "12px", 
                height: "12px", 
                backgroundColor: "#dc2626", // Vermelho do tema
                marginRight: "5px" 
              }}></span>
              Áreas existentes
            </div>
        </div>
      </div>
      
      {/* Seção de ajuste manual da área */}
      <div style={{ marginTop: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px",
            backgroundColor: theme?.palette?.background?.hover || "#f5f5f5",
            borderRadius: "4px",
            flexWrap: "wrap",
            border: `1px solid ${theme?.palette?.ui?.border || "#e0e0e0"}`
          }}
        >
          {/* Área Original */}
          <div>
            <Typography.Text type="secondary">
              Área Original: <Typography.Text strong>{formatarNumero(originalArea)} ha</Typography.Text>
            </Typography.Text>
          </div>
          
          {/* Separador visual */}
          <div style={{ width: "1px", height: "24px", backgroundColor: theme?.palette?.ui?.border || "#d9d9d9" }} />
          
          {/* Label e Input na mesma linha */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
            <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
              Área do Polígono:
            </Typography.Text>
            
            {/* Input estilizado com ícone - largura reduzida */}
            <InputWithIconContainer iconPosition="right" width="120px">
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
            <Typography.Text type="danger" style={{ fontSize: "12px" }}>
              Valor fora do limite (±10%)
            </Typography.Text>
          )}
        </div>
        
        {/* Alerta informativo */}
        {tempCoordinates.length > 0 && (
          <Alert
            message="Você pode ajustar manualmente a área em até 10% para mais ou para menos."
            type="info"
            showIcon
            style={{ marginTop: "8px" }}
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

MapDialog.defaultProps = {
  loteAtual: null,
  selectedMarker: null,
  lotesExistentes: []
};

export default MapDialog;