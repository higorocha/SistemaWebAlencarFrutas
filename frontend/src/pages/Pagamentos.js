// src/pages/Pagamentos.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Tag, Space, Typography, Tooltip, Select, DatePicker, Button, Modal, Popconfirm, Dropdown } from "antd";
import { DollarOutlined, BankOutlined, ClockCircleOutlined, CheckCircleOutlined, FilterOutlined, CloseCircleOutlined, UnlockOutlined, StopOutlined, UpOutlined, DownOutlined, EyeOutlined, KeyOutlined, PhoneOutlined, MailOutlined, IdcardOutlined, SafetyOutlined, MoreOutlined, InfoCircleOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosConfig";
import ResponsiveTable from "../components/common/ResponsiveTable";
import { showNotification } from "../config/notificationConfig";
import { formatCurrency, formatarCPF, formatarCNPJ, formatarTelefone } from "../utils/formatters";
import { mapearEstadoRequisicao } from "../utils/bbEstadoRequisicao";
import useResponsive from "../hooks/useResponsive";
import moment from "moment";
import { Box } from "@mui/material";
import { SearchInput } from "components/common/search";
import LotePagamentosDetalhesModal from "../components/pagamentos/LotePagamentosDetalhesModal";
import ConsultaOnlineModal from "../components/pagamentos/ConsultaOnlineModal";
import ConsultaItemIndividualModal from "../components/pagamentos/ConsultaItemIndividualModal";
import { useLocation } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Pagamentos = () => {
  const { isMobile } = useResponsive();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoOrigem, setTipoOrigem] = useState("TODOS");
  const [dateRange, setDateRange] = useState([]);
  const [liberandoLoteId, setLiberandoLoteId] = useState(null);
  const [cancelandoLoteId, setCancelandoLoteId] = useState(null);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [modalCancelamentoOpen, setModalCancelamentoOpen] = useState(false);
  const [modalConsultaOnlineOpen, setModalConsultaOnlineOpen] = useState(false);
  const [modalConsultaItemIndividualOpen, setModalConsultaItemIndividualOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // Guardar, ao carregar a tela via notificação, qual número de requisição devemos abrir automaticamente
  const [numeroRequisicaoParaAbrir, setNumeroRequisicaoParaAbrir] = useState(() => {
    const state = location?.state || {};
    return state.loteNumeroRequisicao || null;
  });

  const fetchLotes = useCallback(async (dataInicio = null, dataFim = null) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);

      const queryString = params.toString();
      const url = queryString
        ? `/api/pagamentos/lotes-turma-colheita?${queryString}`
        : "/api/pagamentos/lotes-turma-colheita";

      const response = await axiosInstance.get(url);
      setLotes(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar lotes de pagamentos:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao carregar lotes de pagamentos da turma de colheita";
      showNotification("error", "Erro", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Se tiver range selecionado, enviar datas normalizadas (início/fim do dia)
    if (dateRange && dateRange.length === 2) {
      const inicio = dateRange[0]
        ? moment(dateRange[0]).startOf("day").toISOString()
        : null;
      const fim = dateRange[1]
        ? moment(dateRange[1]).endOf("day").toISOString()
        : null;
      fetchLotes(inicio, fim);
    } else {
      // Sem filtro de data, buscar todos
      fetchLotes();
    }
  }, [fetchLotes, dateRange]);

  // Após lotes carregados, se vier um numeroRequisicao da navegação (ex: clique na notificação),
  // localizar o lote correspondente e abrir o modal de detalhes automaticamente.
  useEffect(() => {
    if (!numeroRequisicaoParaAbrir || !lotes || lotes.length === 0) return;

    const alvo = lotes.find(
      (lote) => lote.numeroRequisicao === numeroRequisicaoParaAbrir
    );

    if (alvo) {
      setLoteSelecionado(alvo);
      setModalDetalhesOpen(true);
      // Usar uma vez apenas
      setNumeroRequisicaoParaAbrir(null);
    }
  }, [numeroRequisicaoParaAbrir, lotes]);

  // Função para liberar pagamento (chamada do modal)
  const handleLiberarPagamento = async (numeroRequisicao, indicadorFloat) => {
    try {
      setLiberandoLoteId(numeroRequisicao);
      await axiosInstance.post("/api/pagamentos/liberar", {
        numeroRequisicao,
        indicadorFloat,
      });
      showNotification("success", "Sucesso", "Pagamento liberado com sucesso!");
      setModalDetalhesOpen(false);
      setLoteSelecionado(null);
      // Recarregar lotes
      if (dateRange && dateRange.length === 2) {
        const inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        const fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
        fetchLotes(inicio, fim);
      } else {
        fetchLotes();
      }
    } catch (error) {
      console.error("Erro ao liberar pagamento:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao liberar pagamento. Verifique os logs para mais detalhes.";
      showNotification("error", "Erro", message);
    } finally {
      setLiberandoLoteId(null);
    }
  };

  // Função para cancelar item (lançamento individual)
  const handleCancelarItem = async (itemRecord) => {
    if (!itemRecord || !itemRecord.item) {
      showNotification("error", "Erro", "Item não encontrado.");
      return;
    }
    
    try {
      setCancelandoLoteId(itemRecord.itemId);

      // Buscar conta corrente do lote
      const contaCorrenteId = itemRecord.contaCorrente?.id;
      if (!contaCorrenteId) {
        showNotification(
          "error",
          "Erro",
          "Conta corrente não encontrada para este item."
        );
        return;
      }

      // Extrair código de pagamento do item
      // Para PIX: usar identificadorPagamento
      // Para Boleto: usar codigoIdentificadorPagamento
      // Para Guia: usar codigoPagamento
      const item = itemRecord.item;
      const tipoPagamento = itemRecord.tipoPagamentoApi || itemRecord.tipoPagamento;
      
      let codigoPagamento = null;
      if (tipoPagamento === 'PIX' || tipoPagamento === 'pix') {
        codigoPagamento = item.identificadorPagamento;
      } else if (tipoPagamento === 'BOLETO' || tipoPagamento === 'boleto') {
        codigoPagamento = item.codigoIdentificadorPagamento;
      } else if (tipoPagamento === 'GUIA' || tipoPagamento === 'guia') {
        codigoPagamento = item.codigoPagamento;
      } else {
        // Fallback: tentar todos os campos na ordem correta
        codigoPagamento = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
      }

      if (!codigoPagamento || codigoPagamento.toString().trim() === "") {
        showNotification(
          "warning",
          "Atenção",
          "Este item não possui código de pagamento para cancelamento. O pagamento pode ainda não ter sido processado pelo BB."
        );
        return;
      }

      await axiosInstance.post("/api/pagamentos/cancelar", {
        contaCorrenteId,
        listaCodigosPagamento: [codigoPagamento.toString()],
      });

      showNotification("success", "Sucesso", "Item cancelado com sucesso!");
      setModalCancelamentoOpen(false);
      setLoteSelecionado(null);
      
      // Recarregar lotes
      if (dateRange && dateRange.length === 2) {
        const inicio = dateRange[0]
          ? moment(dateRange[0]).startOf("day").toISOString()
          : null;
        const fim = dateRange[1]
          ? moment(dateRange[1]).endOf("day").toISOString()
          : null;
        fetchLotes(inicio, fim);
      } else {
        fetchLotes();
      }
    } catch (error) {
      console.error("Erro ao cancelar item:", error);
      const message =
        error.response?.data?.message ||
        "Erro ao cancelar item. Verifique os logs para mais detalhes.";
      showNotification("error", "Erro", message);
    } finally {
      setCancelandoLoteId(null);
    }
  };

  // Transformar lotes em itens para exibição na tabela
  const itensFiltradosOrdenados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    // Transformar lotes em itens (flatMap)
    let itens = lotes.flatMap((lote) => {
      const itensPagamento = lote.itensPagamento || [];
      // Se não houver itens, criar um item virtual para manter o lote visível
      if (itensPagamento.length === 0) {
        return [{
          ...lote,
          itemId: `lote-${lote.id}`,
          isLoteSemItens: true,
          colheitasDoItem: lote.colheitas || [],
        }];
      }
      // Mapear cada item com suas colheitas
      return itensPagamento.map((item) => {
        // Encontrar colheitas associadas a este item
        // Como o backend retorna todas as colheitas no lote, precisamos filtrar
        // Por enquanto, vamos associar todas as colheitas do lote ao item (já que geralmente há 1 item por lote)
        const colheitasDoItem = lote.colheitas || [];
        
        return {
          ...lote,
          itemId: item.id,
          item: item,
          colheitasDoItem: colheitasDoItem,
        };
      });
    });

    // Aplicar filtros
    if (termo) {
      itens = itens.filter((item) => {
        const numero = (item.numeroRequisicao || "").toString();
        const origemNome = (item.origemNome || "").toLowerCase();
        const conta = `${item.contaCorrente?.agencia || ""} ${item.contaCorrente?.contaCorrente || ""}`.toLowerCase();
        const codigoPagamento = (item.item?.identificadorPagamento || item.item?.codigoIdentificadorPagamento || item.item?.codigoPagamento || "").toString().toLowerCase();

        return (
          numero.includes(termo) ||
          origemNome.includes(termo) ||
          conta.includes(termo) ||
          codigoPagamento.includes(termo)
        );
      });
    }

    if (tipoOrigem !== "TODOS") {
      itens = itens.filter(
        (item) => (item.origemTipo || "").toUpperCase() === tipoOrigem,
      );
    }

    // Ordenar por tipo de origem e depois por dataCriacao (mais recente primeiro)
    const tipoPrioridade = {
      FUNCIONARIO: 1,
      TURMA_COLHEITA: 2,
      FORNECEDOR: 3,
      DESCONHECIDO: 4,
    };

    itens.sort((a, b) => {
      const pa = tipoPrioridade[(a.origemTipo || "DESCONHECIDO")] || 99;
      const pb = tipoPrioridade[(b.origemTipo || "DESCONHECIDO")] || 99;

      if (pa !== pb) {
        return pa - pb;
      }

      const da = new Date(a.dataCriacao).getTime();
      const db = new Date(b.dataCriacao).getTime();

      return db - da;
    });

    return itens;
  }, [lotes, searchTerm, tipoOrigem]);

  const handleLiberarLote = useCallback(
    async (record) => {
      try {
        setLiberandoLoteId(record.id);
        showNotification(
          "info",
          "Liberação de pagamento",
          `Enviando solicitação de liberação para o lote ${record.numeroRequisicao}...`
        );

        await axiosInstance.post("/api/pagamentos/liberar", {
          numeroRequisicao: record.numeroRequisicao,
          indicadorFloat: "S", // Produção
        });

        showNotification(
          "success",
          "Liberação enviada",
          `Lote ${record.numeroRequisicao} enviado para liberação no Banco do Brasil.`
        );

        // Recarregar lista respeitando o filtro de data atual
        if (dateRange && dateRange.length === 2) {
          const inicio = dateRange[0]
            ? moment(dateRange[0]).startOf("day").toISOString()
            : null;
          const fim = dateRange[1]
            ? moment(dateRange[1]).endOf("day").toISOString()
            : null;
          await fetchLotes(inicio, fim);
        } else {
          await fetchLotes();
        }
      } catch (error) {
        console.error("Erro ao liberar lote de pagamentos:", error);
        const message =
          error.response?.data?.message ||
          "Erro ao enviar liberação de pagamentos para o Banco do Brasil";
        showNotification("error", "Erro ao liberar pagamento", message);
      } finally {
        setLiberandoLoteId(null);
      }
    },
    [dateRange, fetchLotes]
  );

  const columns = [
    {
      title: "Lote",
      dataIndex: "numeroRequisicao",
      key: "numeroRequisicao",
      width: 80,
      render: (numero) => (
        <Text code style={{ fontSize: "0.85rem" }}>
          {numero}
        </Text>
      ),
      sorter: (a, b) => a.numeroRequisicao - b.numeroRequisicao,
    },
    {
      title: "Código Pagamento",
      key: "codigoPagamento",
      width: 150,
      render: (_, record) => {
        const item = record.item;
        if (!item) return <Text type="secondary">-</Text>;
        
        const tipoPagamento = record.tipoPagamentoApi || record.tipoPagamento;
        let codigo = null;
        
        if (tipoPagamento === 'PIX' || tipoPagamento === 'pix') {
          codigo = item.identificadorPagamento;
        } else if (tipoPagamento === 'BOLETO' || tipoPagamento === 'boleto') {
          codigo = item.codigoIdentificadorPagamento;
        } else if (tipoPagamento === 'GUIA' || tipoPagamento === 'guia') {
          codigo = item.codigoPagamento;
        } else {
          codigo = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
        }
        
        return codigo ? (
          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: "0.8rem" }}>
            {codigo.toString()}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: "Chave PIX Destino",
      key: "chavePixDestino",
      width: 220,
      render: (_, record) => {
        const item = record.item;
        if (!item || !item.chavePixEnviada) return <Text type="secondary">-</Text>;
        
        const tipoChave = item.tipoChavePixEnviado;
        const chavePix = item.chavePixEnviada;
        let chaveFormatada = chavePix;
        let tipoLabel = '';
        let tagColor = 'blue';
        let icon = <KeyOutlined />;
        
        // Formatar conforme o tipo de chave
        if (tipoChave === 1) {
          // Telefone: formatar como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
          tipoLabel = 'Telefone';
          chaveFormatada = formatarTelefone(chavePix);
          tagColor = 'cyan';
          icon = <PhoneOutlined />;
        } else if (tipoChave === 2) {
          // Email: não precisa formatação
          tipoLabel = 'Email';
          chaveFormatada = chavePix;
          tagColor = 'purple';
          icon = <MailOutlined />;
        } else if (tipoChave === 3) {
          // CPF/CNPJ: identificar pelo tamanho
          const numeros = chavePix.replace(/\D/g, '');
          if (numeros.length === 11) {
            tipoLabel = 'CPF';
            chaveFormatada = formatarCPF(chavePix);
            tagColor = 'green';
            icon = <IdcardOutlined />;
          } else if (numeros.length === 14) {
            tipoLabel = 'CNPJ';
            chaveFormatada = formatarCNPJ(chavePix);
            tagColor = 'orange';
            icon = <IdcardOutlined />;
          } else {
            tipoLabel = 'CPF/CNPJ';
            chaveFormatada = chavePix;
            tagColor = 'default';
            icon = <IdcardOutlined />;
          }
        } else if (tipoChave === 4) {
          // Chave Aleatória: geralmente UUID, não precisa formatação especial
          tipoLabel = 'Chave Aleatória';
          chaveFormatada = chavePix;
          tagColor = 'geekblue';
          icon = <SafetyOutlined />;
        }
        
        return (
          <Tooltip title={`Tipo: ${tipoLabel}`}>
            <Tag 
              color={tagColor} 
              icon={icon}
              style={{ 
                fontSize: "0.85rem", 
                fontFamily: 'monospace',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {chaveFormatada}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Colhedor",
      dataIndex: ["turmaResumo", "nomeColhedor"],
      key: "nomeColhedor",
      width: 200,
      render: (_, record) =>
        record.origemNome ? (
          <Text strong>{record.origemNome}</Text>
        ) : record.turmaResumo?.nomeColhedor ? (
          <Text strong>{record.turmaResumo.nomeColhedor}</Text>
        ) : (
          <Text type="secondary">Não identificado</Text>
        ),
    },
    {
      title: "Conta",
      key: "contaCorrente",
      width: 140,
      render: (_, record) => {
        const conta = record.contaCorrente;
        if (!conta) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space size="small">
            <BankOutlined style={{ color: "#059669" }} />
            <Text style={{ fontSize: "0.85rem" }}>
              {conta.agencia} / {conta.contaCorrente}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Qtd Colheitas",
      key: "quantidadeColheitasItem",
      width: 120,
      render: (_, record) => {
        const qtd = record.colheitasDoItem?.length || 0;
        return (
          <Text strong>{qtd}</Text>
        );
      },
      sorter: (a, b) => (a.colheitasDoItem?.length || 0) - (b.colheitasDoItem?.length || 0),
    },
    {
      title: "Valor Item",
      key: "valorItem",
      width: 140,
      render: (_, record) => {
        const valor = record.colheitasDoItem?.reduce((acc, c) => acc + (c.valorColheita || 0), 0) || 0;
        return (
          <Text strong style={{ color: "#059669" }}>
            R$ {formatCurrency(valor)}
          </Text>
        );
      },
      sorter: (a, b) => {
        const valA = a.colheitasDoItem?.reduce((acc, c) => acc + (c.valorColheita || 0), 0) || 0;
        const valB = b.colheitasDoItem?.reduce((acc, c) => acc + (c.valorColheita || 0), 0) || 0;
        return valA - valB;
      },
    },
    {
      title: "Estado BB",
      key: "estadoRequisicao",
      width: 140,
      render: (_, record) => {
        // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
        const estadoRequisicao = record.estadoRequisicaoAtual || record.estadoRequisicao;
        const mapeamento = mapearEstadoRequisicao(estadoRequisicao);

        return (
          <Tooltip title={mapeamento.tooltip}>
            <Tag color={mapeamento.color}>
              {estadoRequisicao ? `${estadoRequisicao} - ${mapeamento.label}` : mapeamento.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Criado em",
      dataIndex: "dataCriacao",
      key: "dataCriacao",
      width: 160,
      render: (data) =>
        data ? new Date(data).toLocaleString("pt-BR") : "-",
      sorter: (a, b) =>
        new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime(),
    },
    {
      title: "Operações",
      key: "operacoes",
      width: 200,
      render: (_, record) => {
        const usuarioCriacao = record.usuarioCriacao;
        const usuarioLiberacao = record.usuarioLiberacao;
        const dataLiberacao = record.dataLiberacao;
        const item = record.item;
        const usuarioCancelamento = item?.usuarioCancelamento;
        const dataCancelamento = item?.dataCancelamento;

        const operacoes = [];

        if (usuarioCriacao) {
          operacoes.push({
            tipo: "Criado",
            usuario: usuarioCriacao.nome,
            data: record.dataCriacao,
            cor: "#1890ff",
          });
        }

        if (usuarioLiberacao && dataLiberacao) {
          operacoes.push({
            tipo: "Liberado",
            usuario: usuarioLiberacao.nome,
            data: dataLiberacao,
            cor: "#52c41a",
          });
        }

        if (usuarioCancelamento && dataCancelamento) {
          operacoes.push({
            tipo: "Cancelado",
            usuario: usuarioCancelamento.nome,
            data: dataCancelamento,
            cor: "#ff4d4f",
          });
        }

        if (operacoes.length === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Tooltip
            title={
              <div>
                {operacoes.map((op, index) => (
                  <div key={index} style={{ marginBottom: "4px" }}>
                    <strong style={{ color: op.cor }}>{op.tipo}:</strong>{" "}
                    {op.usuario}
                    <br />
                    <span style={{ fontSize: "11px", color: "#8c8c8c" }}>
                      {new Date(op.data).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            }
          >
            <Space direction="vertical" size="small" style={{ fontSize: "12px" }}>
              {operacoes.map((op, index) => (
                <Tag key={index} color={op.cor} style={{ margin: 0 }}>
                  {op.tipo}: {op.usuario}
                </Tag>
              ))}
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Ações",
      key: "acoes",
      width: 140,
      render: (_, record) => {
        // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
        const estadoRequisicao = record.estadoRequisicaoAtual || record.estadoRequisicao;
        
        // Botão "Liberar" aparece quando:
        // - estadoRequisicao === 1 (dados consistentes, aguardando liberação)
        // - estadoRequisicao === 4 (aguardando liberação - pendente de ação pelo Conveniado)
        // - NÃO está liberado (estadoRequisicao !== 9) e NÃO está processado (estadoRequisicao !== 6)
        // Estados 1 e 4 são "aguardando", então podem ser liberados
        const podeLiberar =
          estadoRequisicao &&
          (estadoRequisicao === 1 || estadoRequisicao === 4) &&
          estadoRequisicao !== 9 &&
          estadoRequisicao !== 6;
        
        // Botão "Cancelar" aparece quando:
        // - estadoRequisicao === 1 (dados consistentes, ainda pode cancelar)
        // - estadoRequisicao === 4 (aguardando liberação, ainda pode cancelar)
        // - item existe (não é lote sem itens)
        // - NÃO está liberado (estadoRequisicao !== 9) - quando liberado, não pode mais cancelar
        // - NÃO está processado (estadoRequisicao !== 6) - quando processado, não pode mais cancelar
        const podeCancelar =
          record.item &&
          estadoRequisicao &&
          (estadoRequisicao === 1 || estadoRequisicao === 4) &&
          estadoRequisicao !== 9 &&
          estadoRequisicao !== 6;

        // Função para criar o menu de ações de visualização
        const getMenuContent = (record) => {
          const menuItems = [];
          
          // Opção: Consultar lote online
          menuItems.push({
            key: "consulta-online",
            label: (
              <Space>
                <EyeOutlined style={{ color: "#1890ff" }} />
                <span style={{ color: "#333" }}>Consultar Lote Online</span>
              </Space>
            ),
            onClick: () => {
              setLoteSelecionado(record);
              setModalConsultaOnlineOpen(true);
            },
          });

          // Opção: Consultar item online (apenas se for PIX)
          if (record.item) {
            const item = record.item;
            const tipoPagamento = record.tipoPagamentoApi || record.tipoPagamento;
            let identificadorPagamento = null;
            
            if (tipoPagamento === 'PIX' || tipoPagamento === 'pix') {
              identificadorPagamento = item.identificadorPagamento;
            } else if (tipoPagamento === 'BOLETO' || tipoPagamento === 'boleto') {
              identificadorPagamento = item.codigoIdentificadorPagamento;
            } else if (tipoPagamento === 'GUIA' || tipoPagamento === 'guia') {
              identificadorPagamento = item.codigoPagamento;
            } else {
              identificadorPagamento = item.identificadorPagamento || item.codigoIdentificadorPagamento || item.codigoPagamento;
            }
            
            // Só mostrar opção se for PIX (por enquanto, pois a API é GET /pix/:id)
            if (tipoPagamento === 'PIX' && identificadorPagamento) {
              menuItems.push({
                key: "consulta-individual",
                label: (
                  <Space>
                    <EyeOutlined style={{ color: "#722ed1" }} />
                    <span style={{ color: "#333" }}>Consultar Item Online</span>
                  </Space>
                ),
                onClick: () => {
                  setItemSelecionado({
                    identificadorPagamento: identificadorPagamento.toString(),
                    contaCorrenteId: record.contaCorrente?.id,
                  });
                  setModalConsultaItemIndividualOpen(true);
                },
              });
            }
          }

          return { items: menuItems };
        };

        return (
          <Space size="small">
            {/* Botões de ação diretos */}
            {podeLiberar && (
              <Tooltip title="Liberar pagamento">
                <Button
                  type="primary"
                  size="small"
                  loading={liberandoLoteId === record.numeroRequisicao}
                  onClick={() => {
                    setLoteSelecionado(record);
                    setModalDetalhesOpen(true);
                  }}
                  icon={<UnlockOutlined />}
                  style={{
                    backgroundColor: "#059669",
                    borderColor: "#059669",
                    minWidth: "32px",
                    height: "32px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Tooltip>
            )}
            {podeCancelar && (
              <Tooltip title="Cancelar pagamento">
                <Button
                  size="small"
                  loading={cancelandoLoteId === record.itemId}
                  icon={<StopOutlined />}
                  onClick={() => {
                    setLoteSelecionado(record);
                    setModalCancelamentoOpen(true);
                  }}
                  style={{
                    backgroundColor: "#ff4d4f",
                    borderColor: "#ff4d4f",
                    color: "#ffffff",
                    minWidth: "32px",
                    height: "32px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Tooltip>
            )}
            
            {/* Menu dropdown para opções de visualização */}
            <Dropdown
              menu={getMenuContent(record)}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                size="small"
                style={{
                  color: "#666666",
                  border: "none",
                  boxShadow: "none",
                }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#059669",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "1.500rem",
          }}
        >
          <DollarOutlined style={{ marginRight: 12, color: "#059669" }} />
          {isMobile ? "Pagamentos" : "Relatórios de Pagamentos"}
        </Title>
        <Text
          type="secondary"
          style={{
            fontSize: "14px",
            display: "block",
            textAlign: "left",
          }}
        >
          Visualize e analise os lotes de pagamentos enviados (turmas de colheita, funcionários, fornecedores), com filtros por origem, período e status.
        </Text>
      </Box>

      {/* Filtros - layout inspirado em Pedidos.js */}
      <Box
        sx={{
          p: isMobile ? 2 : 3,
          bgcolor: "#f9f9f9",
          borderRadius: 2,
          border: "1px solid #e8e8e8",
          mb: 0,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Text
            strong
            style={{
              color: "#2E7D32",
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            <FilterOutlined style={{ marginRight: 8 }} />
            Filtros de Busca
          </Text>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: isMobile ? 1 : 2,
            mb: 0,
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* Busca texto */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 250px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Buscar por lote, beneficiário ou conta:
            </Text>
            <SearchInput
              placeholder={
                isMobile
                  ? "Buscar..."
                  : "Buscar por lote, beneficiário ou conta..."
              }
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            />
          </Box>

          {/* Tipo de origem */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 220px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Tipo de origem:
            </Text>
            <Select
              value={tipoOrigem}
              onChange={setTipoOrigem}
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                marginBottom: 0,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              <Option value="TODOS">Todos</Option>
              <Option value="FUNCIONARIO">Funcionários</Option>
              <Option value="TURMA_COLHEITA">Turma de Colheita</Option>
              <Option value="FORNECEDOR">Fornecedores</Option>
            </Select>
          </Box>

          {/* Filtro por data de criação (RangePicker) */}
          <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 260px" } }}>
            <Text
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Data de criação do lote:
            </Text>
            <RangePicker
              value={dateRange}
              onChange={(values) => setDateRange(values || [])}
              placeholder={["Início", "Fim"]}
              format="DD/MM/YYYY"
              size={isMobile ? "small" : "middle"}
              style={{
                width: "100%",
                height: isMobile ? "32px" : "40px",
                marginBottom: 0,
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            />
          </Box>
        </Box>
      </Box>

      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: "#ffffff" }} />
            <span
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: isMobile ? "14px" : "16px",
              }}
            >
              Lotes de Pagamentos - Turmas de Colheita (PIX - API)
            </span>
          </Space>
        }
        style={{
          flex: 1,
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
        headStyle={{
          backgroundColor: "#059669",
          borderBottom: "2px solid #047857",
          color: "#ffffff",
          borderRadius: "8px 8px 0 0",
        }}
        bodyStyle={{ padding: isMobile ? 12 : 16 }}
      >
        <ResponsiveTable
          columns={columns}
          dataSource={itensFiltradosOrdenados}
          loading={loading}
          rowKey="itemId"
          minWidthMobile={1400}
          showScrollHint={true}
          expandable={{
            expandIcon: ({ expanded, onExpand, record }) => {
              const colheitas = record.colheitasDoItem || [];
              if (colheitas.length === 0) return null;
              
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
              const colheitas = record.colheitasDoItem || [];
              
              if (colheitas.length === 0) {
                return (
                  <div style={{ padding: "16px 24px", backgroundColor: "#fafafa" }}>
                    <Text type="secondary">Nenhuma colheita vinculada a este item.</Text>
                  </div>
                );
              }

              return (
                <div style={{ padding: "16px 24px", backgroundColor: "#fafafa" }}>
                  <Text strong style={{ marginBottom: 12, display: "block", fontSize: "14px", color: "#059669" }}>
                    Colheitas vinculadas a este item ({colheitas.length}):
                  </Text>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {colheitas.map((c, index) => (
                      <Card
                        key={c.id || index}
                        size="small"
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e8e8e8",
                          borderRadius: "6px",
                        }}
                        bodyStyle={{ padding: "12px" }}
                      >
                        <Space size="middle" wrap>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                              Pedido
                            </Text>
                            <Tag color="blue" style={{ fontFamily: 'monospace', marginTop: "4px" }}>
                              {c.pedidoNumero || '-'}
                            </Tag>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                              Cliente
                            </Text>
                            <Text strong style={{ display: "block", marginTop: "4px" }}>
                              {c.cliente || '-'}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                              Fruta
                            </Text>
                            <Text style={{ display: "block", marginTop: "4px" }}>
                              {c.frutaNome || '-'}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                              Quantidade
                            </Text>
                            <Text style={{ display: "block", marginTop: "4px" }}>
                              {c.quantidadeColhida || 0} {c.unidadeMedida || ''}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                              Valor
                            </Text>
                            <Text strong style={{ display: "block", marginTop: "4px", color: "#059669" }}>
                              R$ {formatCurrency(c.valorColheita || 0)}
                            </Text>
                          </div>
                          {c.dataColheita && (
                            <div>
                              <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                Data Colheita
                              </Text>
                              <Text style={{ display: "block", marginTop: "4px" }}>
                                {new Date(c.dataColheita).toLocaleDateString("pt-BR")}
                              </Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            },
          }}
        />
      </Card>

      {/* Modal de detalhes do lote e confirmação de liberação */}
      <LotePagamentosDetalhesModal
        open={modalDetalhesOpen}
        onClose={() => {
          if (!liberandoLoteId) {
            setModalDetalhesOpen(false);
            setLoteSelecionado(null);
          }
        }}
        lote={loteSelecionado}
        loadingLiberacao={!!liberandoLoteId}
        onConfirmLiberacao={async (lote) => {
          // Usar indicadorFloat 'S' (produção)
          await handleLiberarPagamento(lote.numeroRequisicao, 'S');
        }}
      />

      {/* Modal de detalhes do lote e confirmação de cancelamento */}
      <LotePagamentosDetalhesModal
        open={modalCancelamentoOpen}
        onClose={() => {
          if (!cancelandoLoteId) {
            setModalCancelamentoOpen(false);
            setLoteSelecionado(null);
          }
        }}
        lote={loteSelecionado}
        onConfirmCancelamento={handleCancelarItem}
        loadingCancelamento={!!cancelandoLoteId}
        mode="cancelamento"
      />

      {/* Modal de consulta online */}
      <ConsultaOnlineModal
        open={modalConsultaOnlineOpen}
        onClose={() => {
          setModalConsultaOnlineOpen(false);
          setLoteSelecionado(null);
        }}
        numeroRequisicao={loteSelecionado?.numeroRequisicao}
        contaCorrenteId={loteSelecionado?.contaCorrente?.id}
      />

      {/* Modal de consulta item individual */}
      <ConsultaItemIndividualModal
        open={modalConsultaItemIndividualOpen}
        onClose={() => {
          setModalConsultaItemIndividualOpen(false);
          setItemSelecionado(null);
        }}
        identificadorPagamento={itemSelecionado?.identificadorPagamento}
        contaCorrenteId={itemSelecionado?.contaCorrenteId}
      />
    </Box>
  );
};

export default Pagamentos;


