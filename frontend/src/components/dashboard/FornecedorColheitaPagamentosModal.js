// src/components/dashboard/FornecedorColheitaPagamentosModal.js

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Typography,
  Input,
  DatePicker,
  Select,
  Divider,
  Empty,
  Tag,
  Tooltip,
  Button,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  AppleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  HeatMapOutlined,
  CheckCircleTwoTone,
  ClockCircleOutlined,
  DollarOutlined,
  DollarCircleOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  TagOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { Icon } from "@iconify/react";
import styled from "styled-components";
import moment from "moment";
import useResponsive from "../../hooks/useResponsive";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import ResponsiveTable from "../common/ResponsiveTable";
import {
  formatCurrency,
  capitalizeName,
  capitalizeNameShort,
  intFormatter,
} from "../../utils/formatters";
import { MonetaryInput, MaskedDatePicker } from "../common/inputs";
import ConfirmActionModal from "../common/modals/ConfirmActionModal";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SummaryCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.05);
`;

const FiltersCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
`;

const FruitSectionCard = styled(Card)`
  border-radius: 10px;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  margin-bottom: ${(props) => (props.$isMobile ? "12px" : "16px")};
`;

const QuantitiesBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #047857;
  font-size: 0.75rem;
  font-weight: 600;
`;

const STATUS_DISPLAY = {
  PEDIDO_CRIADO: { label: "Criado", color: "#2563eb" },
  AGUARDANDO_COLHEITA: { label: "Aguardando Colheita", color: "#f59e0b" },
  COLHEITA_PARCIAL: { label: "Colheita Parcial", color: "#f97316" },
  COLHEITA_REALIZADA: { label: "Colheita Realizada", color: "#16a34a" },
  AGUARDANDO_PRECIFICACAO: { label: "Aguardando Precificação", color: "#8b5cf6" },
  PRECIFICACAO_REALIZADA: { label: "Precificação Realizada", color: "#0f766e" },
  AGUARDANDO_PAGAMENTO: { label: "Aguardando Pagamento", color: "#d97706" },
  PAGAMENTO_PARCIAL: { label: "Pagamento Parcial", color: "#059669" },
  PAGAMENTO_REALIZADO: { label: "Pagamento Realizado", color: "#047857" },
  PEDIDO_FINALIZADO: { label: "Finalizado", color: "#047857" },
  CANCELADO: { label: "Cancelado", color: "#dc2626" },
};

const getStatusDisplay = (status) => {
  if (!status) {
    return { label: "Sem Status", color: "#9ca3af" };
  }
  return STATUS_DISPLAY[status] || {
    label: capitalizeNameShort(status),
    color: "#0f172a",
  };
};

const formatQuantidade = (quantidade) =>
  Number(quantidade || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseLocaleNumber = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se já é um número, retornar diretamente
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  const stringValor = String(valor).trim();
  if (!stringValor) return null;

  // ✅ O MonetaryInput (NumericFormat) retorna values.value já como string numérica
  // no formato americano (ponto como separador decimal, sem separador de milhares)
  // Exemplo: "1.111" = 1.111 (um vírgula um um um), não 1111
  // Então podemos converter diretamente para número usando parseFloat
  // Se a string contém vírgula, é formato brasileiro, converter para formato americano
  // Se contém ponto, assumir que já está no formato correto (pode ser decimal ou milhar)
  
  let normalized = stringValor;
  
  // Se contém vírgula, é formato brasileiro (vírgula decimal, ponto milhar)
  if (stringValor.includes(",")) {
    // Remover pontos (separadores de milhares) e substituir vírgula por ponto
    normalized = stringValor.replace(/\./g, "").replace(",", ".");
  } 
  // Se contém ponto mas não vírgula, verificar se é formato brasileiro de milhares
  // Padrão: 1.111 (sem parte decimal) = 1111 (milhar)
  // Padrão: 1.111.111 = 1111111 (milhar)
  else if (/^\d{1,3}(\.\d{3})+$/.test(stringValor) && !stringValor.includes(",")) {
    // É formato de milhar brasileiro, remover pontos
    normalized = stringValor.replace(/\./g, "");
  }
  // Caso contrário, assumir que já está no formato correto (decimal com ponto)
  // O NumericFormat já retorna neste formato

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const FornecedorColheitaPagamentosModal = ({ open = false, fornecedor = null, onClose = () => {}, onPagamentosCriados = () => {} }) => {
  const { isMobile } = useResponsive();
  const { getStatusColor, AGUARDANDO_PAGAMENTO, PEDIDO_FINALIZADO } = usePedidoStatusColors();
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroData, setFiltroData] = useState(null);
  // ✅ Filtro de Status da Colheita: 'TODAS', 'PAGA', 'PRECIFICADA', 'NAO_PRECIFICADA'
  // Por padrão, exibir 'NAO_PRECIFICADA' e 'PRECIFICADA' juntas (valor padrão: 'PENDENTE')
  // 'PENDENTE' representa "não precificada + precificada" (todas exceto pagas)
  const [filtroStatus, setFiltroStatus] = useState('PENDENTE');
  const [filtroFruta, setFiltroFruta] = useState(undefined);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [valoresFornecedor, setValoresFornecedor] = useState({});
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [statusPagamentoConfirmacao, setStatusPagamentoConfirmacao] = useState(null);
  const [dataPagamentoSelecionada, setDataPagamentoSelecionada] = useState(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(null);
  const [loading, setLoading] = useState(false);
  // Os dados já vêm do dashboard, não precisamos fazer nova chamada
  const detalhes = fornecedor?.detalhes || [];
  
  // Calcular resumo a partir dos detalhes (fonte de verdade)
  // Sempre calcular a partir dos detalhes para garantir precisão
  const resumo = useMemo(() => {
    if (!detalhes || detalhes.length === 0) {
      return {
        quantidadePedidos: 0,
        quantidadeFrutas: 0,
        totalColheitas: 0,
        colheitasPagas: 0,
        colheitasEmAberto: 0,
        quantidadeAreas: 0,
        totalPago: 0,
        totalPendente: 0,
        distribuicaoPorUnidade: [],
      };
    }
    
    // Calcular a partir dos detalhes (fonte de verdade)
    const quantidadePedidos = new Set(detalhes.map((d) => d.pedidoId)).size;
    const quantidadeFrutas = new Set(detalhes.map((d) => d.frutaId)).size;
    const quantidadeAreas = new Set(detalhes.map((d) => d.areaNome)).size;
    const totalColheitas = detalhes.length;
    
    // Colheitas pagas: têm pagamentoId E status é PAGO
    const colheitasPagas = detalhes.filter((d) => {
      const temPagamentoId = d.pagamentoId !== undefined && 
                             d.pagamentoId !== null && 
                             typeof d.pagamentoId === 'number' && 
                             d.pagamentoId > 0;
      const statusPago = d.statusPagamento === 'PAGO';
      return temPagamentoId && statusPago;
    }).length;
    
    // Colheitas em aberto: não têm pagamentoId OU têm pagamentoId mas status não é PAGO
    const colheitasEmAberto = detalhes.filter((d) => {
      const temPagamentoId = d.pagamentoId !== undefined && 
                             d.pagamentoId !== null && 
                             typeof d.pagamentoId === 'number' && 
                             d.pagamentoId > 0;
      const statusPago = d.statusPagamento === 'PAGO';
      // Em aberto se: não tem pagamentoId OU tem pagamentoId mas status não é PAGO
      return !temPagamentoId || (temPagamentoId && !statusPago);
    }).length;
    
    // Calcular Total Pago e Total Pendente
    // IMPORTANTE: Só somar valores se houver pagamento PENDENTE/PROCESSANDO
    // Se não tem pagamento, não somar nada (valor = 0), pois não foi precificada ainda
    let totalPago = 0;
    let totalPendente = 0;
    
    detalhes.forEach((colheita) => {
      const temPagamentoId = colheita.pagamentoId !== undefined && 
                             colheita.pagamentoId !== null && 
                             typeof colheita.pagamentoId === 'number' && 
                             colheita.pagamentoId > 0;
      const statusPago = colheita.statusPagamento === 'PAGO';
      const statusPendente = colheita.statusPagamento === 'PENDENTE' || colheita.statusPagamento === 'PROCESSANDO';
      
      if (temPagamentoId && statusPago) {
        // Colheita paga - usar valorTotal do pagamento se disponível, senão usar valor
        totalPago += colheita.valorTotal || colheita.valor || 0;
      } else if (temPagamentoId && statusPendente) {
        // Colheita precificada mas não paga (PENDENTE/PROCESSANDO) - usar valorTotal do pagamento
        // Se valorTotal não estiver definido, usar 0 (não usar valor proporcional)
        totalPendente += colheita.valorTotal || 0;
      }
      // Se não tem pagamento OU tem pagamento mas status não é PENDENTE/PROCESSANDO/PAGO:
      // Não somar nada (valor = 0), pois não foi precificada ainda ou status é inválido
    });
    
    // Calcular distribuição por unidade
    const distribuicaoPorUnidadeMap = new Map();
    detalhes.forEach((colheita) => {
      const unidade = colheita.unidade || "UN";
      if (!distribuicaoPorUnidadeMap.has(unidade)) {
        distribuicaoPorUnidadeMap.set(unidade, {
          unidade,
          quantidadePaga: 0,
          quantidadePendente: 0,
          quantidadeTotal: 0,
          valorPago: 0,
          valorPendente: 0,
          valorTotal: 0,
        });
      }
      
      const distribuicao = distribuicaoPorUnidadeMap.get(unidade);
      distribuicao.quantidadeTotal += colheita.quantidade || 0;
      distribuicao.valorTotal += colheita.valor || 0;
      
      const temPagamentoId = colheita.pagamentoId !== undefined && 
                             colheita.pagamentoId !== null && 
                             typeof colheita.pagamentoId === 'number' && 
                             colheita.pagamentoId > 0;
      const statusPago = colheita.statusPagamento === 'PAGO';
      const statusPendente = colheita.statusPagamento === 'PENDENTE' || colheita.statusPagamento === 'PROCESSANDO';
      
      if (temPagamentoId && statusPago) {
        // Colheita paga - usar valorTotal do pagamento se disponível, senão usar valor
        distribuicao.quantidadePaga += colheita.quantidade || 0;
        distribuicao.valorPago += colheita.valorTotal || colheita.valor || 0;
      } else {
        // Colheita pendente/em aberto - sempre contar quantidade
        distribuicao.quantidadePendente += colheita.quantidade || 0;
        
        // IMPORTANTE: Só somar valor se houver pagamento PENDENTE/PROCESSANDO
        // Se não tem pagamento, não somar valor (valor = 0), pois não foi precificada ainda
        if (temPagamentoId && statusPendente) {
          // Tem pagamento pendente/processando - usar valorTotal do pagamento
          distribuicao.valorPendente += colheita.valorTotal || 0;
        }
        // Se não tem pagamento, não somar nada (valorPendente permanece 0)
      }
    });
    
    const distribuicaoPorUnidade = Array.from(distribuicaoPorUnidadeMap.values()).map((d) => ({
      ...d,
      quantidadePaga: Number(d.quantidadePaga.toFixed(2)),
      quantidadePendente: Number(d.quantidadePendente.toFixed(2)),
      quantidadeTotal: Number(d.quantidadeTotal.toFixed(2)),
      valorPago: Number(d.valorPago.toFixed(2)),
      valorPendente: Number(d.valorPendente.toFixed(2)),
      valorTotal: Number(d.valorTotal.toFixed(2)),
    }));
    
    return {
      quantidadePedidos,
      quantidadeFrutas,
      totalColheitas,
      colheitasPagas,
      colheitasEmAberto,
      quantidadeAreas,
      totalPago,
      totalPendente,
      distribuicaoPorUnidade,
    };
  }, [fornecedor, detalhes]);
  
  // Obter nome do fornecedor
  const nomeFornecedor = useMemo(() => {
    return fornecedor?.nomeFornecedor || fornecedor?.nome || "Fornecedor";
  }, [fornecedor]);

  useEffect(() => {
    if (!open) {
      setFiltroBusca("");
      setFiltroData(null);
      // ✅ Resetar filtroStatus para padrão (não precificada + precificada)
      setFiltroStatus('PENDENTE');
      setFiltroFruta(undefined);
      setItensSelecionados([]);
      setValoresFornecedor({});
      setModalConfirmacaoAberto(false);
      setStatusPagamentoConfirmacao(null);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);
    }
  }, [open, fornecedor?.id]);

  useEffect(() => {
    if (modalConfirmacaoAberto) {
      if (!dataPagamentoSelecionada) {
        setDataPagamentoSelecionada(moment());
      }
      if (!formaPagamentoSelecionada) {
        setFormaPagamentoSelecionada('PIX');
      }
    }
  }, [modalConfirmacaoAberto]);

  // Distribuição por unidade (vem do resumo calculado)
  const distribuicaoPorUnidade = resumo.distribuicaoPorUnidade || [];

  // ✅ Opções de status da colheita para o filtro
  const statusColheitaOpcoes = useMemo(() => [
    { value: 'TODAS', label: 'Todas' },
    { value: 'PAGA', label: 'Colheita Paga' },
    { value: 'PRECIFICADA', label: 'Precificada' },
    { value: 'NAO_PRECIFICADA', label: 'Não Precificada' },
    // Valor padrão 'PENDENTE' (Não Precificada + Precificada) não aparece na lista, é usado internamente
  ], []);

  const frutasDisponiveis = useMemo(() => {
    const set = new Set(detalhes.map((item) => item.fruta).filter(Boolean));
    return Array.from(set.values());
  }, [detalhes]);

  const detalhesFiltrados = useMemo(() => {
    const termoBusca = filtroBusca.trim().toLowerCase();

    return detalhes
      .filter((item) => {
        // ✅ FILTRAR por Status da Colheita
        // Verificar se tem pagamentoId e statusPagamento
        const temPagamentoId = item.pagamentoId !== undefined && 
                               item.pagamentoId !== null && 
                               typeof item.pagamentoId === 'number' && 
                               item.pagamentoId > 0;
        const statusPago = item.statusPagamento === 'PAGO';
        const statusPrecificado = temPagamentoId && (item.statusPagamento === 'PENDENTE' || item.statusPagamento === 'PROCESSANDO');
        const statusNaoPrecificado = !temPagamentoId;
        
        // Aplicar filtro de status da colheita
        if (filtroStatus) {
          if (filtroStatus === 'PAGA') {
            // Mostrar apenas colheitas pagas
            if (!statusPago) {
              return false;
            }
          } else if (filtroStatus === 'PRECIFICADA') {
            // Mostrar apenas colheitas precificadas (tem pagamentoId mas não está pago)
            if (!statusPrecificado) {
              return false;
            }
          } else if (filtroStatus === 'NAO_PRECIFICADA') {
            // Mostrar apenas colheitas não precificadas (não tem pagamentoId)
            if (!statusNaoPrecificado) {
              return false;
            }
          } else if (filtroStatus === 'PENDENTE') {
            // Mostrar colheitas não precificadas + precificadas (padrão: todas exceto pagas)
            if (statusPago) {
              return false;
            }
          } else if (filtroStatus === 'TODAS') {
            // Mostrar todas (incluindo pagas)
            // Não filtrar por status
          }
        } else {
          // Se não há filtro, usar padrão: mostrar não precificadas + precificadas (todas exceto pagas)
          if (statusPago) {
            return false;
          }
        }

        // Filtro de busca (pedido, cliente, área)
        if (termoBusca) {
          const pedido = (item.pedidoNumero || "").toLowerCase();
          const cliente = (item.cliente || "").toLowerCase();
          const area = (item.areaNome || "").toLowerCase();
          if (
            !pedido.includes(termoBusca) &&
            !cliente.includes(termoBusca) &&
            !area.includes(termoBusca)
          ) {
            return false;
          }
        }

        // Filtro de fruta
        if (filtroFruta && item.fruta !== filtroFruta) {
          return false;
        }

        // Filtro de data
        if (
          filtroData &&
          filtroData.length === 2 &&
          filtroData[0] &&
          filtroData[1] &&
          item.dataColheita
        ) {
          const data = moment(item.dataColheita);
          if (!data.isBetween(filtroData[0], filtroData[1], "day", "[]")) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dataA = a.dataColheita ? moment(a.dataColheita).valueOf() : 0;
        const dataB = b.dataColheita ? moment(b.dataColheita).valueOf() : 0;
        return dataB - dataA;
      });
  }, [detalhes, filtroBusca, filtroStatus, filtroFruta, filtroData]);

  const formatNumber = React.useCallback(
    (value, { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {}) => {
      if (value === null || value === undefined) {
        return "-";
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return "-";
      }
      return numeric.toLocaleString("pt-BR", {
        minimumFractionDigits,
        maximumFractionDigits,
      });
    },
    []
  );

  const gerarResumoAreas = React.useCallback((detalhesFruta = []) => {
    const mapa = new Map();

    detalhesFruta.forEach((detalhe) => {
      const areaKey = detalhe.areaFornecedorId ?? detalhe.areaNome ?? detalhe.frutaPedidoAreaId;
      if (!mapa.has(areaKey)) {
        mapa.set(areaKey, {
          areaId: detalhe.areaFornecedorId,
          areaNome: detalhe.areaNome,
          unidades: new Map(),
          quantidadeHa: null,
        });
      }

      const registro = mapa.get(areaKey);

      // Usar quantidadeHa do backend (vem da área do fornecedor)
      // Se ainda não foi definido ou se o novo valor é válido, atualizar
      if (detalhe.quantidadeHa !== undefined && detalhe.quantidadeHa !== null) {
        const quantidadeHaNumero = Number(detalhe.quantidadeHa);
        if (Number.isFinite(quantidadeHaNumero) && quantidadeHaNumero > 0) {
          registro.quantidadeHa = quantidadeHaNumero;
        }
      }

      // Adicionar quantidades por unidade
      const adicionarQuantidade = (unidade, quantidade) => {
        if (!unidade) return;
        const valor = Number(quantidade) || 0;
        if (!Number.isFinite(valor) || valor === 0) return;
        
        // Se a unidade for HA (hectares), não adicionar às unidades normais
        const unidadeUpper = unidade.toUpperCase();
        if (unidadeUpper === 'HA' || unidadeUpper === 'HECTARES' || unidadeUpper === 'HECTARE') {
          return;
        } else {
          // Caso contrário, adicionar à unidade normal
          const atual = registro.unidades.get(unidade) || 0;
          registro.unidades.set(unidade, atual + valor);
        }
      };

      adicionarQuantidade(detalhe.unidade, detalhe.quantidade);
      if (detalhe.unidadeSecundaria && detalhe.quantidadeSecundaria) {
        adicionarQuantidade(detalhe.unidadeSecundaria, detalhe.quantidadeSecundaria);
      }
    });

    return Array.from(mapa.values())
      .map((registro) => {
        // Calcular métricas para cada unidade (exceto HA)
        const metricas = Array.from(registro.unidades.entries())
          .filter(([unidade]) => {
            const unidadeUpper = unidade.toUpperCase();
            return unidadeUpper !== 'HA' && unidadeUpper !== 'HECTARES' && unidadeUpper !== 'HECTARE';
          })
          .map(([unidade, quantidade]) => {
            // Calcular média como quantidade/ha
            const quantidadeHaValida = registro.quantidadeHa !== null && 
                                       registro.quantidadeHa !== undefined && 
                                       Number.isFinite(Number(registro.quantidadeHa)) && 
                                       Number(registro.quantidadeHa) > 0;
            const media = quantidadeHaValida
              ? quantidade / Number(registro.quantidadeHa)
              : null;

            return {
              unidade,
              quantidade,
              media,
            };
          });

        const quantidadeTotal = metricas.reduce((acc, metrica) => acc + (metrica.quantidade || 0), 0);

        // Formatar nome da área: $area - $fornecedor ($quantidadeHa)
        // Sempre incluir nome do fornecedor, mesmo sem hectares
        const quantidadeHaValida = registro.quantidadeHa !== null && 
                                   registro.quantidadeHa !== undefined && 
                                   Number.isFinite(Number(registro.quantidadeHa)) && 
                                   Number(registro.quantidadeHa) > 0;
        
        const quantidadeHaFormatada = quantidadeHaValida
          ? formatNumber(registro.quantidadeHa, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : null;
        
        const nomeAreaCompleto = quantidadeHaFormatada
          ? `${registro.areaNome} - ${nomeFornecedor} (${quantidadeHaFormatada} ha)`
          : `${registro.areaNome} - ${nomeFornecedor}`;

        return {
          areaId: registro.areaId,
          areaNome: registro.areaNome,
          areaNomeCompleto: nomeAreaCompleto,
          quantidadeHa: registro.quantidadeHa,
          metricas,
          quantidadeTotal,
        };
      })
      .sort((a, b) => (b.quantidadeTotal || 0) - (a.quantidadeTotal || 0));
  }, [nomeFornecedor, formatNumber]);

  const getRowKey = useMemo(
    () => (item) =>
      `${item.pedidoId}-${item.frutaId}-${item.areaNome || "area"}`,
    []
  );

  const detalhesPorKey = useMemo(() => {
    const mapa = new Map();
    detalhesFiltrados.forEach((item) => {
      mapa.set(getRowKey(item), item);
    });
    return mapa;
  }, [detalhesFiltrados, getRowKey]);

  const isColheitaPaga = React.useCallback((item) => {
    if (!item) return false;

    const temPagamentoId =
      item.pagamentoId !== undefined &&
      item.pagamentoId !== null &&
      typeof item.pagamentoId === "number" &&
      item.pagamentoId > 0;
    const statusPago = item.statusPagamento === "PAGO";

    return temPagamentoId && statusPago;
  }, []);

  const gruposPorFruta = useMemo(() => {
    const mapa = new Map();

    detalhesFiltrados.forEach((item) => {
      const fruta = item.fruta || "Fruta não identificada";
      if (!mapa.has(fruta)) {
        mapa.set(fruta, {
          fruta,
          detalhes: [],
          totalValor: 0,
          totalPorUnidade: new Map(),
        });
      }

      const grupo = mapa.get(fruta);
      grupo.detalhes.push(item);
      grupo.totalValor += Number(item.valor || 0);
      const unidade = (item.unidade || "UN").toUpperCase();
      const quantidadeAtual = grupo.totalPorUnidade.get(unidade) || 0;
      grupo.totalPorUnidade.set(unidade, quantidadeAtual + (Number(item.quantidade) || 0));
    });

    return Array.from(mapa.values()).map((grupo) => ({
      ...grupo,
      totalPorUnidade: Array.from(grupo.totalPorUnidade.entries()).map(([unidade, total]) => ({
        unidade,
        total,
      })),
    }));
  }, [detalhesFiltrados]);

  const colunasPedidos = useMemo(
    () => [
      {
        title: "Pedido",
        dataIndex: "pedidoNumero",
        key: "pedidoNumero",
        width: 140,
        render: (numero) => (
          <Tag color="green" style={{ fontFamily: "monospace" }}>
            #{numero}
          </Tag>
        ),
      },
      {
        title: "Cliente",
        dataIndex: "cliente",
        key: "cliente",
        width: 200,
        ellipsis: true,
        render: (cliente) => {
          const clienteNome = cliente || "-";
          return (
            <Tooltip title={cliente ? capitalizeName(clienteNome) : undefined}>
              <Text>{capitalizeNameShort(clienteNome)}</Text>
            </Tooltip>
          );
        },
      },
      {
        title: "Área",
        dataIndex: "areaNome",
        key: "areaNome",
        width: 120,
        ellipsis: true,
        render: (area) => (
          <Tooltip title={capitalizeName(area || "")}>
            <Text strong style={{ color: "#065f46" }}>
              {capitalizeNameShort(area || "-")}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: "Data Colheita",
        dataIndex: "dataColheita",
        key: "dataColheita",
        width: 160,
        render: (data) =>
          data ? (
            <Space size={4}>
              <CalendarOutlined style={{ color: "#0f766e" }} />
              <Text>{moment(data).format("DD/MM/YYYY")}</Text>
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
      {
        title: "Quantidade",
        key: "quantidade",
        width: 130,
        render: (_, record) => (
          <Text strong>
            {intFormatter(record.quantidade)} {record.unidade || ""}
          </Text>
        ),
      },
      {
        title: "Valor Venda",
        dataIndex: "valorTotalFruta",
        key: "valorTotalFruta",
        width: 140,
        render: (valor) => (
          <Text style={{ color: "#1f2937", fontWeight: 500 }}>
            {valor > 0 ? `R$ ${formatCurrency(valor)}` : "-"}
          </Text>
        ),
      },
      {
        title: "Valor Compra",
        key: "valorCompra",
        width: 140,
        render: (_, record) => {
          // Mostrar valorTotal se existir (valor de compra/precificação)
          const valorCompra = record.valorTotal;
          return (
            <Text style={{ color: "#1f2937", fontWeight: 500 }}>
              {valorCompra && valorCompra > 0 ? `R$ ${formatCurrency(valorCompra)}` : "-"}
            </Text>
          );
        },
      },
      {
        title: "Status",
        key: "status",
        width: 120,
        render: (_, record) => {
          // Se status é PAGO, mostrar badge verde "Pago" (cor PEDIDO_FINALIZADO)
          if (record.statusPagamento === 'PAGO') {
            const corPago = PEDIDO_FINALIZADO || getStatusColor('PEDIDO_FINALIZADO') || "#52c41a";
            return (
              <Tag
                style={{
                  backgroundColor: corPago,
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontWeight: 600,
                  border: "none",
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                }}
              >
                Pago
              </Tag>
            );
          }
          
          // Se existe valorTotal (valor de compra/precificação), mostrar badge amarelo "Precificado" (cor AGUARDANDO_PAGAMENTO)
          if (record.valorTotal && record.valorTotal > 0) {
            const corPrecificado = AGUARDANDO_PAGAMENTO || getStatusColor('AGUARDANDO_PAGAMENTO') || "#faad14";
            return (
              <Tag
                style={{
                  backgroundColor: corPrecificado,
                  color: "#ffffff",
                  borderRadius: "4px",
                  fontWeight: 600,
                  border: "none",
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                }}
              >
                Precificado
              </Tag>
            );
          }
          
          // Se não tem valorTotal e não está pago, não mostrar badge
          return <Text type="secondary">-</Text>;
        },
      },
    ],
    [AGUARDANDO_PAGAMENTO, PEDIDO_FINALIZADO, getStatusColor]
  );

  useEffect(() => {
    const chavesValidas = new Set(detalhesFiltrados.map((item) => getRowKey(item)));
    setItensSelecionados((prev) => prev.filter((key) => chavesValidas.has(key)));
    setValoresFornecedor((prev) => {
      const atualizado = {};
      Object.entries(prev).forEach(([key, valor]) => {
        if (chavesValidas.has(key)) {
          atualizado[key] = valor;
        }
      });
      return atualizado;
    });
  }, [detalhesFiltrados, getRowKey]);

  // Validação: verificar se pode precificar/pagar
  const podePrecificarOuPagar = useMemo(() => {
    if (itensSelecionados.length === 0) {
      return false;
    }

    // Verificar se todos os itens selecionados têm valor unitário válido (> 0)
    const todosValoresValidos = itensSelecionados.every((key) => {
      const item = detalhesPorKey.get(key);
      if (!item) return false;

      const valorUnitarioRaw = valoresFornecedor[key] ?? "";
      // ✅ Converter valor unitário corretamente
      let valorUnitarioNumero = null;
      if (valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "") {
        if (typeof valorUnitarioRaw === 'number') {
          valorUnitarioNumero = valorUnitarioRaw;
        } else {
          // O NumericFormat retorna string no formato "1.111" (ponto decimal)
          valorUnitarioNumero = parseFloat(String(valorUnitarioRaw));
          if (isNaN(valorUnitarioNumero)) {
            valorUnitarioNumero = null;
          }
        }
      }
      
      return valorUnitarioNumero !== null && valorUnitarioNumero > 0;
    });

    return todosValoresValidos;
  }, [itensSelecionados, valoresFornecedor, detalhesPorKey]);

  // Calcular total a pagar/precificar
  const totalAPagar = useMemo(() => {
    if (itensSelecionados.length === 0) return 0;

    return itensSelecionados.reduce((acc, key) => {
      const item = detalhesPorKey.get(key);
      if (!item) return acc;

      const valorUnitarioRaw = valoresFornecedor[key] ?? "";
      // ✅ Converter valor unitário corretamente
      let valorUnitarioNumero = null;
      if (valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "") {
        if (typeof valorUnitarioRaw === 'number') {
          valorUnitarioNumero = valorUnitarioRaw;
        } else {
          // O NumericFormat retorna string no formato "1.111" (ponto decimal)
          valorUnitarioNumero = parseFloat(String(valorUnitarioRaw));
          if (isNaN(valorUnitarioNumero)) {
            valorUnitarioNumero = null;
          }
        }
      }
      
      const quantidadeNumero = typeof item.quantidade === "number"
        ? item.quantidade
        : parseLocaleNumber(String(item.quantidade ?? "")) ?? 0;

      if (valorUnitarioNumero !== null && valorUnitarioNumero > 0 && quantidadeNumero > 0) {
        // ✅ Calcular com precisão correta (2 casas decimais)
        return acc + Number((valorUnitarioNumero * quantidadeNumero).toFixed(2));
      }

      return acc;
    }, 0);
  }, [itensSelecionados, valoresFornecedor, detalhesPorKey]);

  // Função para abrir modal de confirmação
  const abrirModalConfirmacao = (status) => {
    if (!fornecedor || !fornecedor.id) {
      showNotification("error", "Erro", "Fornecedor não informado");
      return;
    }

    if (itensSelecionados.length === 0) {
      showNotification("warning", "Atenção", "Selecione pelo menos uma colheita");
      return;
    }

    if (!podePrecificarOuPagar) {
      showNotification("warning", "Atenção", "Preencha os valores unitários para todas as colheitas selecionadas");
      return;
    }

    setStatusPagamentoConfirmacao(status);
    setModalConfirmacaoAberto(true);
  };

  // Função para criar pagamentos (após confirmação)
  const criarPagamentos = async () => {
    if (!dataPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a data do pagamento.');
      return;
    }

    if (!formaPagamentoSelecionada) {
      showNotification('error', 'Validação', 'Selecione a forma de pagamento.');
      return;
    }

    if (!fornecedor || !fornecedor.id) {
      showNotification("error", "Erro", "Fornecedor não informado");
      return;
    }

    if (itensSelecionados.length === 0) {
      showNotification("warning", "Atenção", "Selecione pelo menos uma colheita");
      return;
    }

    const status = statusPagamentoConfirmacao;

    // Preparar pagamentos
    const pagamentos = itensSelecionados.map((key) => {
      const item = detalhesPorKey.get(key);
      if (!item) return null;

      // Verificar se já existe pagamento para esta colheita
      if (item.pagamentoId !== undefined && item.pagamentoId !== null && typeof item.pagamentoId === 'number' && item.pagamentoId > 0) {
        console.warn(`Colheita ${key} já tem pagamento (ID: ${item.pagamentoId})`);
        return null;
      }

      const valorUnitarioRaw = valoresFornecedor[key] ?? "";
      // ✅ Converter valor unitário corretamente
      let valorUnitarioNumero = null;
      if (valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "") {
        if (typeof valorUnitarioRaw === 'number') {
          valorUnitarioNumero = valorUnitarioRaw;
        } else {
          // O NumericFormat retorna string no formato "1.111" (ponto decimal)
          valorUnitarioNumero = parseFloat(String(valorUnitarioRaw));
          if (isNaN(valorUnitarioNumero)) {
            valorUnitarioNumero = null;
          }
        }
      }

      if (!valorUnitarioNumero || valorUnitarioNumero <= 0) {
        return null;
      }

      const quantidadeNumero = typeof item.quantidade === "number"
        ? item.quantidade
        : parseLocaleNumber(String(item.quantidade ?? "")) ?? 0;

      // ✅ Calcular valor total com precisão correta (2 casas decimais)
      const valorTotal = Number((valorUnitarioNumero * quantidadeNumero).toFixed(2));

      if (valorTotal <= 0) {
        return null;
      }

      // Converter unidade para o formato do backend (UnidadeMedida enum)
      // Valores válidos: KG, CX, TON, UND, ML
      const unidadeMap = {
        "KG": "KG",
        "CX": "CX",
        "TON": "TON",
        "TONELADA": "TON",
        "UND": "UND",
        "UN": "UND",
        "UNIDADE": "UND",
        "UNIDADES": "UND",
        "ML": "ML",
        "MILILITRO": "ML",
        "MILILITROS": "ML",
      };
      const unidadeUpper = item.unidade?.toUpperCase() || "UND";
      const unidadeMedida = unidadeMap[unidadeUpper] || "UND";

      return {
        fornecedorId: fornecedor.id,
        areaFornecedorId: item.areaFornecedorId,
        pedidoId: item.pedidoId,
        frutaId: item.frutaId,
        frutaPedidoId: item.frutaPedidoId,
        frutaPedidoAreaId: item.frutaPedidoAreaId,
        quantidade: quantidadeNumero,
        unidadeMedida: unidadeMedida,
        valorUnitario: valorUnitarioNumero,
        valorTotal: valorTotal,
        dataColheita: item.dataColheita ? moment(item.dataColheita).toISOString() : undefined,
        dataPagamento: dataPagamentoSelecionada
          ? (moment.isMoment(dataPagamentoSelecionada) 
              ? dataPagamentoSelecionada.clone().startOf('day').add(12, 'hours').toISOString()
              : moment(dataPagamentoSelecionada).startOf('day').add(12, 'hours').toISOString())
          : moment().startOf('day').add(12, 'hours').toISOString(),
        formaPagamento: formaPagamentoSelecionada || undefined,
        status: status,
      };
    }).filter(Boolean);

    if (pagamentos.length === 0) {
      showNotification("error", "Erro", "Nenhum pagamento válido para criar");
      return;
    }

    if (pagamentos.length !== itensSelecionados.length) {
      showNotification("warning", "Atenção", "Alguns itens não foram incluídos por terem valores inválidos");
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        `/api/fornecedores/${fornecedor.id}/pagamentos/criar-multiplos`,
        { pagamentos }
      );

      showNotification(
        "success",
        "Sucesso",
        `${pagamentos.length} pagamento(s) ${status === "PENDENTE" ? "precificado(s)" : "criado(s)"} com sucesso`
      );

      // Fechar modal de confirmação
      setModalConfirmacaoAberto(false);
      setStatusPagamentoConfirmacao(null);
      setDataPagamentoSelecionada(null);
      setFormaPagamentoSelecionada(null);

      // Limpar seleção e valores
      setItensSelecionados([]);
      setValoresFornecedor({});

      // Chamar callback para recarregar dados
      onPagamentosCriados();

      // Fechar modal após sucesso
      onClose();
    } catch (error) {
      console.error("Erro ao criar pagamentos:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erro ao criar pagamentos";
      showNotification("error", "Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para botões
  const handlePrecificar = () => {
    abrirModalConfirmacao("PENDENTE");
  };

  const handlePagar = () => {
    abrirModalConfirmacao("PAGO");
  };

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: itensSelecionados,
      onChange: (selectedKeys) => {
        setItensSelecionados(selectedKeys);
        setValoresFornecedor((prev) => {
          const atualizado = {};
          
          // Primeiro, limpar valores de itens que foram desselecionados
          Object.keys(prev).forEach((key) => {
            if (!selectedKeys.includes(key)) {
              // Item foi desselecionado, não incluir no novo estado
            }
          });
          
          selectedKeys.forEach((key) => {
            const item = detalhesPorKey.get(key);
            
            // Se já tem valor no estado (usuário pode ter editado), manter
            if (prev[key] !== undefined && prev[key] !== null && prev[key] !== "") {
              atualizado[key] = prev[key];
            } else if (item) {
              // Verificar se o item já tem um pagamento precificado (PENDENTE/PROCESSANDO)
              const temPagamentoId = item.pagamentoId !== undefined && 
                                     item.pagamentoId !== null && 
                                     typeof item.pagamentoId === 'number' && 
                                     item.pagamentoId > 0;
              const statusPendente = item.statusPagamento === 'PENDENTE' || 
                                     item.statusPagamento === 'PROCESSANDO';
              
              // Se tem pagamento precificado, usar o valorUnitario do pagamento
              if (temPagamentoId && statusPendente && item.valorUnitario !== undefined && item.valorUnitario !== null) {
                // Passar o valor como string numérica (ex: "1.0")
                // O MonetaryInput (NumericFormat) aceita número ou string numérica e formata automaticamente
                // O onChange retorna string numérica, então vamos manter consistência usando string
                atualizado[key] = String(item.valorUnitario);
              } else {
                // Se não tem pagamento precificado, deixar vazio (undefined)
                atualizado[key] = undefined;
              }
            } else {
              // Se não encontrou o item, deixar vazio
              atualizado[key] = undefined;
            }
          });
          
          return atualizado;
        });
      },
      // ✅ IMPEDIR seleção de colheitas pagas
      getCheckboxProps: (record) => {
        const key = getRowKey(record);
        const item = detalhesPorKey.get(key);
        const pago = isColheitaPaga(item);
        return {
          disabled: pago,
          name: `checkbox-${key}`,
        };
      },
      renderCell: (_, record, __, originNode) => {
        const key = getRowKey(record);
        const item = detalhesPorKey.get(key);
        if (isColheitaPaga(item)) {
          return (
            <Tooltip title="Colheita já paga">
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "18px" }} />
            </Tooltip>
          );
        }
        return originNode;
      },
    }),
    [detalhesPorKey, getRowKey, isColheitaPaga, itensSelecionados]
  );

  return (
    <Modal
      title={
          <span
            style={{
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "16px",
              backgroundColor: "#059669",
              padding: "12px 16px",
              margin: "-20px -24px 0 -24px",
              display: "block",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Icon icon="mdi:truck-delivery" style={{ marginRight: 8 }} />
            Detalhes do Fornecedor - {capitalizeName(nomeFornecedor)}
          </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: isMobile ? "8px" : "12px",
            flexWrap: isMobile ? "wrap" : "nowrap",
            marginTop: isMobile ? "12px" : "16px",
            paddingTop: isMobile ? "12px" : "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={onClose}
            size={isMobile ? "small" : "middle"}
            style={{
              height: isMobile ? "32px" : "40px",
              padding: isMobile ? "0 12px" : "0 16px",
              borderRadius: "6px",
              borderColor: "#d9d9d9",
            }}
          >
            Fechar
          </Button>
        </div>
      }
      width={isMobile ? "96vw" : 1480}
      centered
      destroyOnClose
      styles={{
        body: {
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1100 },
      }}
    >
      {!fornecedor ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Empty description="Selecione um fornecedor para visualizar os detalhes" />
        </div>
      ) : detalhes.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Empty description="Nenhuma colheita registrada para este fornecedor" />
        </div>
      ) : (
        <div>
          <SummaryCard
            title={
              <Space>
                <UserOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: 600 }}>Resumo Consolidado</span>
              </Space>
            }
            styles={{
              header: {
                backgroundColor: "#059669",
                borderBottom: "2px solid #047857",
                borderRadius: "10px 10px 0 0",
                padding: isMobile ? "6px 12px" : "10px 16px",
              },
              body: {
                padding: isMobile ? "12px" : "20px",
              },
            }}
          >
            {/* Primeira linha: Total de pedidos / Total de frutas / Total de colheitas / Total de áreas */}
            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total de Pedidos"
                  value={resumo.quantidadePedidos || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#047857", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total de Frutas"
                  value={resumo.quantidadeFrutas || 0}
                  prefix={<AppleOutlined />}
                  valueStyle={{ color: "#f97316", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total de Colheitas"
                  value={resumo.totalColheitas || 0}
                  prefix={<HeatMapOutlined />}
                  valueStyle={{ color: "#0ea5e9", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total de Áreas"
                  value={resumo.quantidadeAreas || 0}
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: "#8b5cf6", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
            </Row>

            <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

            {/* Segunda linha: Colheitas pagas / Colheitas em aberto / Total Pendente / Total Pago */}
            <Row gutter={isMobile ? [12, 12] : [24, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Colheitas Pagas"
                  value={resumo.colheitasPagas || 0}
                  prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                  valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Colheitas em Aberto"
                  value={resumo.colheitasEmAberto || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#faad14", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Pendente"
                  value={formatCurrency(resumo.totalPendente || 0)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#faad14", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Pago"
                  value={formatCurrency(resumo.totalPago || 0)}
                  prefix={<DollarCircleOutlined />}
                  valueStyle={{ color: "#52c41a", fontSize: isMobile ? "1.25rem" : "1.5rem" }}
                />
              </Col>
            </Row>

            <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

            {/* Terceira linha: Distribuição por Unidade (layout compacto) */}
            {distribuicaoPorUnidade.length > 0 && (
              <div style={{ marginTop: isMobile ? 8 : 12 }}>
                <Text strong style={{ color: "#047857", fontSize: "0.875rem", marginBottom: 8, display: "block" }}>
                  <HeatMapOutlined style={{ marginRight: 6 }} />
                  Distribuição por Unidade
                </Text>
                <Space wrap size={[8, 8]} style={{ width: "100%" }}>
                  {distribuicaoPorUnidade.map((dist) => (
                    <div
                      key={dist.unidade}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <Text strong style={{ color: "#047857", fontSize: "0.8rem" }}>
                        {dist.unidade}:
                      </Text>
                      <Tag color="success" style={{ margin: 0, fontSize: "0.75rem", padding: "2px 8px" }}>
                        Pago: {intFormatter(dist.quantidadePaga)}
                      </Tag>
                      <Tag color="warning" style={{ margin: 0, fontSize: "0.75rem", padding: "2px 8px" }}>
                        Pendente: {intFormatter(dist.quantidadePendente)}
                      </Tag>
                      <Tag color="default" style={{ margin: 0, fontSize: "0.75rem", padding: "2px 8px" }}>
                        Total: {intFormatter(dist.quantidadeTotal)}
                      </Tag>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </SummaryCard>

          <FiltersCard
            title={
              <Space>
                <FilterOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: 600 }}>Busca e Filtros</span>
              </Space>
            }
            style={{ marginTop: isMobile ? 12 : 16 }}
            styles={{
              header: {
                backgroundColor: "#047857",
                borderBottom: "2px solid #065f46",
                borderRadius: "10px 10px 0 0",
                padding: isMobile ? "6px 12px" : "10px 16px",
              },
              body: { padding: isMobile ? "12px" : "18px" },
            }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Input
                  value={filtroBusca}
                  onChange={(event) => setFiltroBusca(event.target.value)}
                  placeholder="Buscar por pedido, cliente ou área"
                  allowClear
                  size={isMobile ? "middle" : "large"}
                  prefix={<Icon icon="mdi:magnify" style={{ color: "#047857" }} />}
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <Select
                  value={filtroStatus === 'PENDENTE' ? undefined : filtroStatus}
                  onChange={(value) => {
                    // Se limpar (value === undefined), voltar para padrão (PENDENTE)
                    setFiltroStatus(value || 'PENDENTE');
                  }}
                  placeholder="Status da Colheita"
                  allowClear
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                >
                  {statusColheitaOpcoes.map((opcao) => (
                    <Option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  value={filtroFruta}
                  onChange={setFiltroFruta}
                  allowClear
                  placeholder="Filtrar por fruta"
                  style={{ width: "100%" }}
                  size={isMobile ? "middle" : "large"}
                >
                  {frutasDisponiveis.map((fruta) => (
                    <Option key={fruta} value={fruta}>
                      {capitalizeName(fruta)}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={5}>
                <RangePicker
                  value={filtroData}
                  onChange={setFiltroData}
                  allowClear
                  format="DD/MM/YYYY"
                  size={isMobile ? "middle" : "large"}
                  style={{ width: "100%" }}
                  placeholder={["Data início", "Data fim"]}
                  disabledDate={(current) => current && current > moment().endOf("day")}
                />
              </Col>
            </Row>
          </FiltersCard>

          <div style={{ marginTop: isMobile ? 12 : 20 }}>
            {gruposPorFruta.length === 0 ? (
              <Empty
                description={
                  filtroBusca || filtroStatus || filtroFruta || filtroData
                    ? "Nenhum registro encontrado com os filtros aplicados."
                    : "Nenhum registro de colheita para este fornecedor."
                }
                style={{ padding: "40px 0" }}
              />
            ) : (
              gruposPorFruta.map((grupo) => {
                const resumoAreas = gerarResumoAreas(grupo.detalhes);

                return (
                <FruitSectionCard
                  key={grupo.fruta}
                  $isMobile={isMobile}
                  title={
                    <Space>
                      <Icon icon="healthicons:fruits" style={{ fontSize: '20px', color: "#ffffff" }} />
                      <span style={{ color: "#ffffff", fontWeight: 600 }}>
                        {capitalizeName(grupo.fruta)}
                      </span>
                    </Space>
                  }
                  styles={{
                    header: {
                      backgroundColor: "#059669",
                      borderBottom: "2px solid #047857",
                      borderRadius: "10px 10px 0 0",
                      padding: isMobile ? "6px 12px" : "10px 16px",
                    },
                    body: { padding: isMobile ? "12px" : "18px" },
                  }}
                >
                  <ResponsiveTable
                    columns={colunasPedidos}
                    dataSource={grupo.detalhes.map((detalhe) => ({
                      ...detalhe,
                      __rowKey: getRowKey(detalhe),
                    }))}
                    rowKey="__rowKey"
                    pagination={{
                      pageSize: isMobile ? 5 : 8,
                      hideOnSinglePage: true,
                    }}
                    minWidthMobile={isMobile ? 900 : 1100}
                    showScrollHint
                    rowSelection={rowSelection}
                  />
                      {resumoAreas.length > 0 && (
                        <div
                          style={{
                            marginTop: isMobile ? 12 : 16,
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                            padding: isMobile ? 10 : 16,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: isMobile ? 8 : 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <TagOutlined style={{ color: "#047857" }} />
                            <Text strong style={{ color: "#047857", fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
                              Resumo por Área
                            </Text>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: isMobile ? 8 : 12,
                            }}
                          >
                            {resumoAreas.map((area) => (
                                <div
                                  key={`${grupo.fruta}-${area.areaId || area.areaNome}`}
                                  style={{
                                    backgroundColor: "#ecfdf5",
                                    border: "1px solid #a7f3d0",
                                    borderRadius: 8,
                                    padding: isMobile ? 10 : 12,
                                  }}
                                >
                                  <Text strong style={{ color: "#065f46", fontSize: "0.9rem" }}>
                                    {area.areaNomeCompleto || area.areaNome || "Área"}
                                  </Text>
                                  {area.metricas.map((metrica, indice) => {
                                    const mediaFormatada = metrica.media && Number.isFinite(metrica.media)
                                      ? formatNumber(metrica.media, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                      : "-";

                                    return (
                                      <div
                                        key={`${area.areaId || area.areaNome}-${metrica.unidade}-${indice}`}
                                        style={{
                                          marginTop: 8,
                                          paddingTop: 8,
                                          borderTop: indice > 0 ? "1px dashed #bbf7d0" : "none",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 4,
                                          fontSize: "0.8rem",
                                          color: "#065f46",
                                        }}
                                      >
                                        <span>
                                          Quantidade ({metrica.unidade}):{" "}
                                          <strong>
                                            {formatNumber(metrica.quantidade, {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 2,
                                            })}{" "}
                                            {metrica.unidade}
                                          </strong>
                                        </span>
                                        <span>
                                          Média:{" "}
                                          <strong>
                                            {mediaFormatada !== "-" 
                                              ? `${mediaFormatada} ${metrica.unidade}/ha`
                                              : "-"}
                                          </strong>
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                </FruitSectionCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {itensSelecionados.length > 0 && (
        <Card
          title={
            <Space>
              <Icon icon="mdi:truck-check" style={{ color: "#ffffff", fontSize: 20 }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Dados da Compra</span>
            </Space>
          }
          style={{
            marginTop: isMobile ? 12 : 20,
            border: "0.0625rem solid #e8e8e8",
            borderRadius: "0.5rem",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "0.125rem solid #047857",
              color: "#ffffff",
              borderRadius: "0.5rem 0.5rem 0 0",
              padding: isMobile ? "6px 12px" : "8px 16px",
            },
            body: {
              padding: isMobile ? "12px" : "16px",
              backgroundColor: "#f9f9f9",
            },
          }}
        >
          {/* Área de scroll com altura máxima para 5 linhas */}
          <div style={{
            maxHeight: isMobile ? 'auto' : '480px', // ~96px por linha × 5 linhas
            overflowY: itensSelecionados.length > 5 ? 'auto' : 'visible',
            marginBottom: isMobile ? '12px' : '16px',
            paddingRight: itensSelecionados.length > 5 ? '8px' : '0'
          }}>
            {/* Cabeçalho das colunas */}
            {!isMobile && (
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 16, padding: isMobile ? "6px 0" : "8px 0", borderBottom: "0.125rem solid #e8e8e8" }}>
                <Col xs={24} md={6}>
                  <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                    <AppleOutlined style={{ marginRight: "0.5rem" }} />
                    Fruta
                  </span>
                </Col>
                <Col xs={24} md={4}>
                  <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                    <EnvironmentOutlined style={{ marginRight: "0.5rem" }} />
                    Área
                  </span>
                </Col>
                <Col xs={24} md={4}>
                  <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                    <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                    Quantidade
                  </span>
                </Col>
                <Col xs={24} md={5}>
                  <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                    <DollarOutlined style={{ marginRight: "0.25rem" }} />
                    Valor Unitário
                  </span>
                </Col>
                <Col xs={24} md={5}>
                  <span style={{ color: "#059669", fontSize: "0.875rem", fontWeight: "700" }}>
                    <CalculatorOutlined style={{ marginRight: "0.5rem" }} />
                    Valor Total
                  </span>
                </Col>
              </Row>
            )}

            {itensSelecionados.map((key, index) => {
              const item = detalhesPorKey.get(key);
              if (!item) return null;

              const quantidadeNumero =
                typeof item.quantidade === "number"
                  ? item.quantidade
                  : parseLocaleNumber(String(item.quantidade ?? "")) ?? 0;
              const quantidadeTexto = `${intFormatter(quantidadeNumero || 0)} ${item.unidade || ""}`.trim();

              // Obter valor unitário do estado (já inicializado no rowSelection.onChange se tiver pagamento precificado)
              const valorUnitarioRaw = valoresFornecedor[key];
              
              // Converter para número (pode ser string numérica ou número)
              // ✅ O MonetaryInput (NumericFormat) retorna values.value já como string numérica
              // no formato americano (ponto como separador decimal)
              // Exemplo: "1.111" = 1.111 (um vírgula um um um)
              // Precisamos garantir que a conversão seja feita corretamente
              let valorUnitarioNumero = null;
              
              if (valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "") {
                if (typeof valorUnitarioRaw === 'number') {
                  valorUnitarioNumero = valorUnitarioRaw;
                } else {
                  // ✅ O NumericFormat retorna string no formato "1.111" (ponto decimal)
                  // Converter diretamente para número
                  valorUnitarioNumero = parseFloat(String(valorUnitarioRaw));
                  if (isNaN(valorUnitarioNumero)) {
                    valorUnitarioNumero = null;
                  }
                }
              }
              
              // ✅ Calcular valor total com precisão correta
              // Usar Number() para garantir precisão numérica
              const valorTotal = valorUnitarioNumero !== null && quantidadeNumero && valorUnitarioNumero > 0
                ? Number((valorUnitarioNumero * quantidadeNumero).toFixed(2))
                : 0;

              return (
                <div key={key} style={{ 
                  paddingBottom: index < itensSelecionados.length - 1 ? (isMobile ? 12 : 16) : 0,
                  marginBottom: index < itensSelecionados.length - 1 ? (isMobile ? 12 : 16) : 0,
                  borderBottom: index < itensSelecionados.length - 1 ? "1px solid #f0f0f0" : "none"
                }}>
                  <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="middle" style={{ marginBottom: 0 }}>
                    {/* Fruta */}
                    <Col xs={24} md={6}>
                      {isMobile ? (
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                          <Text strong style={{ color: "#059669", fontSize: "0.95rem" }}>
                            {capitalizeName(item.fruta)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Pedido #{item.pedidoNumero}
                          </Text>
                        </Space>
                      ) : (
                        <Space direction="vertical" size={2} style={{ width: "100%" }}>
                          <Text strong style={{ color: "#333", fontSize: "0.875rem" }}>
                            {capitalizeName(item.fruta)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Pedido #{item.pedidoNumero}
                          </Text>
                        </Space>
                      )}
                    </Col>

                    {/* Área */}
                    <Col xs={24} md={4}>
                      {isMobile ? (
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Área
                          </Text>
                          <Tag color="#0f766e" style={{ borderRadius: 999, fontWeight: 600 }}>
                            {capitalizeNameShort(item.areaNome || "-")}
                          </Tag>
                        </Space>
                      ) : (
                        <Tag color="#0f766e" style={{ borderRadius: 999, fontWeight: 600, fontSize: "0.875rem" }}>
                          {capitalizeNameShort(item.areaNome || "-")}
                        </Tag>
                      )}
                    </Col>

                    {/* Quantidade */}
                    <Col xs={12} md={4}>
                      {isMobile ? (
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Quantidade
                          </Text>
                          <Tag color="#10b981" style={{ borderRadius: 999, fontWeight: 600 }}>
                            {quantidadeTexto || "-"}
                          </Tag>
                        </Space>
                      ) : (
                        <Tag color="#10b981" style={{ borderRadius: 999, fontWeight: 600, fontSize: "0.875rem" }}>
                          {quantidadeTexto || "-"}
                        </Tag>
                      )}
                    </Col>

                    {/* Valor Unitário */}
                    <Col xs={24} md={5}>
                      {isMobile ? (
                        <Space direction="vertical" size={2} style={{ width: "100%" }}>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Valor unitário (R$)
                          </Text>
                          <MonetaryInput
                            decimalScale={4}
                            placeholder="0,0000"
                            addonBefore="R$"
                            size={isMobile ? "small" : "large"}
                            value={valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "" 
                              ? valorUnitarioRaw 
                              : undefined}
                            onChange={(value) =>
                              setValoresFornecedor((prev) => ({
                                ...prev,
                                [key]: value,
                              }))
                            }
                            style={{
                              fontSize: isMobile ? "0.875rem" : "1rem",
                              width: "100%",
                              maxWidth: isMobile ? "100%" : "160px",
                            }}
                          />
                        </Space>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <MonetaryInput
                            decimalScale={4}
                            placeholder="0,0000"
                            addonBefore="R$"
                            size={isMobile ? "small" : "large"}
                            value={valorUnitarioRaw !== undefined && valorUnitarioRaw !== null && valorUnitarioRaw !== "" 
                              ? valorUnitarioRaw 
                              : undefined}
                            onChange={(value) =>
                              setValoresFornecedor((prev) => ({
                                ...prev,
                                [key]: value,
                              }))
                            }
                            style={{
                              fontSize: isMobile ? "0.875rem" : "1rem",
                              width: "160px",
                              maxWidth: "160px",
                            }}
                          />
                        </div>
                      )}
                    </Col>

                    {/* Valor Total */}
                    <Col xs={12} md={5}>
                      {isMobile ? (
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: "0.75rem" }}>
                            Valor total (R$)
                          </Text>
                          <Tag color="#047857" style={{ borderRadius: 999, fontWeight: 600 }}>
                            R$ {formatCurrency(valorTotal || 0)}
                          </Tag>
                        </Space>
                      ) : (
                        <Tag color="#047857" style={{ borderRadius: 999, fontWeight: 600, fontSize: "0.875rem" }}>
                          R$ {formatCurrency(valorTotal || 0)}
                        </Tag>
                      )}
                    </Col>
                  </Row>
                </div>
              );
            })}
          </div>

          {/* Área de Ações - Sempre visível quando há itens selecionados */}
          <Divider style={{ margin: isMobile ? "16px 0" : "20px 0" }} />
          <div style={{
            backgroundColor: '#f6ffed',
            padding: isMobile ? '12px' : '16px',
            borderRadius: '8px'
          }}>
            <div style={{ marginBottom: isMobile ? 12 : 16 }}>
              <Space
                direction={isMobile ? "vertical" : "horizontal"}
                size={isMobile ? 4 : 12}
                style={{ width: "100%", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}
              >
                <Text strong style={{ color: "#065f46", fontSize: isMobile ? "0.95rem" : "1.05rem" }}>
                  Total selecionado
                </Text>
                <Tag color="#047857" style={{ fontSize: isMobile ? "0.95rem" : "1.1rem", padding: "6px 14px", borderRadius: 999 }}>
                  R$ {formatCurrency(totalAPagar || 0)}
                </Tag>
              </Space>
            </div>
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]} align="middle">
              <Col xs={24} sm={24} md={8}>
                <Button
                  type="primary"
                  size={isMobile ? "middle" : "large"}
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setItensSelecionados([]);
                    setValoresFornecedor({});
                  }}
                  disabled={itensSelecionados.length === 0}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    cursor: itensSelecionados.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Limpar Seleção
                </Button>
              </Col>
              <Col xs={12} sm={12} md={8}>
                <Button
                  type="primary"
                  size={isMobile ? "middle" : "large"}
                  onClick={handlePrecificar}
                  loading={loading}
                  disabled={!podePrecificarOuPagar}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    cursor: !podePrecificarOuPagar ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Precificar
                </Button>
              </Col>
              <Col xs={12} sm={12} md={8}>
                <Button
                  type="primary"
                  size={isMobile ? "middle" : "large"}
                  onClick={handlePagar}
                  loading={loading}
                  disabled={!podePrecificarOuPagar}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    cursor: !podePrecificarOuPagar ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Pagar ✓
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}

      {/* Modal de Confirmação */}
      <ConfirmActionModal
        open={modalConfirmacaoAberto}
        onCancel={() => {
          setModalConfirmacaoAberto(false);
          setStatusPagamentoConfirmacao(null);
          setDataPagamentoSelecionada(null);
          setFormaPagamentoSelecionada(null);
        }}
        onConfirm={criarPagamentos}
        title={statusPagamentoConfirmacao === "PENDENTE" ? "Confirmar Precificação" : "Confirmar Pagamento"}
        confirmText={statusPagamentoConfirmacao === "PENDENTE" ? "Confirmar Precificação" : "Confirmar Pagamento"}
        cancelText="Cancelar"
        icon={<DollarOutlined />}
        iconColor="#059669"
        confirmDisabled={!dataPagamentoSelecionada || !formaPagamentoSelecionada}
        customContent={
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ 
              fontSize: "48px", 
              color: "#059669", 
              marginBottom: "16px",
              display: "block"
            }}>
              <DollarOutlined />
            </div>
            <Text style={{ 
              fontSize: "16px", 
              fontWeight: "500", 
              color: "#333",
              lineHeight: "1.5",
              marginBottom: "20px",
              display: "block"
            }}>
              Você está prestes a {statusPagamentoConfirmacao === "PENDENTE" ? "precificar" : "pagar"} as colheitas selecionadas.
            </Text>
            
            {/* Detalhes da operação */}
            <div style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
              textAlign: "left"
            }}>
              <Text style={{ fontSize: "14px", fontWeight: "600", color: "#059669", display: "block", marginBottom: "8px" }}>
                📋 Detalhes da Operação:
              </Text>
              <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>👤 Fornecedor:</strong> {fornecedor?.nomeFornecedor || "Fornecedor"}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>📦 Total de itens:</strong> {itensSelecionados.length}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>💰 Valor total:</strong> R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ marginBottom: "0" }}>
                  <strong>ℹ️ Status:</strong> {statusPagamentoConfirmacao === "PENDENTE" ? "Precificação (PENDENTE)" : "Pagamento (PAGO)"}
                </div>
              </div>
            </div>
            {/* Campos adicionais */}
            <div style={{ marginTop: "16px" }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Data do Pagamento</Text>
                    </Space>
                  </div>
                  <MaskedDatePicker
                    value={dataPagamentoSelecionada}
                    onChange={setDataPagamentoSelecionada}
                    size="middle"
                    style={{ borderRadius: 6, width: "100%" }}
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    placeholder="Selecione a data"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ textAlign: "left", marginBottom: "6px" }}>
                    <Space>
                      <CreditCardOutlined style={{ color: "#059669" }} />
                      <Text strong style={{ color: "#059669" }}>Método</Text>
                    </Space>
                  </div>
                  <Select
                    value={formaPagamentoSelecionada}
                    onChange={setFormaPagamentoSelecionada}
                    placeholder="Selecione a forma"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    {[
                      { value: 'PIX', label: 'PIX', icon: <PixIcon width={16} height={16} /> },
                      { value: 'BOLETO', label: 'Boleto Bancário', icon: <BoletoIcon width={16} height={16} /> },
                      { value: 'TRANSFERENCIA', label: 'Transferência Bancária', icon: <TransferenciaIcon width={16} height={16} /> },
                      { value: 'DINHEIRO', label: 'Dinheiro', icon: '💰' },
                      { value: 'CHEQUE', label: 'Cheque', icon: '📄' },
                    ].map((metodo) => (
                      <Option key={metodo.value} value={metodo.value}>
                        <Space>
                          {typeof metodo.icon === 'string' ? (
                            <span>{metodo.icon}</span>
                          ) : (
                            metodo.icon
                          )}
                          <span>{metodo.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>
            {(!dataPagamentoSelecionada || !formaPagamentoSelecionada) && (
              <div style={{ marginTop: "16px" }}>
                <Text type="danger" style={{ fontSize: "12px" }}>
                  Preencha a data e a forma de pagamento para continuar.
                </Text>
              </div>
            )}
          </div>
        }
      />
    </Modal>
  );
};

FornecedorColheitaPagamentosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  fornecedor: PropTypes.shape({
    id: PropTypes.number,
    nomeFornecedor: PropTypes.string,
    quantidadePedidos: PropTypes.number,
    quantidadeFrutas: PropTypes.number,
    quantidadeAreas: PropTypes.number,
    totalValor: PropTypes.number,
    totalQuantidade: PropTypes.number,
    detalhes: PropTypes.arrayOf(
      PropTypes.shape({
        pedidoId: PropTypes.number,
        pedidoNumero: PropTypes.string,
        cliente: PropTypes.string,
        frutaId: PropTypes.number,
        fruta: PropTypes.string,
        quantidade: PropTypes.number,
        unidade: PropTypes.string,
        valor: PropTypes.number,
        valorTotalFruta: PropTypes.number,
        areaNome: PropTypes.string,
        statusPedido: PropTypes.string,
        dataColheita: PropTypes.string,
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
};

export default FornecedorColheitaPagamentosModal;

