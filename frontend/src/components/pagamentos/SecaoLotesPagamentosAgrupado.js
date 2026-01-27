// src/components/pagamentos/SecaoLotesPagamentosAgrupado.js
// Componente para exibir lotes de pagamentos agrupados por dia (específico para turma de colheita)

import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axiosInstance from "../../api/axiosConfig";
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Statistic,
  Row,
  Col,
  Pagination,
  Tooltip,
  Collapse,
  Divider,
  Spin,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import ResponsiveTable from "../common/ResponsiveTable";
import { formatCurrency, formatarChavePixPorTipo, capitalizeName } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import moment from "moment";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const ITEM_ESTADOS_PAGOS = new Set(["PAGO", "PAGO ", "PROCESSADO", "DEBITADO", "DEBITADO ", "DEBITADO".toLowerCase()]);

const isItemPago = (estado) => {
  const normalizado = (estado || "").toString().trim().toUpperCase();
  return normalizado === "PAGO" || normalizado === "PROCESSADO" || normalizado === "DEBITADO";
};

const SecaoLotesPagamentosAgrupado = ({
  titulo,
  icone,
  lotes,
  loading,
  estatisticas,
  paginacao,
  onPageChange,
  activeKey,
  onToggleActive,
  columns,
  rowKey = "loteId",
  onConsultarItemIndividual,
  // Novos props para buscar totais por dia
  dataInicio,
  dataFim,
  tipoData,
  contaCorrenteId,
  usarEstatisticasBackendPorDia = true,
}) => {
  const { isMobile } = useResponsive();
  const isExpanded = activeKey;
  const [expandedDays, setExpandedDays] = useState([]);
  const [estatisticasPorDia, setEstatisticasPorDia] = useState([]);
  const [loadingEstatisticasPorDia, setLoadingEstatisticasPorDia] = useState(false);
  // Estado para controlar paginação de lotes por dia
  const [paginacaoLotesPorDia, setPaginacaoLotesPorDia] = useState({});

  // Verificar se os dados já vêm agrupados por dia do backend
  const dadosJaAgrupados = useMemo(() => {
    return Array.isArray(lotes) && lotes.length > 0 && lotes[0]?.diaKey;
  }, [lotes]);

  // Buscar estatísticas por dia do backend (totais completos, não apenas da página)
  // Fazer apenas uma vez quando expande pela primeira vez ou quando filtros mudam
  useEffect(() => {
    const fetchEstatisticasPorDia = async () => {
      // Se já temos estatísticas e os dados já vêm agrupados do backend, 
      // podemos usar os dados locais como fallback imediato
      if (dadosJaAgrupados && lotes.length > 0) {
        // Usar dados locais enquanto carrega (sem mostrar loading)
        const statsLocais = lotes.map((dia) => ({
          dia: dia.diaKey,
          diaLabel: dia.diaLabel,
          totalLotes: dia.totalLotes,
          totalItens: dia.totalItens,
          totalColheitas: dia.totalColheitas,
          valorTotal: dia.valorTotal,
          valorPendente: dia.valorPendente,
          valorProcessado: dia.valorProcessado,
        }));
        setEstatisticasPorDia(statsLocais);
      }

      // ✅ Quando há filtros locais ativos (chips/texto), não buscar estatísticas do backend,
      // senão ele sobrescreve os totais filtrados e "desalinha" o que está na tela.
      if (!usarEstatisticasBackendPorDia) {
        return;
      }

      try {
        setLoadingEstatisticasPorDia(true);

        const params = new URLSearchParams();
        if (dataInicio) params.append("dataInicio", dataInicio);
        if (dataFim) params.append("dataFim", dataFim);
        if (tipoData) params.append("tipoData", tipoData);
        if (contaCorrenteId) params.append("contaCorrenteId", contaCorrenteId.toString());

        const url = `/api/pagamentos/estatisticas-por-dia-turma-colheita?${params.toString()}`;

        const response = await axiosInstance.get(url);
        // Atualizar com dados do backend (mais precisos, incluem todos os dias)
        setEstatisticasPorDia(response.data || []);
      } catch (error) {
        console.error("Erro ao buscar estatísticas por dia:", error);
        // Em caso de erro, manter os dados locais se existirem
      } finally {
        setLoadingEstatisticasPorDia(false);
      }
    };

    if (isExpanded) {
      fetchEstatisticasPorDia();
    } else {
      // Limpar estatísticas quando colapsa para economizar memória
      setEstatisticasPorDia([]);
    }
  }, [isExpanded, dataInicio, dataFim, tipoData, contaCorrenteId, dadosJaAgrupados, lotes, usarEstatisticasBackendPorDia]);

  // Agrupar lotes por dia (dataCriacao) - apenas se não vierem agrupados do backend
  const lotesAgrupadosPorDia = useMemo(() => {
    // Função auxiliar para determinar se um lote tem botão "Liberar" visível
    // (mesmo que desabilitado, o botão ainda aparece, então consideramos para ordenação)
    const temBotaoLiberar = (lote) => {
      const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
      const podeLiberar =
        estadoRequisicao &&
        (estadoRequisicao === 1 || estadoRequisicao === 4) &&
        estadoRequisicao !== 9 &&
        estadoRequisicao !== 6 &&
        !lote.dataLiberacao;
      
      // Retornar true se o botão aparece (mesmo que desabilitado por data passada)
      // A ordenação deve priorizar lotes que têm o botão visível
      return !!podeLiberar;
    };
    if (dadosJaAgrupados) {
      // Dados já vêm agrupados do backend - cada item é um dia com seus lotes
      return lotes.map((dia) => {
        // Ordenar lotes dentro do dia: primeiro os que têm botão "Liberar"
        const lotesOrdenados = Array.isArray(dia.lotes) ? [...dia.lotes] : [];
        lotesOrdenados.sort((a, b) => {
          const temBotaoA = temBotaoLiberar(a);
          const temBotaoB = temBotaoLiberar(b);
          
          // Se um tem botão e outro não, o que tem botão vem primeiro
          if (temBotaoA !== temBotaoB) {
            return temBotaoA ? -1 : 1;
          }
          
          // Se ambos têm ou não têm botão, manter ordem original (por dataCriacao, mais recente primeiro)
          const dataA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
          const dataB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
          return dataB - dataA;
        });
        
        return {
          diaKey: dia.diaKey,
          diaLabel: dia.diaLabel || moment(dia.diaKey).format("DD/MM/YYYY"),
          dataCriacao: dia.dataCriacao ? new Date(dia.dataCriacao) : new Date(dia.diaKey),
          lotes: lotesOrdenados,
          // Estatísticas já vêm do backend
          totalLotes: dia.totalLotes,
          totalItens: dia.totalItens,
          totalColheitas: dia.totalColheitas,
          valorTotal: dia.valorTotal,
          valorPendente: dia.valorPendente,
          valorProcessado: dia.valorProcessado,
        };
      });
    }

    if (!Array.isArray(lotes) || lotes.length === 0) {
      return [];
    }

    // Se não vierem agrupados, agrupar localmente
    const grupos = new Map();

    lotes.forEach((lote) => {
      if (!lote.dataCriacao) return;

      // Normalizar data para o início do dia (ignorar hora)
      const dataCriacao = moment(lote.dataCriacao).startOf("day");
      const diaKey = dataCriacao.format("YYYY-MM-DD");
      const diaLabel = dataCriacao.format("DD/MM/YYYY");

      if (!grupos.has(diaKey)) {
        grupos.set(diaKey, {
          diaKey,
          diaLabel,
          dataCriacao: dataCriacao.toDate(),
          lotes: [],
        });
      }

      const grupo = grupos.get(diaKey);
      if (grupo) {
        grupo.lotes.push(lote);
      }
    });

    // Converter para array, ordenar lotes dentro de cada dia e depois ordenar dias por data
    return Array.from(grupos.values())
      .map((grupo) => {
        // Ordenar lotes dentro do dia: primeiro os que têm botão "Liberar"
        grupo.lotes.sort((a, b) => {
          const temBotaoA = temBotaoLiberar(a);
          const temBotaoB = temBotaoLiberar(b);
          
          // Se um tem botão e outro não, o que tem botão vem primeiro
          if (temBotaoA !== temBotaoB) {
            return temBotaoA ? -1 : 1;
          }
          
          // Se ambos têm ou não têm botão, manter ordem original (por dataCriacao, mais recente primeiro)
          const dataA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
          const dataB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
          return dataB - dataA;
        });
        
        return grupo;
      })
      .sort((a, b) => {
        // Ordenar dias por data (mais recente primeiro)
        return moment(b.dataCriacao).valueOf() - moment(a.dataCriacao).valueOf();
      });
  }, [lotes, dadosJaAgrupados]);

  // Combinar dados de lotes com estatísticas do backend
  const diasComEstatisticas = useMemo(() => {
    return lotesAgrupadosPorDia.map((grupo) => {
      // Buscar estatísticas do backend para este dia
      const statsBackend = usarEstatisticasBackendPorDia
        ? estatisticasPorDia.find((stat) => stat.dia === grupo.diaKey)
        : undefined;

      // Calcular valor dos lotes excluídos/rejeitados (não considerar nos totais)
      const valorExcluidosRejeitados = grupo.lotes.reduce((acc, lote) => {
        // Verificação robusta para excluido
        const estaExcluido = lote.excluido === true || 
                             lote.excluido === "true" || 
                             lote.excluido === 1 || 
                             lote.excluido === "1";
        // Verificar se está rejeitado (estado BB 7)
        const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
        const estaRejeitado = estadoRequisicao === 7;
        
        if (estaExcluido || estaRejeitado) {
          return acc + Number(lote.valorTotalColheitas || lote.valorTotalEnviado || 0);
        }
        return acc;
      }, 0);

      // Se os dados já vêm do backend com estatísticas, usar diretamente
      if (dadosJaAgrupados && grupo.totalLotes !== undefined) {
        const valorTotalAjustado = (statsBackend?.valorTotal ?? grupo.valorTotal) - valorExcluidosRejeitados;
        const valorPendenteAjustado = Math.max(0, (statsBackend?.valorPendente ?? grupo.valorPendente) - valorExcluidosRejeitados);
        
        return {
          ...grupo,
          // Priorizar estatísticas do endpoint de estatísticas por dia (mais precisas)
          totalLotes: statsBackend?.totalLotes ?? grupo.totalLotes,
          totalItens: statsBackend?.totalItens ?? grupo.totalItens,
          totalColheitas: statsBackend?.totalColheitas ?? grupo.totalColheitas,
          valorTotal: valorTotalAjustado,
          valorPendente: valorPendenteAjustado,
          valorProcessado: statsBackend?.valorProcessado ?? grupo.valorProcessado,
          valorExcluidosRejeitados,
        };
      }

      // Caso contrário, calcular localmente (excluindo lotes excluídos/rejeitados)
      const lotesNaoExcluidos = grupo.lotes.filter((lote) => {
        const estaExcluido = lote.excluido === true || 
                             lote.excluido === "true" || 
                             lote.excluido === 1 || 
                             lote.excluido === "1";
        const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
        const estaRejeitado = estadoRequisicao === 7;
        return !(estaExcluido || estaRejeitado);
      });

      const valorTotalLocal = lotesNaoExcluidos.reduce((acc, lote) => 
        acc + Number(lote.valorTotalColheitas || lote.valorTotalEnviado || 0), 0
      );

      return {
        ...grupo,
        // Usar estatísticas do backend se disponíveis, senão calcular localmente
        totalLotes: statsBackend?.totalLotes || lotesNaoExcluidos.length,
        totalItens: statsBackend?.totalItens || lotesNaoExcluidos.reduce((acc, lote) => acc + (lote.quantidadeItens || lote.itensPagamento?.length || 0), 0),
        totalColheitas: statsBackend?.totalColheitas || lotesNaoExcluidos.reduce((acc, lote) => acc + (lote.quantidadeColheitas || 0), 0),
        valorTotal: statsBackend?.valorTotal ? (statsBackend.valorTotal - valorExcluidosRejeitados) : valorTotalLocal,
        valorPendente: statsBackend?.valorPendente ? Math.max(0, statsBackend.valorPendente - valorExcluidosRejeitados) : 0,
        valorProcessado: statsBackend?.valorProcessado || 0,
        valorExcluidosRejeitados,
      };
    });
  }, [lotesAgrupadosPorDia, estatisticasPorDia, dadosJaAgrupados, usarEstatisticasBackendPorDia]);

  // Paginação por dia
  const diasPaginados = useMemo(() => {
    const page = paginacao.page || 1;
    const limit = paginacao.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return diasComEstatisticas.slice(start, end);
  }, [diasComEstatisticas, paginacao.page, paginacao.limit]);

  // Total de dias (para paginação) - usar estatísticas do backend se disponíveis
  const totalDias = estatisticasPorDia.length > 0 ? estatisticasPorDia.length : diasComEstatisticas.length;

  return (
    <Card
      style={{
        margin: 0,
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        marginBottom: 24,
      }}
      styles={{
        header: {
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          color: "#ffffff",
          borderRadius: "8px 8px 0 0",
          cursor: "pointer",
        },
        body: {
          padding: "16px",
        },
      }}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
          onClick={onToggleActive}
        >
          <Space>
            {icone || <DollarOutlined style={{ color: "#ffffff", fontSize: "18px" }} />}
            <Text strong style={{ fontSize: isMobile ? "14px" : "16px", color: "#ffffff" }}>
              {titulo}
            </Text>
          </Space>
          <Space>
            <Text style={{ fontSize: "11px", color: "#ffffff", opacity: 0.9 }}>
              Clique para expandir/colapsar
            </Text>
            <RightOutlined
              rotate={isExpanded ? 90 : 0}
              style={{
                color: "#ffffff",
                fontSize: "14px",
                transition: "transform 0.3s",
                marginLeft: "8px",
              }}
            />
          </Space>
        </div>
      }
    >
      {/* Cards de Estatísticas Gerais */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem", height: "100%", display: "flex", flexDirection: "column" } }}
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <Space size={4} style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Lotes</Text>
                <Tooltip
                  title={
                    <div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Total de Lotes:</strong> Quantidade total de lotes de pagamento criados nesta seção.
                      </div>
                      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Lotes Pendentes:</strong> Quantidade de lotes aguardando liberação para processamento no Banco do Brasil. Calculado como: Total de Lotes - Lotes Liberados - Lotes Rejeitados.
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined
                    style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                  />
                </Tooltip>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "24px" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileTextOutlined style={{ color: "#059669", fontSize: "1rem" }} />
                  <span style={{ color: "#059669", fontSize: "1.125rem", fontWeight: "600" }}>
                    {estatisticas.totalLotes}
                  </span>
                </div>
                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    backgroundColor: "#e8e8e8",
                  }}
                />
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  <ClockCircleOutlined style={{ color: "#fa8c16", fontSize: "1rem" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", justifyContent: "center" }}>
                    <Text
                      style={{
                        color: "#8c8c8c",
                        fontSize: "0.625rem",
                        lineHeight: "1.2",
                      }}
                    >
                      Pendentes
                    </Text>
                    <span
                      style={{
                        color: "#fa8c16",
                        fontSize: "1rem",
                        fontWeight: "600",
                      }}
                    >
                      {Math.max(0, (estatisticas.totalLotes || 0) - (estatisticas.lotesLiberados || 0) - (estatisticas.lotesRejeitados || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem" } }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Itens</Text>
                  <Tooltip title="Quantidade total de itens (transferências individuais) em todos os lotes desta seção.">
                    <InfoCircleOutlined
                      style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
              value={estatisticas.totalItens}
              prefix={<ShoppingOutlined style={{ color: "#1890ff", fontSize: "1rem" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem" } }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Total de Colheitas</Text>
                  <Tooltip title="Quantidade total de colheitas vinculadas aos lotes de pagamento de turmas.">
                    <InfoCircleOutlined
                      style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
              value={estatisticas.totalColheitas}
              prefix={<TeamOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
              valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem", height: "100%", display: "flex", flexDirection: "column" } }}
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <Space size={4} style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Lotes Liberados / Rejeitados</Text>
                <Tooltip
                  title={
                    <div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Lotes Liberados:</strong> Quantidade de lotes que já foram liberados para processamento no Banco do Brasil.
                      </div>
                      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Lotes Rejeitados:</strong> Quantidade de lotes que foram rejeitados pelo Banco do Brasil ou que contêm itens bloqueados.
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                </Tooltip>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "24px" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />
                  <span style={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}>
                    {estatisticas.lotesLiberados || 0}
                  </span>
                </div>
                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    backgroundColor: "#e8e8e8",
                  }}
                />
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "1rem" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", justifyContent: "center" }}>
                    <Text
                      style={{
                        color: "#8c8c8c",
                        fontSize: "0.625rem",
                        lineHeight: "1.2",
                      }}
                    >
                      Rejeitados
                    </Text>
                    <span
                      style={{
                        color: "#ff4d4f",
                        fontSize: "1rem",
                        fontWeight: "600",
                      }}
                    >
                      {estatisticas.lotesRejeitados || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem", height: "100%", display: "flex", flexDirection: "column" } }}
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <Space size={4} style={{ marginBottom: "8px" }}>
                <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Itens Liberados / Rejeitados</Text>
                <Tooltip
                  title={
                    <div>
                      <div style={{ marginBottom: "4px" }}>
                        <strong>Itens Liberados:</strong> Quantidade de itens (transferências) que já foram processados e pagos pelo Banco do Brasil.
                      </div>
                      <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                        <strong>Itens Rejeitados:</strong> Quantidade de itens (transferências) que foram rejeitados ou bloqueados pelo Banco do Brasil.
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }} />
                </Tooltip>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "24px" }}>
                <Tooltip title={`Itens de turma de colheita liberados: ${estatisticas.itensLiberados || 0}`}>
                  <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem", cursor: "help" }} />
                </Tooltip>
                <span style={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.itensLiberados || 0}
                </span>
                <span style={{ color: "#d9d9d9", fontSize: "1rem" }}>/</span>
                <span style={{ color: "#ff4d4f", fontSize: "1.125rem", fontWeight: "600" }}>
                  {estatisticas.itensRejeitados || 0}
                </span>
                <Tooltip title={`Itens de turma de colheita rejeitados: ${estatisticas.itensRejeitados || 0}`}>
                  <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "1rem", marginLeft: "4px", cursor: "help" }} />
                </Tooltip>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem" } }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Liberado</Text>
                  <Tooltip title="Valor já pago pelo Banco do Brasil.">
                    <InfoCircleOutlined
                      style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
              value={formatCurrency(estatisticas.valorTotalLiberado || 0)}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: "1rem" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem" } }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Pendente</Text>
                  <Tooltip title="Valor das colheitas que ainda não foi pago.">
                    <InfoCircleOutlined
                      style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
              value={formatCurrency(estatisticas.valorTotalPendente || 0)}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16", fontSize: "1rem" }} />}
              valueStyle={{ color: "#fa8c16", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              borderRadius: "0.75rem",
              boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              height: "100%",
            }}
            styles={{ body: { padding: "0.75rem" } }}
          >
            <Statistic
              title={
                <Space size={4}>
                  <Text style={{ color: "#666", fontSize: "0.6875rem" }}>Valor Total Colheitas</Text>
                  <Tooltip title="Valor total de todas as colheitas vinculadas.">
                    <InfoCircleOutlined
                      style={{ color: "#d9d9d9", fontSize: "0.75rem", cursor: "help" }}
                    />
                  </Tooltip>
                </Space>
              }
              value={formatCurrency(estatisticas.valorTotalColheitas)}
              prefix={<DollarOutlined style={{ color: "#722ed1", fontSize: "1rem" }} />}
              valueStyle={{ color: "#722ed1", fontSize: "1.125rem", fontWeight: "600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cards Agrupados por Dia - Visível apenas quando expandido */}
      {isExpanded && (
        <>
          <div style={{ marginTop: 16, borderTop: "1px solid #e8e8e8", paddingTop: 16 }}>
            {loading || loadingEstatisticasPorDia ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Spin size="large" />
                <div style={{ marginTop: "16px" }}>
                  <Text type="secondary">Carregando dados...</Text>
                </div>
              </div>
            ) : diasPaginados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">Nenhum lote encontrado</Text>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {diasPaginados.map((grupoDia) => {
                  const isDayExpanded = expandedDays.includes(grupoDia.diaKey);
                  
                  // Determinar cor da borda baseado no status: verde se tudo pago, laranja se tiver pendente
                  const valorPendente = grupoDia.valorPendente || 0;
                  const corBorda = valorPendente > 0 ? "#fa8c16" : "#52c41a"; // Laranja se pendente, verde se tudo pago
                  const larguraBorda = "4px";

                  return (
                    <Card
                      key={grupoDia.diaKey}
                      style={{
                        border: "1px solid #e8e8e8",
                        borderLeft: `${larguraBorda} solid ${corBorda}`,
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                      }}
                      styles={{
                        body: {
                          padding: "16px",
                        },
                      }}
                    >
                      {/* Cabeçalho do Card do Dia */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: isDayExpanded ? "16px" : "0",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setExpandedDays((prev) =>
                            prev.includes(grupoDia.diaKey)
                              ? prev.filter((key) => key !== grupoDia.diaKey)
                              : [...prev, grupoDia.diaKey]
                          );
                        }}
                      >
                        <Space size="middle">
                          <CalendarOutlined style={{ color: "#059669", fontSize: "18px" }} />
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: "#059669",
                              fontSize: isMobile ? "14px" : "16px",
                            }}
                          >
                            {grupoDia.diaLabel}
                          </Title>
                          <Tag color="blue" style={{ fontSize: "12px" }}>
                            {grupoDia.totalLotes} {grupoDia.totalLotes === 1 ? "lote" : "lotes"}
                          </Tag>
                        </Space>
                        <Button
                          type="text"
                          size="small"
                          icon={isDayExpanded ? <UpOutlined /> : <DownOutlined />}
                          style={{ color: "#059669" }}
                        />
                      </div>

                      {/* Resumo do Dia (sempre visível) */}
                      <Row gutter={[16, 16]} style={{ marginTop: "12px" }}>
                        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: "1 1 0", minWidth: "120px" }}>
                          <div style={{ textAlign: "center" }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
                            >
                              Quantidade de Pagamentos
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                              {grupoDia.totalItens}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: "1 1 0", minWidth: "120px" }}>
                          <div style={{ textAlign: "center" }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
                            >
                              Valor Total
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#059669" }}>
                              R$ {formatCurrency(grupoDia.valorTotal)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: "1 1 0", minWidth: "120px" }}>
                          <div style={{ textAlign: "center" }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
                            >
                              Valor Pendente
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#fa8c16" }}>
                              R$ {formatCurrency(grupoDia.valorPendente)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: "1 1 0", minWidth: "120px" }}>
                          <div style={{ textAlign: "center" }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
                            >
                              Valor Processado
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
                              R$ {formatCurrency(grupoDia.valorProcessado)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: "1 1 0", minWidth: "120px" }}>
                          <div style={{ textAlign: "center" }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
                            >
                              Excluído/Rejeitado
                            </Text>
                            <Text strong style={{ fontSize: "16px", color: "#ff4d4f" }}>
                              R$ {formatCurrency(grupoDia.valorExcluidosRejeitados || 0)}
                            </Text>
                          </div>
                        </Col>
                      </Row>

                      {/* Tabela de Lotes do Dia (expandível) */}
                      {isDayExpanded && (() => {
                        // Paginação para os lotes deste dia
                        const pageLotes = paginacaoLotesPorDia[grupoDia.diaKey]?.page || 1;
                        const limitLotes = paginacaoLotesPorDia[grupoDia.diaKey]?.limit || 10;
                        const totalLotes = grupoDia.lotes.length;
                        const startLotes = (pageLotes - 1) * limitLotes;
                        const endLotes = startLotes + limitLotes;
                        const lotesPaginados = grupoDia.lotes.slice(startLotes, endLotes);

                        return (
                          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e8e8e8" }}>
                            <ResponsiveTable
                              columns={columns}
                              dataSource={lotesPaginados}
                              loading={false}
                              rowKey={rowKey}
                              minWidthMobile={1400}
                              showScrollHint={true}
                              pagination={{
                                current: pageLotes,
                                pageSize: limitLotes,
                                total: totalLotes,
                                onChange: (page, pageSize) => {
                                  setPaginacaoLotesPorDia((prev) => ({
                                    ...prev,
                                    [grupoDia.diaKey]: {
                                      page,
                                      limit: pageSize || limitLotes,
                                    },
                                  }));
                                },
                                onShowSizeChange: (current, size) => {
                                  setPaginacaoLotesPorDia((prev) => ({
                                    ...prev,
                                    [grupoDia.diaKey]: {
                                      page: 1,
                                      limit: size,
                                    },
                                  }));
                                },
                                showSizeChanger: !isMobile,
                                showTotal: (total, range) =>
                                  isMobile
                                    ? `${range[0]}-${range[1]}/${total}`
                                    : `${range[0]}-${range[1]} de ${total} lotes`,
                                pageSizeOptions: ["10", "20", "50", "100"],
                                size: isMobile ? "small" : "default",
                              }}
                            expandable={{
                              expandIcon: ({ expanded, onExpand, record }) => {
                                const itens = record.itensPagamento || [];
                                if (itens.length === 0) return null;

                                return (
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                                    onClick={(e) => onExpand(record, e)}
                                    style={{
                                      padding: "4px 8px",
                                      height: "auto",
                                      color: "#059669",
                                    }}
                                  />
                                );
                              },
                              expandedRowRender: (record) => {
                                const itens = record.itensPagamento || [];

                                // Ordenação apenas nesta seção (Turma de Colheita):
                                // 1) Pendentes primeiro
                                // 2) Pagos em ordem alfabética (por responsável da chave PIX; fallback para chave / código)
                                const itensOrdenados = [...itens].sort((a, b) => {
                                  const estadoA = a.estadoPagamentoIndividual || a.status;
                                  const estadoB = b.estadoPagamentoIndividual || b.status;
                                  const pagoA = isItemPago(estadoA);
                                  const pagoB = isItemPago(estadoB);

                                  if (pagoA !== pagoB) return pagoA ? 1 : -1; // pendentes primeiro

                                  // Se ambos forem pagos, ordenar alfabeticamente
                                  if (pagoA && pagoB) {
                                    const nomeA = (
                                      a.responsavelChavePixEnviado ||
                                      record.turmaResumo?.responsavelChavePix ||
                                      a.chavePixEnviada ||
                                      record.turmaResumo?.chavePix ||
                                      a.identificadorPagamento ||
                                      a.codigoIdentificadorPagamento ||
                                      a.codigoPagamento ||
                                      ""
                                    )
                                      .toString()
                                      .trim()
                                      .toLowerCase();

                                    const nomeB = (
                                      b.responsavelChavePixEnviado ||
                                      record.turmaResumo?.responsavelChavePix ||
                                      b.chavePixEnviada ||
                                      record.turmaResumo?.chavePix ||
                                      b.identificadorPagamento ||
                                      b.codigoIdentificadorPagamento ||
                                      b.codigoPagamento ||
                                      ""
                                    )
                                      .toString()
                                      .trim()
                                      .toLowerCase();

                                    return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
                                  }

                                  // Caso ambos sejam pendentes, manter ordem original (estável)
                                  return 0;
                                });

                                if (itensOrdenados.length === 0) {
                                  return (
                                    <div
                                      style={{
                                        padding: "12px 16px",
                                        backgroundColor: "#f9f9f9",
                                        margin: "0 -16px",
                                        borderTop: "1px solid #e8e8e8",
                                      }}
                                    >
                                      <Text type="secondary">Nenhum item neste lote.</Text>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    style={{
                                      padding: "12px 16px",
                                      backgroundColor: "#f9f9f9",
                                      margin: "0 -16px",
                                      borderTop: "1px solid #e8e8e8",
                                    }}
                                  >
                                    <Text
                                      strong
                                      style={{
                                        fontSize: "13px",
                                        color: "#059669",
                                        marginBottom: "10px",
                                        display: "block",
                                      }}
                                    >
                                      Itens do Lote ({itensOrdenados.length}):
                                    </Text>
                                    <div style={{ display: "grid", gap: "8px" }}>
                                      {itensOrdenados.map((item, index) => {
                                        const colheitas = item.colheitas || [];
                                        const chavePixExibir = item.chavePixEnviada || record.turmaResumo?.chavePix || null;
                                        const responsavelChavePixExibir =
                                          item.responsavelChavePixEnviado ||
                                          record.turmaResumo?.responsavelChavePix ||
                                          null;

                                        return (
                                          <Card
                                            key={item.id || index}
                                            size="small"
                                            style={{
                                              backgroundColor: "#ffffff",
                                              border: "1px solid #d9d9d9",
                                              borderRadius: "4px",
                                              boxShadow: "none",
                                            }}
                                            styles={{ body: { padding: "10px" } }}
                                          >
                                            <Row gutter={[16, 0]} align="top" wrap={false}>
                                              <Col flex="none" style={{ minWidth: "160px", maxWidth: "160px" }}>
                                                <div>
                                                  <Text
                                                    type="secondary"
                                                    style={{
                                                      fontSize: "12px",
                                                      display: "block",
                                                      marginBottom: "4px",
                                                      lineHeight: "1.2",
                                                      fontWeight: "500",
                                                      color: "#595959",
                                                    }}
                                                  >
                                                    Código
                                                  </Text>
                                                  <Tag
                                                    color="blue"
                                                    style={{
                                                      fontFamily: "monospace",
                                                      fontSize: "13px",
                                                      margin: 0,
                                                      padding: "2px 6px",
                                                    }}
                                                  >
                                                    {item.identificadorPagamento ||
                                                      item.codigoIdentificadorPagamento ||
                                                      item.codigoPagamento ||
                                                      "-"}
                                                  </Tag>
                                                </div>
                                              </Col>

                                              <Col flex="none" style={{ minWidth: "100px", maxWidth: "100px" }}>
                                                <div>
                                                  <Text
                                                    type="secondary"
                                                    style={{
                                                      fontSize: "12px",
                                                      display: "block",
                                                      marginBottom: "4px",
                                                      lineHeight: "1.2",
                                                      fontWeight: "500",
                                                      color: "#595959",
                                                    }}
                                                  >
                                                    Valor
                                                  </Text>
                                                  <Text
                                                    strong
                                                    style={{
                                                      display: "block",
                                                      color: "#059669",
                                                      fontSize: "15px",
                                                      whiteSpace: "nowrap",
                                                    }}
                                                  >
                                                    R$ {formatCurrency(Number(item.valorEnviado || 0))}
                                                  </Text>
                                                </div>
                                              </Col>

                                              {chavePixExibir && (
                                                <Col flex="none" style={{ minWidth: "140px", maxWidth: "140px" }}>
                                                  <div>
                                                    <Text
                                                      type="secondary"
                                                      style={{
                                                        fontSize: "12px",
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        lineHeight: "1.2",
                                                        fontWeight: "500",
                                                        color: "#595959",
                                                      }}
                                                    >
                                                      Chave PIX
                                                    </Text>
                                                    <Text
                                                      style={{
                                                        display: "block",
                                                        fontSize: "13px",
                                                        fontFamily: "monospace",
                                                        wordBreak: "break-all",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                      }}
                                                    >
                                                      {item.chavePixEnviada
                                                        ? formatarChavePixPorTipo(item.chavePixEnviada, item.tipoChavePixEnviado)
                                                        : chavePixExibir}
                                                    </Text>
                                                  </div>
                                                </Col>
                                              )}

                                              {responsavelChavePixExibir && (
                                                <Col flex="none" style={{ minWidth: "216px", maxWidth: "216px" }}>
                                                  <div>
                                                    <Text
                                                      type="secondary"
                                                      style={{
                                                        fontSize: "12px",
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        lineHeight: "1.2",
                                                        fontWeight: "500",
                                                        color: "#595959",
                                                      }}
                                                    >
                                                      Resp. Chave PIX
                                                    </Text>
                                                    <Text
                                                      style={{
                                                        display: "block",
                                                        fontSize: "13px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                      }}
                                                    >
                                                      {item.responsavelChavePixEnviado
                                                        ? capitalizeName(item.responsavelChavePixEnviado)
                                                        : capitalizeName(responsavelChavePixExibir)}
                                                    </Text>
                                                  </div>
                                                </Col>
                                              )}

                                              <Col flex="auto" style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", paddingBottom: "2px" }}>
                                                {(item.identificadorPagamento ||
                                                  item.codigoIdentificadorPagamento ||
                                                  item.codigoPagamento) && (
                                                  <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => {
                                                      onConsultarItemIndividual({
                                                        identificadorPagamento:
                                                          item.identificadorPagamento ||
                                                          item.codigoIdentificadorPagamento ||
                                                          item.codigoPagamento,
                                                        contaCorrenteId: record.contaCorrente?.id,
                                                      });
                                                    }}
                                                    style={{ padding: "0", fontSize: "13px", height: "auto" }}
                                                  >
                                                    Consultar
                                                  </Button>
                                                )}
                                              </Col>
                                            </Row>

                                            {colheitas.length > 0 && (
                                              <div
                                                style={{
                                                  marginTop: "8px",
                                                  paddingTop: "8px",
                                                  borderTop: "1px solid #e8e8e8",
                                                }}
                                              >
                                                <Text
                                                  type="secondary"
                                                  style={{
                                                    fontSize: "12px",
                                                    display: "block",
                                                    marginBottom: "4px",
                                                    fontWeight: "500",
                                                    color: "#595959",
                                                  }}
                                                >
                                                  Colheitas ({colheitas.length}):
                                                </Text>
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "4px",
                                                    width: "100%",
                                                  }}
                                                >
                                                  {colheitas.map((c, idx) => {
                                                    const quantidade = c.quantidadeColhida || 0;
                                                    const unidade = c.unidadeMedida || "";
                                                    const quantidadeFormatada = Number(quantidade).toLocaleString("pt-BR", {
                                                      minimumFractionDigits: 0,
                                                      maximumFractionDigits: 2,
                                                    });
                                                    
                                                    return (
                                                      <Tag
                                                        key={idx}
                                                        color="cyan"
                                                        style={{ fontSize: "12px", padding: "2px 6px", margin: 0 }}
                                                      >
                                                        {c.pedidoNumero} - {c.frutaNome} - {quantidadeFormatada} {unidade} - R${" "}
                                                        {formatCurrency(c.valorColheita || 0)}
                                                      </Tag>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </Card>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              },
                            }}
                          />
                        </div>
                        );
                      })()}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Paginação por Dia */}
            {totalDias > 0 && (
              <div
                style={{
                  padding: isMobile ? "0.75rem" : "1rem",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <Pagination
                  current={paginacao.page}
                  pageSize={paginacao.limit}
                  total={totalDias}
                  onChange={onPageChange}
                  onShowSizeChange={onPageChange}
                  showSizeChanger={!isMobile}
                  showTotal={(total, range) =>
                    isMobile
                      ? `${range[0]}-${range[1]}/${total}`
                      : `${range[0]}-${range[1]} de ${total} dias`
                  }
                  pageSizeOptions={["10", "20", "50", "100"]}
                  size={isMobile ? "small" : "default"}
                />
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

SecaoLotesPagamentosAgrupado.propTypes = {
  titulo: PropTypes.string.isRequired,
  icone: PropTypes.node,
  lotes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  estatisticas: PropTypes.object.isRequired,
  paginacao: PropTypes.object.isRequired,
  onPageChange: PropTypes.func.isRequired,
  activeKey: PropTypes.bool.isRequired,
  onToggleActive: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  rowKey: PropTypes.string,
  onConsultarItemIndividual: PropTypes.func.isRequired,
  dataInicio: PropTypes.string,
  dataFim: PropTypes.string,
  tipoData: PropTypes.string,
  contaCorrenteId: PropTypes.number,
};

export default SecaoLotesPagamentosAgrupado;

