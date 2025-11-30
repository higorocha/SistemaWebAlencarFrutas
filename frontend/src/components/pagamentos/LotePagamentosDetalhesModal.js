// src/components/pagamentos/LotePagamentosDetalhesModal.js

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Empty,
  Tooltip,
} from "antd";
import {
  DollarOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UnlockOutlined,
  StopOutlined,
  AppleOutlined,
  MessageOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ResponsiveTable from "../common/ResponsiveTable";
import { formatCurrency, capitalizeName, capitalizeNameShort, formatarCPF } from "../../utils/formatters";
import useResponsive from "../../hooks/useResponsive";
import { PrimaryButton } from "../common/buttons";
import { getFruitIcon } from "../../utils/fruitIcons";
import { mapearEstadoRequisicao } from "../../utils/bbEstadoRequisicao";

const { Text } = Typography;

const LotePagamentosDetalhesModal = ({
  open,
  onClose,
  onAfterClose,
  lote,
  onConfirmLiberacao,
  onConfirmCancelamento,
  loadingLiberacao = false,
  loadingCancelamento = false,
  mode = "liberacao", // "liberacao" ou "cancelamento"
}) => {
  const { isMobile } = useResponsive();
  
  // Detectar tipo de origem do lote
  const origemTipo = lote?.origemTipo || 'TURMA_COLHEITA';
  const isFolhaPagamento = origemTipo === 'FOLHA_PAGAMENTO';
  
  // Extrair colheitas (para TURMA_COLHEITA)
  const colheitas = useMemo(() => {
    if (isFolhaPagamento) return [];
    return lote?.colheitas || [];
  }, [lote, isFolhaPagamento]);
  
  // Extrair funcionários (para FOLHA_PAGAMENTO)
  const funcionarios = useMemo(() => {
    if (!isFolhaPagamento || !lote?.itensPagamento) return [];
    
    return lote.itensPagamento
      .map((item) => item.funcionarioPagamento)
      .filter((fp) => fp !== null && fp !== undefined)
      .map((fp) => ({
        id: fp.id,
        funcionario: fp.funcionario,
        folha: fp.folha,
        valorLiquido: fp.valorLiquido,
        valorBruto: fp.valorBruto,
        statusPagamento: fp.statusPagamento,
        meioPagamento: fp.meioPagamento,
        tipoContrato: fp.tipoContrato,
        referenciaNomeCargo: fp.referenciaNomeCargo,
        referenciaNomeFuncao: fp.referenciaNomeFuncao,
      }));
  }, [lote, isFolhaPagamento]);

  const statusLoteTag = () => {
    if (!lote) return null;
    
    // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
    const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
    
    if (estadoRequisicao !== null && estadoRequisicao !== undefined) {
      // Usar mapeamento do BB
      const mapeamento = mapearEstadoRequisicao(estadoRequisicao);
      return (
        <Tooltip title={mapeamento.tooltip}>
          <Tag color={mapeamento.color}>
            {estadoRequisicao ? `${estadoRequisicao} - ${mapeamento.label}` : mapeamento.label}
          </Tag>
        </Tooltip>
      );
    }
    
    // Fallback para status antigo se não tiver estadoRequisicao
    const s = (lote.status || "").toString().toUpperCase();
    let color = "default";
    let label = s;

    if (s === "PENDENTE") {
      color = "orange";
      label = "Pendente";
    } else if (s === "ENVIADO" || s === "PROCESSANDO") {
      color = "gold";
      label = "Processando";
    } else if (s === "CONCLUIDO" || s === "PARCIAL") {
      color = "green";
      label = s === "PARCIAL" ? "Parcial" : "Concluído";
    } else if (s === "REJEITADO" || s === "ERRO") {
      color = "red";
      label = s === "ERRO" ? "Erro" : "Rejeitado";
    }

    return <Tag color={color}>{label.toUpperCase()}</Tag>;
  };

  // Verificar se pode liberar o lote
  // Segue a mesma lógica do botão "Liberar" em Pagamentos.js
  const podeLiberar = () => {
    if (!lote) return false;
    
    // Usar estadoRequisicaoAtual se disponível, senão estadoRequisicao
    const estadoRequisicao = lote.estadoRequisicaoAtual || lote.estadoRequisicao;
    
    // Botão "Liberar" aparece quando:
    // - estadoRequisicao === 1 (dados consistentes, aguardando liberação)
    // - estadoRequisicao === 4 (aguardando liberação - pendente de ação pelo Conveniado)
    // - NÃO está liberado (estadoRequisicao !== 9) e NÃO está processado (estadoRequisicao !== 6)
    // - E, CRITICAMENTE, o lote AINDA NÃO FOI LIBERADO (não possui dataLiberacao)
    // Estados 1 e 4 são "aguardando", então podem ser liberados
    // IMPORTANTE: Verificar dataLiberacao para evitar liberar lotes já liberados
    // que voltaram para estado 4 após passar por estado 8 (sequência real do BB: 1,2,3 → 8 → 4 → 9/10 → 6/7)
    const pode =
      estadoRequisicao &&
      (estadoRequisicao === 1 || estadoRequisicao === 4) &&
      estadoRequisicao !== 9 &&
      estadoRequisicao !== 6 &&
      !lote.dataLiberacao; // Não permitir se já foi liberado anteriormente
    
    return !!pode;
  };

  // Colunas para tabela de funcionários (FOLHA_PAGAMENTO)
  const colunasFuncionarios = [
    {
      title: "Funcionário",
      key: "funcionario",
      width: 200,
      render: (_, record) => (
        <Text strong style={{ color: "#059669" }}>
          {capitalizeName(record.funcionario?.nome || '-')}
        </Text>
      ),
    },
    {
      title: "Chave PIX",
      key: "chavePix",
      width: 180,
      render: (_, record) => (
        record.funcionario?.chavePix ? (
          <Text style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {record.funcionario.chavePix}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: "Responsável pela Chave PIX",
      key: "responsavelChavePix",
      width: 200,
      render: (_, record) => (
        record.funcionario?.responsavelChavePix ? (
          <Text>
            {capitalizeName(record.funcionario.responsavelChavePix)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: "Cargo/Função",
      key: "cargoFuncao",
      width: 180,
      render: (_, record) => {
        const tipoContrato = record.tipoContrato;
        if (tipoContrato === 'MENSALISTA' && record.referenciaNomeCargo) {
          return <Text>{capitalizeName(record.referenciaNomeCargo)}</Text>;
        } else if (tipoContrato === 'DIARISTA' && record.referenciaNomeFuncao) {
          return <Text>{capitalizeName(record.referenciaNomeFuncao)}</Text>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Tipo Contrato",
      key: "tipoContrato",
      width: 120,
      render: (_, record) => (
        <Tag color={record.tipoContrato === 'MENSALISTA' ? 'blue' : 'cyan'}>
          {record.tipoContrato || '-'}
        </Tag>
      ),
    },
    {
      title: "Valor Bruto",
      dataIndex: "valorBruto",
      key: "valorBruto",
      width: 120,
      align: "right",
      render: (valor) => (
        <Text strong style={{ color: '#333' }}>
          {formatCurrency(valor || 0)}
        </Text>
      ),
    },
    {
      title: "Valor Líquido",
      dataIndex: "valorLiquido",
      key: "valorLiquido",
      width: 120,
      align: "right",
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor || 0)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "statusPagamento",
      key: "statusPagamento",
      width: 120,
      render: (status) => {
        const s = (status || "").toString().toUpperCase();
        if (!s) return <Tag>-</Tag>;

        let color = "default";
        let label = s;

        if (s === "PENDENTE") {
          color = "orange";
          label = "Pendente";
        } else if (s === "PROCESSANDO" || s === "ENVIADO") {
          color = "gold";
          label = s === "ENVIADO" ? "Enviado" : "Processando";
        } else if (s === "PAGO") {
          color = "green";
          label = "Pago";
        } else if (s === "REJEITADO") {
          color = "red";
          label = "Rejeitado";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Método",
      dataIndex: "meioPagamento",
      key: "meioPagamento",
      width: 120,
      render: (meio) => {
        if (!meio) return <Text type="secondary">-</Text>;
        let metodoFormatado = meio;
        if (meio === "PIX_API") {
          metodoFormatado = "PIX - API";
        } else if (meio === "PIX") {
          metodoFormatado = "PIX";
        } else if (meio === "ESPECIE") {
          metodoFormatado = "Espécie";
        }
        return <Tag color="blue">{metodoFormatado}</Tag>;
      },
    },
  ];

  // Colunas para tabela de colheitas (TURMA_COLHEITA)
  const colunasColheitas = [
    {
      title: "Pedido",
      dataIndex: "pedidoNumero",
      key: "pedidoNumero",
      width: 140,
      render: (numero) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {numero || '-'}
        </Tag>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      width: 200,
      ellipsis: true,
      render: (cliente) => capitalizeNameShort(cliente || ''),
    },
    {
      title: "Placa",
      dataIndex: "placaPrimaria",
      key: "placaPrimaria",
      width: 140,
      render: (placa) => (
        placa ? placa.toUpperCase() : '-'
      ),
    },
    {
      title: "Fruta",
      dataIndex: "frutaNome",
      key: "frutaNome",
      width: 180,
      render: (nome) => (
        <Space>
          {getFruitIcon(nome, { width: 20, height: 20 })}
          <span style={{ fontWeight: '500' }}>{capitalizeName(nome || '')}</span>
        </Space>
      ),
    },
    {
      title: "Quantidade",
      key: "quantidade",
      width: 130,
      render: (_, record) => (
        <Text strong>
          {(record.quantidadeColhida || 0).toLocaleString('pt-BR')} {record.unidadeMedida || '-'}
        </Text>
      ),
    },
    {
      title: "Valor",
      dataIndex: "valorColheita",
      key: "valorColheita",
      width: 110,
      render: (valor) => (
        <Text strong style={{ color: '#059669' }}>
          {formatCurrency(valor || 0)}
        </Text>
      ),
    },
    {
      title: "Data Colheita",
      dataIndex: "dataColheita",
      key: "dataColheita",
      width: 140,
      render: (data) => (
        data ? new Date(data).toLocaleDateString('pt-BR') : '-'
      ),
    },
    {
      title: "Status",
      dataIndex: "statusPagamento",
      key: "statusPagamento",
      width: 110,
      render: (status) => {
        const s = (status || "").toString().toUpperCase();
        if (!s) return <Tag>-</Tag>;

        let color = "default";
        let label = s;

        if (s === "PENDENTE") {
          color = "orange";
          label = "Pendente";
        } else if (s === "PROCESSANDO") {
          color = "gold";
          label = "Processando";
        } else if (s === "PAGO") {
          color = "green";
          label = "Pago";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Método",
      dataIndex: "formaPagamento",
      key: "formaPagamento",
      width: 120,
      render: (forma) =>
        forma ? <Tag color="blue">{forma}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: "Observações",
      dataIndex: "observacoes",
      key: "observacoes",
      width: 120,
      render: (obs) => (
        obs ? (
          <Tooltip title={obs}>
            <MessageOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        ) : '-'
      ),
    },
  ];

  const handleOk = () => {
    if (mode === "cancelamento" && onConfirmCancelamento && lote) {
      onConfirmCancelamento(lote);
    } else if (mode === "liberacao" && onConfirmLiberacao && lote) {
      onConfirmLiberacao(lote);
    }
  };

  const isLoading = mode === "cancelamento" ? loadingCancelamento : loadingLiberacao;
  const okText = mode === "cancelamento" ? "Confirmar cancelamento" : "Confirmar liberação";
  
  // Formatar datas do período da folha (igual ao ArhFolhaPagamento.js)
  const formatarDataPeriodo = (folha) => {
    if (!folha?.dataInicial || !folha?.dataFinal) {
      return "";
    }
    
    const dataInicial = new Date(folha.dataInicial);
    const dataFinal = new Date(folha.dataFinal);
    
    const formatarData = (data) => {
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };
    
    return ` • ${formatarData(dataInicial)} - ${formatarData(dataFinal)}`;
  };

  // Formatar título com informações da folha para FOLHA_PAGAMENTO
  const getTitle = () => {
    const baseTitle = mode === "cancelamento" ? "Cancelar Lote de Pagamentos" : "Detalhes do Lote de Pagamentos";
    
    if (isFolhaPagamento && funcionarios.length > 0 && funcionarios[0].folha) {
      const folha = funcionarios[0].folha;
      const mes = String(folha.competenciaMes).padStart(2, '0');
      const ano = folha.competenciaAno;
      const periodo = folha.periodo;
      
      const folhaInfo = `${mes}/${ano} - ${periodo}ª Quinzena${formatarDataPeriodo(folha)}`;
      
      return `${baseTitle} - Folha: ${folhaInfo}`;
    }
    
    return baseTitle;
  };
  
  const title = getTitle();
  const titleIcon = mode === "cancelamento" ? <StopOutlined /> : <UnlockOutlined />;

  const handleClose = () => {
    onClose();
    // Chamar callback após fechar para atualizar dados
    if (onAfterClose) {
      setTimeout(() => {
        onAfterClose();
      }, 100);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
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
          {titleIcon && <span style={{ marginRight: "0.5rem" }}>{titleIcon}</span>}
          {title}
        </span>
      }
      width={isMobile ? '95vw' : 1600}
      style={{ maxWidth: isMobile ? '95vw' : 1600 }}
      centered
      destroyOnClose
      maskClosable={!isLoading}
      styles={{
        body: {
          maxHeight: "calc(100vh - 12.5rem)",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? 12 : 20,
        },
        header: {
          backgroundColor: "#059669",
          borderBottom: "0.125rem solid #047857",
          padding: 0,
        },
        wrapper: { zIndex: 1200 },
        mask: { zIndex: 1200 }
      }}
    >
      {lote ? (
        <>
          {/* Card de Informações do Lote */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                  Informações do Lote
                </span>
              </Space>
            }
            style={{
              marginBottom: isMobile ? 12 : 16,
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
                padding: isMobile ? "6px 12px" : "8px 16px"
              },
              body: {
                padding: isMobile ? "12px" : "16px"
              }
            }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  Lote / Requisição:
                </Text>
                <br />
                <Text style={{ fontSize: isMobile ? "0.875rem" : "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  #{lote.numeroRequisicao}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Criado em:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                  {lote.dataCriacao
                    ? new Date(lote.dataCriacao).toLocaleString("pt-BR")
                    : "-"}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Status do lote:
                </Text>
                <br />
                <div style={{ marginTop: "4px" }}>
                  {statusLoteTag()}
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <BankOutlined style={{ marginRight: 4 }} />
                  Conta utilizada:
                </Text>
                <br />
                {lote.contaCorrente ? (
                  <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                    Ag. <Text strong>{lote.contaCorrente.agencia}</Text> / Cc.{" "}
                    <Text strong>{lote.contaCorrente.contaCorrente}</Text>
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: "0.875rem", marginTop: "4px" }}>-</Text>
                )}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  {isFolhaPagamento ? "Valor total dos funcionários:" : "Valor total das colheitas:"}
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  R$ {formatCurrency(
                    isFolhaPagamento 
                      ? (lote.valorTotalFuncionarios || 0)
                      : (lote.valorTotalColheitas || 0)
                  )}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  Valor enviado ao BB:
                </Text>
                <br />
                <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                  R$ {formatCurrency(lote.valorTotalEnviado || 0)}
                </Text>
              </Col>
              {/* Informações da Folha para FOLHA_PAGAMENTO */}
              {isFolhaPagamento && funcionarios.length > 0 && funcionarios[0].folha && (
                <>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      Folha de Pagamento:
                    </Text>
                    <br />
                    <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                      {(() => {
                        const folha = funcionarios[0].folha;
                        const mes = String(folha.competenciaMes).padStart(2, '0');
                        const ano = folha.competenciaAno;
                        const periodo = folha.periodo;
                        return `${mes}/${ano} - ${periodo}ª Quinzena`;
                      })()}
                    </Text>
                  </Col>
                  {funcionarios[0].folha.dataInicial && funcionarios[0].folha.dataFinal && (
                    <Col xs={24} sm={12} md={8}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        Período da Folha:
                      </Text>
                      <br />
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                        {(() => {
                          const folha = funcionarios[0].folha;
                          const dataInicial = new Date(folha.dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          const dataFinal = new Date(folha.dataFinal).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          return `${dataInicial} a ${dataFinal}`;
                        })()}
                      </Text>
                    </Col>
                  )}
                </>
              )}
              {/* Informações do Beneficiário para TURMA_COLHEITA */}
              {!isFolhaPagamento && (
                <>
                  {/* Nome do Colhedor */}
                  {(lote.turmaResumo?.nomeColhedor || lote.origemNome) && (
                    <Col xs={24} sm={12} md={8}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        Beneficiário (Colhedor):
                      </Text>
                      <br />
                      <Text style={{ fontSize: "0.875rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                        {capitalizeName(lote.turmaResumo?.nomeColhedor || lote.origemNome || '-')}
                      </Text>
                    </Col>
                  )}
                  {/* Chave PIX - buscar do item de pagamento ou turmaResumo */}
                  {(() => {
                    const chavePix = lote.itensPagamento?.[0]?.chavePixEnviada || lote.turmaResumo?.chavePix || null;
                    return chavePix ? (
                      <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                          <BankOutlined style={{ marginRight: 4 }} />
                          Chave PIX:
                        </Text>
                        <br />
                        <Text style={{ fontSize: "0.875rem", fontFamily: 'monospace', marginTop: "4px" }}>
                          {chavePix}
                        </Text>
                      </Col>
                    ) : null;
                  })()}
                  {/* Responsável pela Chave PIX */}
                  {lote.turmaResumo?.responsavelChavePix && (
                    <Col xs={24} sm={12} md={8}>
                      <Text strong style={{ color: "#059669", fontSize: "0.8125rem" }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        Responsável pela Chave PIX:
                      </Text>
                      <br />
                      <Text style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                        {capitalizeName(lote.turmaResumo.responsavelChavePix)}
                      </Text>
                    </Col>
                  )}
                </>
              )}
            </Row>
          </Card>

          {/* Card de Colheitas Vinculadas (TURMA_COLHEITA) */}
          {!isFolhaPagamento && (
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Colheitas Vinculadas
                  </span>
                </Space>
              }
              style={{
                marginBottom: isMobile ? 12 : 16,
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
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: {
                  padding: isMobile ? "12px" : "16px"
                }
              }}
            >
              {colheitas && colheitas.length > 0 ? (
                <ResponsiveTable
                  columns={colunasColheitas}
                  dataSource={colheitas}
                  rowKey="id"
                  minWidthMobile={1200}
                  showScrollHint={true}
                  pagination={false}
                />
              ) : (
                <Empty
                  description="Nenhuma colheita vinculada a este lote"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "40px" }}
                />
              )}
            </Card>
          )}

          {/* Card de Funcionários Vinculados (FOLHA_PAGAMENTO) */}
          {isFolhaPagamento && (
            <Card
              title={
                <Space>
                  <TeamOutlined style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff", fontWeight: "600", fontSize: "0.875rem" }}>
                    Funcionários Vinculados
                  </span>
                </Space>
              }
              style={{
                marginBottom: isMobile ? 12 : 16,
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
                  padding: isMobile ? "6px 12px" : "8px 16px"
                },
                body: {
                  padding: isMobile ? "12px" : "16px"
                }
              }}
            >
              {funcionarios && funcionarios.length > 0 ? (
                <ResponsiveTable
                  columns={colunasFuncionarios}
                  dataSource={funcionarios}
                  rowKey="id"
                  minWidthMobile={1200}
                  showScrollHint={true}
                  pagination={false}
                />
              ) : (
                <Empty
                  description="Nenhum funcionário vinculado a este lote"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: "40px" }}
                />
              )}
            </Card>
          )}

          {/* Footer com botões */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e8e8e8",
          }}>
            <Button
              onClick={handleClose}
              size={isMobile ? "middle" : "large"}
              disabled={isLoading}
              style={{
                height: isMobile ? "32px" : "40px",
                padding: isMobile ? "0 12px" : "0 16px",
              }}
            >
              Fechar
            </Button>
            {mode === "cancelamento" ? (
              <Button
                danger
                size={isMobile ? "middle" : "large"}
                loading={isLoading}
                onClick={handleOk}
                icon={<StopOutlined />}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                  color: "#ffffff",
                  fontWeight: "500",
                  borderRadius: "6px",
                }}
              >
                {okText}
              </Button>
            ) : (
              <PrimaryButton
                size={isMobile ? "middle" : "large"}
                loading={isLoading}
                onClick={handleOk}
                icon={<UnlockOutlined />}
                disabled={!podeLiberar()}
                style={{
                  height: isMobile ? "32px" : "40px",
                  padding: isMobile ? "0 12px" : "0 16px",
                }}
              >
                {okText}
              </PrimaryButton>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Empty
            description="Nenhum lote selecionado"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
    </Modal>
  );
};

LotePagamentosDetalhesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAfterClose: PropTypes.func,
  lote: PropTypes.object,
  onConfirmLiberacao: PropTypes.func,
  onConfirmCancelamento: PropTypes.func,
  loadingLiberacao: PropTypes.bool,
  loadingCancelamento: PropTypes.bool,
  mode: PropTypes.oneOf(["liberacao", "cancelamento"]),
};

export default LotePagamentosDetalhesModal;


