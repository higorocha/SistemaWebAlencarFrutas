// src/components/arh/folha-pagamento/FuncionariosSemChavePixModal.js

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Modal, Typography, Alert, Tag, Space, Button, Card } from "antd";
import { WarningOutlined, UserOutlined } from "@ant-design/icons";
import { capitalizeName, formatarCPF } from "../../../utils/formatters";
import { PrimaryButton } from "../../common/buttons";
import ResponsiveTable from "../../common/ResponsiveTable";
import useResponsive from "../../../hooks/useResponsive";

const { Text, Paragraph, Title } = Typography;

const STATUS_COLORS = {
  PENDENTE: "orange",
  REJEITADO: "red",
  ENVIADO: "blue",
  PROCESSADO: "blue",
  PAGO: "green",
  CANCELADO: "volcano",
};

const labelMeioPagamento = (meio) => {
  if (!meio) return "PIX";
  if (meio === "PIX_API") return "PIX-API (Banco do Brasil)";
  if (meio === "PIX") return "PIX Manual";
  if (meio === "ESPECIE") return "Pagamento em espécie";
  return meio;
};

const FuncionariosSemChavePixModal = ({
  open,
  onClose,
  funcionarios = [],
  meioPagamentoTentado = null,
  onRetryFinalizacao,
}) => {
  const { isMobile } = useResponsive();

  const dataSource = useMemo(
    () =>
      (funcionarios || []).map((item) => ({
        key: item.funcionarioPagamentoId ?? item.funcionarioId,
        nome: capitalizeName(item.funcionario?.nome || "Funcionário"),
        cpf: item.funcionario?.cpf ? formatarCPF(item.funcionario.cpf) : "—",
        tipoContrato: item.funcionario?.tipoContrato || "—",
        cargoOuFuncao: item.cargo?.nome || item.funcao?.nome || "—",
        gerente: item.funcionario?.gerente?.nome
          ? capitalizeName(item.funcionario.gerente.nome)
          : "—",
        statusPagamento: item.statusPagamento || "PENDENTE",
      })),
    [funcionarios],
  );

  const columns = useMemo(
    () => [
      {
        title: "Funcionário",
        dataIndex: "nome",
        key: "nome",
        width: "22%",
        render: (text) => (
          <Text strong style={{ color: "#059669", fontSize: "0.75rem" }}>
            {text}
          </Text>
        ),
      },
      {
        title: "CPF",
        dataIndex: "cpf",
        key: "cpf",
        width: "13%",
        align: "center",
        render: (text) => (
          <Text style={{ fontSize: "0.75rem" }}>{text}</Text>
        ),
      },
      {
        title: "Tipo de Contrato",
        dataIndex: "tipoContrato",
        key: "tipoContrato",
        width: "15%",
        align: "center",
        render: (text) => (
          <Text style={{ fontSize: "0.75rem" }}>{text}</Text>
        ),
      },
      {
        title: "Cargo/Função",
        dataIndex: "cargoOuFuncao",
        key: "cargoOuFuncao",
        width: "18%",
        align: "center",
        render: (text) => (
          <Text style={{ fontSize: "0.75rem" }}>{text}</Text>
        ),
      },
      {
        title: "Gerente",
        dataIndex: "gerente",
        key: "gerente",
        width: "18%",
        align: "center",
        render: (text) => (
          <Text style={{ fontSize: "0.75rem" }}>{text}</Text>
        ),
      },
      {
        title: "Status",
        dataIndex: "statusPagamento",
        key: "statusPagamento",
        width: "14%",
        align: "center",
        render: (status) => (
          <Tag
            color={STATUS_COLORS[status] || "default"}
            style={{
              margin: 0,
              fontWeight: "500",
              fontSize: "0.65rem",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            {status}
          </Tag>
        ),
      },
    ],
    [],
  );

  const footerButtons = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: isMobile ? "8px" : "12px",
        flexWrap: isMobile ? "wrap" : "nowrap",
      }}
    >
      <Button
        key="close-modal"
        onClick={onClose}
        size={isMobile ? "middle" : "large"}
        style={{
          height: isMobile ? "36px" : "40px",
          padding: isMobile ? "0 16px" : "0 20px",
        }}
      >
        Entendi
      </Button>
      {onRetryFinalizacao && (
        <PrimaryButton
          key="retry-modal"
          onClick={() => {
            onClose?.();
            onRetryFinalizacao();
          }}
          style={{
            minWidth: isMobile ? "auto" : 180,
            height: isMobile ? "36px" : "40px",
            padding: isMobile ? "0 16px" : "0 20px",
          }}
        >
          Reabrir Finalização
        </PrimaryButton>
      )}
    </div>
  );

  return (
    <Modal
      title={
        <span
          style={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: isMobile ? "0.875rem" : "1rem",
            backgroundColor: "#059669",
            padding: isMobile ? "0.625rem 0.75rem" : "0.75rem 1rem",
            margin: "-1.25rem -1.5rem 0 -1.5rem",
            display: "block",
            borderRadius: "0.5rem 0.5rem 0 0",
          }}
        >
          <WarningOutlined style={{ marginRight: "0.5rem" }} />
          Funcionários sem Chave PIX
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={footerButtons}
      width={isMobile ? "95vw" : "90%"}
      style={{ maxWidth: isMobile ? "95vw" : "75rem" }}
      centered
      destroyOnClose
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
        mask: { zIndex: 1200 },
      }}
    >
      {/* Alert de Aviso */}
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined style={{ fontSize: "18px" }} />}
        message={
          <Text strong style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
            Validação de Finalização
          </Text>
        }
        description={
          <Space direction="vertical" size={8}>
            <Paragraph
              style={{
                margin: 0,
                color: "#475569",
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              Para utilizar <strong>{labelMeioPagamento(meioPagamentoTentado)}</strong>,
              todos os funcionários com lançamentos pendentes precisam ter uma chave PIX
              cadastrada.
            </Paragraph>
            <Paragraph
              style={{
                margin: 0,
                color: "#475569",
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
              }}
            >
              <strong>Ações necessárias:</strong> Atualize o cadastro dos funcionários
              abaixo com suas chaves PIX ou realize o pagamento manual (marcando-os como
              pagos individualmente) antes de tentar finalizar novamente.
            </Paragraph>
          </Space>
        }
        style={{
          marginBottom: isMobile ? 12 : 16,
          borderRadius: "0.5rem",
          border: "1px solid #fbbf24",
        }}
      />

      {/* Card com a tabela */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#ffffff" }} />
            <span
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              Funcionários Bloqueando a Finalização ({funcionarios.length})
            </span>
          </Space>
        }
        style={{
          border: "0.0625rem solid #e8e8e8",
          borderRadius: "0.5rem",
        }}
        styles={{
          header: {
            backgroundColor: "#059669",
            color: "#ffffff",
            borderRadius: "0.5rem 0.5rem 0 0",
            borderBottom: "0.125rem solid #047857",
            padding: isMobile ? "6px 12px" : "8px 16px",
          },
          body: {
            padding: isMobile ? "12px" : "16px",
          },
        }}
      >
        <ResponsiveTable
          columns={columns}
          dataSource={dataSource}
          rowKey="key"
          pagination={false}
          minWidthMobile={1100}
          showScrollHint={true}
        />
      </Card>
    </Modal>
  );
};

FuncionariosSemChavePixModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  funcionarios: PropTypes.array,
  meioPagamentoTentado: PropTypes.string,
  onRetryFinalizacao: PropTypes.func,
};

export default FuncionariosSemChavePixModal;


