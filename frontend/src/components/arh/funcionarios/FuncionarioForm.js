// src/components/arh/funcionarios/FuncionarioForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Select, Switch, Row, Col, Card, Space, Typography } from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  BankOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { IMaskInput } from "react-imask";
import { capitalizeName } from "../../../utils/formatters";
import MonetaryInput from "../../common/inputs/MonetaryInput";

// Lista de estados brasileiros
const ESTADOS_BRASILEIROS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const { Text } = Typography;

const TIPO_CONTRATO_OPTIONS = [
  { label: "Mensalista", value: "MENSALISTA" },
  { label: "Diarista", value: "DIARISTA" },
  { label: "Eventual", value: "EVENTUAL" },
];

// Mapeamento dos tipos de chave PIX
const TIPOS_CHAVE_PIX = {
  1: "Telefone",
  2: "Email",
  3: "CPF/CNPJ",
  4: "Chave Aleatória"
};


const FuncionarioForm = ({
  funcionarioAtual,
  setFuncionarioAtual,
  cargos,
  funcoes,
  gerentes,
  erros,
  setErros,
}) => {
  const handleChange = (field, value) => {
    let newData = {
      ...funcionarioAtual,
      [field]: value,
    };

    // Lógica especial para tipo de contrato
    if (field === "tipoContrato") {
      // Se mudou para DIARISTA, limpar cargoId
      if (value === "DIARISTA") {
        newData.cargoId = undefined;
        // Limpar erro de cargoId
        if (erros.cargoId) {
          setErros((prev) => ({
            ...prev,
            cargoId: undefined,
          }));
        }
      }
      // Se mudou para MENSALISTA, limpar funcaoId e gerenteId
      if (value === "MENSALISTA") {
        newData.funcaoId = undefined;
        newData.gerenteId = undefined;
        // Limpar erro de funcaoId e gerenteId
        if (erros.funcaoId) {
          setErros((prev) => ({
            ...prev,
            funcaoId: undefined,
          }));
        }
        if (erros.gerenteId) {
          setErros((prev) => ({
            ...prev,
            gerenteId: undefined,
          }));
        }
      }
    }

    // Lógica especial para cargoId: se selecionar um cargo gerencial, limpar gerenteId
    if (field === "cargoId") {
      const cargoSelecionado = cargos.find(c => c.id === value);
      if (cargoSelecionado?.isGerencial === true) {
        // Se o cargo é gerencial, limpar gerenteId
        newData.gerenteId = undefined;
        // Limpar erro de gerenteId se existir
        if (erros.gerenteId) {
          setErros((prev) => ({
            ...prev,
            gerenteId: undefined,
          }));
        }
      }
    }

    setFuncionarioAtual(newData);

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handler especial para tipoChavePix que também atualiza modalidadeChave
  const handleTipoChavePixChange = (value) => {
    if (value === undefined || value === null) {
      setFuncionarioAtual((prev) => ({
        ...prev,
        tipoChavePix: undefined,
        modalidadeChave: "",
        chavePix: "",
        responsavelChavePix: "",
      }));
      setErros((prev) => ({
        ...prev,
        tipoChavePix: undefined,
        chavePix: undefined,
        responsavelChavePix: undefined,
      }));
      return;
    }

    setFuncionarioAtual((prev) => ({
      ...prev,
      tipoChavePix: value,
      modalidadeChave: TIPOS_CHAVE_PIX[value],
    }));

    if (erros.tipoChavePix) {
      setErros((prev) => ({
        ...prev,
        tipoChavePix: undefined,
      }));
    }
  };

  const isDiarista = funcionarioAtual.tipoContrato === "DIARISTA";
  const isMensalista = funcionarioAtual.tipoContrato === "MENSALISTA";
  
  // Verificar se o cargo selecionado é gerencial
  const cargoSelecionado = cargos.find(c => c.id === funcionarioAtual.cargoId);
  const isCargoGerencial = cargoSelecionado?.isGerencial === true;
  
  // Para mensalista: mostrar gerente apenas se o cargo NÃO for gerencial
  const deveMostrarGerenteMensalista = isMensalista && !isCargoGerencial;

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção 1: Informações Pessoais */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Informações Pessoais
              </span>
            </Space>
          }
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            },
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <Text strong>Nome Completo</Text>
                  </Space>
                }
                validateStatus={erros.nome ? "error" : ""}
                help={erros.nome}
                required
              >
                <Input
                  placeholder="Nome completo do funcionário"
                  value={funcionarioAtual.nome || ""}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <Text strong>Apelido</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Apelido do funcionário"
                  value={funcionarioAtual.apelido || ""}
                  onChange={(e) => handleChange("apelido", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <Text strong>CPF</Text>
                  </Space>
                }
                validateStatus={erros.cpf ? "error" : ""}
                help={erros.cpf}
                required
              >
                <IMaskInput
                  mask="000.000.000-00"
                  placeholder="000.000.000-00"
                  onAccept={(value) => handleChange("cpf", value)}
                  value={funcionarioAtual.cpf || ""}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cpf ? "#ff4d4f" : "#d9d9d9",
                    width: "100%",
                    height: "40px",
                    padding: "4px 11px",
                    fontSize: "14px",
                    border: "1px solid",
                    transition: "all 0.3s",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <Text strong>RG</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Número do RG"
                  value={funcionarioAtual.rg || ""}
                  onChange={(e) => handleChange("rg", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <IdcardOutlined style={{ color: "#059669" }} />
                    <Text strong>PIS</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Número do PIS"
                  value={funcionarioAtual.pis || ""}
                  onChange={(e) => handleChange("pis", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Text strong>Telefone</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="(00) 00000-0000"
                  value={funcionarioAtual.telefone || ""}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <Text strong>E-mail</Text>
                  </Space>
                }
              >
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={funcionarioAtual.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 2: Endereço */}
        <Card
          title={
            <Space>
              <EnvironmentOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Endereço
              </span>
            </Space>
          }
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            },
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>CEP</Text>
                  </Space>
                }
              >
                <IMaskInput
                  mask="00000-000"
                  placeholder="00000-000"
                  onAccept={(value) => handleChange("cep", value)}
                  value={funcionarioAtual.cep || ""}
                  className="ant-input ant-input-lg"
                  style={{
                    borderRadius: "6px",
                    borderColor: erros.cep ? "#ff4d4f" : "#d9d9d9",
                    width: "100%",
                    height: "40px",
                    padding: "4px 11px",
                    fontSize: "14px",
                    border: "1px solid",
                    transition: "all 0.3s",
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Logradouro</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Rua, Avenida, etc."
                  value={funcionarioAtual.logradouro || ""}
                  onChange={(e) => handleChange("logradouro", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Número</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Número"
                  value={funcionarioAtual.numero || ""}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Complemento</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Apto, Bloco, etc."
                  value={funcionarioAtual.complemento || ""}
                  onChange={(e) => handleChange("complemento", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Bairro</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Bairro"
                  value={funcionarioAtual.bairro || ""}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Cidade</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Cidade"
                  value={funcionarioAtual.cidade || ""}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label={
                  <Space>
                    <EnvironmentOutlined style={{ color: "#059669" }} />
                    <Text strong>Estado</Text>
                  </Space>
                }
              >
                <Select
                  placeholder="UF"
                  value={funcionarioAtual.estado || undefined}
                  onChange={(value) => handleChange("estado", value)}
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {ESTADOS_BRASILEIROS.map((estado) => (
                    <Select.Option key={estado} value={estado}>
                      {estado}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Seção 3: Vínculo Empregatício */}
        <Card
          title={
            <Space>
              <BankOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Vínculo Empregatício
              </span>
            </Space>
          }
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            },
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <BankOutlined style={{ color: "#059669" }} />
                    <Text strong>Tipo de Contrato</Text>
                  </Space>
                }
                validateStatus={erros.tipoContrato ? "error" : ""}
                help={erros.tipoContrato}
                required
              >
                <Select
                  placeholder="Selecione o tipo de contrato"
                  value={funcionarioAtual.tipoContrato || undefined}
                  onChange={(value) => handleChange("tipoContrato", value)}
                  options={TIPO_CONTRATO_OPTIONS}
                  size="large"
                />
              </Form.Item>
            </Col>
            {isMensalista && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <BankOutlined style={{ color: "#059669" }} />
                      <Text strong>Cargo</Text>
                    </Space>
                  }
                  validateStatus={erros.cargoId ? "error" : ""}
                  help={erros.cargoId}
                  required
                >
                  <Select
                    placeholder="Selecione um cargo"
                    value={funcionarioAtual.cargoId || undefined}
                    onChange={(value) => handleChange("cargoId", value)}
                    allowClear
                    size="large"
                  >
                    {cargos.map((cargo) => (
                      <Select.Option value={cargo.id} key={cargo.id}>
                        {cargo.nome ? capitalizeName(cargo.nome) : cargo.nome}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            {isDiarista && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <BankOutlined style={{ color: "#059669" }} />
                      <Text strong>Função Diarista</Text>
                    </Space>
                  }
                  validateStatus={erros.funcaoId ? "error" : ""}
                  help={erros.funcaoId}
                  required
                >
                  <Select
                    placeholder="Escolha a função diarista"
                    value={funcionarioAtual.funcaoId || undefined}
                    onChange={(value) => handleChange("funcaoId", value)}
                    size="large"
                  >
                    {funcoes.map((funcao) => (
                      <Select.Option value={funcao.id} key={funcao.id}>
                        {funcao.nome ? capitalizeName(funcao.nome) : funcao.nome}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            {/* Campo Gerente: aparece para diaristas OU mensalistas com cargo não gerencial */}
            {(isDiarista || deveMostrarGerenteMensalista) && (
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <UserOutlined style={{ color: "#059669" }} />
                      <Text strong>Gerente</Text>
                    </Space>
                  }
                  validateStatus={erros.gerenteId ? "error" : ""}
                  help={erros.gerenteId || "Selecione o gerente responsável (opcional)"}
                >
                  <Select
                    placeholder="Selecione o gerente"
                    value={funcionarioAtual.gerenteId || undefined}
                    onChange={(value) => handleChange("gerenteId", value)}
                    allowClear
                    size="large"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {gerentes.map((gerente) => (
                      <Select.Option 
                        value={gerente.id} 
                        key={gerente.id}
                        label={`${capitalizeName(gerente.nome)} - ${capitalizeName(gerente.cargo?.nome || "")}`}
                      >
                        {capitalizeName(gerente.nome)} {gerente.cargo && `- ${capitalizeName(gerente.cargo.nome)}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>

        {/* Seção 4: Dados de Pagamento */}
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Dados de Pagamento
              </span>
            </Space>
          }
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
          styles={{
            header: {
              backgroundColor: "#059669",
              borderBottom: "2px solid #047857",
              color: "#ffffff",
              borderRadius: "8px 8px 0 0",
            },
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>Tipo da Chave PIX</Text>
                  </Space>
                }
                validateStatus={erros.tipoChavePix ? "error" : ""}
                help={erros.tipoChavePix}
              >
                <Select
                  placeholder="Selecione o tipo"
                  value={funcionarioAtual.tipoChavePix}
                  onChange={handleTipoChavePixChange}
                  allowClear
                  size="large"
                >
                  <Select.Option value={1}>{TIPOS_CHAVE_PIX[1]}</Select.Option>
                  <Select.Option value={2}>{TIPOS_CHAVE_PIX[2]}</Select.Option>
                  <Select.Option value={3}>{TIPOS_CHAVE_PIX[3]}</Select.Option>
                  <Select.Option value={4}>{TIPOS_CHAVE_PIX[4]}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>Chave PIX</Text>
                  </Space>
                }
                validateStatus={erros.chavePix ? "error" : ""}
                help={erros.chavePix}
              >
                <Input
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={funcionarioAtual.chavePix || ""}
                  onChange={(e) => handleChange("chavePix", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: "#059669" }} />
                    <Text strong>Responsável Chave PIX</Text>
                  </Space>
                }
                validateStatus={erros.responsavelChavePix ? "error" : ""}
                help={erros.responsavelChavePix}
              >
                <Input
                  placeholder="Nome do responsável pela chave PIX"
                  value={funcionarioAtual.responsavelChavePix || ""}
                  onChange={(e) =>
                    handleChange("responsavelChavePix", e.target.value)
                  }
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>Ajuda de Custo (R$)</Text>
                  </Space>
                }
                help="Valor em reais para ajuda de custo na folha de pagamento"
              >
                <MonetaryInput
                  value={funcionarioAtual.ajudaCusto}
                  onChange={(value) => handleChange("ajudaCusto", value ? parseFloat(value) : undefined)}
                  placeholder="0,00"
                  size="large"
                  addonAfter="R$"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <DollarOutlined style={{ color: "#059669" }} />
                    <Text strong>PIX de Terceiro</Text>
                  </Space>
                }
                help="Marque se a chave PIX pertence a um terceiro"
              >
                <Switch
                  checked={funcionarioAtual.pixTerceiro || false}
                  onChange={(checked) => handleChange("pixTerceiro", checked)}
                  checkedChildren="Sim"
                  unCheckedChildren="Não"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

FuncionarioForm.propTypes = {
  funcionarioAtual: PropTypes.object.isRequired,
  setFuncionarioAtual: PropTypes.func.isRequired,
  cargos: PropTypes.array.isRequired,
  funcoes: PropTypes.array.isRequired,
  gerentes: PropTypes.array.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
};

export default FuncionarioForm;
