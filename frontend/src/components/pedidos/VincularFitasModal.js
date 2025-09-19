// src/components/pedidos/VincularFitasModal.js

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Checkbox,
  Input,
  Tag,
  Empty,
  Collapse,
  InputNumber,
  Form,
  Alert,
} from "antd";
import {
  TagOutlined,
  SaveOutlined,
  CloseOutlined,
  AppleOutlined,
  EnvironmentOutlined,
  EditOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../api/axiosConfig";
import { showNotification } from "../../config/notificationConfig";
import useNotificationWithContext from "../../hooks/useNotificationWithContext";
import moment from "moment";
import { 
  consolidarUsoFitas, 
  calcularEstoqueRealDisponivel, 
  validarFitasCompleto,
  criarMapaEstoqueDisponivel 
} from "../../utils/fitasValidation";

const { Text } = Typography;
const { Panel } = Collapse;

const VincularFitasModal = ({
  open,
  onClose,
  fruta,
  onSave,
  loading = false,
  todasFrutasPedido = [], // ✅ NOVA PROP: Todas as frutas do pedido para validação global
  fitasOriginaisTodasFrutas = [], // ✅ NOVA PROP: Fitas originais de todas as frutas (modo edição)
}) => {
  const [fitasComAreas, setFitasComAreas] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [selecoesPorLote, setSelecoesPorLote] = useState({}); // {fitaId_controleBananaId: {fitaNome, areaNome, fitaCor, maxDisponivel, dataRegistro}}
  const [lotesSelecionados, setLotesSelecionados] = useState([]); // Array com seleções + quantidade/observação
  const [errosValidacao, setErrosValidacao] = useState({});
  const [alertasEstoque, setAlertasEstoque] = useState([]); // ✅ NOVO: Alertas de validação global

  // Hook para notificações com z-index correto
  const { error, warning, contextHolder } = useNotificationWithContext();
  
  // ✅ COMPATIBILIDADE: Dados originais do EditarPedidoDialog (quando disponível) ou fallback para dados atuais
  const fitasOriginaisBank = fruta?.fitasOriginaisBanco || fruta?.fitas || [];
  // ✅ DETECTAR MODO: Se há fitasOriginaisBanco, estamos no modo edição (ColheitaTab)
  const isModoEdicao = Boolean(fruta?.fitasOriginaisBanco);
  
  // ✅ NOVA LÓGICA: Estados para validação global
  const [usoGlobalAtual, setUsoGlobalAtual] = useState({});
  const [estoqueGlobalDisponivel, setEstoqueGlobalDisponivel] = useState({});

  // Buscar dados quando modal abrir
  useEffect(() => {
    if (open) {
      fetchDados();
    } else {
      resetStates();
    }
  }, [open, fruta]);

  // Inicializar fitas existentes quando dados estiverem carregados
  useEffect(() => {
    if (open && fitasComAreas.length > 0) {
      initializeFromExistingFitas();
    }
  }, [open, fitasComAreas]);

  const resetStates = () => {
    setSelecoesPorLote({});
    setLotesSelecionados([]);
    setErrosValidacao({});
    setAlertasEstoque([]);
    setUsoGlobalAtual({});
    setEstoqueGlobalDisponivel({});
  };

  const fetchDados = async () => {
    try {
      setLoadingDados(true);
      
      // Consultar o backend para obter endpoint correto
      const response = await axiosInstance.get("/controle-banana/fitas-com-areas");
      const dadosFitas = response.data || [];
      setFitasComAreas(dadosFitas);
      
      // ✅ NOVA LÓGICA: Inicializar validação global
      inicializarValidacaoGlobal(dadosFitas);
      
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      error("Erro", "Erro ao carregar fitas disponíveis");
    } finally {
      setLoadingDados(false);
    }
  };

  // ✅ NOVA FUNÇÃO: Inicializar validação global
  const inicializarValidacaoGlobal = (dadosFitas) => {
    try {
      // Criar mapa de estoque disponível
      const mapaEstoque = criarMapaEstoqueDisponivel(dadosFitas);
      setEstoqueGlobalDisponivel(mapaEstoque);
      
      // Consolidar uso atual de todas as frutas (exceto a fruta sendo editada)
      const frutasParaConsolidar = todasFrutasPedido.filter((_, index) => index !== fruta?.index);
      const usoConsolidado = consolidarUsoFitas(frutasParaConsolidar);
      setUsoGlobalAtual(usoConsolidado);
      
    } catch (error) {
      console.error('Erro ao inicializar validação global:', error);
    }
  };

  const initializeFromExistingFitas = () => {
    if (fruta?.fitas && Array.isArray(fruta.fitas) && fitasComAreas.length > 0) {
      
      // Limpar seleções existentes antes de inicializar
      setSelecoesPorLote({});
      setLotesSelecionados([]);
      
      // NOVA ESTRATÉGIA: Reconstruir seleções individuais por lote
      const novasSelecoes = {};
      const novosLotesSelecionados = [];
      
      fruta.fitas.forEach(fitaExistente => {
        // Verificar se a fita tem detalhesAreas (nova estrutura do backend)
        if (fitaExistente.detalhesAreas && Array.isArray(fitaExistente.detalhesAreas)) {
          // Nova estrutura: fita com detalhesAreas do backend
          fitaExistente.detalhesAreas.forEach(detalhe => {
            // Buscar a fita nas fitas disponíveis
            const fitaData = fitasComAreas.find(f => f.fitaBananaId === fitaExistente.fitaBananaId);
            
            if (fitaData) {
              // Buscar o lote específico usando controleBananaId
              const area = fitaData.areas.find(a => a.areaId === detalhe.areaId);
              if (area) {
                const controleEspecifico = area.controles.find(c => c.id === detalhe.controleBananaId);
                if (controleEspecifico) {
                  
                  const chave = `${fitaData.id}_${controleEspecifico.id}`;
                  
                  novasSelecoes[chave] = {
                    fitaNome: fitaData.nome,
                    areaNome: area.nome,
                    fitaCor: fitaData.corHex,
                    maxDisponivel: controleEspecifico.quantidadeFitas,
                    dataRegistro: controleEspecifico.dataRegistro
                  };
                  
                  novosLotesSelecionados.push({
                    chave,
                    fitaId: fitaData.fitaBananaId,
                    controleBananaId: controleEspecifico.id,
                    areaId: detalhe.areaId,
                    fitaNome: fitaData.nome,
                    areaNome: area.nome,
                    fitaCor: fitaData.corHex,
                    quantidade: detalhe.quantidade || 0,
                    observacoes: fitaExistente.observacoes || '',
                    maxDisponivel: controleEspecifico.quantidadeFitas,
                    dataRegistro: controleEspecifico.dataRegistro
                  });
                }
              }
            }
          });
        } else if (fitaExistente.areaId && fitaExistente.areaNome) {
          // Estrutura antiga: fita com campos diretos de área (compatibilidade)
          const fitaData = fitasComAreas.find(f => f.fitaBananaId === fitaExistente.fitaBananaId);
          if (fitaData) {
            const area = fitaData.areas.find(a => a.areaId === fitaExistente.areaId);
            if (area && area.controles.length > 0) {
              // Usar o primeiro controle disponível como fallback
              const primeiroControle = area.controles[0];
              const chave = `${fitaData.id}_${primeiroControle.id}`;
              
              novasSelecoes[chave] = {
                fitaNome: fitaData.nome,
                areaNome: area.nome,
                fitaCor: fitaData.corHex,
                maxDisponivel: primeiroControle.quantidadeFitas,
                dataRegistro: primeiroControle.dataRegistro
              };
              
              novosLotesSelecionados.push({
                chave,
                fitaId: fitaData.fitaBananaId,
                controleBananaId: primeiroControle.id,
                areaId: fitaExistente.areaId,
                fitaNome: fitaData.nome,
                areaNome: area.nome,
                fitaCor: fitaData.corHex,
                quantidade: fitaExistente.quantidadeFita || 0,
                observacoes: fitaExistente.observacoes || '',
                maxDisponivel: primeiroControle.quantidadeFitas,
                dataRegistro: primeiroControle.dataRegistro
              });
            }
          }
        } else {
          // Estrutura muito antiga: distribuir pelo primeiro lote da primeira área (fallback)
          const fitaData = fitasComAreas.find(f => f.fitaBananaId === fitaExistente.fitaBananaId);
          if (fitaData && fitaData.areas.length > 0) {
            const primeiraArea = fitaData.areas[0];
            if (primeiraArea.controles.length > 0) {
              const primeiroControle = primeiraArea.controles[0];
              const chave = `${fitaData.id}_${primeiroControle.id}`;
              
              if (!novasSelecoes[chave]) {
                novasSelecoes[chave] = {
                  fitaNome: fitaData.nome,
                  areaNome: primeiraArea.nome,
                  fitaCor: fitaData.corHex,
                  maxDisponivel: primeiroControle.quantidadeFitas,
                  dataRegistro: primeiroControle.dataRegistro
                };
                
                novosLotesSelecionados.push({
                  chave,
                  fitaId: fitaData.fitaBananaId,
                  controleBananaId: primeiroControle.id,
                  areaId: primeiraArea.areaId,
                  fitaNome: fitaData.nome,
                  areaNome: primeiraArea.nome,
                  fitaCor: fitaData.corHex,
                  quantidade: fitaExistente.quantidadeFita || 0,
                  observacoes: fitaExistente.observacoes || '',
                  maxDisponivel: primeiroControle.quantidadeFitas,
                  dataRegistro: primeiroControle.dataRegistro
                });
              }
            }
          }
        }
      });
      
      
      setSelecoesPorLote(novasSelecoes);
      setLotesSelecionados(novosLotesSelecionados);
    }
  };

  const toggleLoteSelection = (fitaId, area, controle) => {
    const chave = `${fitaId}_${controle.id}`;
    const fita = fitasComAreas.find(f => f.id === fitaId);
    
    if (selecoesPorLote[chave]) {
      // Remover seleção
      setSelecoesPorLote(prev => {
        const novo = { ...prev };
        delete novo[chave];
        return novo;
      });
      
      // Remover da lista de selecionados
      setLotesSelecionados(prev => prev.filter(item => item.chave !== chave));
    } else {
      // ✅ NOVA LÓGICA: Verificar se pode selecionar este lote
      const loteJaVinculado = isLoteVinculadoAoPedido(fita.fitaBananaId, controle.id);
      const podeSelecionar = controle.quantidadeFitas > 0 || loteJaVinculado;
      
      if (!podeSelecionar) {
        if (isModoEdicao) {
          warning("Estoque Esgotado",
            `O lote da área "${area.nome}" não possui fitas disponíveis`);
        }
        // No modo criação, não mostra notification - apenas não permite seleção
        return;
      }
      
      // Verificar se já não existe para evitar duplicação
      const jaExiste = lotesSelecionados.some(item => item.chave === chave);
      if (jaExiste) {
        return;
      }
      
      // Adicionar seleção
      const novaSelecao = {
        fitaNome: fita?.nome || '',
        areaNome: area.nome,
        fitaCor: fita?.corHex || '#52c41a',
        maxDisponivel: controle.quantidadeFitas,
        dataRegistro: controle.dataRegistro
      };
      
      setSelecoesPorLote(prev => ({
        ...prev,
        [chave]: novaSelecao
      }));
      
      // Adicionar à lista de selecionados (com verificação extra de duplicação)
      setLotesSelecionados(prev => {
        // Verificação dupla para evitar duplicações
        const jaExisteNaLista = prev.some(item => item.chave === chave);
        if (jaExisteNaLista) {
          return prev; // Retorna lista atual sem alterações
        }
        
        return [...prev, {
          chave,
          fitaId: fita?.fitaBananaId || fitaId, // fitaBananaId
          controleBananaId: controle.id,
          areaId: area.areaId,
          fitaNome: fita?.nome || '',
          areaNome: area.nome,
          fitaCor: fita?.corHex || '#52c41a',
          quantidade: 0,
          observacoes: '',
          maxDisponivel: controle.quantidadeFitas,
          dataRegistro: controle.dataRegistro
        }];
      });
    }
  };

  const isLoteSelected = (fitaId, controleBananaId) => {
    return selecoesPorLote.hasOwnProperty(`${fitaId}_${controleBananaId}`);
  };

  // ✅ NOVA FUNÇÃO: Verificar se lote está vinculado ao pedido
  const isLoteVinculadoAoPedido = (fitaBananaId, controleBananaId) => {
    if (!fruta?.fitas) return false;
    
    return fruta.fitas.some(fita => 
      fita.fitaBananaId === fitaBananaId && 
      fita.detalhesAreas?.some(detalhe => detalhe.controleBananaId === controleBananaId)
    );
  };

  const handleQuantidadeChange = (chave, quantidade) => {
    const lote = lotesSelecionados.find(f => f.chave === chave);
    if (!lote) return;
    
    // Atualizar quantidade primeiro
    const lotesSelecionadosAtualizados = lotesSelecionados.map(item => 
      item.chave === chave 
        ? { ...item, quantidade: quantidade || 0 }
        : item
    );
    setLotesSelecionados(lotesSelecionadosAtualizados);
    
    // ✅ NOVA LÓGICA: Validação global em tempo real
    validarEstoqueGlobalEmTempoReal(lotesSelecionadosAtualizados, chave);
  };

  // ✅ NOVA FUNÇÃO: Validação global em tempo real
  const validarEstoqueGlobalEmTempoReal = (lotesSelecionadosAtuais, chaveAlterada = null) => {
    try {
      // Construir dados simulados da fruta atual para validação
      const frutaAtualSimulada = {
        ...fruta,
        fitas: construirFitasParaValidacao(lotesSelecionadosAtuais)
      };
      
      // Construir array com todas as frutas (outras frutas + fruta atual simulada)
      const todasFrutasParaValidacao = [...todasFrutasPedido];
      if (fruta?.index !== undefined && fruta.index >= 0) {
        todasFrutasParaValidacao[fruta.index] = frutaAtualSimulada;
      } else {
        todasFrutasParaValidacao.push(frutaAtualSimulada);
      }
      
      // Executar validação completa
      const resultadoValidacao = validarFitasCompleto(
        todasFrutasParaValidacao,
        fitasComAreas,
        fitasOriginaisTodasFrutas,
        isModoEdicao
      );
      
      // Atualizar alertas globais
      setAlertasEstoque(resultadoValidacao.mensagensErro || []);
      
      // Atualizar erros específicos do lote alterado
      if (chaveAlterada && resultadoValidacao.conflitos) {
        const controleBananaId = chaveAlterada.split('_')[1];
        const conflito = resultadoValidacao.conflitos[controleBananaId];
        
        if (conflito) {
          const loteAtual = lotesSelecionadosAtuais.find(l => l.chave === chaveAlterada);
          if (loteAtual) {
            setErrosValidacao(prev => ({
              ...prev,
              [chaveAlterada]: `Conflito de estoque: ${conflito.quantidadeUsada} fitas solicitadas > ${conflito.estoqueDisponivel} disponíveis (excesso: ${conflito.excesso})`
            }));
          }
        } else {
          // Limpar erro se não há conflito
          setErrosValidacao(prev => {
            const novos = { ...prev };
            delete novos[chaveAlterada];
            return novos;
          });
        }
      }
      
      
    } catch (error) {
      console.error('Erro na validação em tempo real:', error);
    }
  };

  // ✅ NOVA FUNÇÃO: Construir dados de fitas para validação
  const construirFitasParaValidacao = (lotesSelecionadosAtuais) => {
    const fitasPorFitaBananaId = {};
    
    lotesSelecionadosAtuais.forEach(selecao => {
      const fitaId = selecao.fitaId;
      
      if (!fitasPorFitaBananaId[fitaId]) {
        fitasPorFitaBananaId[fitaId] = {
          fitaBananaId: fitaId,
          quantidadeFita: 0,
          observacoes: selecao.observacoes || '',
          detalhesAreas: [],
          _fitaNome: selecao.fitaNome,
          _fitaCor: selecao.fitaCor
        };
      }
      
      fitasPorFitaBananaId[fitaId].quantidadeFita += selecao.quantidade;
      fitasPorFitaBananaId[fitaId].detalhesAreas.push({
        fitaBananaId: fitaId,
        areaId: selecao.areaId,
        quantidade: selecao.quantidade,
        controleBananaId: selecao.controleBananaId
      });
    });
    
    return Object.values(fitasPorFitaBananaId);
  };

  const handleObservacoesChange = (chave, observacoes) => {
    setLotesSelecionados(prev => 
      prev.map(item => 
        item.chave === chave 
          ? { ...item, observacoes }
          : item
      )
    );
  };

  const handleSave = () => {
    // Validar se há seleções
    if (lotesSelecionados.length === 0) {
      warning("Atenção", "Selecione pelo menos um lote de fita");
      return;
    }

    // Validar quantidades
    const selecoesSemQuantidade = lotesSelecionados.filter(item => !item.quantidade || item.quantidade <= 0);
    if (selecoesSemQuantidade.length > 0) {
      warning("Atenção", "Todas as seleções devem ter quantidade maior que zero");
      return;
    }

    // ✅ NOVA VALIDAÇÃO GLOBAL: Validar considerando todas as frutas do pedido
    try {
      // Construir dados simulados da fruta atual
      const frutaAtualSimulada = {
        ...fruta,
        fitas: construirFitasParaValidacao(lotesSelecionados)
      };
      
      // Construir array com todas as frutas (outras frutas + fruta atual simulada)
      const todasFrutasParaValidacao = [...todasFrutasPedido];
      if (fruta?.index !== undefined && fruta.index >= 0) {
        todasFrutasParaValidacao[fruta.index] = frutaAtualSimulada;
      } else {
        todasFrutasParaValidacao.push(frutaAtualSimulada);
      }
      
      // Executar validação completa
      const resultadoValidacao = validarFitasCompleto(
        todasFrutasParaValidacao,
        fitasComAreas,
        fitasOriginaisTodasFrutas,
        isModoEdicao
      );
      
      
      // Se há conflitos, não permitir salvar
      if (!resultadoValidacao.valido) {
        setAlertasEstoque(resultadoValidacao.mensagensErro || []);
        
        error(
          "Conflito de Estoque Detectado",
          `${resultadoValidacao.mensagensErro?.length || 0} conflito(s) encontrado(s). Verifique os alertas e ajuste as quantidades.`
        );
        return;
      }
      
    } catch (error) {
      console.error('Erro na validação final:', error);
      error("Erro", "Erro interno na validação. Tente novamente.");
      return;
    }

    // Validar erros de validação locais existentes
    if (Object.keys(errosValidacao).length > 0) {
      error("Erro de Validação", "Corrija as quantidades com erro antes de continuar");
      return;
    }

    // NOVA LÓGICA: Agrupar por fitaBananaId mas processar controleBananaId individuais
    const fitasConsolidadas = {};
    
    lotesSelecionados.forEach(selecao => {
      const fitaId = selecao.fitaId;
      
      if (!fitasConsolidadas[fitaId]) {
        // Primeira ocorrência desta fita
        fitasConsolidadas[fitaId] = {
          fitaBananaId: fitaId,
          quantidadeFita: 0,
          observacoes: selecao.observacoes || '',
          detalhesAreas: [],
          // Campos para reconstrução no frontend
          _fitaNome: selecao.fitaNome,
          _fitaCor: selecao.fitaCor
        };
      }
      
      // Somar quantidade total
      fitasConsolidadas[fitaId].quantidadeFita += selecao.quantidade;
      
      // Adicionar detalhe do lote com controleBananaId específico
      fitasConsolidadas[fitaId].detalhesAreas.push({
        fitaBananaId: fitaId,
        areaId: selecao.areaId,
        quantidade: selecao.quantidade,
        controleBananaId: selecao.controleBananaId // ✅ Incluir controleBananaId específico do lote selecionado
      });
    });
    
    // Converter objeto consolidado para array
    const fitasComDetalhes = Object.values(fitasConsolidadas);

    onSave(fitasComDetalhes);
    onClose();
  };

  return (
    <>
      {contextHolder}
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
          <TagOutlined style={{ marginRight: 8 }} />
          Vincular Fitas - {fruta?.frutaNome || 'Banana'}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      styles={{
        body: { 
          maxHeight: "calc(100vh - 200px)", 
          overflowY: "auto", 
          overflowX: "hidden", 
          padding: 20 
        },
        header: { 
          backgroundColor: "#059669", 
          borderBottom: "2px solid #047857", 
          padding: 0 
        },
      }}
      centered
      destroyOnClose
    >
      {/* Informações da Fruta */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Informações da Fruta</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Fruta:</Text>
            <br />
            <Text>{fruta?.frutaNome}</Text>
          </Col>
          <Col span={8}>
            <Text strong>Quantidade Prevista:</Text>
            <br />
            <Text>{fruta?.quantidadePrevista} {fruta?.unidadeMedida1}</Text>
          </Col>
          <Col span={8}>
            <Text strong>Seleções:</Text>
            <br />
            <Tag color="blue">{lotesSelecionados.length} lote(s) selecionado(s)</Tag>
          </Col>
        </Row>
      </Card>

      {/* ✅ NOVA SEÇÃO: Alertas de Validação Global */}
      {alertasEstoque.length > 0 && (
        <Alert
          message="⚠️ Conflitos de Estoque Detectados"
          description={
            <div>
              <Text strong style={{ color: '#d32f2f' }}>
                As seleções atuais extrapolam o estoque disponível:
              </Text>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                {alertasEstoque.map((alerta, index) => (
                  <li key={index} style={{ marginBottom: 4, color: '#d32f2f' }}>
                    {alerta}
                  </li>
                ))}
              </ul>
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ 
            marginBottom: 16,
            border: '2px solid #ff4d4f',
            backgroundColor: '#fff2f0'
          }}
          closable={false}
        />
      )}

      {/* PRIMEIRA SEÇÃO: Seleção de Fitas por Área */}
      <Card
        title={
          <Space>
            <TagOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Selecionar Lotes de Fitas por Área</span>
          </Space>
        }
        style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
        styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
        loading={loadingDados}
      >
        {fitasComAreas.length > 0 ? (
          <Collapse 
            ghost
            expandIconPosition="end"
            style={{ backgroundColor: 'transparent' }}
            defaultActiveKey={(() => {
              // ✅ Iniciar com fitas vinculadas ao pedido expandidas
              const fitasVinculadas = fitasComAreas.filter(fita => {
                return fruta?.fitas?.some(f => f.fitaBananaId === fita.fitaBananaId);
              });
              return fitasVinculadas.map(fita => fita.id);
            })()}
          >
            {(() => {
              // ✅ Filtrar e ordenar fitas baseado no modo de operação
              let fitasFiltradas = fitasComAreas.filter(fita => {
                const estaVinculadaAoPedido = fruta?.fitas?.some(f => f.fitaBananaId === fita.fitaBananaId);
                const temEstoqueEmAlgumaArea = fita.areas.some(area => 
                  area.controles.some(controle => controle.quantidadeFitas > 0)
                );
                
                if (isModoEdicao) {
                  // MODO EDIÇÃO: Mostrar fitas vinculadas OU com estoque
                  return estaVinculadaAoPedido || temEstoqueEmAlgumaArea;
                } else {
                  // MODO CRIAÇÃO: Mostrar apenas fitas com estoque
                  return temEstoqueEmAlgumaArea;
                }
              });
              
              // Ordenar fitas: primeiro as vinculadas ao pedido, depois as outras
              const fitasVinculadas = fitasFiltradas.filter(fita => {
                return fruta?.fitas?.some(f => f.fitaBananaId === fita.fitaBananaId);
              });
              const fitasNaoVinculadas = fitasFiltradas.filter(fita => {
                return !fruta?.fitas?.some(f => f.fitaBananaId === fita.fitaBananaId);
              });
              
              return [...fitasVinculadas, ...fitasNaoVinculadas];
            })().map((fita) => (
              <Panel 
                key={fita.id}
                header={
                  <Space>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: fita.corHex,
                        borderRadius: '50%',
                        border: '1px solid #d9d9d9',
                        display: 'inline-block'
                      }}
                    />
                    <Text strong style={{ fontSize: '16px' }}>{fita.nome}</Text>
                    {(() => {
                      // ✅ Verificar se esta fita está vinculada ao pedido
                      const estaVinculada = fruta?.fitas?.some(f => f.fitaBananaId === fita.fitaBananaId);
                      return estaVinculada ? (
                        <Tag color="green" size="small">
                          ✅ Vinculada ao pedido
                        </Tag>
                      ) : (
                        <Tag color="blue" size="small">
                          {fita.totalDisponivel} fitas em {fita.areas.filter(area => 
                            area.controles.some(controle => controle.quantidadeFitas > 0)
                          ).length} área(s)
                        </Tag>
                      );
                    })()}
                  </Space>
                }
                style={{ 
                  marginBottom: 8,
                  border: '1px solid #e8e8e8',
                  borderRadius: '6px',
                  backgroundColor: '#fafafa'
                }}
              >
                <div style={{ paddingLeft: 20 }}>
                  <Row gutter={[16, 16]}>
                    {/* ✅ NOVA LÓGICA: Mostrar lotes individuais por área */}
                    {fita.areas
                      .filter((area) => {
                        // ✅ FILTRO APRIMORADO: Lógica diferente para edição vs criação
                        if (isModoEdicao) {
                          // MODO EDIÇÃO: Mostrar lotes com estoque OU já vinculados ao pedido
                          return area.controles.some(controle => {
                            const loteJaVinculado = isLoteVinculadoAoPedido(fita.fitaBananaId, controle.id);
                            const temEstoque = controle.quantidadeFitas > 0;
                            return temEstoque || loteJaVinculado;
                          });
                        } else {
                          // MODO CRIAÇÃO: Mostrar apenas lotes com estoque > 0
                          return area.controles.some(controle => controle.quantidadeFitas > 0);
                        }
                      })
                      .map((area) => (
                        <Col xs={24} key={area.areaId}>
                          <div style={{ marginBottom: 12 }}>
                            {/* Cabeçalho da Área */}
                            <div style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#f0f2f5', 
                              borderRadius: '6px 6px 0 0', 
                              borderBottom: '1px solid #d9d9d9',
                              fontWeight: '700',
                              fontSize: '14px'
                            }}>
                              <EnvironmentOutlined style={{ marginRight: 8, color: '#059669' }} />
                              <strong>{area.nome} ({area.areaTotal} ha) - {area.culturas}</strong>
                            </div>
                            
                            {/* Lotes da Área */}
                            <Row gutter={[8, 8]} style={{ padding: '8px' }}>
                              {area.controles
                                .filter(controle => {
                                  if (isModoEdicao) {
                                    // MODO EDIÇÃO: Mostrar lotes com estoque OU já vinculados
                                    const loteJaVinculado = isLoteVinculadoAoPedido(fita.fitaBananaId, controle.id);
                                    const temEstoque = controle.quantidadeFitas > 0;
                                    return temEstoque || loteJaVinculado;
                                  } else {
                                    // MODO CRIAÇÃO: Mostrar apenas com estoque > 0
                                    return controle.quantidadeFitas > 0;
                                  }
                                })
                                .sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro)) // Mais recentes primeiro
                                .map((controle) => {
                                  const isSelected = isLoteSelected(fita.id, controle.id);
                                  const loteJaVinculado = isLoteVinculadoAoPedido(fita.fitaBananaId, controle.id);
                                  const temEstoque = controle.quantidadeFitas > 0;
                                  const podeSelecionar = isModoEdicao ? (temEstoque || loteJaVinculado) : temEstoque;
                                  
                                  const diasTotais = controle.tempoDesdeData?.dias || 0;
                                  const semanasExatas = diasTotais / 7;
                                  const tempoFormatado = diasTotais < 7 
                                    ? `${diasTotais} dia${diasTotais !== 1 ? 's' : ''}`
                                    : `${Math.ceil(semanasExatas)} semana${Math.ceil(semanasExatas) !== 1 ? 's' : ''}`;
                                  
                                  // Função para escurecer a cor hex
                                  const darkenColor = (hex, amount = 0.2) => {
                                    const num = parseInt(hex.replace('#', ''), 16);
                                    const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
                                    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
                                    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
                                    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
                                  };
                                  
                                  const corEscurecida = darkenColor(fita.corHex, 0.3);
                                  
                                  return (
                                    <Col xs={24} sm={12} lg={6} key={controle.id}>
                                      <Card 
                                        size="small"
                                        style={{ 
                                          border: isSelected ? `2px solid ${corEscurecida}` : 
                                                 loteJaVinculado ? '2px solid #52c41a' : `1px solid ${fita.corHex}`,
                                          backgroundColor: isSelected ? `${fita.corHex}25` : 
                                                        loteJaVinculado ? '#f6ffed' : '#fff',
                                          opacity: podeSelecionar ? 1 : 0.6,
                                          cursor: podeSelecionar ? 'pointer' : 'not-allowed',
                                          borderRadius: '8px',
                                          overflow: 'hidden',
                                          boxShadow: isSelected ? `0 2px 8px ${fita.corHex}40` : '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onClick={(e) => {
                                          // Só executar se o clique não foi no checkbox
                                          if (e.target.type !== 'checkbox' && !e.target.closest('.ant-checkbox-wrapper')) {
                                            podeSelecionar && toggleLoteSelection(fita.id, area, controle);
                                          }
                                        }}
                                        styles={{ body: { padding: '10px' } }}
                                      >
                                        {/* Header com gradiente da cor da fita */}
                                        <div style={{
                                          background: `linear-gradient(135deg, ${fita.corHex} 0%, ${corEscurecida} 100%)`,
                                          margin: '-10px -10px 8px -10px',
                                          padding: '6px 10px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          color: '#fff',
                                          fontWeight: '600',
                                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                        }}>
                                          <div style={{ fontSize: '12px' }}>
                                            Marcado: {moment(controle.dataRegistro).format('DD/MM/YY')}
                                          </div>
                                          {loteJaVinculado && (
                                            <div style={{ 
                                              backgroundColor: 'rgba(255,255,255,0.2)', 
                                              borderRadius: '12px', 
                                              padding: '2px 6px',
                                              fontSize: '10px'
                                            }}>
                                              ✅ Vinculado
                                            </div>
                                          )}
                                        </div>
                                        
                                        <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                          {/* Checkbox com tempo integrado e quantidade à direita */}
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <Checkbox
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  e.stopPropagation(); // Evitar duplo clique
                                                  toggleLoteSelection(fita.id, area, controle);
                                                }}
                                                disabled={!podeSelecionar}
                                              />
                                              <div style={{
                                                backgroundColor: `${fita.corHex}15`,
                                                border: `1px solid ${fita.corHex}40`,
                                                color: corEscurecida,
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                padding: '2px 8px',
                                                borderRadius: '8px'
                                              }}>
                                                {tempoFormatado}
                                              </div>
                                            </div>
                                            
                                            <div style={{
                                              backgroundColor: fita.corHex,
                                              color: '#fff',
                                              fontSize: '12px',
                                              fontWeight: '600',
                                              padding: '2px 8px',
                                              borderRadius: '12px',
                                              textShadow: '0 1px 1px rgba(0,0,0,0.2)'
                                            }}>
                                              {controle.quantidadeFitas} fitas
                                            </div>
                                          </div>
                                          
                                          {/* Observações se existirem */}
                                          {controle.observacoes && (
                                            <div style={{ 
                                              fontSize: '10px', 
                                              fontStyle: 'italic', 
                                              color: '#666', 
                                              backgroundColor: '#f8f9fa',
                                              padding: '4px 6px',
                                              borderRadius: '4px',
                                              borderLeft: `3px solid ${fita.corHex}`,
                                              maxHeight: '32px',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis'
                                            }}>
                                              {controle.observacoes.length > 50 
                                                ? `${controle.observacoes.substring(0, 50)}...`
                                                : controle.observacoes
                                              }
                                            </div>
                                          )}
                                        </Space>
                                      </Card>
                                    </Col>
                                  );
                                })}
                            </Row>
                          </div>
                        </Col>
                      ))
                    }
                  </Row>
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <Empty description="Nenhum lote de fita de banana com estoque disponível" />
        )}
      </Card>

      {/* SEGUNDA SEÇÃO: Lotes Selecionados com Quantidade/Observação */}
      {lotesSelecionados.length > 0 && (
        <Card
          title={
            <Space>
              <EditOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>Lotes Selecionados - Definir Quantidades</span>
              <Tag 
                color="green" 
                size="small"
                style={{ 
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                {lotesSelecionados.length} lote(s) selecionado(s)
              </Tag>
            </Space>
          }
          style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, backgroundColor: "#f9f9f9" }}
          styles={{ header: { backgroundColor: "#059669", borderBottom: "2px solid #047857", color: "#ffffff", borderRadius: "8px 8px 0 0" } }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {lotesSelecionados.map((item, index) => {
              // Função para escurecer a cor hex (mesma do card superior)
              const darkenColor = (hex, amount = 0.2) => {
                const num = parseInt(hex.replace('#', ''), 16);
                const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
                const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
                const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
                return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
              };
              
              const corEscurecida = darkenColor(item.fitaCor, 0.3);
              
              return (
                <Card 
                  key={item.chave}
                  size="small" 
                  style={{
                    border: `2px solid ${corEscurecida}`,
                    backgroundColor: `${item.fitaCor}15`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: `0 2px 6px ${item.fitaCor}30`,
                    marginBottom: 12
                  }}
                  styles={{ body: { padding: '12px' } }}
                >
                  {/* Header com gradiente da cor da fita */}
                  <div style={{
                    background: `linear-gradient(135deg, ${item.fitaCor} 0%, ${corEscurecida} 100%)`,
                    margin: '-12px -12px 12px -12px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{item.fitaNome} - {item.areaNome}</span>
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      Marcado em {moment(item.dataRegistro).format('DD/MM/YY')}
                    </div>
                  </div>
                    
                  {/* Conteúdo inline - Quantidade e Observações na mesma linha */}
                  <Row gutter={16} align="middle">
                    <Col span={8}>
                      <div>
                        {(() => {
                          if (isModoEdicao) {
                            // MODO EDIÇÃO: Mostrar detalhes completos
                            const fitaExistente = fitasOriginaisBank.find(f => 
                              f.fitaBananaId === item.fitaId && 
                              f.detalhesAreas?.some(d => d.controleBananaId === item.controleBananaId)
                            );
                            
                            const quantidadeJaVinculada = fitaExistente?.detalhesAreas?.find(d => d.controleBananaId === item.controleBananaId)?.quantidade || 0;
                            const estoqueRealDisponivel = item.maxDisponivel + quantidadeJaVinculada;
                            
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={{ fontSize: '12px', color: '#333', whiteSpace: 'nowrap', fontWeight: 700 }}>
                                  Quantidade (máx: {estoqueRealDisponivel}):
                                </Text>
                                {quantidadeJaVinculada > 0 && (
                                  <Tag 
                                    color="blue" 
                                    size="small" 
                                    style={{ 
                                      fontSize: '10px', 
                                      lineHeight: '16px',
                                      margin: 0,
                                      padding: '0 4px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {item.maxDisponivel} marcada + {quantidadeJaVinculada} vinculadas
                                  </Tag>
                                )}
                              </div>
                            );
                          } else {
                            // MODO CRIAÇÃO: Mostrar apenas o estoque disponível
                            return (
                              <Text style={{ fontSize: '12px', display: 'block', marginBottom: 4, color: '#333', fontWeight: 700 }}>
                                Quantidade (máx: {item.maxDisponivel}):
                              </Text>
                            );
                          }
                        })()}
                        <Form.Item
                          validateStatus={errosValidacao[item.chave] ? 'error' : ''}
                          help={errosValidacao[item.chave] || ''}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            size="large"
                            min={0}
                            value={item.quantidade}
                            onChange={(value) => handleQuantidadeChange(item.chave, value || 0)}
                            style={{ 
                              width: '100%',
                              borderColor: item.fitaCor
                            }}
                            placeholder="0"
                          />
                        </Form.Item>
                      </div>
                    </Col>
                    
                    <Col span={16}>
                      <div>
                        <Text style={{ fontSize: '12px', display: 'block', marginBottom: 4, color: '#333', fontWeight: 700 }}>
                          Observações (opcional):
                        </Text>
                        <Input
                          size="large"
                          placeholder="Ex: Fita para banana premium"
                          value={item.observacoes}
                          onChange={(e) => handleObservacoesChange(item.chave, e.target.value)}
                          style={{ 
                            width: '100%',
                            borderColor: `${item.fitaCor}60`
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        </Card>
      )}


      {/* Botões de Ação */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
        <Button 
          icon={<CloseOutlined />}
          onClick={onClose} 
          disabled={loading}
          size="large"
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          size="large"
          style={{
            backgroundColor: "#059669",
            borderColor: "#059669",
          }}
        >
          Confirmar Vinculação
        </Button>
      </div>
      </Modal>
    </>
  );
};

VincularFitasModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fruta: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  todasFrutasPedido: PropTypes.array, // ✅ NOVA PROP
  fitasOriginaisTodasFrutas: PropTypes.array, // ✅ NOVA PROP
};

export default VincularFitasModal;