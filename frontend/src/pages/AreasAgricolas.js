// src/pages/AreasAgricolas.js

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Typography, Button, Space, Modal, Spin } from "antd";
import {
  OrderedListOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import { useLoadScript } from "@react-google-maps/api";
import { Pagination } from "antd";
import { showNotification } from "../config/notificationConfig";
import { Box } from "@mui/material";
import LoadingFallback from "components/common/loaders/LoadingFallback";
import { PrimaryButton } from "components/common/buttons";
import { cpf } from "cpf-cnpj-validator";
import { SearchInput } from "components/common/search";

const MapDialog = lazy(() => import("../components/areas/MapDialog"));
const AreasTable = lazy(() => import("../components/areas/AreasTable"));
const AddEditAreaDialog = lazy(() =>
  import("../components/areas/AddEditAreaDialog")
);

// Funções auxiliares idênticas ao código original
const API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_DEFAULT_API_KEY_HERE";

// Tornar as bibliotecas estáticas para evitar warning de performance
const GOOGLE_MAPS_LIBRARIES = ["drawing", "geometry"];

const formatarNumero = (numero) => {
  if (numero === null || numero === undefined || isNaN(numero)) return "-";
  return Number(numero).toFixed(2);
};

const capitalizeName = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const haversineDistance = (coord1, coord2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6378137;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const insertMidpoints = (coord1, coord2, interval = 50) => {
  const distance = haversineDistance(coord1, coord2);
  const numberOfMidpoints = Math.floor(distance / interval);
  const midpoints = [];

  for (let i = 1; i <= numberOfMidpoints; i++) {
    const fraction = (interval * i) / distance;
    const lat = coord1.lat + (coord2.lat - coord1.lat) * fraction;
    const lng = coord1.lng + (coord2.lng - coord1.lng) * fraction;
    midpoints.push({ lat, lng });
  }

  return midpoints;
};

const calculatePolygonArea = (coordinates) => {
  if (window.google && window.google.maps && window.google.maps.geometry) {
    const googleCoordinates = coordinates.map(
      (coord) => new window.google.maps.LatLng(coord.lat, coord.lng)
    );
    const polygon = new window.google.maps.Polygon({
      paths: googleCoordinates,
    });
    const areaInSquareMeters =
      window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const areaInHectares = areaInSquareMeters / 10000;
    return areaInHectares;
  }
  return 0;
};

const AreasAgricolas = () => {
  const [areas, setAreas] = useState([]);
  const [areasFiltradas, setAreasFiltradas] = useState([]);
  const [culturas, setCulturas] = useState([]);
  
  // Estados para paginação controlada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState("view");

  const [isDrawing, setIsDrawing] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [midpoints, setMidpoints] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [areaAtual, setAreaAtual] = useState({
    id: null,
    nome: "",
    categoria: "COLONO",
    areaTotal: "",
    coordenadas: [],
    culturas: [],
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [openDetalhesDialog, setOpenDetalhesDialog] = useState(false);
  const [areaDetalhes, setAreaDetalhes] = useState(null);

  const defaultCenter = { lat: -3.052397, lng: -40.083981 };
  const defaultZoom = 14;
  const [areaPoligono, setAreaPoligono] = useState(0);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const isEditableMode = mapMode === "edit" || mapMode === "create";
  const API_URL = {
    areas: "/api/areas-agricolas",
    culturas: "/api/culturas",
  };
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    onLoad: () => console.log("Google Maps carregado com sucesso"),
    onError: (error) => console.error("Erro ao carregar Google Maps:", error),
  });

  const calcularAreaPolygon = useCallback((coordinates) => {
    return calculatePolygonArea(coordinates);
  }, []);

  const setMapModeHandler = useCallback((mode) => {
    setMapMode(mode);
  }, []);

  const calcularMidpoints = useCallback((coordinates) => {
    if (coordinates.length < 3) {
      setMidpoints([]);
      return;
    }
    
    console.log("DEBUG_MAP: calcularMidpoints chamado com:", coordinates.length, "coordenadas");
    const newMidpoints = [];
    
    // Criar apenas um midpoint simples por segmento para reduzir complexidade
    for (let i = 0; i < coordinates.length; i++) {
      const coord1 = coordinates[i];
      const coord2 = coordinates[(i + 1) % coordinates.length];
      
      // Calcular ponto médio simples
      const midLat = (coord1.lat + coord2.lat) / 2;
      const midLng = (coord1.lng + coord2.lng) / 2;
      
      newMidpoints.push({
        id: `midpoint-${i}`,
        lat: midLat,
        lng: midLng,
        originalIndex: i,
      });
    }
    
    console.log("DEBUG_MAP: Midpoints calculados:", newMidpoints.length);
    setMidpoints(newMidpoints);
  }, []);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  // Simples detecção de tela pequena:
  const isSmallScreen = window.innerWidth < 600;

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  useEffect(() => {
    console.log("DEBUG_MAP: useEffect tempCoordinates mudou:", tempCoordinates.length);
    if (tempCoordinates.length > 0) {
      console.log("DEBUG_MAP: Sincronizando markers com", tempCoordinates.length, "coordenadas");
      // Sincronizar markers com tempCoordinates apenas quando não estiver editando midpoints
      const novosMarkers = tempCoordinates.map((coord, index) => ({
        id: index,
        lat: coord.lat,
        lng: coord.lng,
      }));
      setMarkers(novosMarkers);
      console.log("DEBUG_MAP: Markers sincronizados:", novosMarkers.length);
    } else {
      console.log("DEBUG_MAP: Limpando markers e midpoints");
      setMidpoints([]);
      setMarkers([]);
    }
  }, [tempCoordinates]); // Removida dependência calcularMidpoints para evitar interferência

  // useEffect separado para calcular midpoints
  useEffect(() => {
    if (tempCoordinates.length > 2) {
      console.log("DEBUG_MAP: Calculando midpoints para", tempCoordinates.length, "coordenadas");
      calcularMidpoints(tempCoordinates);
    } else if (tempCoordinates.length === 0) {
      setMidpoints([]);
    }
  }, [tempCoordinates, calcularMidpoints]);

  useEffect(() => {
    if (tempCoordinates.length > 0) {
      const area = calcularAreaPolygon(tempCoordinates);
      console.log("Coordenadas do Polígono:", tempCoordinates);
      console.log("Área Calculada (ha):", area);
      setAreaPoligono(area);
    } else {
      console.log("Nenhuma coordenada no polígono. Área definida para 0.");
      setAreaPoligono(0);
    }
  }, [tempCoordinates, calcularAreaPolygon]);

  useEffect(() => {
    if (isLoaded && !loadError) {
      buscarAreas();
      buscarCulturas();
    }
  }, [isLoaded, loadError]); // eslint-disable-line

  const buscarAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(API_URL.areas);
      console.log("Dados recebidos da API:", response.data);

      setAreas(response.data);
      setAreasFiltradas(response.data);
      console.log("Áreas carregadas:", response.data);
    } catch (error) {
      console.error("Erro ao buscar áreas agrícolas:", error);
      showNotification("error", "Erro", "Erro ao buscar áreas agrícolas.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL.areas]);

  const buscarCulturas = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_URL.culturas);
      setCulturas(response.data);
    } catch (error) {
      console.error("Erro ao buscar culturas:", error);
      showNotification("error", "Erro", "Erro ao buscar culturas.");
    }
  }, []);

  const handleOpenDialog = useCallback(() => {
    console.log("DEBUG_MAP: handleOpenDialog chamado");
    setAreaAtual({
      id: null,
      nome: "",
      categoria: "COLONO",
      areaTotal: "0.00",
      coordenadas: [],
      culturas: [],
    });
    setEditando(false);
    setErros({});
    // CORREÇÃO: Não limpar coordenadas se já existem
    if (tempCoordinates.length === 0) {
      console.log("DEBUG_MAP: Limpando coordenadas no handleOpenDialog");
      setMarkers([]);
      setTempCoordinates([]);
      setMidpoints([]);
      setAreaPoligono(0);
    } else {
      console.log("DEBUG_MAP: Mantendo coordenadas existentes:", tempCoordinates.length);
    }
    setMapCenter(defaultCenter);
    setMapZoom(defaultZoom);
    setIsDrawing(false);
    setMapMode("create");
    setOpenDialog(true);
  }, [defaultCenter, tempCoordinates.length]);

  const handleCloseDialog = useCallback(() => {
    console.log("DEBUG_MAP: handleCloseDialog chamado");
    setOpenDialog(false);
    setErros({});
    setMarkers([]);
    setTempCoordinates([]);
    setMidpoints([]);
    setAreaPoligono(0);
    setMapCenter(defaultCenter);
    setMapZoom(defaultZoom);
    setIsDrawing(false);
    setMapMode("view");
  }, [defaultCenter]);

  const handleCloseMapDialog = useCallback(() => {
    console.log("DEBUG_MAP: handleCloseMapDialog chamado");
    // Sincronizar área do polígono com o formulário se houver coordenadas
    if (tempCoordinates.length > 0 && areaPoligono > 0) {
      console.log("DEBUG_MAP: Sincronizando área:", areaPoligono, "com coordenadas:", tempCoordinates.length);
      setAreaAtual(prev => ({
        ...prev,
        areaTotal: Number(areaPoligono).toFixed(2),
        coordenadas: tempCoordinates,
      }));
    } else {
      console.log("DEBUG_MAP: Nenhuma área para sincronizar - tempCoordinates:", tempCoordinates.length, "areaPoligono:", areaPoligono);
    }
    setMapOpen(false);
  }, [tempCoordinates, areaPoligono, setAreaAtual]);

  // Funções para controle da paginação
  const handlePageChange = useCallback((page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Volta para primeira página quando muda o tamanho
    }
  }, [pageSize]);

  const handleShowSizeChange = useCallback((current, size) => {
    setPageSize(size);
    setCurrentPage(1); // Volta para primeira página quando muda o tamanho
  }, []);

  // CORREÇÃO 1: Lógica de abrir mapa simplificada e centralizada
  const abrirMapa = useCallback(
    (area, mode = "view") => {
      console.log("DEBUG_MAP: abrirMapa chamado com:", { area: area ? { id: area.id, coordenadas: area.coordenadas?.length } : null, mode });
      if (mode === "view") {
        setIsLoading(true);
        axiosInstance
          .get(`${API_URL.areas}/${area.id}`)
          .then((response) => {
            setAreaDetalhes(response.data);
            setOpenDetalhesDialog(true);
          })
          .catch((error) => {
            console.error("Erro ao buscar dados completos da área:", error);
            showNotification("error", "Erro", "Não foi possível carregar os dados completos da área.");
            setAreaDetalhes(area);
            setOpenDetalhesDialog(true);
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      }

      // Para modo "create" ou "edit"
      setMapMode(mode);
      
      // Verificar se tem coordenadas para editar (pode vir do area ou do areaAtual)
      const coordenadas = (area && area.coordenadas) || (areaAtual && areaAtual.coordenadas) || [];
      
      if (mode === "edit" && coordenadas && coordenadas.length > 0) {
        // Editar área existente com coordenadas
        console.log("DEBUG_MAP: Editando área com coordenadas:", coordenadas.length);
        setTempCoordinates(coordenadas);
        
        // Calcular centro do polígono
        const center = {
          lat: coordenadas.reduce((sum, coord) => sum + coord.lat, 0) / coordenadas.length,
          lng: coordenadas.reduce((sum, coord) => sum + coord.lng, 0) / coordenadas.length,
        };
        setMapCenter(center);
        setMapZoom(15);
        setIsDrawing(false);
        
        // Calcular e setar a área do polígono
        const areaCalculada = calcularAreaPolygon(coordenadas);
        setAreaPoligono(areaCalculada);
        console.log("DEBUG_MAP: Área calculada para edição:", areaCalculada);
      } else {
        // Criar nova área ou editar sem coordenadas
        setTempCoordinates([]);
        setMarkers([]);
        setMidpoints([]);
        setAreaPoligono(0);
        setMapCenter(defaultCenter);
        setMapZoom(defaultZoom);
        setIsDrawing(true); // Sempre habilitar desenho para create
        setMapMode("create"); // Forçar modo create
      }
      
      setMapOpen(true);
    },
    [defaultCenter, API_URL.areas]
  );

  // CORREÇÃO 2: Lógica de salvar centralizada no componente pai
  const handleSalvarArea = useCallback(async () => {
    if (isSaving) return;

    const novosErros = {};
    const areaTotalNum = parseFloat(String(areaAtual.areaTotal).replace(',', '.'));

    if (!areaAtual.nome || areaAtual.nome.trim() === "") {
      novosErros.nome = "Nome da área é obrigatório";
    }
    if (!areaAtual.categoria) {
      novosErros.categoria = "Categoria é obrigatória";
    }
    if (isNaN(areaTotalNum) || areaTotalNum <= 0) {
      novosErros.areaTotal = "Área total deve ser maior que zero";
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      showNotification("error", "Erro ao salvar", "Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    
    // As coordenadas já estão em areaAtual através do MapDialog
    // Garantir que apenas as propriedades necessárias sejam enviadas
    const dadosParaEnvio = {
      nome: areaAtual.nome,
      categoria: areaAtual.categoria,
      areaTotal: areaTotalNum,
      coordenadas: areaAtual.coordenadas && areaAtual.coordenadas.length >= 3 ? areaAtual.coordenadas : null,
      culturas: (areaAtual.culturas || []).map(c => ({
        culturaId: c.culturaId,
        areaPlantada: parseFloat(c.areaPlantada || 0),
        areaProduzindo: parseFloat(c.areaProduzindo || 0),
      }))
    };
    
    // Remover propriedades undefined/null para evitar problemas de validação
    Object.keys(dadosParaEnvio).forEach(key => {
      if (dadosParaEnvio[key] === undefined || dadosParaEnvio[key] === null) {
        delete dadosParaEnvio[key];
      }
    });
    
    console.log("DEBUG_SAVE: Dados enviados para o backend:", {
      nome: dadosParaEnvio.nome,
      categoria: dadosParaEnvio.categoria,
      areaTotal: dadosParaEnvio.areaTotal,
      coordenadas: dadosParaEnvio.coordenadas ? `${dadosParaEnvio.coordenadas.length} pontos` : "sem coordenadas",
      culturas: dadosParaEnvio.culturas ? `${dadosParaEnvio.culturas.length} culturas` : "sem culturas"
    });
    console.log("DEBUG_SAVE: Payload completo:", JSON.stringify(dadosParaEnvio, null, 2));
    
    try {
      if (editando) {
        // Para edição, remover o id do payload se existir
        const { id, ...dadosParaUpdate } = dadosParaEnvio;
        await axiosInstance.patch(`${API_URL.areas}/${areaAtual.id}`, dadosParaUpdate);
        showNotification("success", "Sucesso", "Área atualizada com sucesso!");
      } else {
        await axiosInstance.post(API_URL.areas, dadosParaEnvio);
        showNotification("success", "Sucesso", "Área cadastrada com sucesso!");
      }
      buscarAreas();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar área:", error.response?.data || error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erro desconhecido ao salvar.";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [areaAtual, editando, isSaving, API_URL.areas, buscarAreas, handleCloseDialog]);

  const handleEditarArea = useCallback(
    (area) => {
      console.log("Área recebida para edição:", area);

      const coordenadas = area.coordenadas || [];

      setAreaAtual({
        id: area.id,
        nome: area.nome,
        categoria: area.categoria,
        areaTotal: Number(area.areaTotal).toFixed(2),
        coordenadas: coordenadas,
        culturas: area.culturas || [],
      });

      const novosMarkers = coordenadas.map((coord, index) => ({
        id: index,
        lat: coord.lat,
        lng: coord.lng,
      }));
      setMarkers(novosMarkers);
      setTempCoordinates(coordenadas);

      calcularMidpoints(coordenadas);

      setIsDrawing(false);
      setEditando(true);
      setOpenDialog(true);
    },
    [calcularMidpoints, setOpenDialog]
  );

  const handleExcluirArea = useCallback(
    async (id) => {
      Modal.confirm({
        title: "Confirmar exclusão",
        content:
          "Tem certeza de que deseja excluir esta área agrícola? Essa ação não pode ser desfeita.",
        okText: "Sim",
        okType: "danger",
        cancelText: "Não",
        onOk: async () => {
          try {
            await axiosInstance.delete(`${API_URL.areas}/${id}`);
            showNotification(
              "success",
              "Sucesso",
              "Área agrícola excluída com sucesso!"
            );
            buscarAreas();
          } catch (error) {
            console.error("Erro ao excluir área agrícola:", error);

            const errorMessage =
              error.response?.data?.error ||
              "Ocorreu um erro ao excluir a área agrícola.";
            const errorDetails = error.response?.data?.detalhes || "";

            Modal.error({
              title: "Não é possível excluir a área",
              content: (
                <>
                  <p>{errorMessage}</p>
                  {errorDetails && <p>{errorDetails}</p>}
                </>
              ),
            });
          }
        },
      });
    },
    [API_URL.areas, buscarAreas]
  );

  const handleChange = useCallback((fieldName, value) => {
    console.log(`Mudança no campo ${fieldName}:`, value);
    setAreaAtual((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);

  const calcularAreaPlantada = useCallback((culturas) => {
    if (!culturas || !Array.isArray(culturas)) return 0;
    return culturas.reduce((sum, cultura) => {
      return sum + (cultura.areaPlantada || 0);
    }, 0);
  }, []);

  const addVertex = useCallback(
    (event) => {
      if (mapMode !== "create") return;

      const newPoint = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      const updatedPath = [...tempCoordinates, newPoint];
      setTempCoordinates(updatedPath);
    },
    [tempCoordinates, mapMode]
  );

  const handlePolygonComplete = useCallback(
    (polygon) => {
      console.log("DEBUG_MAP: handlePolygonComplete chamado");
      const path = polygon.getPath();
      const newCoordinates = path.getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

      console.log("DEBUG_MAP: Novas coordenadas:", newCoordinates);

      // Verificar se há pelo menos 3 pontos
      if (newCoordinates.length < 3) {
        console.log("DEBUG_MAP: Polígono com menos de 3 pontos, ignorando");
        polygon.setMap(null);
        return;
      }

      // Calcular a área
      const area = calcularAreaPolygon(newCoordinates);
      const AREA_MAXIMA = 100; // em hectares

      console.log("DEBUG_MAP: Área calculada:", area);

      if (area > AREA_MAXIMA) {
        showNotification(
          "error",
          "Erro",
          `A área desenhada (${area.toFixed(
            2
          )} ha) excede o limite máximo de ${AREA_MAXIMA} ha.`
        );
        polygon.setMap(null); // Remove o polígono desenhado
        setIsDrawing(false);
        return;
      }

      // CORREÇÃO: Garantir que as coordenadas sejam mantidas
      console.log("DEBUG_MAP: Definindo tempCoordinates com:", newCoordinates);
      setTempCoordinates(newCoordinates); // Salva as coordenadas temporárias do polígono
      setAreaPoligono(area); // Armazena a área calculada

      // Calcular e adicionar midpoints
      calcularMidpoints(newCoordinates);

      setIsDrawing(false);

      // Remover o polígono desenhado pelo DrawingManager
      polygon.setMap(null);
      console.log("DEBUG_MAP: handlePolygonComplete finalizado");
    },
    [calcularAreaPolygon, calcularMidpoints]
  );

  const handleMarkerDragEnd = useCallback(
    (index, event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();

      const updatedCoordinates = tempCoordinates.map((coord, i) =>
        i === index ? { lat: newLat, lng: newLng } : coord
      );
      setTempCoordinates(updatedCoordinates);
    },
    [tempCoordinates]
  );

  const handleMarkerClick = useCallback((markerId) => {
    setSelectedMarker(markerId);
  }, []);

  // CORREÇÃO 3: Sincronização correta de markers ao arrastar midpoints
  const handleMidpointDragEnd = useCallback(
    (midpointId, event) => {
      console.log("DEBUG_MAP: handleMidpointDragEnd chamado:", midpointId);
      const midpoint = midpoints.find((m) => m.id === midpointId);
      if (!midpoint) {
        console.log("DEBUG_MAP: Midpoint não encontrado:", midpointId);
        return;
      }

      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();

      const newVertex = { lat: newLat, lng: newLng };
      console.log("DEBUG_MAP: Novo vértice:", newVertex, "na posição:", midpoint.originalIndex + 1);

      // Criar novo array de coordenadas com o novo vértice inserido
      const newPath = [...tempCoordinates];
      newPath.splice(midpoint.originalIndex + 1, 0, newVertex);

      console.log("DEBUG_MAP: Atualizando tempCoordinates com novo path:", newPath.length, "pontos");
      setTempCoordinates(newPath);
    },
    [midpoints, tempCoordinates]
  );

  const deleteMarker = useCallback(
    (markerId) => {
      if (typeof markerId === "number") {
        if (tempCoordinates.length <= 3) {
          showNotification("error", "Erro", "Um polígono deve ter pelo menos 3 pontos.");
          setSelectedMarker(null);
          return;
        }

        const updatedCoordinates = tempCoordinates.filter((_, i) => i !== markerId);
        setTempCoordinates(updatedCoordinates);
      } else {
        showNotification("error", "Erro", "Midpoints são gerados automaticamente e não podem ser deletados diretamente.");
      }
      setSelectedMarker(null);
    },
    [tempCoordinates]
  );

  const handleCloseInfoWindow = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setAreasFiltradas(areas);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtrados = areas.filter((area) => {
        return area.nome.toLowerCase().includes(query) ||
               area.categoria.toLowerCase().includes(query) ||
               area.areaTotal.toString().includes(query);
      });
      setAreasFiltradas(filtrados);
      setCurrentPage(1); // Reset para primeira página quando busca
    }
  }, [areas, searchQuery]);

  if (loadError) {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Text type="danger">
          Erro ao carregar o Google Maps. Verifique se a chave da API está configurada corretamente no arquivo .env como REACT_APP_GOOGLE_MAPS_API_KEY.
        </Typography.Text>
      </div>
    );
  }

  if (!isLoaded) {
    return <LoadingFallback message="Carregando mapa." />;
  }

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={1} style={{ marginBottom: 16, color: "#059669" }}>
        Áreas Agrícolas
      </Typography.Title>

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <PrimaryButton
          onClick={handleOpenDialog}
          icon={<PlusCircleOutlined />}
        >
          Adicionar Área Agrícola
        </PrimaryButton>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <Suspense fallback={<LoadingFallback />}>
          <SearchInput
            placeholder="Buscar áreas por nome..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            style={{ marginTop: "8px" }}
          />
        </Suspense>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <AreasTable
          areas={areasFiltradas}
          loading={isLoading}
          onEdit={handleEditarArea}
          onDelete={handleExcluirArea}
          onOpenMap={abrirMapa}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onShowSizeChange={handleShowSizeChange}
        />
      </Suspense>
      {areasFiltradas.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={areasFiltradas.length}
            onChange={handlePageChange}
            onShowSizeChange={handleShowSizeChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} áreas`}
            pageSizeOptions={["10", "20", "50", "100"]}
          />
        </div>
      )}
             <Suspense fallback={<LoadingFallback />}>
         <AddEditAreaDialog
           open={openDialog}
           onClose={handleCloseDialog}
           areaAtual={areaAtual}
           setAreaAtual={setAreaAtual}
           editando={editando}
           culturas={culturas}
           erros={erros}
           setErros={setErros}
           isSaving={isSaving}
           handleSalvarArea={handleSalvarArea}
           abrirMapa={abrirMapa}
           onCulturasReload={buscarCulturas}
         />
       </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <MapDialog
          open={mapOpen}
          onClose={handleCloseMapDialog}
          mapMode={mapMode}
          setMapMode={setMapModeHandler}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          mapZoom={mapZoom}
          setMapZoom={setMapZoom}
          loteAtual={areaAtual}
          setLoteAtual={setAreaAtual}
          tempCoordinates={tempCoordinates}
          setTempCoordinates={setTempCoordinates}
          markers={markers}
          setMarkers={setMarkers}
          midpoints={midpoints}
          setMidpoints={setMidpoints}
          handlePolygonComplete={handlePolygonComplete}
          handleMarkerDragEnd={handleMarkerDragEnd}
          handleMarkerClick={handleMarkerClick}
          handleMidpointDragEnd={handleMidpointDragEnd}
          deleteMarker={deleteMarker}
          selectedMarker={selectedMarker}
          handleCloseInfoWindow={handleCloseInfoWindow}
          calculateAreaPolygon={calcularAreaPolygon}
          setAreaPoligono={setAreaPoligono}
          areaPoligono={areaPoligono}
          lotesExistentes={areas.filter((l) => l.id !== areaAtual?.id)}
        />
      </Suspense>
    </div>
  );
};

export default AreasAgricolas;
