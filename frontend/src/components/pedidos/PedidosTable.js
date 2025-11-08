// src/components/pedidos/PedidosTable.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import {
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
  Modal,
  message,
  Popconfirm,
  Empty,
  DatePicker,
} from "antd";
import ResponsiveTable from "../common/ResponsiveTable";
import FrutasPedidoModal from "./FrutasPedidoModal";
import TurmasPedidoModal from "./TurmasPedidoModal";
import VisualizarPedidoModal from "./VisualizarPedidoModal";
import usePedidoStatusColors from "../../hooks/usePedidoStatusColors";
import useCoresPorTempo from "../../hooks/useCoresPorTempo";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalculatorOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  AppleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatarValorMonetario, intFormatter, formatarNumero, capitalizeName } from "../../utils/formatters";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";

const { Text } = Typography;

// Styled components para tabela com tema personalizado - SEGUINDO PADRÃO DO SISTEMA
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 600;
    padding: 16px;
    font-size: 14px;
  }

  .ant-table-tbody > tr:nth-child(even) {
    background-color: #fafafa;
  }

  .ant-table-tbody > tr:nth-child(odd) {
    background-color: #ffffff;
  }

  .ant-table-tbody > tr:hover {
    background-color: #e6f7ff !important;
    cursor: pointer;
  }

  .ant-table-tbody > tr.ant-table-row-selected {
    background-color: #d1fae5 !important;
  }

  .ant-table-tbody > tr > td {
    padding: 12px 16px;
    font-size: 14px;
  }



  .ant-table-container {
    border-radius: 8px;
    overflow: hidden;
  }



  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    width: 100% !important;
    table-layout: fixed;
  }

  .ant-table-container {
    width: 100% !important;
  }

  .ant-table-thead > tr > th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-tbody > tr > td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ant-table-pagination.ant-pagination {
    margin: 16px 0;
    padding: 0 16px;
  }

  .ant-empty {
    padding: 40px 20px;
  }

  .ant-empty-description {
    color: #999;
  }
