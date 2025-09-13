// src/components/pedidos/VisualizarPedidoModal.js

import React from "react";
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
  TagOutlined
} from "@ant-design/icons";
import { formatarValorMonetario, numberFormatter } from "../../utils/formatters";
import { PDFButton } from "../common/buttons";
import moment from "moment";
import { showNotification } from "../../config/notificationConfig";

const { Title, Text, Paragraph } = Typography;

const VisualizarPedidoModal = ({
  open,
  onClose,
  pedido,
  loading = false,
}) => {
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

  // Função para obter configuração de status
  const getStatusConfig = (status) => {
    const configs = {
      PEDIDO_CRIADO: { color: 'blue', text: 'Pedido Criado' },
      AGUARDANDO_COLHEITA: { color: 'orange', text: 'Aguardando Colheita' },
      COLHEITA_REALIZADA: { color: 'green', text: 'Colheita Realizada' },
      AGUARDANDO_PRECIFICACAO: { color: 'purple', text: 'Aguardando Precificação' },
      PRECIFICACAO_REALIZADA: { color: 'cyan', text: 'Precificação Realizada' },
      AGUARDANDO_PAGAMENTO: { color: 'gold', text: 'Aguardando Pagamento' },
      PAGAMENTO_PARCIAL: { color: 'orange', text: 'Pagamento Parcial' },
      PAGAMENTO_REALIZADO: { color: 'lime', text: 'Pagamento Realizado' },
      PEDIDO_FINALIZADO: { color: 'success', text: 'Pedido Finalizado' },
      CANCELADO: { color: 'error', text: 'Cancelado' },
    };
    return configs[status] || { color: 'default', text: status };
  };

  // Função para lidar com exportação PDF
  const handleExportPDF = () => {
    showNotification("info", "Em Desenvolvimento", "A funcionalidade de exportação PDF ainda está em desenvolvimento.");
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
          {nome || '-'}
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
            {numberFormatter(qtd)} {unidade}
          </Text>
        );
      },
    },
    {
      title: 'Qtd. Real',
      key: 'quantidadeReal',
      width: 140,
      align: 'center',
      render: (_, record) => {
        // Só exibir se houver unidade de precificação
        if (!record.unidadePrecificada) return <Text>-</Text>;
        
        // Usar a unidade precificada
        const unidadePrecificada = record.unidadePrecificada;
        
        // Se tem unidade precificada diferente, mostrar a quantidade correspondente
        let qtd = record.quantidadeReal || 0;
        let unidade = unidadePrecificada;
        
        // Se existe quantidadeReal2 e unidadeMedida2, pode ser que seja a quantidade precificada
        if (record.quantidadeReal2 && record.unidadeMedida2 && 
            record.unidadePrecificada === record.unidadeMedida2) {
          qtd = record.quantidadeReal2;
        }
        
        return (
          <Text strong style={{ color: "#10b981" }}>
            {numberFormatter(qtd)} {unidade}
          </Text>
        );
      },
    },
    {
      title: 'Preço Unitário',
      dataIndex: 'valorUnitario',
      key: 'valorUnitario',
      width: 140,
      align: 'right',
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
      align: 'right',
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
          PIX: { color: "#52c41a", icon: "💳" },
          BOLETO: { color: "#1890ff", icon: "🧾" },
          TRANSFERENCIA: { color: "#722ed1", icon: "🏦" },
          DINHEIRO: { color: "#faad14", icon: "💰" },
          CHEQUE: { color: "#f5222d", icon: "📄" },
        };
        const config = metodos[metodo] || { color: "#666", icon: "💳" };
        return (
          <Tag color={config.color}>
            <span style={{ marginRight: 4 }}>{config.icon}</span>
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

  if (!pedido) return null;


  const statusConfig = getStatusConfig(pedido.status);

  return (
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
          <EyeOutlined style={{ marginRight: 8 }} />
          Visualizar Pedido #{pedido.numeroPedido}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <PDFButton
            onClick={handleExportPDF}
            size="large"
            tooltip="Exportar pedido para PDF"
          >
            Exportar PDF
          </PDFButton>
          <Button onClick={onClose} size="large">
            Fechar
          </Button>
        </div>
      }
      width={1200}
      centered
      destroyOnClose
      loading={loading}
      styles={{
        body: { 
          maxHeight: "calc(100vh - 200px)", 
          overflowY: "auto", 
          padding: "20px" 
        },
        header: { 
          backgroundColor: "#059669", 
          borderBottom: "2px solid #047857", 
          padding: 0 
        }
      }}
    >
      {/* Seção 1: Dados Básicos */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Básicos do Pedido</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          },
          body: { 
            padding: "16px 20px" 
          }
        }}
      >
        <Row gutter={[16, 12]}>
          <Col span={6}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>Número do Pedido:</Text>
            <br />
            <Text style={{ fontSize: "16px", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
              #{pedido.numeroPedido}
            </Text>
          </Col>
          <Col span={6}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>Status:</Text>
            <br />
            <Tag color={statusConfig.color} style={{ fontSize: "12px", padding: "4px 10px", fontWeight: "500", marginTop: "4px" }}>
              {statusConfig.text}
            </Tag>
          </Col>
          <Col span={6}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Data do Pedido:
            </Text>
            <br />
            <Text style={{ fontSize: "14px", marginTop: "4px" }}>{formatarData(pedido.dataPedido)}</Text>
          </Col>
          <Col span={6}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Data Prevista Colheita:
            </Text>
            <br />
            <Text style={{ fontSize: "14px", marginTop: "4px" }}>{formatarData(pedido.dataPrevistaColheita)}</Text>
          </Col>
        </Row>
        <Divider style={{ margin: "12px 0" }} />
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>
              <UserOutlined style={{ marginRight: 4 }} />
              Cliente:
            </Text>
            <br />
            <Text style={{ fontSize: "15px", fontWeight: "500", color: "#333", marginTop: "4px" }}>
              {pedido.cliente?.nome || '-'}
            </Text>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: "#059669", fontSize: "13px" }}>
              <FileTextOutlined style={{ marginRight: 4 }} />
              Observações:
            </Text>
            <br />
            <Paragraph style={{ 
              margin: "4px 0 0 0", 
              color: "#666", 
              fontSize: "14px",
              fontStyle: pedido.observacoes ? "normal" : "italic"
            }}>
              {pedido.observacoes || "Nenhuma observação registrada"}
            </Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Seção 2: Frutas do Pedido */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas do Pedido</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          } 
        }}
      >
        {pedido.frutasPedidos && pedido.frutasPedidos.length > 0 ? (
          <>
            {/* Subseção: Valores */}
            <Title level={5} style={{ color: "#059669", marginBottom: "8px", marginTop: "0" }}>
              <DollarOutlined style={{ marginRight: 8 }} />
              Valores
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
            <Table
              columns={frutasColumns}
              dataSource={pedido.frutasPedidos}
              rowKey="id"
              pagination={false}
              size="small"
              style={{ border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "24px" }}
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
                        padding: '12px 16px',
                        fontSize: '14px',
                        borderBottom: 'none',
                      }}
                    />
                  ),
                },
              }}
            />

            {/* Subseção: Áreas e Fitas */}
            <Title level={5} style={{ color: "#059669", marginBottom: "8px" }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Áreas e Fitas Vinculadas
            </Title>
            <Divider style={{ margin: "0 0 16px 0", borderColor: "#e8e8e8" }} />
            {pedido.frutasPedidos.map((frutaPedido, index) => (
              <div key={frutaPedido.id} style={{ marginBottom: "20px" }}>
                <div style={{ 
                  backgroundColor: "#f8fafc", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "8px", 
                  padding: "16px",
                  marginBottom: "12px"
                }}>
                  <Text strong style={{ color: "#059669", fontSize: "16px", display: "block", marginBottom: "12px" }}>
                    <AppleOutlined style={{ marginRight: 8 }} />
                    {frutaPedido.fruta?.nome}
                  </Text>
                  
                  <Row gutter={[16, 16]}>
                    {/* Áreas */}
                    <Col span={12}>
                      <Text strong style={{ color: "#059669", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        Áreas ({frutaPedido.areas?.length || 0})
                      </Text>
                      {frutaPedido.areas && frutaPedido.areas.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {frutaPedido.areas.map((area, areaIndex) => (
                            <div key={areaIndex} style={{ marginBottom: "4px" }}>
                              <Tag 
                                color={area.areaPropria ? "green" : area.areaFornecedor ? "blue" : "orange"}
                                style={{ marginBottom: "2px" }}
                              >
                                {area.areaPropria ? (
                                  <span>
                                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                                    {area.areaPropria.nome}
                                  </span>
                                ) : area.areaFornecedor ? (
                                  <span>
                                    <UserOutlined style={{ marginRight: 4 }} />
                                    {area.areaFornecedor.fornecedor?.nome} • {area.areaFornecedor.nome}
                                  </span>
                                ) : (
                                  <span style={{ color: "#f59e0b" }}>
                                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                                    Área pendente de definição
                                  </span>
                                )}
                              </Tag>
                              {/* Exibir observação apenas da primeira área (todas têm a mesma observação) */}
                              {areaIndex === 0 && area.observacoes && !area.observacoes.includes('Área a ser definida durante a colheita') && (
                                <div style={{ 
                                  fontSize: "11px", 
                                  color: "#666", 
                                  fontStyle: "italic",
                                  marginTop: "2px",
                                  paddingLeft: "4px"
                                }}>
                                  {area.observacoes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          Nenhuma área vinculada
                        </Text>
                      )}
                    </Col>

                    {/* Fitas */}
                    <Col span={12}>
                      <Text strong style={{ color: "#059669", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                        <TagOutlined style={{ marginRight: 4 }} />
                        Fitas ({frutaPedido.fitas?.length || 0})
                      </Text>
                      {frutaPedido.fitas && frutaPedido.fitas.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                          {frutaPedido.fitas.map((fita, fitaIndex) => (
                            <React.Fragment key={fitaIndex}>
                              {/* Conteúdo da fita em uma linha */}
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {/* Cor da fita */}
                                <div
                                  style={{
                                    width: 10,
                                    height: 10,
                                    backgroundColor: fita.fitaBanana?.corHex || '#52c41a',
                                    borderRadius: '50%',
                                    border: '1px solid #d9d9d9',
                                    flexShrink: 0
                                  }}
                                />
                                
                                {/* Nome da fita e quantidade */}
                                <span style={{ fontWeight: "600", color: "#333" }}>
                                  {fita.fitaBanana?.nome || 'Fita'} • {fita.quantidadeFita || 0} und
                                </span>
                                
                                {/* Área de origem */}
                                <span style={{ color: "#666" }}>
                                  <EnvironmentOutlined style={{ fontSize: "10px", color: "#10b981", marginRight: "2px" }} />
                                  {fita.controleBanana?.areaAgricola?.nome || 'Área não identificada'}
                                </span>
                                
                                {/* Observações com tooltip se existirem */}
                                {fita.observacoes && (
                                  <Tooltip title={fita.observacoes} placement="top">
                                    <span style={{ 
                                      color: "#8b5cf6",
                                      fontStyle: "italic",
                                      cursor: "pointer"
                                    }}>
                                      📝 {fita.observacoes.length > 10 
                                        ? `${fita.observacoes.substring(0, 10)}...` 
                                        : fita.observacoes
                                      }
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                              
                              {/* Divider vertical entre lotes de fitas */}
                              {fitaIndex < frutaPedido.fitas.length - 1 && (
                                <Divider type="vertical" style={{ height: "16px", margin: "0 4px" }} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          Nenhuma fita vinculada
                        </Text>
                      )}
                    </Col>
                  </Row>
                </div>
              </div>
            ))}
          </>
        ) : (
          <Empty 
            description="Nenhuma fruta cadastrada" 
            image={<AppleOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
          />
        )}
      </Card>

      {/* Seção 3: Dados de Colheita */}
      {(pedido.dataColheita || pedido.observacoesColheita || pedido.pesagem || pedido.nomeMotorista) && (
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados de Colheita</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              color: "#ffffff", 
              borderRadius: "8px 8px 0 0" 
            } 
          }}
        >
          <Row gutter={[16, 16]}>
            {/* Data da Colheita */}
            <Col span={6}>
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
            <Col span={6}>
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
            <Col span={6}>
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
            <Col span={6}>
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

      {/* Seção 4: Pagamentos e Precificação */}
      {(pedido.valorFinal || (pedido.pagamentosPedidos && pedido.pagamentosPedidos.length > 0)) && (
        <Card
          title={
            <Space>
              <CreditCardOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Pagamentos e Precificação</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ 
            header: { 
              backgroundColor: "#059669", 
              color: "#ffffff", 
              borderRadius: "8px 8px 0 0" 
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
              <Row gutter={[20, 16]} align="middle" style={{ marginBottom: "24px" }}>
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
                      {formatarValorMonetario(pedido?.valorFinal || 0)}
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
                      {formatarValorMonetario(pedido?.valorRecebido || 0)}
                    </Text>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: ((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0)) > 0 ? "#fef2f2" : "#f0fdf4", 
                    border: ((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0)) > 0 ? "2px solid #ef4444" : "2px solid #22c55e", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: ((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0)) > 0 ? "0 2px 8px rgba(239, 68, 68, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <CalendarOutlined style={{ 
                        fontSize: "24px", 
                        color: ((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0)) > 0 ? "#ef4444" : "#22c55e" 
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      VALOR RESTANTE
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: ((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0)) > 0 ? "#dc2626" : "#15803d",
                      display: "block"
                    }}>
                      {formatarValorMonetario((pedido?.valorFinal || 0) - (pedido?.valorRecebido || 0))}
                    </Text>
                  </div>
                </Col>
                
                <Col span={6}>
                  <div style={{ 
                    backgroundColor: (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 1) ? "#f0fdf4" : (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 0.5) ? "#fffbeb" : "#fef2f2", 
                    border: (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 1) ? "2px solid #22c55e" : (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 0.5) ? "2px solid #f59e0b" : "2px solid #ef4444", 
                    borderRadius: "12px", 
                    padding: "16px",
                    textAlign: "center",
                    boxShadow: (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 1)
                      ? "0 2px 8px rgba(34, 197, 94, 0.15)" 
                      : (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 0.5)
                        ? "0 2px 8px rgba(245, 158, 11, 0.15)" 
                        : "0 2px 8px rgba(239, 68, 68, 0.15)"
                  }}>
                    <div style={{ marginBottom: "8px" }}>
                      <InfoCircleOutlined style={{ 
                        fontSize: "24px", 
                        color: (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 1) ? "#22c55e" : (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 0.5) ? "#f59e0b" : "#ef4444"
                      }} />
                    </div>
                    <Text style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                      % PAGO
                    </Text>
                    <Text style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 1) ? "#15803d" : (pedido?.valorFinal && ((pedido?.valorRecebido || 0) / pedido.valorFinal) >= 0.5) ? "#d97706" : "#dc2626",
                      display: "block"
                    }}>
                      {pedido?.valorFinal ? (((pedido?.valorRecebido || 0) / pedido.valorFinal) * 100).toFixed(1) : 0}%
                    </Text>
                  </div>
                </Col>
              </Row>
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
              <Table
                columns={pagamentosColumns}
                dataSource={pedido.pagamentosPedidos}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ border: "1px solid #e8e8e8", borderRadius: "8px" }}
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
                          padding: '12px 16px',
                          fontSize: '14px',
                          borderBottom: 'none',
                        }}
                      />
                    ),
                  },
                }}
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
        </Card>
      )}

      {/* Seção 5: Informações do Sistema */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações do Sistema</span>
          </Space>
        }
        styles={{ 
          header: { 
            backgroundColor: "#059669", 
            color: "#ffffff", 
            borderRadius: "8px 8px 0 0" 
          } 
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Text strong style={{ color: "#059669" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Criado em:
            </Text>
            <br />
            <Text style={{ fontSize: "14px" }}>{formatarDataHora(pedido.createdAt)}</Text>
          </Col>
          <Col span={8}>
            <Text strong style={{ color: "#059669" }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Última atualização:
            </Text>
            <br />
            <Text style={{ fontSize: "14px" }}>{formatarDataHora(pedido.updatedAt)}</Text>
          </Col>
          <Col span={8}>
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
    </Modal>
  );
};

VisualizarPedidoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  loading: PropTypes.bool,
};

export default VisualizarPedidoModal;
