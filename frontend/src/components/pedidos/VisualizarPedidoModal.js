// src/components/pedidos/VisualizarPedidoModal.js

import React, { useState } from "react";
import { 
  Modal, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space, 
  Divider, 
  Table, 
  Empty,
  Button,
  Tooltip
} from "antd";
import PropTypes from "prop-types";
import {
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  AppleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  CarOutlined,
  CalculatorOutlined,
  BankOutlined,
  InfoCircleOutlined,
  TagOutlined,
  BuildOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  LinkOutlined
} from "@ant-design/icons";
import { formatarValorMonetario, numberFormatter, capitalizeName, intFormatter } from "../../utils/formatters";
import { PDFButton } from "../common/buttons";
import HistoricoPedidoModal from "./HistoricoPedidoModal";
import moment from "moment";
import { showNotification } from "../../config/notificationConfig";
import axiosInstance from "../../api/axiosConfig";
import { PixIcon, BoletoIcon, TransferenciaIcon } from "../Icons/PaymentIcons";
import useResponsive from "../../hooks/useResponsive";
import ResponsiveTable from "../common/ResponsiveTable";
import { getFruitIcon } from "../../utils/fruitIcons";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import CentralizedLoader from "../common/loaders/CentralizedLoader";

const { Title, Text, Paragraph } = Typography;

