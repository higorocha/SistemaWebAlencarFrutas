// componentesColheita/MaoObraRow.js
import React from "react";
import { Form, Row, Col, Select, Input, Button, Space, Tooltip, Divider, Typography } from "antd";
import { 
  TeamOutlined, 
  AppleOutlined, 
  CalculatorOutlined, 
  DollarOutlined, 
  FileTextOutlined,
  DeleteOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { MonetaryInput } from "../../common/inputs";

const { Option } = Select;
const { Text } = Typography;

const MaoObraRow = ({
  field,
  index,
  form,
  isMobile,
  turmasColheita,
  pedido,
  fieldsLength,
  onRemove,
  onAdd,
  capitalizeName
}) => {
  // ✅ Usar Form.useWatch DENTRO do componente (não no map)
  const frutaIdSelecionado = Form.useWatch(['maoObra', index, 'frutaId'], form);
  const quantidadeColhida = Form.useWatch(['maoObra', index, 'quantidadeColhida'], form);
  const valorUnitario = Form.useWatch(['maoObra', index, 'valorUnitario'], form);
  const valorColheita = Form.useWatch(['maoObra', index, 'valorColheita'], form);

  const { key, name, ...restField } = field;

  // Obter dados da turma selecionada para exibir no identificador
  const maoObraItem = form.getFieldValue('maoObra')?.[index];
  const turmaSelecionada = turmasColheita.find(t => t.id === maoObraItem?.turmaColheitaId);
  const identificador = turmaSelecionada ? turmaSelecionada.nomeColhedor : `Colheitador ${index + 1}`;

  // Obter a fruta selecionada e sua unidade
  const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === frutaIdSelecionado);
  const unidadeFruta = frutaSelecionada?.unidadeMedida1 || '';

  // ✅ Verificar se quantidade está preenchida para habilitar os campos de valor
  const qtdStr = quantidadeColhida ? String(quantidadeColhida).replace(',', '.') : '0';
  const qtd = parseFloat(qtdStr) || 0;
  const quantidadePreenchida = qtd > 0;

  // ✅ Ref para controlar qual campo está sendo editado (evitar loop)
  const isEditingValorUnitario = React.useRef(false);
  const isEditingValorTotal = React.useRef(false);

  // ✅ Handler para calcular valor total quando valor unitário muda
  const handleValorUnitarioChange = (novoValorUnitario) => {
    if (!quantidadeColhida || !novoValorUnitario) return;
    if (isEditingValorTotal.current) return; // Evitar loop

    isEditingValorUnitario.current = true;

    const qtdStr = String(quantidadeColhida).replace(',', '.');
    const valUnitStr = String(novoValorUnitario).replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valUnit = parseFloat(valUnitStr) || 0;

    if (quantidade > 0 && valUnit > 0) {
      const total = quantidade * valUnit;
      // ✅ CORREÇÃO: Usar setFieldValue para atualizar valorColheita sem triggerar onChange
      const maoObraAtual = form.getFieldValue('maoObra');
      maoObraAtual[index] = { ...maoObraAtual[index], valorColheita: total };
      form.setFieldsValue({ maoObra: maoObraAtual });
    }

    setTimeout(() => {
      isEditingValorUnitario.current = false;
    }, 100);
  };

  // ✅ Handler para calcular valor unitário quando valor total muda
  const handleValorTotalChange = (novoValorTotal) => {
    if (!quantidadeColhida || !novoValorTotal) return;
    if (isEditingValorUnitario.current) return; // Evitar loop

    isEditingValorTotal.current = true;

    const qtdStr = String(quantidadeColhida).replace(',', '.');
    const valTotalStr = String(novoValorTotal).replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valTotal = parseFloat(valTotalStr) || 0;

    if (quantidade > 0 && valTotal > 0) {
      const valUnit = valTotal / quantidade;
      // ✅ CORREÇÃO: Usar setFieldValue para atualizar valorUnitario sem triggerar onChange
      const maoObraAtual = form.getFieldValue('maoObra');
      maoObraAtual[index] = { ...maoObraAtual[index], valorUnitario: valUnit };
      form.setFieldsValue({ maoObra: maoObraAtual });
    }

    setTimeout(() => {
      isEditingValorTotal.current = false;
    }, 100);
  };
  
  return (
    <div key={key}>
      {isMobile && index > 0 && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: isMobile ? "12px" : "16px",
          padding: "8px 0"
        }}>
          <div style={{
            flex: 1,
            height: "1px",
            backgroundColor: "#e8e8e8"
          }} />
          <div style={{
            margin: "0 12px",
            padding: "4px 12px",
            backgroundColor: "#f0f9ff",
            borderRadius: "12px",
            border: "1px solid #bae6fd"
          }}>
            <Text style={{ 
              color: "#059669", 
              fontSize: "12px", 
              fontWeight: "600" 
            }}>
              {identificador}
            </Text>
          </div>
          <div style={{
            flex: 1,
            height: "1px",
            backgroundColor: "#e8e8e8"
          }} />
        </div>
      )}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="baseline">
        <Col xs={24} md={4}>
          <Form.Item
            {...restField}
            name={[name, 'turmaColheitaId']}
            label={isMobile ? (
              <Space size="small">
                <TeamOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Turma de Colheita</span>
              </Space>
            ) : undefined}
            rules={[
              {
                validator: (_, value) => {
                  const formValues = form.getFieldsValue();
                  const maoObraItem = formValues.maoObra?.[name] || {};
                  const temOutrosCampos = maoObraItem.frutaId ||
                                          maoObraItem.quantidadeColhida ||
                                          maoObraItem.valorColheita;

                  if (temOutrosCampos && !value) {
                    return Promise.reject(new Error("Turma é obrigatória quando outros campos são preenchidos"));
                  }

                  // Validação de duplicidade (turma + fruta)
                  if (value && maoObraItem.frutaId) {
                    const todasCombinacoes = formValues.maoObra || [];
                    const combinacoesIguais = todasCombinacoes.filter(item => 
                      item && 
                      item.turmaColheitaId === value && 
                      item.frutaId === maoObraItem.frutaId
                    );

                    if (combinacoesIguais.length > 1) {
                      const turmaNome = turmasColheita.find(t => t.id === value)?.nomeColhedor || `Turma ${value}`;
                      const frutaInfo = pedido?.frutasPedidos?.find(fp => fp.frutaId === maoObraItem.frutaId);
                      // ✅ OBTER nome da fruta (prioridade: fruta.nome > frutaNome > fallback)
                      const nomeFruta = frutaInfo?.fruta?.nome || frutaInfo?.frutaNome || `Fruta ID ${maoObraItem.frutaId}`;
                      const frutaNome = capitalizeName(nomeFruta);
                      return Promise.reject(new Error(`"${turmaNome}" já foi selecionado(a) para a fruta "${frutaNome}"`));
                    }
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select
              placeholder="Selecione uma turma"
              size={isMobile ? "small" : "middle"}
              showSearch
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                if (typeof label === 'string') {
                  return label.toLowerCase().includes(input.toLowerCase());
                }
                if (React.isValidElement(label)) {
                  const text = label.props?.title || label.props?.children;
                  return typeof text === 'string' ? text.toLowerCase().includes(input.toLowerCase()) : false;
                }
                return false;
              }}
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            >
              {turmasColheita.map((turma) => (
                <Option 
                  key={turma.id} 
                  value={turma.id}
                >
                  <Tooltip title={capitalizeName(turma.nomeColhedor)} placement="top">
                    <span>{capitalizeName(turma.nomeColhedor)}</span>
                  </Tooltip>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            {...restField}
            name={[name, 'frutaId']}
            label={isMobile ? (
              <Space size="small">
                <AppleOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Fruta Colhida</span>
              </Space>
            ) : undefined}
            rules={[
              {
                validator: (_, value) => {
                  const formValues = form.getFieldsValue();
                  const maoObraItem = formValues.maoObra?.[name] || {};
                  const temOutrosCampos = maoObraItem.turmaColheitaId ||
                                          maoObraItem.quantidadeColhida ||
                                          maoObraItem.valorColheita;

                  if (temOutrosCampos && !value) {
                    return Promise.reject(new Error("Fruta é obrigatória quando outros campos são preenchidos"));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select
              placeholder="Selecione a fruta"
              size={isMobile ? "small" : "middle"}
              showSearch
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                if (typeof label === 'string') {
                  return label.toLowerCase().includes(input.toLowerCase());
                }
                if (React.isValidElement(label)) {
                  const text = label.props?.title || label.props?.children;
                  return typeof text === 'string' ? text.toLowerCase().includes(input.toLowerCase()) : false;
                }
                return false;
              }}
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            >
              {pedido?.frutasPedidos?.map((frutaPedido) => {
                // ✅ OBTER nome da fruta (prioridade: fruta.nome > frutaNome > fallback)
                const nomeFruta = frutaPedido.fruta?.nome || frutaPedido.frutaNome || `Fruta ID ${frutaPedido.frutaId}`;
                return (
                  <Option 
                    key={frutaPedido.frutaId} 
                    value={frutaPedido.frutaId}
                  >
                    <Tooltip title={capitalizeName(nomeFruta)} placement="top">
                      <span>{capitalizeName(nomeFruta)}</span>
                    </Tooltip>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={3}>
          <Form.Item
            {...restField}
            name={[name, 'quantidadeColhida']}
            label={isMobile ? (
              <Space size="small">
                <CalculatorOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Quantidade</span>
              </Space>
            ) : undefined}
            rules={[
              {
                validator: (_, value) => {
                  const formValues = form.getFieldsValue();
                  const maoObraItem = formValues.maoObra?.[name] || {};
                  const temOutrosCampos = maoObraItem.turmaColheitaId || 
                                          maoObraItem.frutaId ||
                                          maoObraItem.valorColheita;
                  
                  if (temOutrosCampos && !value) {
                    return Promise.reject(new Error("Quantidade é obrigatória quando outros campos são preenchidos"));
                  }
                  
                  if (value) {
                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                    if (numValue && numValue <= 0) {
                      return Promise.reject(new Error("Quantidade deve ser maior que zero"));
                    }
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
          >
            <MonetaryInput
              placeholder="Ex: 1.234,56"
              addonAfter={unidadeFruta}
              size={isMobile ? "small" : "large"}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={3}>
          <Form.Item
            {...restField}
            name={[name, 'valorUnitario']}
            label={isMobile ? (
              <Space size="small">
                <DollarOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Valor Unit.</span>
              </Space>
            ) : undefined}
            trigger="onChange"
          >
            <MonetaryInput
              placeholder="Ex: 5,00"
              addonBefore="R$"
              size={isMobile ? "small" : "large"}
              disabled={!quantidadePreenchida}
              decimalScale={4}
              onChange={(value) => {
                if (value && quantidadeColhida) {
                  handleValorUnitarioChange(value);
                }
              }}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={3}>
          <Form.Item
            {...restField}
            name={[name, 'valorColheita']}
            label={isMobile ? (
              <Space size="small">
                <CalculatorOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Valor Total</span>
              </Space>
            ) : undefined}
            rules={[
              {
                validator: (_, value) => {
                  const formValues = form.getFieldsValue();
                  const maoObraItem = formValues.maoObra?.[name] || {};
                  const temOutrosCampos = maoObraItem.turmaColheitaId || 
                                          maoObraItem.frutaId ||
                                          maoObraItem.quantidadeColhida;
                  
                  if (temOutrosCampos && !value) {
                    return Promise.reject(new Error("Valor é obrigatório quando outros campos são preenchidos"));
                  }
                  
                  if (value && value <= 0) {
                    return Promise.reject(new Error("Valor deve ser maior que zero"));
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
            trigger="onChange"
          >
            <MonetaryInput
              placeholder="Ex: 150,00"
              addonBefore="R$"
              size={isMobile ? "small" : "large"}
              disabled={!quantidadePreenchida}
              onChange={(value) => {
                if (value && quantidadeColhida) {
                  handleValorTotalChange(value);
                }
              }}
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item
            {...restField}
            name={[name, 'observacoes']}
            label={isMobile ? (
              <Space size="small">
                <FileTextOutlined style={{ color: "#059669" }} />
                <span style={{ fontWeight: "700", color: "#059669", fontSize: "14px" }}>Observações</span>
              </Space>
            ) : undefined}
          >
            <Input
              placeholder="Observações (opcional)"
              size={isMobile ? "small" : "middle"}
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={3}>
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "8px" : "8px", 
            justifyContent: isMobile ? "center" : "center",
            flexDirection: isMobile ? "row" : "row",
            marginTop: isMobile ? "8px" : "0",
            paddingTop: isMobile ? "8px" : "0",
            borderTop: isMobile ? "1px solid #f0f0f0" : "none"
          }}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (fieldsLength > 1) {
                  onRemove(name);
                }
              }}
              disabled={fieldsLength <= 1}
              size={isMobile ? "small" : "large"}
              style={{
                borderRadius: "3.125rem",
                height: isMobile ? "32px" : "40px",
                width: isMobile ? "32px" : "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                border: "0.125rem solid #ff4d4f",
                color: "#ff4d4f",
                backgroundColor: "#ffffff",
              }}
            />

            {index === fieldsLength - 1 && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  onAdd({
                    turmaColheitaId: undefined,
                    frutaId: undefined,
                    quantidadeColhida: undefined,
                    valorUnitario: undefined,
                    valorColheita: undefined,
                    observacoes: ''
                  });
                }}
                size={isMobile ? "small" : "large"}
                style={{
                  borderRadius: "3.125rem",
                  borderColor: "#10b981",
                  color: "#10b981",
                  borderWidth: "0.125rem",
                  height: isMobile ? "32px" : "40px",
                  width: isMobile ? "32px" : "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  backgroundColor: "#ffffff",
                }}
              />
            )}
          </div>
        </Col>
      </Row>
      {index < fieldsLength - 1 && <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />}
    </div>
  );
};

export default MaoObraRow;


