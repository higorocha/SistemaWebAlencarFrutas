// src/components/pedidos/PagamentoModal.js

import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Statistic,
  Tag,
  Table,
  Divider,
  Empty,
  Tooltip,
} from "antd";
import {
  CreditCardOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BankOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { formatarValorMonetario } from "../../utils/formatters";
import { PrimaryButton } from "../common/buttons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import NovoPagamentoModal from "./NovoPagamentoModal";

const { Title, Text } = Typography;

const PagamentoModal = ({
  open,
  onClose,
  pedido,
  loading,
  onNovoPagamento,
  onRemoverPagamento,
}) => {
  const [novoPagamentoModalOpen, setNovoPagamentoModalOpen] = useState(false);
  const [pagamentoEditando, setPagamentoEditando] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pagamentoParaRemover, setPagamentoParaRemover] = useState(null);

  // Buscar pagamentos quando modal abrir
  useEffect(() => {
    if (open && pedido?.id) {
      fetchPagamentos();
    }
  }, [open, pedido?.id]);

  const fetchPagamentos = async () => {
    try {
      setLoadingPagamentos(true);
      const response = await axiosInstance.get(`/api/pedidos/${pedido.id}/pagamentos`);
      
      // Garantir que seja um array
      const pagamentosArray = Array.isArray(response.data) ? response.data : Object.values(response.data || {});
      
      setPagamentos(pagamentosArray);
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      showNotification("error", "Erro", "Erro ao carregar pagamentos");
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const handleNovoPagamento = async (pagamentoData) => {
    try {
      await onNovoPagamento(pagamentoData);
      await fetchPagamentos(); // Recarregar lista interna
      setNovoPagamentoModalOpen(false);
      setPagamentoEditando(null);
      // Não mostrar mensagem aqui pois a página principal já mostra
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      throw error; // Re-throw para o modal tratar
    }
  };

  const handleEditarPagamento = (pagamento) => {
    setPagamentoEditando(pagamento);
    setNovoPagamentoModalOpen(true);
  };

  // Função para abrir modal de confirmação
  const handleAbrirConfirmacaoRemocao = (pagamento) => {
    setPagamentoParaRemover(pagamento);
    setConfirmModalOpen(true);
  };

  const handleRemoverPagamento = async () => {
    if (!pagamentoParaRemover) return;
    
    try {
      await onRemoverPagamento(pagamentoParaRemover.id);
      await fetchPagamentos(); // Recarregar lista interna
      setConfirmModalOpen(false);
      setPagamentoParaRemover(null);
      // Não exibir notificação aqui pois o componente pai já exibe
    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      showNotification("error", "Erro", "Erro ao remover pagamento");
    }
  };

  // Calcular valores consolidados
  // Usar o valorRecebido consolidado do pedido (mais confiável)
  const valorTotalRecebido = pedido?.valorRecebido || 0;
  const valorRestante = (pedido?.valorFinal || 0) - valorTotalRecebido;
  const percentualPago = pedido?.valorFinal ? (valorTotalRecebido / pedido.valorFinal) * 100 : 0;
  

  // Função para formatar datas de forma segura
  const formatarData = (date) => {
    if (!date) return "-";
    
    try {
      // Se já é uma string, tentar parsear
      if (typeof date === 'string') {
        // Formato do banco: '2025-09-03 03:00:00' ou '2025-09-03 23:18:38.057'
        // Converter para formato ISO se necessário
        let dateString = date;
        
        // Se não tem 'T' e tem espaço, adicionar 'T' para formato ISO
        if (dateString.includes(' ') && !dateString.includes('T')) {
          dateString = dateString.replace(' ', 'T');
        }
        
        // Se não tem timezone, adicionar 'Z' para UTC
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
          dateString += 'Z';
        }
        
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          console.warn('Data inválida após conversão:', dateString);
          return "-";
        }
        return parsedDate.toLocaleDateString("pt-BR");
      }
      
      // Se é um objeto Date
      if (date instanceof Date) {
        return date.toLocaleDateString("pt-BR");
      }
      
      // Tentar converter para Date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Data inválida recebida:', date);
        return "-";
      }
      
      return parsedDate.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data recebida:', date);
      return "-";
    }
  };

  // Colunas da tabela de pagamentos
  const columns = [
    {
      title: "Data",
      dataIndex: "dataPagamento",
      key: "dataPagamento",
      width: 100,
      render: (date) => formatarData(date),
    },
    {
      title: "Valor",
      dataIndex: "valorRecebido",
      key: "valorRecebido",
      width: 120,
      render: (valor) => (
        <Text strong style={{ color: "#059669" }}>
          {formatarValorMonetario(valor)}
        </Text>
      ),
    },
    {
      title: "Método",
      dataIndex: "metodoPagamento",
      key: "metodoPagamento",
      width: 120,
      render: (metodo) => {
        const metodos = {
          PIX: { color: "#52c41a", icon: "💳" },
          BOLETO: { color: "#1890ff", icon: "🧾" },
          TRANSFERENCIA: { color: "#722ed1", icon: "🏦" },
          DINHEIRO: { color: "#faad14", icon: "💰" },
          CHEQUE: { color: "#f5222d", icon: "📄" },
        };
        const config = metodos[metodo] || { color: "#666", icon: "💳" };
        return (
          <Tag color={config.color} icon={<span>{config.icon}</span>}>
            {metodo}
          </Tag>
        );
      },
    },
    {
      title: "Conta",
      dataIndex: "contaDestino",
      key: "contaDestino",
      width: 120,
      render: (conta) => (
        <Tag color="blue">
          <BankOutlined /> {conta}
        </Tag>
      ),
    },
    {
      // Coluna para exibir o número do vale (referência externa do pagamento)
      // Campo opcional que pode conter informações como número de vale, comprovante, etc.
      title: "Vale",
      dataIndex: "referenciaExterna",
      key: "referenciaExterna",
      width: 100,
      ellipsis: true,
      render: (ref) => ref || "-",
    },
    {
      title: "Ações",
      key: "acoes",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* Botão de informações com tooltip para exibir observações do pagamento */}
          {record.observacoesPagamento && (
            <Tooltip 
              title={record.observacoesPagamento} 
              placement="topLeft"
              overlayStyle={{ maxWidth: 300 }}
            >
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
          {/* Botão para editar o pagamento */}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditarPagamento(record)}
            title="Editar pagamento"
            style={{ color: '#52c41a' }}
          />
          {/* Botão para remover o pagamento */}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleAbrirConfirmacaoRemocao(record)}
            title="Remover pagamento"
          />
        </Space>
      ),
    },
  ];

  // Função para obter informações das frutas com unidade de precificação
  const getFrutasInfo = () => {
    if (!pedido?.frutasPedidos || pedido.frutasPedidos.length === 0) {
      return "Nenhuma fruta";
    }

    return pedido.frutasPedidos.map((fp) => {
      const unidadePrec = fp.unidadePrecificada || fp.unidadeMedida1;
      const quantidade = unidadePrec === fp.unidadeMedida2 ? fp.quantidadeReal2 : fp.quantidadeReal;
      return `${fp.fruta?.nome}: ${quantidade} ${unidadePrec}`;
    }).join(", ");
  };

  return (
    <>
      <Modal
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
            <CreditCardOutlined style={{ marginRight: 8 }} />
            Gestão de Pagamentos
          </span>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={1000}
        styles={{
          body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", padding: 20 },
          header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", padding: 0 },
          wrapper: { zIndex: 1000 }
        }}
        centered
        destroyOnClose
      >
        {pedido && (
          <>
            {/* Informações do Pedido */}
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Pedido</span>
                </Space>
              }
              style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
              styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>Pedido:</Text>
                  <br />
                  <Text>{pedido.numeroPedido}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>Cliente:</Text>
                  <br />
                  <Text>{pedido.cliente?.nome}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Frutas (Unidade de Precificação):</Text>
                  <br />
                  <Text>{getFrutasInfo()}</Text>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Status:</Text>
                  <br />
                  <Tag color={pedido.status === 'PAGAMENTO_PARCIAL' ? 'orange' : 'purple'}>
                    {pedido.status === 'PAGAMENTO_PARCIAL' ? 'Pagamento Parcial' : 'Aguardando Pagamento'}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text strong>Data do Pedido:</Text>
                  <br />
                  <Text>{formatarData(pedido.createdAt)}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Última Atualização:</Text>
                  <br />
                  <Text>{formatarData(pedido.updatedAt)}</Text>
                </Col>
              </Row>
            </Card>

            {/* Resumo Financeiro */}
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo Financeiro</span>
                </Space>
              }
              style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "2px solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "8px 8px 0 0",
                  padding: "12px 20px"
                },
                body: { padding: "20px" }
              }}
            >
              <Row gutter={[20, 16]} align="middle">
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: "#f0f9ff", 
                    border: "2px solid #0ea5e9", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <DollarOutlined style={{ fontSize: "24px", color: "#0ea5e9" }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR TOTAL
                    </Text>
                    <Text style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", display: "block" }}>
                      {formatarValorMonetario(pedido.valorFinal)}
                    </Text>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: "#f0fdf4", 
                    border: "2px solid #22c55e", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <BankOutlined style={{ fontSize: "24px", color: "#22c55e" }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RECEBIDO
                    </Text>
                    <Text style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", display: "block" }}>
                      {formatarValorMonetario(valorTotalRecebido)}
                    </Text>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: valorRestante > 0 ? "#fef2f2" : "#f0fdf4", 
                    border: valorRestante > 0 ? "2px solid #ef4444" : "2px solid #22c55e", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: valorRestante > 0 ? "0 2px 8px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <CalendarOutlined style={{ 
                        fontSize: "24px", 
                        color: valorRestante > 0 ? "#ef4444" : "#22c55e" 
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RESTANTE
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: valorRestante > 0 ? "#dc2626" : "#15803d",
                      display: "block"
                    }}>
                      {formatarValorMonetario(valorRestante)}
                    </Text>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: percentualPago >= 100 ? "#f0fdf4" : percentualPago >= 50 ? "#fffbeb" : "#fef2f2", 
                    border: percentualPago >= 100 ? "2px solid #22c55e" : percentualPago >= 50 ? "2px solid #f59e0b" : "2px solid #ef4444", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: percentualPago >= 100 
                      ? "0 2px 8px rgba(34, 197, 94, 0.15)" 
                      : percentualPago >= 50 
                        ? "0 2px 8px rgba(245, 158, 11, 0.15)" 
                        : "0 2px 8px rgba(239, 68, 68, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <InfoCircleOutlined style={{ 
                        fontSize: "24px", 
                        color: percentualPago >= 100 ? "#22c55e" : percentualPago >= 50 ? "#f59e0b" : "#ef4444"
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      % PAGO
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: percentualPago >= 100 ? "#15803d" : percentualPago >= 50 ? "#d97706" : "#dc2626",
                      display: "block"
                    }}>
                      {percentualPago.toFixed(1)}%
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Lista de Pagamentos */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600" }}>Pagamentos Realizados</span>
                </Space>
              }
              style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
              styles={{ 
                header: { 
                  backgroundColor: "#059669", 
                  borderBottom: "2px solid #047857", 
                  color: "#ffffff", 
                  borderRadius: "8px 8px 0 0",
                  padding: "8px 16px"
                },
                body: { padding: "12px 16px" }
              }}
              extra={
                <PrimaryButton
                  icon={<PlusCircleOutlined />}
                  onClick={() => setNovoPagamentoModalOpen(true)}
                  disabled={valorRestante <= 0}
                  size="middle"
                >
                  Novo Pagamento
                </PrimaryButton>
              }
            >
              {pagamentos.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={pagamentos}
                  rowKey="id"
                  pagination={false}
                  loading={loadingPagamentos}
                  size="small"
                  style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: "8px",
                  }}
                  components={{
                    header: {
                      cell: (props) => (
                        <th
                          {...props}
                          style={{
                            ...props.style,
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontWeight: 600,
                            padding: '8px 12px',
                            fontSize: '14px',
                            borderBottom: 'none',
                          }}
                        />
                      ),
                    },
                  }}
                />
              ) : (
                <Empty
                  description="Nenhum pagamento registrado"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>

            {/* Botões de Ação */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
              <Button 
                onClick={onClose} 
                disabled={loading}
                size="large"
              >
                Fechar
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal para Novo Pagamento */}
      <NovoPagamentoModal
        open={novoPagamentoModalOpen}
        onClose={() => {
          setNovoPagamentoModalOpen(false);
          setPagamentoEditando(null);
        }}
        onSave={handleNovoPagamento}
        pedido={pedido}
        valorRestante={valorRestante}
        loading={loading}
        pagamentoEditando={pagamentoEditando}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        title={
          <span style={{ 
            color: "#ffffff", 
            fontWeight: "600", 
            fontSize: "16px",
            backgroundColor: "#ef4444",
            padding: "12px 16px",
            margin: "-20px -24px 0 -24px",
            display: "block",
            borderRadius: "8px 8px 0 0",
          }}>
            <DeleteOutlined style={{ marginRight: 8 }} />
            Confirmar Exclusão
          </span>
        }
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPagamentoParaRemover(null);
        }}
        onOk={handleRemoverPagamento}
        okText="Sim, Remover"
        cancelText="Cancelar"
        okButtonProps={{ 
          danger: true,
          style: { backgroundColor: '#ef4444', borderColor: '#ef4444' }
        }}
        cancelButtonProps={{ style: { borderColor: '#d9d9d9' } }}
        width={500}
        styles={{
          header: { backgroundColor: "#ef4444", borderBottom: "2px solid #dc2626", padding: 0 },
          body: { padding: 20 }
        }}
        centered
      >
        {pagamentoParaRemover && (
          <div>
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>
              Tem certeza que deseja remover este pagamento?
            </p>
            <div style={{ 
              backgroundColor: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              marginBottom: "16px"
            }}>
              <p style={{ margin: 0, fontWeight: "600", color: "#dc2626" }}>
                Detalhes do Pagamento:
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#374151" }}>
                <strong>Valor:</strong> {formatarValorMonetario(pagamentoParaRemover.valorRecebido)}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Método:</strong> {pagamentoParaRemover.metodoPagamento}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Data:</strong> {formatarData(pagamentoParaRemover.dataPagamento)}
              </p>
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PagamentoModal;