const VisualizarPedidoModal = ({
  open,
  onClose,
  pedido,
  loading = false,
}) => {
  // Hook de responsividade
  const { isMobile } = useResponsive();

  // Hook para cores de status centralizadas
  const { getStatusConfig } = usePedidoStatusColors();

  // Estado para controlar modal de histórico
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  
  // Estado para controlar loading do PDF
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Função para formatar datas
  const formatarData = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY");
  };

  // Função para formatar data e hora
  const formatarDataHora = (data) => {
    if (!data) return "-";
    return moment(data).format("DD/MM/YYYY HH:mm");
  };

  // Função para lidar com exportação PDF
  const handleExportPDF = async () => {
    if (!pedido?.id) {
      showNotification("error", "Erro", "Pedido não encontrado para gerar PDF.");
      return;
    }

    try {
      setLoadingPDF(true);
      
      // Fazer requisição para o endpoint de PDF
      // IMPORTANTE: Para ler headers com blob, precisamos garantir que o axios os exponha
      const response = await axiosInstance.get(`/api/pdf/pedido/${pedido.id}`, {
        responseType: 'blob', // Importante para receber o arquivo binário
        // Garantir que os headers sejam expostos
        transformResponse: [(data) => data], // Não transforma a resposta
      });

      // Extrair nome do arquivo do header Content-Disposition do backend
      let nomeArquivo = `pedido-${pedido.numeroPedido}.pdf`; // Fallback
      
      // Tentar diferentes formas de acessar o header
      const contentDisposition = 
        response.headers['content-disposition'] || 
        response.headers['Content-Disposition'];
      
      console.log('[Frontend PDF] Content-Disposition header:', contentDisposition);
      console.log('[Frontend PDF] Todos os headers disponíveis:', Object.keys(response.headers));
      
      if (contentDisposition) {
        // Primeiro tenta o formato RFC 5987 (filename*=UTF-8''...)
        let match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (match && match[1]) {
          nomeArquivo = decodeURIComponent(match[1]);
          console.log('[Frontend PDF] Nome extraído do filename*:', nomeArquivo);
        } else {
          // Fallback para o formato padrão (filename="...")
          match = contentDisposition.match(/filename="([^"]+)"/);
          if (!match) {
            match = contentDisposition.match(/filename=([^;]+)/);
          }
          if (match && match[1]) {
            nomeArquivo = match[1].replace(/['"]/g, '').trim();
            console.log('[Frontend PDF] Nome extraído do filename:', nomeArquivo);
          }
        }
      } else {
        console.warn('[Frontend PDF] Content-Disposition header não encontrado! Usando fallback.');
      }
      
      console.log('[Frontend PDF] Nome do arquivo final que será usado:', nomeArquivo);

      // Criar blob do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento <a> para download
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo; // Usa o nome do arquivo do backend
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
      
      showNotification("success", "PDF Gerado", "O PDF do pedido foi gerado e baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      
      // Tentar extrair mensagem de erro do response
      let errorMessage = "Erro ao gerar PDF do pedido.";
      
      if (error.response?.status === 404) {
        errorMessage = "Pedido não encontrado.";
      } else if (error.response?.status === 401) {
        errorMessage = "Sessão expirada. Por favor, faça login novamente.";
      } else if (error.response?.data) {
        // Se o erro vier como blob, tentar converter para texto
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir parsear, usar mensagem padrão
        }
      }
      
      showNotification("error", "Erro ao Gerar PDF", errorMessage);
    } finally {
      setLoadingPDF(false);
    }
  };

  // Colunas da tabela de valores das frutas
  const frutasColumns = [
    {
      title: 'Fruta',
      dataIndex: ['fruta', 'nome'],
      key: 'fruta',
      width: 150,
      render: (nome) => (
        <Text strong style={{ color: "#059669" }}>
          {capitalizeName(nome) || '-'}
        </Text>
      ),
    },
    {
      title: 'Qtd. Prevista',
      key: 'quantidadePrevista',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const qtd = record.quantidadePrevista || 0;
        const unidade = record.unidadeMedida1 || '';
        return (
          <Text type="secondary">
            {intFormatter(qtd)} {unidade}
          </Text>
        );
      },
    },
    {
      title: 'Qtd. Colhida',
      key: 'quantidadeColhida',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const qtdColhida = record.quantidadeReal || 0;
        const unidadeColhida = record.unidadeMedida1 || '';

        if (qtdColhida <= 0) {
          return <Text>-</Text>;
        }

        return (
          <Text strong style={{ color: "#10b981" }}>
            {intFormatter(qtdColhida)} {unidadeColhida}
          </Text>
        );
      },
    },
    {
      title: 'Qtd. Precificada',
      dataIndex: 'quantidadePrecificada',
      key: 'quantidadePrecificada',
      width: 140,
      align: 'center',
      render: (quantidade, record) => {
        if (!quantidade) return <Text>-</Text>;

        const unidade = record.unidadePrecificada || record.unidadeMedida1 || '';

        return (
          <Text strong style={{ color: "#059669" }}>
            {intFormatter(quantidade)} {unidade}
          </Text>
        );
      },
    },
    {
      title: 'Preço Unitário',
      dataIndex: 'valorUnitario',
      key: 'valorUnitario',
      width: 140,
      align: 'center',
      render: (preco) => (
        <Text strong style={{ color: preco ? "#059669" : "#999" }}>
          {preco ? formatarValorMonetario(preco) : '-'}
        </Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'valorTotal',
      key: 'valorTotal',
      width: 140,
      align: 'center',
      render: (total) => (
        <Text strong style={{ 
          color: total > 0 ? "#059669" : "#999",
          fontSize: "14px"
        }}>
          {total > 0 ? formatarValorMonetario(total) : '-'}
        </Text>
      ),
    },
  ];

  // Colunas da tabela de pagamentos
  const pagamentosColumns = [
    {
      title: 'Data',
      dataIndex: 'dataPagamento',
      key: 'dataPagamento',
      width: 90,
      render: (data) => (
        <Text>
          <CalendarOutlined style={{ marginRight: 4, color: "#059669" }} />
          {formatarData(data)}
        </Text>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'valorRecebido',
      key: 'valorRecebido',
      width: 100,
      align: 'left',
      render: (valor) => (
        <Text strong style={{ color: "#059669", fontSize: "14px" }}>
          {formatarValorMonetario(valor)}
        </Text>
      ),
    },
    {
      title: 'Método',
      dataIndex: 'metodoPagamento',
      key: 'metodoPagamento',
      width: 100,
      render: (metodo) => {
        const metodos = {
          PIX: { icon: <PixIcon width={16} height={16} /> },
          BOLETO: { icon: <BoletoIcon width={16} height={16} /> },
          TRANSFERENCIA: { icon: <TransferenciaIcon width={16} height={16} /> },
          DINHEIRO: { icon: "💰" },
          CHEQUE: { icon: "📄" },
        };
        const config = metodos[metodo] || { icon: <PixIcon width={16} height={16} /> };
        return (
          <Tag
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              color: '#333333',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
              cursor: 'default',
              minHeight: '28px'
            }}
          >
            {config.icon}
            {metodo}
          </Tag>
        );
      },
    },
    {
      title: 'Conta',
      dataIndex: 'contaDestino',
      key: 'contaDestino',
      width: 100,
      render: (conta) => (
        <Tag color="blue">
          <CreditCardOutlined style={{ marginRight: 4 }} />
          {conta || '-'}
        </Tag>
      ),
    },
    {
      title: 'Vale',
      dataIndex: 'referenciaExterna',
      key: 'referenciaExterna',
      width: 80,
      ellipsis: true,
      render: (ref) => ref || '-',
    },
    {
      title: 'Observações',
      dataIndex: 'observacoesPagamento',
      key: 'observacoesPagamento',
      width: 150,
      ellipsis: true,
      render: (observacoes) => {
        if (!observacoes) return <Text type="secondary">-</Text>;
        
        return (
          <Tooltip title={observacoes} placement="topLeft">
            <Text 
              style={{ 
                cursor: 'pointer',
                color: '#666',
                fontSize: '13px'
              }}
            >
              {observacoes.length > 20 
                ? `${observacoes.substring(0, 20)}...` 
                : observacoes
              }
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  const lancamentosVinculadosColumns = [
    {
      title: 'ID',
      dataIndex: 'lancamentoExtratoId',
      key: 'lancamentoExtratoId',
      width: 50,
      align: 'center',
      render: (value) => (
        <Tag color="#059669" style={{ fontWeight: 600 }}>
          #{value}
        </Tag>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: ['lancamentoExtrato', 'textoDescricaoHistorico'],
      key: 'descricao',
      align: 'left',
      width: 220,
      ellipsis: true,
      render: (_, record) => {
        const descricao =
          record.lancamentoExtrato?.textoDescricaoHistorico ||
          record.descricao ||
          '-';
        return (
          <Tooltip title={descricao} placement="topLeft">
            <Text style={{ fontSize: '0.75rem', color: '#374151' }}>
              {descricao}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Origem',
      dataIndex: ['lancamentoExtrato', 'nomeContrapartida'],
      key: 'origem',
      align: 'left',
      width: 200,
      ellipsis: true,
      render: (_, record) => {
        const informacao = record.lancamentoExtrato?.textoInformacaoComplementar
          || record.textoInformacaoComplementar;
        const { origem: origemInformada } = extrairInformacaoComplementar(informacao);

        const origem =
          origemInformada ||
          record.lancamentoExtrato?.nomeContrapartida ||
          record.nomeContrapartida ||
          '-';
        return (
          <Tooltip title={origem} placement="topLeft">
            <Text style={{ fontSize: '0.75rem', color: '#1f2937' }}>{origem}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Agência/Conta',
      dataIndex: 'agenciaConta',
      key: 'agenciaConta',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const agencia =
          record.lancamentoExtrato?.agenciaConta || record.agenciaConta;
        const conta =
          record.lancamentoExtrato?.numeroConta || record.numeroConta;
        if (!agencia && !conta) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Text style={{ fontSize: '0.75rem', color: '#0f172a' }}>
            {agencia || ''}{agencia && conta ? '/' : ''}{conta || ''}
          </Text>
        );
      },
    },
    {
      title: 'Valor Vinculado',
      dataIndex: 'valorVinculado',
      key: 'valorVinculado',
      width: 140,
      align: 'center',
      render: (valor) => (
        <Tag color="green" style={{ borderRadius: 999, fontSize: '0.75rem' }}>
          {formatarValorMonetario(valor)}
        </Tag>
      ),
    },
    {
      title: 'Categoria',
      dataIndex: ['lancamentoExtrato', 'categoriaOperacao'],
      key: 'categoriaOperacao',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const categoria = record.lancamentoExtrato?.categoriaOperacao;
        return (
          <Tag
            color="blue"
            style={{
              borderRadius: 999,
              fontSize: '0.75rem',
              padding: '4px 12px',
              textTransform: 'capitalize',
            }}
          >
            {formatarCategoriaOperacao(categoria)}
          </Tag>
        );
      },
    },
    {
      title: 'Data/Hora',
      key: 'dataHoraComplementar',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const informacao = record.lancamentoExtrato?.textoInformacaoComplementar
          || record.textoInformacaoComplementar;
        const { data, hora } = extrairInformacaoComplementar(informacao);

        if (!data && !hora) {
          const dataFallback = record.createdAt
            ? formatarDataHora(record.createdAt)
            : '-';
          return (
            <Space size={4} style={{ justifyContent: 'center' }}>
              <CalendarOutlined style={{ color: '#059669' }} />
              <Text>{dataFallback}</Text>
            </Space>
          );
        }

        return (
          <Space size={4} style={{ justifyContent: 'center' }}>
            <CalendarOutlined style={{ color: '#059669' }} />
            <Text>
              {data || '--/--'} {hora || '--:--'}
            </Text>
          </Space>
        );
      },
    },
  ];

  if (!open && !loading) return null;

  const statusConfig = pedido ? getStatusConfig(pedido.status) : null;
  const numeroPedido = pedido?.numeroPedido;

  const frutasComVinculos =
    pedido?.frutasPedidos?.filter(
      (frutaPedido) =>
        (frutaPedido.areas && frutaPedido.areas.length > 0) ||
        (frutaPedido.fitas && frutaPedido.fitas.length > 0),
    ) || [];

  const lancamentosVinculados = Array.isArray(pedido?.lancamentosExtratoVinculos)
    ? pedido.lancamentosExtratoVinculos
    : [];

  const totalLancamentosVinculados = lancamentosVinculados.reduce(
    (acc, item) => acc + (Number(item?.valorVinculado) || 0),
    0,
  );

  const formatarCategoriaOperacao = (categoria) => {
    if (!categoria) return '-';
    return categoria
      .toLowerCase()
      .split('_')
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  };

  const extrairInformacaoComplementar = (informacao) => {
    if (!informacao) {
      return { data: null, hora: null, origem: null };
    }

    const partes = informacao.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return { data: null, hora: null, origem: null };
    }

    const data = partes[0] || null;
    const hora = partes.length > 1 ? partes[1] : null;
    const restante = partes.slice(2);

    let origem = null;

    if (restante.length > 0) {
      const indicePrimeiroTokenComLetra = restante.findIndex((token) =>
        /[A-Za-zÀ-ÿ]/.test(token),
      );

      const tokensOrigem =
        indicePrimeiroTokenComLetra >= 0
          ? restante.slice(indicePrimeiroTokenComLetra)
          : restante;

      origem = tokensOrigem.join(' ').replace(/\s+/g, ' ').trim() || null;
    }

    return { data, hora, origem };
  };

  return (
    <>
      <Modal
        title={
          <span style={{ 
            color: "#ffffff", 
            fontWeight: "600", 
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}>
            <EyeOutlined style={{ marginRight: "0.5rem" }} />
            {numeroPedido
              ? isMobile
                ? `Pedido #${numeroPedido}`
                : `Visualizar Pedido #${numeroPedido}`
              : "Carregando pedido"}
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
            flexWrap: isMobile ? "wrap" : "nowrap"
          }}>
            <PDFButton
              onClick={handleExportPDF}
              loading={loadingPDF}
              disabled={loadingPDF || !pedido?.id}
              size={isMobile ? "small" : "large"}
              tooltip="Exportar pedido para PDF"
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
                fontSize: isMobile ? "0.75rem" : undefined,
              }}
            >
              Exportar PDF
            </PDFButton>
            <Button 
              onClick={onClose} 
              size={isMobile ? "small" : "large"}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
              }}
            >
              Fechar
            </Button>
          </div>
        }
        width={isMobile ? '95vw' : '90%'}
        style={{ maxWidth: isMobile ? '95vw' : "75rem" }}
        centered
        destroyOnClose
        loading={loading}
        styles={{
          body: { 
            maxHeight: "calc(100vh - 12.5rem)", 
            overflowY: "auto",
            overflowX: "hidden",
            padding: isMobile ? 12 : 20
          },
          header: { 
            backgroundColor: "#059669", 
            borderBottom: "0.125rem solid #047857", 
            padding: 0 
          },
          wrapper: { zIndex: 1200 },
          mask: { zIndex: 1200 }
        }}
      >
        {!pedido ? (
          <div
            style={{
              padding: isMobile ? 24 : 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isMobile ? 200 : 260,
            }}
          >
            <Empty
              description="Carregando dados do pedido..."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            {/* Seção 1: Dados Básicos */}
            <Card
              title={
                <Space>
                  <UserOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Dados Básicos do Pedido
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16,
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem"
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  borderBottom: "0.125rem solid #047857",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { 
                  padding: isMobile ? "12px" : "16px" 
                }
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>Número do Pedido:</Text>
                  <br />
                  <Text style={{ fontSize: isMobile ? "0.875rem" : "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                    #{pedido.numeroPedido}
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>Status:</Text>
                  <br />
                  <Tag color={statusConfig?.color} style={{ fontSize: "0.75rem", padding: "4px 10px", fontWeight: "500", marginTop: "4px" }}>
                    {statusConfig?.text}
                  </Tag>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    Data do Pedido:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>{formatarData(pedido.dataPedido)}</Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    Data Prevista Colheita:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>{formatarData(pedido.dataPrevistaColheita)}</Text>
                </Col>
              </Row>
              <Divider style={{ margin: isMobile ? "8px 0" : "12px 0" }} />
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
                <Col xs={24} sm={24} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    Cliente:
                  </Text>
                  <br />
                  <Text style={{ fontSize: isMobile ? "0.875rem" : "0.9375rem", fontWeight: "500", color: "#333", marginTop: "4px" }}>
                    {pedido.cliente?.nome || '-'}
                  </Text>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    Observações:
                  </Text>
                  <br />
                  <Paragraph style={{
                    margin: "4px 0 0 0",
                    color: "#666",
                    fontSize: "0.875rem",
                    fontStyle: pedido.observacoes ? "normal" : "italic"
                  }}>
                    {pedido.observacoes || "Nenhuma observação registrada"}
                  </Paragraph>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    Criado por:
                  </Text>
                  <br />
                  {pedido.usuarioCriador ? (
                    <Text
                      style={{
                        fontSize: "0.875rem",
                        color: "#059669",
                        marginTop: "4px",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontWeight: "500"
                      }}
                      onClick={() => setHistoricoModalOpen(true)}
                    >
                      {pedido.usuarioCriador.nome}
                    </Text>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={() => setHistoricoModalOpen(true)}
                      style={{
                        padding: "0",
                        height: "auto",
                        fontSize: "0.875rem",
                        color: "#8c8c8c"
                      }}
                    >
                      Ver Histórico
                    </Button>
                  )}
                </Col>
              </Row>
            </Card>

            {/* Seção 2: Frutas do Pedido */}
            <Card
              title={
                <Space>
                  <AppleOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Frutas do Pedido
                  </span>
                </Space>
              }
              style={{ 
                marginBottom: isMobile ? 12 : 16,
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem"
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  borderBottom: "0.125rem solid #047857",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { 
                  padding: isMobile ? "12px" : "16px" 
                }
              }}
            >
              {pedido.frutasPedidos && pedido.frutasPedidos.length > 0 ? (
                <>
                  {/* Subseção: Valores */}
                  <Title
                    level={5}
                    style={{
                      color: "#059669",
                      marginBottom: "8px",
                      marginTop: "0",
                    }}
                  >
                    <DollarOutlined style={{ marginRight: 8 }} />
                    Valores
                  </Title>
                  <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                  <ResponsiveTable
                    columns={frutasColumns}
                    dataSource={pedido.frutasPedidos}
                    rowKey="id"
                    pagination={false}
                    minWidthMobile={1000}
                    showScrollHint={true}
                    style={{
                      marginBottom: isMobile ? "16px" : "24px",
                    }}
                  />

                  {/* Subseção: Áreas e Fitas */}
                  <Title level={5} style={{ color: "#059669", marginBottom: "8px" }}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    Áreas e Fitas Vinculadas
                  </Title>
                  <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

                  {frutasComVinculos.length === 0 ? (
                    <Empty
                      description="Nenhuma fruta possui áreas ou fitas vinculadas"
                      image={
                        <EnvironmentOutlined
                          style={{ fontSize: 48, color: "#d9d9d9" }}
                        />
                      }
                    />
                  ) : (
                    frutasComVinculos.map((frutaPedido) => {
                      const fitas = frutaPedido.fitas || [];
                      const totalFitas = fitas.reduce(
                        (acc, fita) => acc + (fita.quantidadeFita || 0),
                        0,
                      );
                      const coresMap = new Map();
                      const areasFitasSet = new Set();

                      fitas.forEach((fita) => {
                        const corHex = (
                          fita.fitaBanana?.corHex || "#52c41a"
                        ).toUpperCase();
                        const nomeCor =
                          fita.fitaBanana?.nome || `Cor ${corHex}`;
                            const areaNome = capitalizeName(
                              fita.controleBanana?.areaAgricola?.nome ||
                                "Área não identificada",
                            );
                        areasFitasSet.add(areaNome);

                        if (!coresMap.has(corHex)) {
                          coresMap.set(corHex, {
                            corHex,
                            nome: nomeCor,
                            quantidade: 0,
                            areas: new Map(),
                          });
                        }

                        const agrupamento = coresMap.get(corHex);
                        const quantidadeFita = fita.quantidadeFita || 0;
                        agrupamento.quantidade += quantidadeFita;
                        const quantidadeAreaAtual =
                          agrupamento.areas.get(areaNome) || 0;
                        agrupamento.areas.set(
                          areaNome,
                          quantidadeAreaAtual + quantidadeFita,
                        );
                      });

                      const resumoFitas =
                        totalFitas > 0
                          ? `${totalFitas.toLocaleString(
                              "pt-BR",
                            )} fitas distribuídas em ${coresMap.size} ${
                              coresMap.size === 1 ? "cor" : "cores"
                            } em ${areasFitasSet.size} ${
                              areasFitasSet.size === 1 ? "área" : "áreas"
                            }`
                          : null;

                      const coresOrdenadas = Array.from(coresMap.values()).sort((a, b) =>
                        a.nome.localeCompare(b.nome, "pt-BR", {
                          sensitivity: "base",
                        }),
                      );

                      const areasFiltradas = frutaPedido.areas || [];

                      return (
                        <div key={frutaPedido.id} style={{ marginBottom: "20px" }}>
                          <div
                            style={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "16px",
                              marginBottom: "12px",
                            }}
                          >
                            <Text
                              strong
                              style={{
                                color: "#059669",
                                fontSize: "16px",
                                display: "block",
                                marginBottom: "12px",
                              }}
                            >
                              <span
                                style={{
                                  marginRight: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                }}
                              >
                                {getFruitIcon(frutaPedido.fruta?.nome, {
                                  width: 20,
                                  height: 20,
                                })}
                              </span>
                              {(() => {
                                const frutasMesmaCultura =
                                  pedido.frutasPedidos?.filter((outraFruta) => {
                                    if (!outraFruta.fruta || !frutaPedido.fruta) {
                                      return false;
                                    }
                                    return (
                                      outraFruta.fruta.culturaId ===
                                      frutaPedido.fruta.culturaId
                                    );
                                  }) || [];

                                const nomesSecundarios = frutasMesmaCultura
                                  .filter(
                                    (outraFruta) =>
                                      outraFruta.frutaId !== frutaPedido.frutaId,
                                  )
                                  .map((outraFruta) =>
                                    capitalizeName(outraFruta.fruta?.nome || ""),
                                  )
                                  .filter(Boolean);

                                const nomesFrutas = [
                                  capitalizeName(frutaPedido.fruta?.nome || ""),
                                  ...nomesSecundarios,
                                ].filter(Boolean);

                                return nomesFrutas.map((nome, index) => (
                                  <React.Fragment key={`${nome}-${index}`}>
                                    {index > 0 && (
                                      <span
                                        style={{
                                          margin: "0 6px",
                                          color: "#047857",
                                          fontWeight: 500,
                                        }}
                                      >
                                        •
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        color: "#059669",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {nome}
                                    </span>
                                  </React.Fragment>
                                ));
                              })()}
                            </Text>

                            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                              {/* Áreas */}
                              <Col xs={24} sm={24} md={12}>
                                <Text
                                  strong
                                  style={{
                                    color: "#059669",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                                  Áreas ({areasFiltradas.length || 0})
                                </Text>
                                {areasFiltradas && areasFiltradas.length > 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "8px",
                                    }}
                                  >
                                    {areasFiltradas.map((area, areaIndex) => (
                                      <div
                                        key={areaIndex}
                                        style={{ marginBottom: "4px" }}
                                      >
                                        <Tag
                                          color={
                                            area.areaPropria
                                              ? "green"
                                              : area.areaFornecedor
                                              ? "blue"
                                              : "orange"
                                          }
                                          style={{ marginBottom: "2px" }}
                                        >
                                          {area.areaPropria ? (
                                            <span>
                                              <EnvironmentOutlined
                                                style={{ marginRight: 4 }}
                                              />
                                              {capitalizeName(area.areaPropria.nome)}
                                              {(() => {
                                                const qtd =
                                                  area.quantidadeColhidaUnidade1 || 0;
                                                return (
                                                  qtd > 0 && (
                                                    <span
                                                      style={{
                                                        marginLeft: 6,
                                                        fontWeight: "600",
                                                        color: "#059669",
                                                      }}
                                                    >
                                                      (
                                                      {qtd.toLocaleString("pt-BR")}{" "}
                                                      {frutaPedido.unidadeMedida1})
                                                    </span>
                                                  )
                                                );
                                              })()}
                                            </span>
                                          ) : area.areaFornecedor ? (
                                            <span>
                                              <UserOutlined
                                                style={{ marginRight: 4 }}
                                              />
                                              {capitalizeName(
                                                area.areaFornecedor.fornecedor?.nome,
                                              )}{" "}
                                              • {capitalizeName(area.areaFornecedor.nome)}
                                              {(() => {
                                                const qtd =
                                                  area.quantidadeColhidaUnidade1 || 0;
                                                return (
                                                  qtd > 0 && (
                                                    <span
                                                      style={{
                                                        marginLeft: 6,
                                                        fontWeight: "600",
                                                        color: "#059669",
                                                      }}
                                                    >
                                                      (
                                                      {qtd.toLocaleString("pt-BR")}{" "}
                                                      {frutaPedido.unidadeMedida1})
                                                    </span>
                                                  )
                                                );
                                              })()}
                                            </span>
                                          ) : (
                                            <span style={{ color: "#f59e0b" }}>
                                              <InfoCircleOutlined
                                                style={{ marginRight: 4 }}
                                              />
                                              Área pendente de definição
                                            </span>
                                          )}
                                        </Tag>
                                        {areaIndex === 0 &&
                                          area.observacoes &&
                                          !area.observacoes.includes(
                                            "Área a ser definida durante a colheita",
                                          ) && (
                                            <div
                                              style={{
                                                fontSize: "11px",
                                                color: "#666",
                                                fontStyle: "italic",
                                                marginTop: "2px",
                                                paddingLeft: "4px",
                                              }}
                                            >
                                              {area.observacoes}
                                            </div>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Text
                                    type="secondary"
                                    style={{ fontStyle: "italic" }}
                                  >
                                    Nenhuma área vinculada
                                  </Text>
                                )}
                              </Col>

                              {/* Fitas */}
                              <Col xs={24} sm={24} md={12}>
                                <Text
                                  strong
                                  style={{
                                    color: "#059669",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    marginBottom: "8px",
                                  }}
                                >
                              <TagOutlined style={{ marginRight: 4 }} />
                              {resumoFitas
                                ? `Fitas • ${resumoFitas}`
                                : `Fitas (${fitas.length || 0})`}
                                </Text>
                                {fitas && fitas.length > 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                      }}
                                    >
                                      {coresOrdenadas.map((cor) => {
                                        const distribuicaoPorArea = Array.from(
                                          cor.areas.entries(),
                                        )
                                          .sort((a, b) =>
                                            a[0].localeCompare(b[0], "pt-BR", {
                                              sensitivity: "base",
                                            }),
                                          )
                                          .map(([areaNome, quantidade]) => {
                                            const quantidadeFormatada =
                                              quantidade.toLocaleString("pt-BR");
                                            const sufixo =
                                              quantidade === 1 ? "fita" : "fitas";
                                            return `${quantidadeFormatada} ${sufixo} na ${areaNome}`;
                                          })
                                          .join(", ");

                                        return (
                                          <div
                                            key={cor.corHex}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "8px",
                                              backgroundColor: "#f8fafc",
                                              border: "1px solid #e2e8f0",
                                              borderRadius: "8px",
                                              padding: "8px 12px",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: cor.corHex,
                                                border: "1px solid #94a3b8",
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                              }}
                                            />
                                            <div
                                              style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                flex: 1,
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontWeight: "600",
                                                  color: "#0f172a",
                                                }}
                                              >
                                              {capitalizeName(cor.nome)}
                                              </Text>
                                              <Text
                                                style={{
                                                  fontSize: "12px",
                                                  color: "#475569",
                                                }}
                                              >
                                                {distribuicaoPorArea}
                                              </Text>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <Text
                                    type="secondary"
                                    style={{ fontStyle: "italic" }}
                                  >
                                    Nenhuma fita vinculada
                                  </Text>
                                )}
                              </Col>
                            </Row>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                <Empty
                  description="Nenhuma fruta cadastrada"
                  image={
                    <AppleOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                  }
                />
              )}
            </Card>

            {/* Seção 3: Dados de Colheita */}
            {(pedido.dataColheita ||
              pedido.observacoesColheita ||
              pedido.pesagem ||
              pedido.nomeMotorista) && (
              <Card
                title={
                  <Space>
                    <CalendarOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      Dados de Colheita
                    </span>
                  </Space>
                }
                style={{ 
                  marginBottom: isMobile ? 12 : 16,
                  border: "0.0625rem solid #e8e8e8",
                  borderRadius: "0.5rem"
                }}
                styles={{ 
                  header: { 
                    backgroundColor: "#059669", 
                    color: "#ffffff", 
                    borderRadius: "0.5rem 0.5rem 0 0",
                    borderBottom: "0.125rem solid #047857",
                    padding: isMobile ? "6px 12px" : "8px 16px"
                  },
                  body: { 
                    padding: isMobile ? "12px" : "16px" 
                  }
                }}
              >
                <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                  {/* Data da Colheita */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalendarOutlined style={{ fontSize: "24px", color: "#2563eb", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>DATA COLHEITA</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.dataColheita ? moment(pedido.dataColheita).format('DD/MM/YYYY') : '-'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Pesagem */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalculatorOutlined style={{ fontSize: "24px", color: "#16a34a", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>PESAGEM</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.pesagem || 'Pesagem não informada'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Motorista */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#fefbef",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <UserOutlined style={{ fontSize: "24px", color: "#d97706", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>MOTORISTA</Text>
                        <Text style={{ 
                          fontSize: "14px", 
                          fontWeight: "600", 
                          color: "#1e293b",
                          display: "block",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {pedido.nomeMotorista || 'Motorista não informado'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Placas - Card combinado */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#fdf2f8",
                      border: "1px solid #fbcfe8",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CarOutlined style={{ fontSize: "24px", color: "#be185d", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>PLACAS</Text>
                        <div style={{ marginTop: "2px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {(pedido.placaPrimaria || pedido.placaSecundaria) ? (
                            <>
                              {pedido.placaPrimaria && (
                                <span>
                                  <Text style={{ fontSize: "12px", color: "#64748b" }}>1ª: </Text>
                                  <Text style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{pedido.placaPrimaria}</Text>
                                </span>
                              )}
                              {pedido.placaSecundaria && (
                                <span>
                                  <Text style={{ fontSize: "12px", color: "#64748b" }}>2ª: </Text>
                                  <Text style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{pedido.placaSecundaria}</Text>
                                </span>
                              )}
                            </>
                          ) : (
                            <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Placas não informadas</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Observações da Colheita - se existir */}
                {pedido.observacoesColheita && (
                  <div style={{ 
                    marginTop: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px"
                  }}>
                    <Text strong style={{ color: "#059669", display: "block", marginBottom: "8px" }}>
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      Observações da Colheita
                    </Text>
                    <Paragraph style={{ 
                      margin: 0, 
                      color: "#475569", 
                      fontStyle: "italic",
                      fontSize: "14px",
                      lineHeight: "1.5"
                    }}>
                      {pedido.observacoesColheita}
                    </Paragraph>
                  </div>
                )}
              </Card>
            )}

            {/* Seção 3.5: Custos de Colheita (Mão de Obra) */}
            {pedido.custosColheita && pedido.custosColheita.length > 0 && (
              <Card
                title={
                  <Space>
                    <UserOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      Custos de Colheita (Mão de Obra)
                    </span>
                  </Space>
                }
                style={{ 
                  marginBottom: isMobile ? 12 : 16,
                  border: "0.0625rem solid #e8e8e8",
                  borderRadius: "0.5rem"
                }}
                styles={{ 
                  header: { 
                    backgroundColor: "#059669", 
                    color: "#ffffff", 
                    borderRadius: "0.5rem 0.5rem 0 0",
                    borderBottom: "0.125rem solid #047857",
                    padding: isMobile ? "6px 12px" : "8px 16px"
                  },
                  body: { 
                    padding: isMobile ? "12px" : "16px" 
                  }
                }}
              >
                {/* Lista de Turmas com Scroll */}
                <div style={{
                  maxHeight: pedido.custosColheita.length > 5 ? "400px" : "auto",
                  overflowY: pedido.custosColheita.length > 5 ? "auto" : "visible",
                  marginBottom: "16px",
                  paddingRight: pedido.custosColheita.length > 5 ? "8px" : "0"
                }}>
                  {pedido.custosColheita.map((custo, index) => (
                    <div 
                      key={custo.id || index}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: index < pedido.custosColheita.length - 1 ? "12px" : "0"
                      }}
                    >
                      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]} align="middle">
                        {/* Turma */}
                        <Col xs={24} sm={12} md={8}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <UserOutlined style={{ fontSize: "18px", color: "#059669" }} />
                            <div>
                              <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block" }}>
                                TURMA / COLHEDOR
                              </Text>
                              <Text strong style={{ fontSize: "14px", color: "#1e293b", display: "block", marginTop: "2px" }}>
                                {capitalizeName(custo.turmaColheita?.nomeColhedor || 'Não informado')}
                              </Text>
                            </div>
                          </div>
                        </Col>

                        {/* Fruta */}
                        <Col xs={24} sm={12} md={5}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
                              {getFruitIcon(custo.fruta?.nome, { width: 18, height: 18 })}
                            </span>
                            <div>
                              <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block" }}>
                                FRUTA
                              </Text>
                              <Text strong style={{ fontSize: "14px", color: "#1e293b", display: "block", marginTop: "2px" }}>
                                {capitalizeName(custo.fruta?.nome || '-')}
                              </Text>
                            </div>
                          </div>
                        </Col>

                        {/* Quantidade */}
                        <Col xs={12} sm={8} md={5}>
                          <div>
                            <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block" }}>
                              QUANTIDADE
                            </Text>
                            <Text strong style={{ fontSize: "14px", color: "#1e293b", display: "block", marginTop: "2px" }}>
                              {intFormatter(custo.quantidadeColhida || 0)} {custo.unidadeMedida || ''}
                            </Text>
                          </div>
                        </Col>

                        {/* Valor */}
                        <Col xs={12} sm={8} md={6}>
                          <div>
                            <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block" }}>
                              VALOR
                            </Text>
                            <Text strong style={{ 
                              fontSize: "16px", 
                              color: "#059669", 
                              display: "block", 
                              marginTop: "2px",
                              fontWeight: "700"
                            }}>
                              {formatarValorMonetario(custo.valorColheita || 0)}
                            </Text>
                          </div>
                        </Col>
                      </Row>

                      {/* Observações - se existir */}
                      {custo.observacoes && (
                        <div style={{ 
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e2e8f0"
                        }}>
                          <Text style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                            Observações:
                          </Text>
                          <Text style={{ 
                            fontSize: "13px", 
                            color: "#475569", 
                            fontStyle: "italic",
                            marginLeft: "8px"
                          }}>
                            {custo.observacoes}
                          </Text>
                        </div>
                      )}

                      {/* Status de Pagamento */}
                      <div style={{ 
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        {custo.pagamentoEfetuado ? (
                          <>
                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: "16px" }} />
                            <Tag color="success" style={{ margin: 0 }}>Pagamento Efetuado</Tag>
                            {custo.dataPagamento && (
                              <Text style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                                em {formatarData(custo.dataPagamento)}
                              </Text>
                            )}
                          </>
                        ) : (
                          <>
                            <CloseCircleOutlined style={{ color: "#f59e0b", fontSize: "16px" }} />
                            <Tag color="warning" style={{ margin: 0 }}>Pagamento Pendente</Tag>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo - Fora do Scroll */}
                <div style={{
                  backgroundColor: "#ecfdf5",
                  border: "2px solid #10b981",
                  borderRadius: "12px",
                  padding: "20px",
                  marginTop: "16px"
                }}>
                  <Title level={5} style={{ 
                    color: "#059669", 
                    marginBottom: "16px", 
                    marginTop: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <CalculatorOutlined />
                    Resumo dos Custos de Colheita
                  </Title>
                  
                  <Row gutter={[16, 16]}>
                    {/* Total de Turmas */}
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                          QUANTIDADE DE TURMAS 
                        </Text>
                        <Text style={{ 
                          fontSize: "24px", 
                          fontWeight: "700", 
                          color: "#059669",
                          display: "block",
                          marginTop: "4px"
                        }}>
                          {pedido.custosColheita.length}
                        </Text>
                      </div>
                    </Col>

                    {/* Quantidade Total */}
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                          QUANTIDADE TOTAL
                        </Text>
                        {(() => {
                          // Agrupar quantidades por unidade de medida
                          const quantidadesPorUnidade = pedido.custosColheita.reduce((acc, custo) => {
                            const unidade = custo.unidadeMedida || 'Sem unidade';
                            if (!acc[unidade]) {
                              acc[unidade] = 0;
                            }
                            acc[unidade] += custo.quantidadeColhida || 0;
                            return acc;
                          }, {});

                          const unidades = Object.keys(quantidadesPorUnidade);

                          return (
                            <div style={{ 
                              marginTop: "4px",
                              display: "flex",
                              flexWrap: "wrap",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "12px"
                            }}>
                              {unidades.map((unidade, index) => (
                                <React.Fragment key={unidade}>
                                  <div style={{ 
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center"
                                  }}>
                                    <Text style={{ 
                                      fontSize: "24px", 
                                      fontWeight: "700", 
                                      color: "#059669",
                                      display: "block",
                                      lineHeight: "1"
                                    }}>
                                      {intFormatter(quantidadesPorUnidade[unidade])}
                                    </Text>
                                    <Text style={{ 
                                      fontSize: "11px", 
                                      color: "#64748b", 
                                      display: "block",
                                      marginTop: "4px"
                                    }}>
                                      {unidade}
                                    </Text>
                                  </div>
                                  {index < unidades.length - 1 && (
                                    <div style={{
                                      width: "6px",
                                      height: "6px",
                                      backgroundColor: "#94a3b8",
                                      borderRadius: "50%",
                                      flexShrink: 0
                                    }} />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </Col>

                    {/* Valor Total */}
                    <Col xs={24} sm={24} md={8}>
                      <div style={{ textAlign: "center" }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>
                          VALOR TOTAL
                        </Text>
                        <Text style={{ 
                          fontSize: "28px", 
                          fontWeight: "700", 
                          color: "#059669",
                          display: "block",
                          marginTop: "4px"
                        }}>
                          {formatarValorMonetario(
                            pedido.custosColheita.reduce((total, custo) => 
                              total + (custo.valorColheita || 0), 0
                            )
                          )}
                        </Text>
                      </div>
                    </Col>
                  </Row>

                  {/* Indicador de Pagamentos */}
                  <Divider style={{ margin: "16px 0" }} />
                  <Row gutter={[16, 8]}>
                    <Col xs={12}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CheckCircleOutlined style={{ color: "#10b981", fontSize: "16px" }} />
                        <Text style={{ fontSize: "13px", color: "#475569" }}>
                          <Text strong style={{ color: "#059669" }}>
                            {pedido.custosColheita.filter(c => c.pagamentoEfetuado).length}
                          </Text>
                          {' '}pagamento(s) efetuado(s)
                        </Text>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CloseCircleOutlined style={{ color: "#f59e0b", fontSize: "16px" }} />
                        <Text style={{ fontSize: "13px", color: "#475569" }}>
                          <Text strong style={{ color: "#d97706" }}>
                            {pedido.custosColheita.filter(c => !c.pagamentoEfetuado).length}
                          </Text>
                          {' '}pagamento(s) pendente(s)
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>
            )}

            {/* Seção 4: Pagamentos e Precificação */}
            {(pedido.valorFinal ||
              (pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0) ||
              lancamentosVinculados.length > 0) && (
              <Card
                title={
                  <Space>
                    <CreditCardOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      Pagamentos e Precificação
                    </span>
                  </Space>
                }
                style={{ 
                  marginBottom: isMobile ? 12 : 16,
                  border: "0.0625rem solid #e8e8e8",
                  borderRadius: "0.5rem"
                }}
                styles={{ 
                  header: { 
                    backgroundColor: "#059669", 
                    color: "#ffffff", 
                    borderRadius: "0.5rem 0.5rem 0 0",
                    borderBottom: "0.125rem solid #047857",
                    padding: isMobile ? "6px 12px" : "8px 16px"
                  },
                  body: { 
                    padding: isMobile ? "12px" : "16px" 
                  }
                }}
              >
                {/* Subseção: Resumo Financeiro */}
                {pedido.valorFinal && (
                  <>
                    <Title level={5} style={{ color: "#059669", marginBottom: "8px" }}>
                      <DollarOutlined style={{ marginRight: 8 }} />
                      Resumo Financeiro
                    </Title>
                    <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />

                    {(() => {
                      // =================================================
                      // LÓGICA DE CÁLCULO CENTRALIZADA
                      // =================================================
                      const valorTotalFrutas = pedido.frutasPedidos?.reduce((acc, fruta) => acc + (parseFloat(fruta.valorTotal) || 0), 0) || 0;
                      const frete = parseFloat(pedido.frete) || 0;
                      const icms = parseFloat(pedido.icms) || 0;
                      const desconto = parseFloat(pedido.desconto) || 0;
                      const avaria = parseFloat(pedido.avaria) || 0;
                      const valorRecebido = parseFloat(pedido.valorRecebido) || 0;

                      // Valor bruto do pedido (sem descontos/avarias)
                      const valorBrutoPedido = valorTotalFrutas + frete + icms;
                      
                      // Valor final líquido (considerando tudo) - deve ser igual ao pedido.valorFinal
                      const valorFinalPedido = valorBrutoPedido - desconto - avaria;

                      // Valor restante a ser pago
                      const valorRestante = valorFinalPedido - valorRecebido;

                      // Percentual pago sobre o valor líquido
                      const percentualPago = valorFinalPedido > 0 ? (valorRecebido / valorFinalPedido) * 100 : 0;
                      // =================================================

                      return (
                        <>
                          {/* LINHA DE DETALHES (FRETE, ICMS, DESCONTO, AVARIA) */}
                          <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]} style={{ marginBottom: isMobile ? "12px" : "16px" }}>
                            {/* Frete */}
                            <Col xs={12} sm={12} md={6}>
                              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                                <Text style={{ fontSize: "11px", color: "#166534", fontWeight: "600", display: "block" }}>FRETE</Text>
                                <Text style={{ fontSize: "14px", fontWeight: "700", color: "#15803d" }}>
                                  {`+ ${formatarValorMonetario(frete)}`}
                                </Text>
                              </div>
                            </Col>
                            {/* ICMS */}
                            <Col xs={12} sm={12} md={6}>
                              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                                <Text style={{ fontSize: "11px", color: "#166534", fontWeight: "600", display: "block" }}>ICMS</Text>
                                <Text style={{ fontSize: "14px", fontWeight: "700", color: "#15803d" }}>
                                  {`+ ${formatarValorMonetario(icms)}`}
                                </Text>
                              </div>
                            </Col>
                            {/* Desconto */}
                            <Col xs={12} sm={12} md={6}>
                              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                                <Text style={{ fontSize: "11px", color: "#991b1b", fontWeight: "600", display: "block" }}>DESCONTO</Text>
                                <Text style={{ fontSize: "14px", fontWeight: "700", color: "#b91c1c" }}>
                                  {`- ${formatarValorMonetario(desconto)}`}
                                </Text>
                              </div>
                            </Col>
                            {/* Avaria */}
                            <Col xs={12} sm={12} md={6}>
                              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                                <Text style={{ fontSize: "11px", color: "#991b1b", fontWeight: "600", display: "block" }}>AVARIA</Text>
                                <Text style={{ fontSize: "14px", fontWeight: "700", color: "#b91c1c" }}>
                                  {`- ${formatarValorMonetario(avaria)}`}
                                </Text>
                              </div>
                            </Col>
                          </Row>

                          {/* LINHA DE CARDS PRINCIPAIS */}
                          <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 16]} align="middle" style={{ marginBottom: isMobile ? "16px" : "24px" }}>
                            {/* VALOR TOTAL BRUTO */}
                            <Col xs={24} sm={12} md={6}>
                              <div style={{ backgroundColor: "#f0f9ff", border: "2px solid #0ea5e9", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)" }}>
                                <div style={{ marginBottom: "8px" }}><DollarOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} /></div>
                                <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>VALOR TOTAL</Text>
                                <Text style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                                  {formatarValorMonetario(valorBrutoPedido)}
                                </Text>
                              </div>
                            </Col>
                            
                            {/* VALOR RECEBIDO */}
                            <Col xs={24} sm={12} md={6}>
                              <div style={{ backgroundColor: "#f0fdf4", border: "2px solid #22c55e", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)" }}>
                                <div style={{ marginBottom: "8px" }}><BankOutlined style={{ fontSize: "24px", color: "#22c55e" }} /></div>
                                <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>VALOR RECEBIDO</Text>
                                <Text style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", display: "block" }}>
                                  {formatarValorMonetario(valorRecebido)}
                                </Text>
                              </div>
                            </Col>
                            
                            {/* VALOR RESTANTE */}
                            <Col xs={24} sm={12} md={6}>
                              <div style={{ backgroundColor: valorRestante > 0 ? "#fef2f2" : "#f0fdf4", border: valorRestante > 0 ? "2px solid #ef4444" : "2px solid #22c55e", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: valorRestante > 0 ? "0 2px 8px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)" }}>
                                <div style={{ marginBottom: "8px" }}><CalendarOutlined style={{ fontSize: "24px", color: valorRestante > 0 ? "#ef4444" : "#22c55e" }} /></div>
                                <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>VALOR RESTANTE</Text>
                                <Text style={{ fontSize: "20px", fontWeight: "700", color: valorRestante > 0 ? "#dc2626" : "#15803d", display: "block" }}>
                                  {formatarValorMonetario(valorRestante)}
                                </Text>
                              </div>
                            </Col>
                            
                            {/* % PAGO */}
                            <Col xs={24} sm={12} md={6}>
                              <div style={{ backgroundColor: percentualPago >= 100 ? "#f0fdf4" : percentualPago >= 50 ? "#fffbeb" : "#fef2f2", border: percentualPago >= 100 ? "2px solid #22c55e" : percentualPago >= 50 ? "2px solid #f59e0b" : "2px solid #ef4444", borderRadius: "12px", padding: "16px", textAlign: "center", boxShadow: percentualPago >= 100 ? "0 2px 8px rgba(34, 197, 94, 0.15)" : percentualPago >= 50 ? "0 2px 8px rgba(245, 158, 11, 0.15)" : "0 2px 8px rgba(239, 68, 68, 0.15)" }}>
                                <div style={{ marginBottom: "8px" }}><InfoCircleOutlined style={{ fontSize: "24px", color: percentualPago >= 100 ? "#22c55e" : percentualPago >= 50 ? "#f59e0b" : "#ef4444" }} /></div>
                                <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>% PAGO</Text>
                                <Text style={{ fontSize: "20px", fontWeight: "700", color: percentualPago >= 100 ? "#15803d" : percentualPago >= 50 ? "#d97706" : "#dc2626", display: "block" }}>
                                  {percentualPago.toFixed(1)}%
                                </Text>
                              </div>
                            </Col>
                          </Row>
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Subseção: Histórico de Pagamentos */}
                {pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0 ? (
                  <>
                    <Title level={5} style={{ color: "#059669", marginBottom: "8px" }}>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      Histórico de Pagamentos
                    </Title>
                    <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
                    <ResponsiveTable
                      columns={pagamentosColumns}
                      dataSource={pedido.pagamentosPedidos}
                      rowKey="id"
                      pagination={false}
                      minWidthMobile={900}
                      showScrollHint={true}
                    />
                  </>
                ) : (
                  pedido.valorFinal && (
                    <Empty 
                      description="Nenhum pagamento registrado" 
                      image={<CreditCardOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
                      style={{ marginTop: "20px" }}
                    />
                  )
                )}

                {lancamentosVinculados.length > 0 && (
                  <>
                    <Divider style={{ margin: "24px 0 16px 0", borderColor: "#e8e8e8" }} />

                    <Title level={5} style={{ color: "#059669", marginBottom: "8px" }}>
                      <LinkOutlined style={{ marginRight: 8 }} />
                      Lançamentos Vinculados
                    </Title>

                    <Space size={[12, 12]} wrap style={{ marginBottom: 16 }}>
                      <Tag
                        color="green"
                        style={{
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontWeight: 600,
                          backgroundColor: "#ecfdf5",
                          border: "1px solid #bbf7d0",
                          color: "#047857",
                        }}
                      >
                        {lancamentosVinculados.length} vínculo(s)
                      </Tag>
                      <Tag
                        color="orange"
                        style={{
                          borderRadius: 999,
                          padding: "4px 12px",
                          fontWeight: 600,
                          backgroundColor: "#fff7ed",
                          border: "1px solid #fed7aa",
                          color: "#9a3412",
                        }}
                      >
                        Total vinculado: {formatarValorMonetario(totalLancamentosVinculados)}
                      </Tag>
                    </Space>

                    <ResponsiveTable
                      columns={lancamentosVinculadosColumns}
                      dataSource={lancamentosVinculados}
                      rowKey={(item) => item.id || `${item.lancamentoExtratoId}-${item.createdAt}`}
                      pagination={false}
                      minWidthMobile={880}
                      showScrollHint
                    />
                  </>
                )}
              </Card>
            )}

            {/* Seção 5: Dados Complementares (apenas para clientes indústria) */}
            {pedido.cliente?.industria && (
              <Card
                title={
                  <Space>
                    <BuildOutlined style={{ color: "#ffffff" }} />
                    <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                      Dados Complementares
                    </span>
                  </Space>
                }
                style={{ 
                  marginBottom: isMobile ? 12 : 16,
                  border: "0.0625rem solid #e8e8e8",
                  borderRadius: "0.5rem"
                }}
                styles={{ 
                  header: { 
                    backgroundColor: "#059669", 
                    color: "#ffffff", 
                    borderRadius: "0.5rem 0.5rem 0 0",
                    borderBottom: "0.125rem solid #047857",
                    padding: isMobile ? "6px 12px" : "8px 16px"
                  },
                  body: { 
                    padding: isMobile ? "12px" : "16px" 
                  }
                }}
              >
                <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                  {/* Data de Entrada */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalendarOutlined style={{ fontSize: "24px", color: "#2563eb", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>DATA ENTRADA</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.indDataEntrada ? moment(pedido.indDataEntrada).format('DD/MM/YYYY') : '-'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Data de Descarga */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalendarOutlined style={{ fontSize: "24px", color: "#16a34a", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>DATA DESCARGA</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.indDataDescarga ? moment(pedido.indDataDescarga).format('DD/MM/YYYY') : '-'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Peso Médio */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#fefbef",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalculatorOutlined style={{ fontSize: "24px", color: "#d97706", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>PESO MÉDIO</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.indPesoMedio ? `${formatarValorMonetario(pedido.indPesoMedio)} KG` : '-'}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Média em Mililitros */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{
                      backgroundColor: "#fdf2f8",
                      border: "1px solid #fbcfe8",
                      borderRadius: "8px",
                      padding: "12px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <CalculatorOutlined style={{ fontSize: "24px", color: "#be185d", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>MÉDIA ML</Text>
                        <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", display: "block", marginTop: "2px" }}>
                          {pedido.indMediaMililitro ? `${formatarValorMonetario(pedido.indMediaMililitro)} ML` : '-'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Número da Nota Fiscal - Card separado para ocupar toda a largura */}
                <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
                  <Col span={24}>
                    <div style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px"
                    }}>
                      <div style={{
                        backgroundColor: "#059669",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <FileTextOutlined style={{ fontSize: "24px", color: "#ffffff" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", display: "block" }}>
                          NÚMERO DA NOTA FISCAL
                        </Text>
                        <Text style={{ 
                          fontSize: "18px", 
                          fontWeight: "700", 
                          color: "#059669", 
                          display: "block", 
                          marginTop: "4px",
                          fontFamily: "monospace"
                        }}>
                          {pedido.indNumeroNf ? `#${pedido.indNumeroNf}` : 'Não informado'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Seção 6: Informações do Sistema */}
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Informações do Sistema
                  </span>
                </Space>
              }
              style={{ 
                border: "0.0625rem solid #e8e8e8",
                borderRadius: "0.5rem"
              }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  color: "#ffffff", 
                  borderRadius: "0.5rem 0.5rem 0 0",
                  borderBottom: "0.125rem solid #047857",
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: { 
                  padding: isMobile ? "12px" : "16px" 
                }
              }}
            >
              <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669" }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    Criado em:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem" }}>{formatarDataHora(pedido.createdAt)}</Text>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ color: "#059669" }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    Última atualização:
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.875rem" }}>{formatarDataHora(pedido.updatedAt)}</Text>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Text strong style={{ color: "#059669" }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    ID do Pedido:
                  </Text>
                  <br />
                  <Text style={{ 
                    fontFamily: "monospace", 
                    fontSize: "12px", 
                    color: "#666",
                    backgroundColor: "#f5f5f5",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #e0e0e0"
                  }}>
                    {pedido.id}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Modal de Histórico */}
            <HistoricoPedidoModal
              open={historicoModalOpen}
              onClose={() => setHistoricoModalOpen(false)}
              historico={pedido?.historicoCompleto || []}
              numeroPedido={pedido?.numeroPedido || ''}
            />
          </>
        )}
      </Modal>
      <CentralizedLoader
        visible={loading}
        message="Carregando pedido..."
        subMessage="Buscando dados atualizados do pedido"
      />
    </>
  );
};

VisualizarPedidoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
};

export default VisualizarPedidoModal;
