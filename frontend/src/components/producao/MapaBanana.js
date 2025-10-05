// src/components/producao/MapaBanana.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Typography, Spin, Empty, Button, Space } from 'antd';
import { EnvironmentOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { GoogleMap, Polygon, Marker, OverlayView, useLoadScript } from '@react-google-maps/api';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import axiosInstance from '../../api/axiosConfig';
import { showNotification } from '../../config/notificationConfig';
import DetalhamentoModal from './DetalhamentoModal';
import useResponsive from '../../hooks/useResponsive';

const { Text, Title } = Typography;

// API Key e configurações do Google Maps
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_DEFAULT_API_KEY_HERE";
const GOOGLE_MAPS_LIBRARIES = ["drawing", "geometry"];

// Estilo para o overlay estático do nome da área
const StaticNameOverlay = styled.div`
  background: rgba(220, 38, 38, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 0.375rem; /* 6px → rem */
  font-size: 0.875rem; /* 14px → rem */
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  min-width: 80px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.3); /* 2px 4px → rem */
  border: 0.0625rem solid rgba(220, 38, 38, 0.8); /* 1px → rem */
  z-index: 5;
  letter-spacing: 0.03125rem; /* 0.5px → rem */
`;

// Estilo para overlay com informações detalhadas
const OverlayBox = styled.div`
  background: ${props => props.theme?.palette?.background?.paper || 'white'};
  padding: 8px;
  border: 0.0625rem solid ${props => props.theme?.palette?.ui?.border || '#ccc'}; /* 1px → rem */
  border-radius: 0.25rem; /* 4px → rem */
  box-shadow: 0 0.125rem 0.375rem ${props => props.theme?.palette?.ui?.shadow || 'rgba(0, 0, 0, 0.3)'}; /* 2px 6px → rem */
  min-width: 200px;
  text-align: center;
  z-index: 10;
  color: ${props => props.theme?.palette?.text?.primary || '#333333'};
`;

const MapaBanana = ({ dashboardData }) => {
  const theme = useTheme();
  // Hook de responsividade
  const { isMobile } = useResponsive();

  const [areasComFitas, setAreasComFitas] = useState([]);

  // Estados para o modal de detalhamento
  const [modalDetalhamento, setModalDetalhamento] = useState({
    visible: false,
    tipo: 'area', // 'area' ou 'fita'
    itemId: null,
    itemNome: ''
  });
  
  // Coordenadas padrão iguais ao AreasAgricolas (Ceará, Brasil)
  const defaultCenter = { lat: -3.052397, lng: -40.083981 };
  const defaultZoom = isMobile ? 12 : 14;  // ✅ Zoom menor no mobile (mais afastado)

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [currentZoom, setCurrentZoom] = useState(defaultZoom);
  const [areaHovered, setAreaHovered] = useState(null);
  const mapRef = useRef(null);
  const centerRef = useRef(defaultCenter);
  const zoomParaExibicaoDetalhes = 17; // Igual ao MapDialog

  // Carregar Google Maps API usando o hook adequado
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    onLoad: () => console.log("Google Maps carregado com sucesso - MapaBanana"),
    onError: (error) => console.error("Erro ao carregar Google Maps - MapaBanana:", error),
  });

  useEffect(() => {
    if (isLoaded) {
      carregarAreasComFitas();
    }
  }, [isLoaded]);

  // ✅ Atualizar zoom quando mudar entre mobile/desktop
  useEffect(() => {
    const newZoom = isMobile ? 12 : 14;
    setMapZoom(newZoom);
    setCurrentZoom(newZoom);
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
  }, [isMobile]);

  const carregarAreasComFitas = async () => {
    try {
      // Buscar áreas que têm fitas vinculadas através da API do controle-banana
      const response = await axiosInstance.get('/controle-banana/areas-com-fitas');
      
      if (response.data && response.data.length > 0) {
        setAreasComFitas(response.data);
        
        // Ajustar o mapa para mostrar todas as áreas
        if (response.data.length > 0 && mapRef.current && isLoaded) {
          const bounds = new window.google.maps.LatLngBounds();
          response.data.forEach(area => {
            if (area.coordenadas && area.coordenadas.length > 0) {
              area.coordenadas.forEach(coord => bounds.extend(coord));
            }
          });
          
          if (!bounds.isEmpty()) {
            const center = bounds.getCenter();
            setMapCenter({ lat: center.lat(), lng: center.lng() });
            
            // Definir zoom baseado no tamanho da área (se geometry está disponível)
            if (window.google.maps.geometry && window.google.maps.geometry.spherical) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const distance = window.google.maps.geometry.spherical.computeDistanceBetween(ne, sw);

              // ✅ Zoom ajustado para mobile (2 níveis a menos) e desktop
              let zoom = isMobile ? 13 : 15;
              if (distance > 50000) zoom = isMobile ? 8 : 10;
              else if (distance > 20000) zoom = isMobile ? 10 : 12;
              else if (distance > 10000) zoom = isMobile ? 12 : 14;

              setMapZoom(zoom);
              setCurrentZoom(zoom);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar áreas com fitas:', error);
      showNotification('error', 'Erro', 'Falha ao carregar áreas no mapa');
    }
  };

  // Callbacks para controlar o mapa (iguais ao MapDialog)
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

  // Função para calcular o centro de um polígono (igual ao MapDialog)
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

  const abrirModalDetalhamento = (tipo, itemId, itemNome) => {
    setModalDetalhamento({
      visible: true,
      tipo,
      itemId,
      itemNome
    });
  };

  const fecharModalDetalhamento = () => {
    setModalDetalhamento({
      visible: false,
      tipo: 'area',
      itemId: null,
      itemNome: ''
    });
  };

  // Estilos para polígonos (iguais ao MapDialog)
  const polygonOptions = {
    fillColor: "#059669", // Verde principal do tema
    fillOpacity: 0.4,
    strokeColor: "#059669", // Verde principal do tema
    strokeOpacity: 1,
    strokeWeight: 2,
    editable: false,
    draggable: false,
  };

  if (loadError) {
    return (
      <Card
        title="🗺️ Mapa das Áreas"
        className="mapa-card"
        style={{ height: isMobile ? '400px' : '600px' }}
        styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
          <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Erro ao carregar Google Maps
          </div>
          <div style={{ fontSize: isMobile ? '0.6875rem' : '0.75rem', marginTop: '4px' }}>
            Verifique se a chave da API está configurada corretamente no arquivo .env como REACT_APP_GOOGLE_MAPS_API_KEY.
          </div>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card
        title="🗺️ Mapa das Áreas"
        className="mapa-card"
        style={{ height: isMobile ? '400px' : '600px', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <Spin size={isMobile ? 'default' : 'large'} />
        <div style={{ marginTop: '16px', color: '#666', fontSize: isMobile ? '0.875rem' : '1rem' }}>
          Carregando mapa...
        </div>
      </Card>
    );
  }

  if (areasComFitas.length === 0) {
    return (
      <Card
        title="🗺️ Mapa das Áreas"
        className="mapa-card"
        style={{ height: isMobile ? '400px' : '600px' }}
        styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <Empty
          image={<EnvironmentOutlined style={{ fontSize: isMobile ? '2.5rem' : '3rem', color: '#d9d9d9' }} />}
          description={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                Nenhuma área com fitas cadastradas
              </div>
              <div style={{ color: '#666', marginTop: '8px', fontSize: isMobile ? '0.6875rem' : '0.75rem' }}>
                Registre fitas em áreas para visualizá-las no mapa
              </div>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title="🗺️ Mapa das Áreas"
      className="mapa-card"
      style={{ height: isMobile ? '400px' : '600px', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { padding: 0, flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 } }}
    >
      <GoogleMap
        mapContainerStyle={{
          height: isMobile ? '350px' : '100%',  // ✅ Altura fixa no mobile
          width: '100%',
          minHeight: isMobile ? '350px' : 'auto'
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
          {/* Renderizar áreas com fitas */}
          {areasComFitas.map((area) => {
            if (!area.coordenadas || !Array.isArray(area.coordenadas) || area.coordenadas.length < 3) {
              return null;
            }

            const center = getPolygonCenter(area.coordenadas);
            const isHovered = areaHovered === area.id;
            
            return (
              <React.Fragment key={`area-fitas-${area.id}`}>
                <Polygon
                  paths={area.coordenadas}
                  options={{
                    ...polygonOptions,
                    fillOpacity: isHovered ? 0.5 : 0.3,
                    strokeOpacity: isHovered ? 1 : 0.8,
                    strokeWeight: isHovered ? 3 : 2,
                    clickable: true,
                    cursor: 'pointer'
                  }}
                  onMouseOver={() => setAreaHovered(area.id)}
                  onMouseOut={() => setAreaHovered(null)}
                  onClick={() => abrirModalDetalhamento('area', area.id, area.nome)}
                />

                <Marker
                  position={center}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
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

                {/* Overlay com informações das fitas quando hover */}
                {isHovered && (
                  <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={getPixelPositionOffset}
                  >
                  <OverlayBox theme={theme}>
                    <Typography.Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                      {area.nome}
                    </Typography.Text>
                    
                    {area.fitas && area.fitas.length > 0 ? (
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text style={{ fontSize: '12px', fontWeight: 600, color: '#059669', display: 'block', marginBottom: '4px' }}>
                          🍌 Fitas Cadastradas:
                        </Typography.Text>
                        <ul style={{ 
                          margin: 0, 
                          paddingLeft: '16px', 
                          fontSize: '11px',
                          lineHeight: '1.4'
                        }}>
                          {area.fitas.map((fita, index) => (
                            <li key={index} style={{ marginBottom: '2px' }}>
                              <span 
                                style={{ 
                                  display: 'inline-block', 
                                  width: '8px', 
                                  height: '8px', 
                                  backgroundColor: fita.corHex || '#059669',
                                  borderRadius: '50%',
                                  marginRight: '6px',
                                  verticalAlign: 'middle'
                                }}
                              />
                              <span style={{ fontWeight: 500 }}>{fita.nome}</span>
                              <span style={{ color: '#666', marginLeft: '4px' }}>
                                ({fita.quantidadeFitas || 0} fitas)
                              </span>
                              {fita.tempoDesdeData && (
                                <span style={{ color: '#059669', marginLeft: '4px', fontSize: '10px' }}>
                                  • {fita.tempoDesdeData.semanas > 0 
                                    ? `${fita.tempoDesdeData.semanas} semana${fita.tempoDesdeData.semanas !== 1 ? 's' : ''}`
                                    : `${fita.tempoDesdeData.dias} dia${fita.tempoDesdeData.dias !== 1 ? 's' : ''}`
                                  }
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Typography.Text style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        Nenhuma fita cadastrada
                      </Typography.Text>
                    )}
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
          bottom: "10px",  // ✅ Mesma linha da legenda
          right: isMobile ? "20px" : "10px",
          backgroundColor: theme?.palette?.background?.paper || "white",
          padding: isMobile ? "6px" : "5px",
          borderRadius: "0.25rem",
          boxShadow: theme?.palette?.ui?.shadow || "0 0.125rem 0.375rem rgba(0,0,0,0.3)",
          border: `0.0625rem solid ${theme?.palette?.ui?.border || "#e0e0e0"}`,
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
          backgroundColor: theme?.palette?.background?.paper || "white",
          padding: isMobile ? "6px 8px" : "8px",
          borderRadius: "0.25rem",
          boxShadow: theme?.palette?.ui?.shadow || "0 0.125rem 0.375rem rgba(0,0,0,0.3)",
          fontSize: isMobile ? "0.6875rem" : "0.75rem",
          border: `0.0625rem solid ${theme?.palette?.ui?.border || "#e0e0e0"}`,
          zIndex: 100,
          maxWidth: isMobile ? "calc(100% - 80px)" : "auto"  // ✅ Ajustado para não sobrepor zoom
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
              backgroundColor: "#059669",
              flexShrink: 0
            }}></span>
            <span style={{
              fontSize: isMobile ? "0.625rem" : "0.75rem",
              whiteSpace: isMobile ? "nowrap" : "normal",
              overflow: isMobile ? "hidden" : "visible",
              textOverflow: isMobile ? "ellipsis" : "clip"
            }}>
              {isMobile ? 'Áreas c/ fitas' : 'Áreas com fitas de banana'}
            </span>
          </div>
          {!isMobile && (
            <div style={{ fontSize: "0.6875rem", color: "#666" }}>
              Total: {areasComFitas.length} área{areasComFitas.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      {/* Modal de Detalhamento */}
      <DetalhamentoModal
        visible={modalDetalhamento.visible}
        onClose={fecharModalDetalhamento}
        tipo={modalDetalhamento.tipo}
        itemId={modalDetalhamento.itemId}
        itemNome={modalDetalhamento.itemNome}
      />
    </Card>
  );
};

export default MapaBanana;