`;

const PedidosTable = ({ 
  pedidos, 
  loading = false, 
  onEdit, 
  onColheita, 
  onPrecificacao, 
  onPagamento,
  onPedidoRemovido,
  onResetPagination,
  onFilterDataPrevista,
  dataPrevistaFilterValue,
}) => {
  const [frutasModalOpen, setFrutasModalOpen] = useState(false);
  const [turmasModalOpen, setTurmasModalOpen] = useState(false);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Função para abrir modal de frutas
  const handleOpenFrutasModal = (pedido) => {
    setPedidoSelecionado(pedido);
    setFrutasModalOpen(true);
  };

  // Função para abrir modal de turmas
  const handleOpenTurmasModal = (pedido) => {
    setPedidoSelecionado(pedido);
    setTurmasModalOpen(true);
  };

  // Função para buscar pedido atualizado do banco
  const buscarPedidoAtualizado = async (pedidoId) => {
    try {
      const response = await axiosInstance.get(`/api/pedidos/${pedidoId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      showNotification("error", "Erro", "Erro ao carregar dados atualizados do pedido");
      return null;
    }
  };

  // Função para abrir modal de visualização
  const handleOpenVisualizarModal = async (pedido) => {
    // Buscar pedido atualizado do banco para garantir que todos os dados estejam presentes
    const pedidoAtualizado = await buscarPedidoAtualizado(pedido.id);
    if (pedidoAtualizado) {
      setPedidoSelecionado(pedidoAtualizado);
      setVisualizarModalOpen(true);
    }
  };

  // Função para abrir modal de confirmação de exclusão
  const handleAbrirConfirmacaoExclusao = (pedido) => {
    setPedidoParaExcluir(pedido);
    setConfirmDeleteModalOpen(true);
  };

  // Função para excluir pedido
  const handleExcluirPedido = async () => {
    if (!pedidoParaExcluir) return;
    
    try {
      setLoadingDelete(true);
      await axiosInstance.delete(`/api/pedidos/${pedidoParaExcluir.id}`);
      
      showNotification("success", "Sucesso", "Pedido excluído com sucesso!");
      
      // Notificar o componente pai para atualizar a lista
      if (onPedidoRemovido) {
        onPedidoRemovido(pedidoParaExcluir.id);
      }
      
      setConfirmDeleteModalOpen(false);
      setPedidoParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      
      // Tratar diferentes tipos de erro
      if (error.response?.status === 400) {
        showNotification("error", "Erro", error.response.data.message || "Não é possível excluir este pedido");
      } else if (error.response?.status === 404) {
        showNotification("error", "Erro", "Pedido não encontrado");
      } else {
        showNotification("error", "Erro", "Erro ao excluir pedido");
      }
    } finally {
      setLoadingDelete(false);
    }
  };

  // Função para obter configuração de status
  // Hook para cores de status centralizadas
  const { getStatusConfig } = usePedidoStatusColors();
  const { getCorPorData } = useCoresPorTempo();

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "-";
    return formatarValorMonetario(value);
  };

  // Função para formatar quantidade com lógica inteligente
  const formatQuantity = (quantidade, unidade) => {
    if (!quantidade) return '-';
    
    // Unidades que devem ser exibidas como inteiros
    const unidadesInteiras = ['UND', 'CX'];
    
    // Verificar se a unidade deve ser formatada como inteiro
    if (unidadesInteiras.includes(unidade)) {
      const quantidadeInteira = Math.round(quantidade);
      return `${intFormatter(quantidadeInteira)} ${unidade}`;
    }
    
    // Para outras unidades (KG, TON, ML, LT), usar formatação decimal
    return `${formatarNumero(quantidade)} ${unidade}`;
  };

  // Função para obter ações baseadas no status
  const getActionsForStatus = (record) => {
    const actions = [];

    // Visualizar sempre disponível
    actions.push(
      <Tooltip key="view" title="Visualizar detalhes">
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleOpenVisualizarModal(record)}
        />
      </Tooltip>
    );

    // Ações específicas por status
    // ✅ COLHEITA: Disponível para PEDIDO_CRIADO, AGUARDANDO_COLHEITA e COLHEITA_PARCIAL
    if (record.status === 'PEDIDO_CRIADO' || record.status === 'AGUARDANDO_COLHEITA' || record.status === 'COLHEITA_PARCIAL') {
      actions.push(
        <Tooltip key="colheita" title={record.status === 'COLHEITA_PARCIAL' ? 'Continuar colheita' : 'Registrar colheita'}>
          <Button
            icon={<ShoppingOutlined />}
            size="small"
            type="primary"
            onClick={() => onColheita(record)}
          />
        </Tooltip>
      );
    }

    // ✅ PRECIFICAÇÃO: Disponível apenas após COLHEITA_REALIZADA (não em COLHEITA_PARCIAL)
    if (record.status === 'COLHEITA_REALIZADA' || record.status === 'AGUARDANDO_PRECIFICACAO') {
      actions.push(
        <Tooltip key="precificacao" title="Definir preços">
          <Button
            icon={<DollarOutlined />}
            size="small"
            type="primary"
            style={{ backgroundColor: '#722ed1' }}
            onClick={() => onPrecificacao(record)}
          />
        </Tooltip>
      );
    }

    if (record.status === 'PRECIFICACAO_REALIZADA' || record.status === 'AGUARDANDO_PAGAMENTO' || record.status === 'PAGAMENTO_PARCIAL') {
      actions.push(
        <Tooltip key="pagamento" title="Registrar pagamento">
          <Button
            icon={<CreditCardOutlined />}
            size="small"
            type="primary"
            style={{ backgroundColor: '#faad14' }}
            onClick={() => onPagamento(record)}
          />
        </Tooltip>
      );
    }

    // Editar disponível para pedidos não finalizados
    if (record.status !== 'PEDIDO_FINALIZADO' && record.status !== 'CANCELADO') {
      actions.push(
        <Tooltip key="edit" title="Editar pedido">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          />
        </Tooltip>
      );
    }

    // ✅ EXCLUIR: Disponível para CANCELADO, PEDIDO_CRIADO, AGUARDANDO_COLHEITA e COLHEITA_PARCIAL
    if (record.status === 'CANCELADO' || record.status === 'PEDIDO_CRIADO' || record.status === 'AGUARDANDO_COLHEITA' || record.status === 'COLHEITA_PARCIAL') {
      actions.push(
        <Tooltip key="delete" title="Excluir pedido">
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleAbrirConfirmacaoExclusao(record)}
          />
        </Tooltip>
      );
    }

    return actions;
  };

  const columns = [
    {
      title: 'Nº Pedido',
      dataIndex: 'numeroPedido',
      key: 'numeroPedido',
      width: 100,
      align: 'left',
      sorter: (a, b) => a.numeroPedido.localeCompare(b.numeroPedido),
      render: (text) => (
        <Text strong style={{ color: '#059669' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 180,
      align: 'left',
      ellipsis: true,
      sorter: (a, b) => (a.cliente?.nome || '').localeCompare(b.cliente?.nome || ''),
      render: (text) => (
        <Text style={{ fontWeight: 500 }}>
          {capitalizeName(text) || '-'}
        </Text>
      ),
    },
    {
      title: 'Frutas',
      key: 'frutas',
      width: 120,
      align: 'left',
      ellipsis: true,
      render: (_, record) => {
        if (!record.frutasPedidos || record.frutasPedidos.length === 0) {
          return <Text>-</Text>;
        }
        
        // Se tiver apenas uma fruta, mostra badge simples
        if (record.frutasPedidos.length === 1) {
          return (
            <Tag color="green" style={{ cursor: 'default' }}>
              {capitalizeName(record.frutasPedidos[0].fruta?.nome || '-')}
            </Tag>
          );
        }
        
        // Se tiver múltiplas frutas, mostra badge clicável
        return (
          <Tooltip title="Clique para ver as frutas">
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleOpenFrutasModal(record)}
            >
              {record.frutasPedidos.length} frutas
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Placa',
      dataIndex: 'placaPrimaria',
      key: 'placaPrimaria',
      width: 100,
      align: 'center',
      render: (placa) => (
        <Text style={{ fontWeight: 500, fontSize: 13 }}>
          {placa ? placa.toUpperCase() : '-'}
        </Text>
      ),
    },
    {
      title: 'Turma',
      key: 'turma',
      width: 120,
      align: 'left',
      ellipsis: true,
      render: (_, record) => {
        // Verificar se há turmas (custos de colheita)
        if (!record.custosColheita || record.custosColheita.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        
        // Agrupar turmas únicas por turmaColheitaId
        const turmasUnicas = new Set();
        record.custosColheita.forEach(custo => {
          if (custo.turmaColheita?.nomeColhedor) {
            turmasUnicas.add(custo.turmaColheita.nomeColhedor);
          }
        });
        
        const turmasArray = Array.from(turmasUnicas);
        
        // Se tiver apenas uma turma, mostra badge simples
        if (turmasArray.length === 1) {
          return (
            <Tag color="purple" style={{ cursor: 'default' }}>
              {capitalizeName(turmasArray[0])}
            </Tag>
          );
        }
        
        // Se tiver múltiplas turmas, mostra badge clicável
        return (
          <Tooltip title="Clique para ver as turmas">
            <Tag 
              color="purple" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleOpenTurmasModal(record)}
            >
              {turmasArray.length} turmas
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Data Pedido',
      dataIndex: 'dataPedido',
      key: 'dataPedido',
      width: 90,
      align: 'left',
      sorter: (a, b) => moment(a.dataPedido).valueOf() - moment(b.dataPedido).valueOf(),
      render: (date) => (
        <Text style={{ fontSize: 12 }}>
          {date ? moment(date).format('DD/MM/YY') : '-'}
        </Text>
      ),
    },
    {
      title: 'Data Prevista',
      dataIndex: 'dataPrevistaColheita',
      key: 'dataPrevistaColheita',
      width: 95,
      align: 'left',
      filteredValue: dataPrevistaFilterValue ? [dataPrevistaFilterValue] : [],
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const selectedDate = selectedKeys && selectedKeys[0] ? moment(selectedKeys[0], 'YYYY-MM-DD') : null;
        return (
          <div style={{ padding: 8 }}>
            <DatePicker
              format="DD/MM/YYYY"
              value={selectedDate}
              onChange={(date) => {
                const formatted = date ? date.format('YYYY-MM-DD') : undefined;
                setSelectedKeys(formatted ? [formatted] : []);
              }}
              style={{ marginBottom: 8, display: 'block' }}
              placeholder="Selecione a data"
            />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  onResetPagination?.();
                  if (selectedKeys && selectedKeys[0]) {
                    onFilterDataPrevista?.(selectedKeys[0]);
                  }
                  confirm({ closeDropdown: true });
                }}
              >
                Filtrar
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  setSelectedKeys([]);
                  onFilterDataPrevista?.(null);
                  onResetPagination?.();
                  confirm({ closeDropdown: true });
                }}
              >
                Limpar
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <Tooltip title="Aplicar filtro de data prevista">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: filtered ? '#1890ff' : 'transparent',
            }}
          >
            <CalendarOutlined style={{ color: '#ffffff' }} />
          </span>
        </Tooltip>
      ),
      onFilter: (value, record) => {
        if (!record.dataPrevistaColheita) return false;
        return moment(record.dataPrevistaColheita).format('YYYY-MM-DD') === value;
      },
      render: (date) => (
        <Text style={{ fontSize: 12 }}>
          {date ? moment(date).format('DD/MM/YY') : '-'}
        </Text>
      ),
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      width: 120,
      align: 'left',
      render: (_, record) => {
        if (!record.frutasPedidos || record.frutasPedidos.length === 0) {
          return <Text>-</Text>;
        }
        
        // Se tiver apenas uma fruta, mostra detalhes
        if (record.frutasPedidos.length === 1) {
          const fruta = record.frutasPedidos[0];
          const qtdPrevista = formatQuantity(fruta.quantidadePrevista, fruta.unidadeMedida1);
          const qtdReal = fruta.quantidadeReal ? formatQuantity(fruta.quantidadeReal, fruta.unidadeMedida1) : null;
          
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Prev: {qtdPrevista}
              </Text>
              {qtdReal && (
                <Text style={{ fontSize: 12, fontWeight: 500 }}>
                  Real: {qtdReal}
                </Text>
              )}
            </Space>
          );
        }
        
        // Se tiver múltiplas frutas, mostra resumo
        const totalPrevisto = record.frutasPedidos.reduce((total, fp) => total + (fp.quantidadePrevista || 0), 0);
        const totalReal = record.frutasPedidos.reduce((total, fp) => total + (fp.quantidadeReal || 0), 0);
        
        // Verificar se todas as frutas têm a mesma unidade de medida
        const unidadesPrevistas = record.frutasPedidos.map(fp => fp.unidadeMedida1).filter(Boolean);
        const unidadesReais = record.frutasPedidos.map(fp => fp.unidadeMedida1).filter(Boolean);
        
        // Verificar se todas as unidades previstas são iguais
        const todasUnidadesPrevistasIguais = unidadesPrevistas.length > 0 && 
          unidadesPrevistas.every(unidade => unidade === unidadesPrevistas[0]);
        
        // Verificar se todas as unidades reais são iguais (se houver)
        const todasUnidadesReaisIguais = unidadesReais.length > 0 && 
          unidadesReais.every(unidade => unidade === unidadesReais[0]);
        
        // Determinar a unidade a ser exibida
        let unidadeExibir = null;
        if (todasUnidadesPrevistasIguais) {
          unidadeExibir = unidadesPrevistas[0];
        } else if (todasUnidadesReaisIguais && unidadesReais.length > 0) {
          unidadeExibir = unidadesReais[0];
        }
        
        // Formatar as quantidades com a unidade se todas forem iguais
        const formatarQuantidadeComUnidade = (quantidade, unidade) => {
          if (unidade) {
            return formatQuantity(quantidade, unidade);
          }
          return formatarNumero(quantidade);
        };
        
        return (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Prev: {formatarQuantidadeComUnidade(totalPrevisto, unidadeExibir)}
            </Text>
            {totalReal > 0 && (
              <Text style={{ fontSize: 12, fontWeight: 500 }}>
                Real: {formatarQuantidadeComUnidade(totalReal, unidadeExibir)}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Valor Total',
      dataIndex: 'valorFinal',
      key: 'valorFinal',
      width: 100,
      align: 'left',
      render: (valor) => (
        <Text strong style={{ color: valor ? '#059669' : '#999' }}>
          {formatCurrency(valor)}
        </Text>
      ),
    },
    {
      title: 'Dias',
      key: 'tempoPagamento',
      width: 110,
      align: 'center',
      sorter: (a, b) => {
        // Função auxiliar para obter data de referência (mesma lógica do render)
        const obterDataReferencia = (record) => {
          let dataReferencia = record.dataColheita;

          // Se houver pagamentos, usar a data do último pagamento
          if (record.pagamentosPedidos && record.pagamentosPedidos.length > 0) {
            const ultimoPagamento = [...record.pagamentosPedidos].sort((a, b) => 
              new Date(b.dataPagamento) - new Date(a.dataPagamento)
            )[0];
            dataReferencia = ultimoPagamento.dataPagamento;
          }

          return dataReferencia;
        };

        const dataA = obterDataReferencia(a);
        const dataB = obterDataReferencia(b);

        const diasA = dataA ? moment().diff(moment(dataA), 'days') : -1;
        const diasB = dataB ? moment().diff(moment(dataB), 'days') : -1;
        
        return diasA - diasB;
      },
      render: (_, record) => {
        if (!['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL'].includes(record.status)) {
          return <Text type="secondary">-</Text>;
        }

        let dataReferencia = record.dataColheita;

        // Se houver pagamentos, usar a data do último pagamento
        if (record.pagamentosPedidos && record.pagamentosPedidos.length > 0) {
          const ultimoPagamento = [...record.pagamentosPedidos].sort((a, b) => 
            new Date(b.dataPagamento) - new Date(a.dataPagamento)
          )[0];
          dataReferencia = ultimoPagamento.dataPagamento;
        }

        if (!dataReferencia) {
            return <Text type="secondary">-</Text>;
        }

        const { cor, texto } = getCorPorData(dataReferencia);
        
        return (
          <Tag color={cor} style={{ fontWeight: 'bold', margin: 'auto' }}>
            {texto}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 135,
      align: 'left',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} style={{ textAlign: 'center' }}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140, /* ✅ Aumentado para acomodar múltiplos botões */
      minWidth: 120, /* ✅ Largura mínima garantida */
      align: 'center',
      render: (_, record) => (
        <Space size="small" wrap={false}> {/* ✅ wrap={false} evita quebra de linha */}
          {getActionsForStatus(record)}
        </Space>
      ),
    },
  ];

  // Componente de tabela vazia
  const EmptyState = () => (
    <Empty
      image={<ShoppingOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
      description={
        <span style={{ color: "#999" }}>
          Nenhum pedido encontrado
        </span>
      }
    />
  );

  return (
    <>
      <ResponsiveTable
        columns={columns}
        dataSource={pedidos}
        loading={loading}
        rowKey="id"
        minWidthMobile={1400}
        showScrollHint={true}
        pagination={false}
        size="middle"
        bordered={true}
        locale={{
          emptyText: <EmptyState />,
        }}
        rowClassName={(record) => {
          // Destacar pedidos próximos ao vencimento
          if (record.status === 'AGUARDANDO_COLHEITA') {
            const diasRestantes = moment(record.dataPrevistaColheita).diff(moment(), 'days');
            if (diasRestantes <= 1) {
              return 'row-warning'; // Você pode adicionar CSS para destacar
            }
          }
          return '';
        }}
      />

      {/* Modal de Frutas */}
      <FrutasPedidoModal
        open={frutasModalOpen}
        onClose={() => {
          setFrutasModalOpen(false);
          setPedidoSelecionado(null);
        }}
        pedido={pedidoSelecionado}
      />

      {/* Modal de Turmas */}
      <TurmasPedidoModal
        open={turmasModalOpen}
        onClose={() => {
          setTurmasModalOpen(false);
          setPedidoSelecionado(null);
        }}
        pedido={pedidoSelecionado}
      />

      {/* Modal de Visualização */}
      <VisualizarPedidoModal
        open={visualizarModalOpen}
        onClose={() => {
          setVisualizarModalOpen(false);
          setPedidoSelecionado(null);
        }}
        pedido={pedidoSelecionado}
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
        open={confirmDeleteModalOpen}
        onCancel={() => {
          setConfirmDeleteModalOpen(false);
          setPedidoParaExcluir(null);
        }}
        onOk={handleExcluirPedido}
        okText="Sim, Excluir"
        cancelText="Cancelar"
        confirmLoading={loadingDelete}
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
        {pedidoParaExcluir && (
          <div>
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>
              Tem certeza que deseja excluir este pedido?
            </p>
            <div style={{ 
              backgroundColor: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              marginBottom: "16px"
            }}>
              <p style={{ margin: 0, fontWeight: "600", color: "#dc2626" }}>
                Detalhes do Pedido:
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#374151" }}>
                <strong>Número:</strong> {pedidoParaExcluir.numeroPedido}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Cliente:</strong> {pedidoParaExcluir.cliente?.nome || '-'}
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#374151" }}>
                <strong>Status:</strong> {getStatusConfig(pedidoParaExcluir.status).text}
              </p>
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              ⚠️ Esta ação não pode ser desfeita. O pedido e todos os dados relacionados serão removidos permanentemente.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

// PropTypes
PedidosTable.propTypes = {
  pedidos: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onColheita: PropTypes.func.isRequired,
  onPrecificacao: PropTypes.func.isRequired,
  onPagamento: PropTypes.func.isRequired,
  onPedidoRemovido: PropTypes.func,
  onResetPagination: PropTypes.func,
  onFilterDataPrevista: PropTypes.func,
  dataPrevistaFilterValue: PropTypes.string,
};


export default PedidosTable;
