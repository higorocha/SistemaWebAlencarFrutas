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
  PlusOutlined,
  CheckCircleOutlined
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
  loadingTurmas = false, // ✅ NOVO: Prop de loading para turmas
  pedido,
  fieldsLength,
  onRemove,
  onAdd,
  capitalizeName,
  pagamentoEfetuado = false,
  rowLocked = false,
}) => {
  // ✅ Usar Form.useWatch DENTRO do componente (não no map)
  const frutaIdSelecionado = Form.useWatch(['maoObra', index, 'frutaId'], form);
  const quantidadeColhida = Form.useWatch(['maoObra', index, 'quantidadeColhida'], form);
  const valorUnitario = Form.useWatch(['maoObra', index, 'valorUnitario'], form);
  const valorColheita = Form.useWatch(['maoObra', index, 'valorColheita'], form);
  const usarUnidadeSecundariaForm = Form.useWatch(['maoObra', index, 'usarUnidadeSecundaria'], form);

  const { key, name, ...restField } = field;

  // Obter dados da turma selecionada para exibir no identificador
  const maoObraItem = form.getFieldValue('maoObra')?.[index];
  const turmaSelecionada = turmasColheita.find(t => t.id === maoObraItem?.turmaColheitaId);
  const identificador = turmaSelecionada ? turmaSelecionada.nomeColhedor : `Colheitador ${index + 1}`;

  // Obter a fruta selecionada e suas unidades
  const frutaSelecionada = pedido?.frutasPedidos?.find(fp => fp.frutaId === frutaIdSelecionado);
  
  // ✅ Ref para rastrear se já inicializou o estado (evitar loop infinito)
  const inicializadoRef = React.useRef(false);
  const ultimoValorFormRef = React.useRef(usarUnidadeSecundariaForm);
  
  // Estado para controlar qual unidade está ativa (toggle entre primária e secundária)
  // ✅ Inicializar baseado no valor do form (se já foi carregado do backend)
  const [usarUnidadeSecundaria, setUsarUnidadeSecundaria] = React.useState(() => {
    return usarUnidadeSecundariaForm === true;
  });
  
  // Determinar qual unidade usar baseado no toggle
  const unidadeFruta = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
    ? frutaSelecionada.unidadeMedida2
    : (frutaSelecionada?.unidadeMedida1 || '');
  
  // Verificar se pode alternar (só se tiver unidade secundária)
  const podeAlternar = frutaSelecionada?.unidadeMedida2 ? true : false;

  // ✅ Sincronizar estado local com valor do form quando mudar (ao carregar dados do backend)
  // Mas apenas quando o valor do form mudar externamente (não por nossa própria atualização)
  React.useEffect(() => {
    const valorAtualForm = usarUnidadeSecundariaForm === true;
    const ultimoValor = ultimoValorFormRef.current === true;
    
    // Se o valor do form mudou E ainda não inicializamos
    if (!inicializadoRef.current && usarUnidadeSecundariaForm !== undefined) {
      // Inicialização: sincronizar estado com form
      setUsarUnidadeSecundaria(valorAtualForm);
      inicializadoRef.current = true;
      ultimoValorFormRef.current = valorAtualForm;
    } else if (inicializadoRef.current && valorAtualForm !== ultimoValor) {
      // Form mudou externamente (ex: carregamento de dados do backend)
      // Atualizar estado e ref para evitar loop
      setUsarUnidadeSecundaria(valorAtualForm);
      ultimoValorFormRef.current = valorAtualForm;
    }
  }, [usarUnidadeSecundariaForm]);

  // ✅ Ref para rastrear o último frutaId (resetar refs quando fruta mudar)
  const ultimoFrutaIdRef = React.useRef(frutaIdSelecionado);
  
  // Resetar para unidade primária quando a fruta mudar (mas não ao carregar dados)
  React.useEffect(() => {
    // Se a fruta mudou, resetar refs para permitir nova inicialização
    if (ultimoFrutaIdRef.current !== frutaIdSelecionado) {
      inicializadoRef.current = false;
      ultimoFrutaIdRef.current = frutaIdSelecionado;
    }
    
    // Só resetar se a fruta realmente mudou (não na primeira renderização)
    if (frutaIdSelecionado) {
      const itemAtual = form.getFieldValue('maoObra')?.[index];
      // Se não tem usarUnidadeSecundaria definido, usar padrão (false)
      if (itemAtual?.usarUnidadeSecundaria === undefined && !inicializadoRef.current) {
        setUsarUnidadeSecundaria(false);
        inicializadoRef.current = true;
        ultimoValorFormRef.current = false;
        // Atualizar campo oculto no formulário
        const maoObraAtual = form.getFieldValue('maoObra') || [];
        maoObraAtual[index] = { ...maoObraAtual[index], usarUnidadeSecundaria: false };
        form.setFieldsValue({ maoObra: maoObraAtual });
      }
    }
  }, [frutaIdSelecionado, index, form]);

  // ✅ Atualizar campo unidadeMedida no form quando toggle mudar (via useEffect para sincronização)
  React.useEffect(() => {
    if (frutaIdSelecionado && inicializadoRef.current) {
      const itemAtual = form.getFieldValue('maoObra')?.[index] || {};
      const valorAtualNoForm = itemAtual?.usarUnidadeSecundaria === true;

      const deveAtualizarToggle = valorAtualNoForm !== usarUnidadeSecundaria && ultimoValorFormRef.current !== usarUnidadeSecundaria;
      const unidadeNaoDefinida = !itemAtual?.unidadeMedida;

      if (deveAtualizarToggle || unidadeNaoDefinida) {
        ultimoValorFormRef.current = usarUnidadeSecundaria;

        const unidadeBase = usarUnidadeSecundaria && frutaSelecionada?.unidadeMedida2
          ? frutaSelecionada.unidadeMedida2
          : (frutaSelecionada?.unidadeMedida1 || 'KG');

        const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
        const unidadeEncontrada = unidadeBase ? unidadesValidas.find(u => unidadeBase.includes(u)) : undefined;
        const unidadeMedida = unidadeEncontrada || 'KG';

        const maoObraAtual = form.getFieldValue('maoObra') || [];
        maoObraAtual[index] = {
          ...maoObraAtual[index],
          usarUnidadeSecundaria,
          unidadeMedida
        };
        form.setFieldsValue({ maoObra: maoObraAtual });
      }
    }
  }, [usarUnidadeSecundaria, frutaIdSelecionado, index, form, frutaSelecionada]);

  // ✅ Verificar se quantidade está preenchida para habilitar os campos de valor
  const qtdStr = quantidadeColhida ? String(quantidadeColhida).replace(',', '.') : '0';
  const qtd = parseFloat(qtdStr) || 0;
  const quantidadePreenchida = qtd > 0;

  // ✅ Linha protegida (PROCESSANDO/PAGO/vinculada PIX-API) não pode ser editada/removida
  const isReadonly = pagamentoEfetuado === true || rowLocked === true;

  // ✅ Ref para controlar qual campo está sendo editado (evitar loop)
  const isEditingValorUnitario = React.useRef(false);
  const isEditingValorTotal = React.useRef(false);
  // ✅ Ref para rastrear se o valorColheita foi informado diretamente pelo usuário
  const valorColheitaInformadoDiretamente = React.useRef(false);
  // ✅ Ref para rastrear a última quantidade (para detectar mudanças)
  const ultimaQuantidadeRef = React.useRef(quantidadeColhida);
  // ✅ Ref para indicar que estamos recalculando devido a mudança de quantidade
  const recalculandoPorQuantidade = React.useRef(false);
  // ✅ Ref para indicar se já foi feita a inicialização (carregamento do backend)
  const inicializadoRefMaoObra = React.useRef(false);

  // ✅ Recalcular valor total automaticamente quando quantidade ou valor unitário mudarem
  // ✅ CORREÇÃO: Se quantidade mudar, sempre recalcular (mesmo se valor foi informado diretamente)
  // Se apenas valor unitário mudar, só recalcular se valor não foi informado diretamente
  React.useEffect(() => {
    if (isReadonly) return;
    if (isEditingValorUnitario.current || isEditingValorTotal.current) return;

    const qtdNum = quantidadeColhida
      ? parseFloat(String(quantidadeColhida).replace(',', '.')) || 0
      : 0;
    const valUnitNum = valorUnitario
      ? parseFloat(String(valorUnitario).replace(',', '.')) || 0
      : 0;

    if (!qtdNum || !valUnitNum) return;

    const maoObraAtual = form.getFieldValue('maoObra') || [];
    const atual = maoObraAtual[index] || {};
    const valorColheitaAtual = atual.valorColheita
      ? parseFloat(String(atual.valorColheita).replace(',', '.')) || 0
      : 0;

    // ✅ Detectar se a quantidade mudou (apenas após inicialização)
    const quantidadeAtualStr = String(quantidadeColhida || '').replace(',', '.');
    const ultimaQuantidadeStr = String(ultimaQuantidadeRef.current || '').replace(',', '.');
    const quantidadeMudou = inicializadoRefMaoObra.current && quantidadeAtualStr !== ultimaQuantidadeStr;
    
    // ✅ Se ainda não foi inicializado, marcar como inicializado e não recalcular
    if (!inicializadoRefMaoObra.current) {
      inicializadoRefMaoObra.current = true;
      ultimaQuantidadeRef.current = quantidadeColhida;
      // ✅ No carregamento inicial, marcar como informado diretamente se houver diferença
      // (para preservar o valor do banco)
      const valUnitNumArredondado = Number(valUnitNum.toFixed(4));
      const totalCalculado = Number((qtdNum * valUnitNumArredondado).toFixed(2));
      const diferenca = Math.abs(valorColheitaAtual - totalCalculado);
      if (valorColheitaAtual > 0 && diferenca > 0.01) {
        valorColheitaInformadoDiretamente.current = true;
      }
      return; // ✅ Não recalcular no carregamento inicial
    }
    
    // Atualizar ref da quantidade
    ultimaQuantidadeRef.current = quantidadeColhida;

    // ✅ Arredondar valorUnitario para 4 casas decimais (igual ao decimalScale do input)
    // para garantir que o cálculo do total use a mesma precisão exibida
    const valUnitNumArredondado = Number(valUnitNum.toFixed(4));

    // Calcular o valor esperado usando o valorUnitario arredondado
    const totalCalculado = Number((qtdNum * valUnitNumArredondado).toFixed(2));

    // ✅ Se a quantidade mudou, sempre recalcular o total (mantendo valorUnitario original)
    if (quantidadeMudou) {
      valorColheitaInformadoDiretamente.current = false;
      recalculandoPorQuantidade.current = true; // ✅ Marcar que estamos recalculando por quantidade
      
      // ✅ IMPORTANTE: Manter o valorUnitario original arredondado para 4 casas, apenas atualizar valorColheita
      maoObraAtual[index] = {
        ...atual,
        valorColheita: totalCalculado,
        // ✅ Garantir que valorUnitario seja arredondado para 4 casas (igual ao decimalScale do input)
        valorUnitario: atual.valorUnitario ? Number(parseFloat(String(atual.valorUnitario).replace(',', '.')).toFixed(4)) : valUnitNumArredondado,
      };
      form.setFieldsValue({ maoObra: maoObraAtual });
      
      // ✅ Resetar a flag após um pequeno delay para evitar recálculos indesejados
      setTimeout(() => {
        recalculandoPorQuantidade.current = false;
      }, 200);
      
      return;
    }

    // ✅ Se quantidade não mudou, verificar se valor foi informado diretamente
    const diferenca = Math.abs(valorColheitaAtual - totalCalculado);
    const foiInformadoDiretamente = valorColheitaAtual > 0 && diferenca > 0.01;
    
    // ✅ Se foi informado diretamente, marcar a flag e não recalcular
    if (foiInformadoDiretamente) {
      valorColheitaInformadoDiretamente.current = true;
      return;
    }
    
    // ✅ Se o valorColheita foi marcado como informado diretamente, mas agora está igual ao calculado,
    // significa que foi recalculado (ex: usuário editou valorUnitario), então resetar a flag
    if (valorColheitaInformadoDiretamente.current && diferenca < 0.01) {
      valorColheitaInformadoDiretamente.current = false;
    }
    
    // ✅ Se o valorColheita foi informado diretamente, não recalcular
    if (valorColheitaInformadoDiretamente.current) return;

    // Se o valor já está correto, não precisa atualizar
    if (diferenca < 0.01) return;

    // Recalcular apenas se não foi informado diretamente
    maoObraAtual[index] = {
      ...atual,
      valorColheita: totalCalculado,
    };
    form.setFieldsValue({ maoObra: maoObraAtual });
  }, [valorUnitario, form, index, isReadonly, quantidadeColhida, valorColheita]); // ✅ Adicionado valorColheita para detectar mudanças

  // ✅ Handler para calcular valor total quando valor unitário muda
  const handleValorUnitarioChange = (novoValorUnitario) => {
    if (!quantidadeColhida || !novoValorUnitario) return;
    if (isEditingValorTotal.current) return; // Evitar loop

    isEditingValorUnitario.current = true;
    // ✅ Quando o usuário edita valorUnitario, resetar a flag (permite recalcular)
    valorColheitaInformadoDiretamente.current = false;

    const qtdStr = String(quantidadeColhida).replace(',', '.');
    const valUnitStr = String(novoValorUnitario).replace(',', '.');
    const quantidade = parseFloat(qtdStr) || 0;
    const valUnit = parseFloat(valUnitStr) || 0;

    if (quantidade > 0 && valUnit > 0) {
      // ✅ Arredondar valorUnitario para 4 casas decimais antes de calcular o total
      const valUnitArredondado = Number(valUnit.toFixed(4));
      const total = Number((quantidade * valUnitArredondado).toFixed(2));
      // ✅ CORREÇÃO: Usar setFieldValue para atualizar valorColheita sem triggerar onChange
      const maoObraAtual = form.getFieldValue('maoObra');
      maoObraAtual[index] = { 
        ...maoObraAtual[index], 
        valorColheita: total,
        valorUnitario: valUnitArredondado // ✅ Armazenar valor arredondado
      };
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
    // ✅ Se estamos recalculando por mudança de quantidade, não recalcular valorUnitario
    if (recalculandoPorQuantidade.current) return;

    isEditingValorTotal.current = true;
    // ✅ Marcar que o valorColheita foi informado diretamente pelo usuário
    valorColheitaInformadoDiretamente.current = true;

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
            <Space size={6}>
              <Text style={{ 
                color: "#059669", 
                fontSize: "12px", 
                fontWeight: "600" 
              }}>
                {identificador}
              </Text>
              {isReadonly && (
                <Tooltip title="Pagamento PROCESSANDO/PAGO ou vínculo PIX-API. Edição e exclusão bloqueadas.">
                  <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 14 }} />
                </Tooltip>
              )}
            </Space>
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
              loading={loadingTurmas && turmasColheita.length === 0} // ✅ NOVO: Mostrar loading apenas se não houver dados ainda
              notFoundContent={loadingTurmas && turmasColheita.length === 0 ? "Carregando..." : "Nenhuma turma encontrada"} // ✅ NOVO: Mensagem enquanto carrega
              style={{
                borderRadius: "6px",
                borderColor: "#d9d9d9",
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
              disabled={isReadonly}
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
              disabled={isReadonly}
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
              addonAfter={
                podeAlternar ? (
                  <span
                    onClick={() => {
                      const novoValor = !usarUnidadeSecundaria;
                      setUsarUnidadeSecundaria(novoValor);
                      
                      // ✅ ATUALIZAR FORM IMEDIATAMENTE no clique (igual ao valor)
                      const maoObraAtual = form.getFieldValue('maoObra') || [];
                      const unidadeBase = novoValor && frutaSelecionada?.unidadeMedida2
                        ? frutaSelecionada.unidadeMedida2
                        : (frutaSelecionada?.unidadeMedida1 || 'KG');
                      const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
                      const unidadeEncontrada = unidadesValidas.find(u => unidadeBase.includes(u));
                      const unidadeMedida = unidadeEncontrada || 'KG';
                      
                      maoObraAtual[index] = { 
                        ...maoObraAtual[index], 
                        usarUnidadeSecundaria: novoValor,
                        unidadeMedida
                      };
                      
                      form.setFieldsValue({ maoObra: maoObraAtual });
                      ultimoValorFormRef.current = novoValor;
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: '#f0f9ff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e0f2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f9ff';
                    }}
                  >
                    {unidadeFruta}
                  </span>
                ) : (
                  unidadeFruta
                )
              }
              size={isMobile ? "small" : "large"}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem"
              }}
              disabled={isReadonly}
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
              disabled={isReadonly || !quantidadePreenchida}
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
              disabled={isReadonly || !quantidadePreenchida}
              onChange={(value) => {
                // ✅ Marcar imediatamente que o valorColheita foi informado diretamente
                // ANTES de qualquer processamento, para evitar recálculo pelo useEffect
                if (value && quantidadeColhida) {
                  valorColheitaInformadoDiretamente.current = true;
                  handleValorTotalChange(value);
                } else {
                  // Se o valor foi limpo, resetar a flag
                  valorColheitaInformadoDiretamente.current = false;
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
              onClick={() => onRemove(name)}
              disabled={isReadonly}
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


