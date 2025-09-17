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

const { Text, Title } = Typography;

// API Key e configurações do Google Maps
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_DEFAULT_API_KEY_HERE";
const GOOGLE_MAPS_LIBRARIES = ["drawing", "geometry"];

// Estilo para o overlay estático do nome da área
const StaticNameOverlay = styled.div`
  background: rgba(220, 38, 38, 0.9);
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

// Estilo para overlay com informações detalhadas
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

const MapaBanana = ({ dashboardData }) => {
  const theme = useTheme();
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
  const defaultZoom = 14;
  
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
              
              let zoom = 15;
              if (distance > 50000) zoom = 10;
              else if (distance > 20000) zoom = 12;
              else if (distance > 10000) zoom = 14;
              
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
        style={{ height: '600px' }}
        styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div>Erro ao carregar Google Maps</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
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
        style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>
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
        style={{ height: '600px' }}
        styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
      >
        <Empty
          image={<EnvironmentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
          description={
            <div style={{ textAlign: 'center' }}>
              <div>Nenhuma área com fitas cadastradas</div>
              <div style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>
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
      style={{ height: '600px' }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ position: 'relative', height: '100%' }}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
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
              icon={<ZoomInOutlined />}
              type="text"
              onClick={() => {
                const newZoom = Math.min(currentZoom + 1, 20);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
              }}
            />
            <Button 
              icon={<ZoomOutOutlined />}
              type="text"
              onClick={() => {
                const newZoom = Math.max(currentZoom - 1, 1);
                setCurrentZoom(newZoom);
                setMapZoom(newZoom);
                if (mapRef.current) {
                  mapRef.current.setZoom(newZoom);
                }
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
              backgroundColor: "#059669",
              marginRight: "5px" 
            }}></span>
            Áreas com fitas de banana
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            Total: {areasComFitas.length} área{areasComFitas.length !== 1 ? 's' : ''}
          </div>
        </div>
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