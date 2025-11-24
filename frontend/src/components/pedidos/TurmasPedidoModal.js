// src/components/pedidos/TurmasPedidoModal.js

import React, { useMemo } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  Table,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import moment from "moment";
import { formatarValorMonetario, capitalizeName, intFormatter } from "../../utils/formatters";

const { Text } = Typography;

const TurmasPedidoModal = ({ open, onClose, pedido }) => {
  // Agrupar turmas por turmaColheitaId e obter dados únicos
  // useMemo sempre executado para evitar erro de hooks condicionais
  const turmasUnicas = useMemo(() => {
    if (!pedido?.custosColheita || pedido.custosColheita.length === 0) return [];
    
    // Criar um mapa para agrupar por turmaColheitaId
    const turmasMap = new Map();
    
    pedido.custosColheita.forEach(custo => {
      const turmaId = custo.turmaColheitaId;
      if (!turmasMap.has(turmaId)) {
        turmasMap.set(turmaId, {
          id: custo.turmaColheita?.id || turmaId,
          turmaColheitaId: turmaId,
          nomeColhedor: custo.turmaColheita?.nomeColhedor || 'Não informado',
          chavePix: custo.turmaColheita?.chavePix,
          responsavelChavePix: custo.turmaColheita?.responsavelChavePix,
          observacoes: custo.turmaColheita?.observacoes,
          dataCadastro: custo.turmaColheita?.dataCadastro,
          custos: []
        });
      }
      
      // Adicionar custo à turma
      turmasMap.get(turmaId).custos.push(custo);
    });
    
    return Array.from(turmasMap.values());
  }, [pedido?.custosColheita]);

  if (!open || !pedido) return null;

  // Colunas da tabela de turmas
  const columns = [
    {
      title: "Colhedor",
      key: "nomeColhedor",
      width: 180,
      render: (_, record) => (
        <Text strong style={{ color: "#059669" }}>
          {capitalizeName(record.nomeColhedor)}
        </Text>
      ),
    },
    {
      title: "Fruta",
      key: "fruta",
      width: 150,
      render: (_, record) => {
        // Agrupar frutas únicas
        const frutasUnicas = [...new Set(record.custos.map(c => c.fruta?.nome).filter(Boolean))];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {frutasUnicas.map((nomeFruta, index) => (
              <Tag key={index} color="green" style={{ fontSize: 11 }}>
                {capitalizeName(nomeFruta)}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Quantidade Total",
      key: "quantidadeTotal",
      width: 140,
      align: "center",
      render: (_, record) => {
        const totalQuantidade = record.custos.reduce((sum, custo) => sum + (custo.quantidadeColhida || 0), 0);
        // Pegar unidade do primeiro custo (assumindo que todos têm a mesma)
        const unidade = record.custos[0]?.unidadeMedida || '';
        return (
          <Text strong style={{ color: "#1890ff" }}>
            {intFormatter(totalQuantidade)} {unidade}
          </Text>
        );
      },
    },
    {
      title: "Valor Total",
      key: "valorTotal",
      width: 120,
      align: "center",
      render: (_, record) => {
        const totalValor = record.custos.reduce((sum, custo) => sum + (custo.valorColheita || 0), 0);
        return (
          <Text strong style={{ color: "#059669" }}>
            {formatarValorMonetario(totalValor)}
          </Text>
        );
      },
    },
    {
      title: "Status Pagamento",
      key: "statusPagamento",
      width: 150,
      align: "center",
      render: (_, record) => {
        // Cada turma só pode colher uma fruta por pedido, então há apenas um custo
        const custo = record.custos && record.custos.length > 0 ? record.custos[0] : null;
        
        if (!custo) {
          return <Tag color="default">-</Tag>;
        }
        
        // Se pagamentoEfetuado === true, mostrar "Pago"
        if (custo.pagamentoEfetuado === true) {
          return (
            <Tooltip title="Pagamento efetuado">
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
                Pago
              </Tag>
            </Tooltip>
          );
        }
        
        // Se pagamentoEfetuado === false, mostrar statusPagamento
        const statusPagamento = custo.statusPagamento || 'PENDENTE';
        
        // Formatar texto do status
        const formatarStatus = (status) => {
          switch (status) {
            case 'PAGO':
              return 'Pago';
            case 'PROCESSANDO':
              return 'Processando';
            case 'PENDENTE':
              return 'Pendente';
            default:
              return status || 'Pendente';
          }
        };
        
        // Determinar cor e ícone baseado no status
        const getStatusConfig = (status) => {
          switch (status) {
            case 'PAGO':
              return { color: 'success', icon: <CheckCircleOutlined /> };
            case 'PROCESSANDO':
              return { 
                color: 'warning', 
                icon: <ClockCircleOutlined />,
                tooltip: 'Pagamento processando - Aguardando liberação no Banco do Brasil. O pagamento será concluído após a liberação e processamento pelo banco.'
              };
            case 'PENDENTE':
            default:
              return { 
                color: 'default', 
                icon: null,
                tooltip: 'Pagamento pendente'
              };
          }
        };
        
        const config = getStatusConfig(statusPagamento);
        const textoStatus = formatarStatus(statusPagamento);
        
        return (
          <Tooltip title={config.tooltip || textoStatus}>
            <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
              {textoStatus}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Chave PIX",
      key: "chavePix",
      width: 180,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {record.chavePix || '-'}
        </Text>
      ),
    },
  ];

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
          <UserOutlined style={{ marginRight: 8 }} />
          Turmas de Colheita
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
            <Text style={{ color: "#059669", fontWeight: 600 }}>{pedido.numeroPedido}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Cliente:</Text>
            <br />
            <Text>{capitalizeName(pedido.cliente?.nome)}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Data do Pedido:</Text>
            <br />
            <Text>{moment(pedido.dataPedido).format("DD/MM/YYYY")}</Text>
          </Col>
          <Col span={6}>
            <Text strong>Turmas:</Text>
            <br />
            <Text strong style={{ color: "#059669", fontSize: 16 }}>
              {turmasUnicas.length}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Lista de Turmas */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>
              Turmas ({turmasUnicas.length})
            </span>
          </Space>
        }
        style={{ border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
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
      >
        {turmasUnicas.length > 0 ? (
          <Table
            columns={columns}
            dataSource={turmasUnicas}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            tableLayout="fixed"
          />
        ) : (
          <Text type="secondary">Nenhuma turma de colheita vinculada a este pedido.</Text>
        )}
      </Card>
    </Modal>
  );
};

export default TurmasPedidoModal;

