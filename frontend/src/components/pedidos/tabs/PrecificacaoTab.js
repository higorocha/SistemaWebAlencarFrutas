// src/components/pedidos/tabs/PrecificacaoTab.js

import React, { useState, useEffect } from "react";
import { Button, Space, Form, Input, Row, Col, Typography, Card, Divider, Tag, Tooltip, DatePicker, InputNumber } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  AppleOutlined,
  CalculatorOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  TagOutlined,
  CarOutlined,
  PercentageOutlined,
  EyeOutlined,
  TruckOutlined,
  CalendarOutlined,
  BuildOutlined,
  NumberOutlined
} from "@ant-design/icons";
import { MonetaryInput } from "../../../components/common/inputs";
import { formatarValorMonetario } from "../../../utils/formatters";
import { FormButton } from "../../common/buttons";
import VisualizarAreasFitasModal from "../VisualizarAreasFitasModal";
import axiosInstance from "../../../api/axiosConfig";
import moment from "moment";

const { Text } = Typography;

const PrecificacaoTab = ({
  pedidoAtual,
  setPedidoAtual,
  erros,
  setErros,
  canEditTab,
  frutas,
  areasProprias,
  areasFornecedores,
  valoresCalculados,
  setValoresCalculados,
  onSave,
  onCancel,
  loading,
  isSaving,
  calcularValores,
  pedido,
  clientes,
}) => {
  // Estados para dados e modais
  const [fitasBanana, setFitasBanana] = useState([]);
  const [visualizarModalOpen, setVisualizarModalOpen] = useState(false);
  const [frutaSelecionada, setFrutaSelecionada] = useState(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState('areas'); // 'areas' ou 'fitas'

  // Carregar fitas de banana quando o componente montar
  useEffect(() => {
    const fetchFitasBanana = async () => {
      try {
        const response = await axiosInstance.get("/fitas-banana");
        setFitasBanana(response.data || []);
      } catch (error) {
        console.error("Erro ao buscar fitas:", error);
      }
    };

    fetchFitasBanana();
  }, []);

  const handleChange = (field, value) => {
    // Para campos numéricos, garantir que seja um número válido ou undefined
    let processedValue = value;
    if (['frete', 'icms', 'desconto', 'avaria'].includes(field)) {
      if (value === null || value === '' || value === undefined) {
        processedValue = undefined;
      } else {
        processedValue = Number(value);
      }
    }

    setPedidoAtual(prev => ({
      ...prev,
      [field]: processedValue,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Calcular valores automaticamente para campos de precificação
    if (['frete', 'icms', 'desconto', 'avaria'].includes(field)) {
      const novosValores = {
        ...valoresCalculados,
        [field]: processedValue || 0,
      };
      setValoresCalculados(novosValores);
      calcularValores(
        field === 'frete' ? (processedValue || 0) : valoresCalculados.frete,
        field === 'icms' ? (processedValue || 0) : valoresCalculados.icms,
        field === 'desconto' ? (processedValue || 0) : valoresCalculados.desconto,
        field === 'avaria' ? (processedValue || 0) : valoresCalculados.avaria
      );
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          // Para campos numéricos, garantir que seja um número válido ou undefined
          let processedValue = value;
          if (['valorUnitario', 'valorTotal'].includes(field)) {
            if (value === null || value === '' || value === undefined) {
              processedValue = undefined;
            } else {
              processedValue = Number(value);
            }
          }
          
          const frutaAtualizada = { ...fruta, [field]: processedValue };
          
          // Se alterou o valor unitário, calcular o valor total da fruta
          if (field === 'valorUnitario') {
            let quantidadeParaCalculo = 0;
            
            if (fruta.unidadePrecificada === fruta.unidadeMedida1) {
              quantidadeParaCalculo = fruta.quantidadeReal || 0;
            } else if (fruta.unidadePrecificada === fruta.unidadeMedida2) {
              quantidadeParaCalculo = fruta.quantidadeReal2 || 0;
            } else {
              quantidadeParaCalculo = fruta.quantidadeReal || 0;
            }
            
            frutaAtualizada.valorTotal = quantidadeParaCalculo * (value || 0);
          }
          
          return frutaAtualizada;
        }
        return fruta;
      });
      
      return { ...prev, frutas: novasFrutas };
    });

    // Se alterou valor unitário ou unidade de precificação, recalcular valores consolidados
    if (['valorUnitario', 'unidadePrecificada'].includes(field)) {
      setTimeout(() => {
        calcularValores(
          valoresCalculados.frete || 0,
          valoresCalculados.icms || 0,
          valoresCalculados.desconto || 0,
          valoresCalculados.avaria || 0
        );
      }, 100);
    }
  };

  // Função para alternar unidade de medida de uma fruta específica
  const toggleUnidadeFruta = (frutaIndex) => {
    const fruta = pedidoAtual.frutas[frutaIndex];
    if (!fruta?.unidadeMedida2) return;

    const novaUnidade = fruta.unidadePrecificada === fruta.unidadeMedida1 
      ? fruta.unidadeMedida2 
      : fruta.unidadeMedida1;

    // Atualizar a unidade e recalcular o valor total individual
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((frutaItem, i) => {
        if (i === frutaIndex) {
          const frutaAtualizada = { ...frutaItem, unidadePrecificada: novaUnidade };
          
          // Recalcular valor total baseado na nova unidade
          let quantidadeParaCalculo = 0;
          if (novaUnidade === frutaItem.unidadeMedida1) {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          } else if (novaUnidade === frutaItem.unidadeMedida2) {
            quantidadeParaCalculo = frutaItem.quantidadeReal2 || 0;
          } else {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          }
          
          frutaAtualizada.valorTotal = quantidadeParaCalculo * (frutaItem.valorUnitario || 0);
          
          return frutaAtualizada;
        }
        return frutaItem;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
    
    // Recalcular valores consolidados considerando a nova unidade
    setTimeout(() => {
      calcularValores(
        valoresCalculados.frete || 0, 
        valoresCalculados.icms || 0, 
        valoresCalculados.desconto || 0, 
        valoresCalculados.avaria || 0
      );
    }, 100);
  };

  // Funções para abrir modais de visualização
  const handleVisualizarAreas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setTipoVisualizacao('areas');
    setVisualizarModalOpen(true);
  };

  const handleVisualizarFitas = (fruta, frutaIndex) => {
    setFrutaSelecionada({ ...fruta, index: frutaIndex });
    setTipoVisualizacao('fitas');
    setVisualizarModalOpen(true);
  };

  // Verificar se fruta tem áreas vinculadas (não placeholders)
  const hasLinkedAreas = (fruta) => {
    return fruta?.areas && fruta.areas.some(area => 
      area.areaPropriaId || area.areaFornecedorId
    );
  };

  // Verificar se fruta tem fitas vinculadas
  const hasLinkedFitas = (fruta) => {
    return fruta?.fitas && fruta.fitas.length > 0;
  };

  // Verificar se o pedido tem alguma fruta com fitas vinculadas
  const pedidoTemFitas = () => {
    return pedidoAtual?.frutas?.some(fruta => hasLinkedFitas(fruta)) || false;
  };

  // Obter nomes das áreas vinculadas
  const getLinkedAreasNames = (fruta) => {
    if (!fruta?.areas) return [];
    
    const realAreas = fruta.areas.filter(area => 
      area.areaPropriaId || area.areaFornecedorId
    );

    return realAreas.map(area => {
      if (area.areaPropriaId) {
        const areaPropria = areasProprias.find(a => a.id === area.areaPropriaId);
        return {
          nome: areaPropria?.nome?.toUpperCase() || `ÁREA ${area.areaPropriaId}`,
          tipo: 'propria'
        };
      } else {
        const areaFornecedor = areasFornecedores.find(a => a.id === area.areaFornecedorId);
        return {
          nome: areaFornecedor?.nome?.toUpperCase() || `ÁREA FORNECEDOR ${area.areaFornecedorId}`,
          tipo: 'fornecedor'
        };
      }
    });
  };

  // Obter nomes das fitas vinculadas
  const getLinkedFitasNames = (fruta) => {
    if (!fruta?.fitas) return [];
    
    return fruta.fitas.map(fita => {
      const fitaBanana = fitasBanana.find(f => f.id === fita.fitaBananaId);
      return {
        nome: fitaBanana?.nome || `Fita ${fita.fitaBananaId}`,
        cor: fitaBanana?.corHex || '#52c41a',
        quantidade: fita.quantidadeFita
      };
    });
  };

  return (
    <div style={{ minHeight: "830px", position: "relative", paddingBottom: "80px" }}>
      {/* Frutas da Precificação */}
      <Card
        title={
          <Space>
            <AppleOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Frutas da Precificação</span>
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
          }
        }}
      >
        {/* Cabeçalho das colunas */}
        {(() => {
          const temFitas = pedidoTemFitas();
          
          return (
            <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
              <Col xs={24} md={temFitas ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <AppleOutlined style={{ marginRight: 8 }} />
                  Fruta
                </span>
              </Col>
              <Col xs={24} md={temFitas ? 3 : 4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Und 1
                </span>
              </Col>
              <Col xs={24} md={temFitas ? 3 : 4}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Und 2
                </span>
              </Col>
              <Col xs={24} md={temFitas ? 4 : 5}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  Áreas
                </span>
              </Col>
              {temFitas && (
                <Col xs={24} md={3}>
                  <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    Fitas
                  </span>
                </Col>
              )}
              <Col xs={24} md={temFitas ? 3 : 3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <DollarOutlined style={{ marginRight: 8 }} />
                  Valor Unit.
                </span>
              </Col>
              <Col xs={24} md={temFitas ? 4 : 3}>
                <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
                  <CalculatorOutlined style={{ marginRight: 8 }} />
                  Total
                </span>
              </Col>
            </Row>
          );
        })()}

        {pedidoAtual.frutas.map((fruta, index) => {
          const temFitas = pedidoTemFitas();
          
          return (
            <div key={index}>
              <Row gutter={[16, 16]} align="baseline">
                {/* Nome da Fruta */}
                <Col xs={24} md={temFitas ? 4 : 5}>
                <Tooltip title={frutas.find(f => f.id === fruta.frutaId)?.nome || ''} placement="top">
                  <Input
                    disabled
                    value={frutas.find(f => f.id === fruta.frutaId)?.nome || ''}
                    style={{
                      borderRadius: "6px",
                      fontSize: "13px"
                    }}
                  />
                </Tooltip>
              </Col>

              {/* Quantidade Real */}
              <Col xs={24} md={temFitas ? 3 : 4}>
                <Input
                  disabled
                  value={`${fruta.quantidadeReal || '0'} ${fruta.unidadeMedida1 || ''}`.trim()}
                  style={{
                    borderRadius: "6px",
                    fontSize: "13px",
                    textAlign: "center"
                  }}
                />
              </Col>

              {/* Quantidade Real 2 */}
              <Col xs={24} md={temFitas ? 3 : 4}>
                <Input
                  disabled
                  value={fruta.unidadeMedida2 ? `${fruta.quantidadeReal2 || '0'} ${fruta.unidadeMedida2}`.trim() : ''}
                  className={!fruta.unidadeMedida2 ? 'custom-disabled-visual' : ''}
                  style={{
                    borderRadius: "6px",
                    fontSize: "13px",
                    textAlign: "center"
                  }}
                />
              </Col>

              {/* Coluna de Áreas */}
              <Col xs={24} md={temFitas ? 4 : 5}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {hasLinkedAreas(fruta) ? (
                    <>
                      {/* Botão com apenas ícone */}
                      <Tooltip title="Ver áreas">
                        <FormButton
                          icon={<EyeOutlined />}
                          onClick={() => handleVisualizarAreas(fruta, index)}
                          style={{ 
                            minWidth: '32px',
                            width: '32px',
                            padding: '0'
                          }}
                        />
                      </Tooltip>
                      
                      {/* Badges das áreas */}
                      {getLinkedAreasNames(fruta).slice(0, 1).map((area, idx) => (
                        <Tag 
                          key={idx} 
                          size="small" 
                          color={area.tipo === 'propria' ? 'green' : 'blue'}
                          style={{ 
                            fontSize: '11px',
                            maxWidth: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {area.nome}
                        </Tag>
                      ))}
                      
                      {/* Badge "+X" se houver mais áreas */}
                      {getLinkedAreasNames(fruta).length > 1 && (
                        <Tag size="small" color="blue" style={{ fontSize: '11px' }}>
                          +{getLinkedAreasNames(fruta).length - 1}
                        </Tag>
                      )}
                    </>
                  ) : (
                    <Tag color="default" style={{ fontSize: '11px' }}>
                      Sem áreas
                    </Tag>
                  )}
                </div>
              </Col>

              {/* Coluna de Fitas - Só aparece se o pedido tem fitas */}
              {temFitas && (
                <Col xs={24} md={3}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {hasLinkedFitas(fruta) ? (
                      <>
                        {/* Botão com apenas ícone */}
                        <Tooltip title="Ver fitas">
                          <FormButton
                            icon={<EyeOutlined />}
                            onClick={() => handleVisualizarFitas(fruta, index)}
                            style={{ 
                              minWidth: '32px',
                              width: '32px',
                              padding: '0'
                            }}
                          />
                        </Tooltip>
                        
                        {/* Badges das fitas */}
                        {getLinkedFitasNames(fruta).slice(0, 1).map((fita, idx) => (
                          <Tag 
                            key={idx} 
                            size="small" 
                            style={{ 
                              fontSize: '11px',
                              backgroundColor: fita.cor + '20',
                              borderColor: fita.cor,
                              color: '#333',
                              maxWidth: '60px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {fita.nome}
                          </Tag>
                        ))}
                        
                        {/* Badge "+X" se houver mais fitas */}
                        {getLinkedFitasNames(fruta).length > 1 && (
                          <Tag size="small" color="purple" style={{ fontSize: '11px' }}>
                            +{getLinkedFitasNames(fruta).length - 1}
                          </Tag>
                        )}
                      </>
                    ) : (
                      <Tag color="default" style={{ fontSize: '11px' }}>
                        Sem fitas
                      </Tag>
                    )}
                  </div>
                </Col>
              )}

              {/* Valor Unitário */}
              <Col xs={24} md={temFitas ? 3 : 3}>
                <MonetaryInput
                  placeholder="Ex: 12,50"
                  addonAfter={
                    <span
                      onClick={() => toggleUnidadeFruta(index)}
                      style={{ 
                        cursor: fruta.unidadeMedida2 ? 'pointer' : 'default',
                        userSelect: 'none', 
                        fontWeight: 600,
                        color: fruta.unidadeMedida2 ? '#1890ff' : '#666',
                        fontSize: '12px',
                        minWidth: '35px',
                        display: 'block',
                        textAlign: 'center'
                      }}
                      title={fruta.unidadeMedida2 ? 'Clique para alternar unidade' : undefined}
                    >
                      {fruta.unidadePrecificada || fruta.unidadeMedida1 || 'UND'}
                    </span>
                  }
                  size="large"
                  value={fruta.valorUnitario}
                  onChange={(value) => handleFrutaChange(index, 'valorUnitario', value)}
                  disabled={!canEditTab("3")}
                  style={{
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                />
              </Col>

              {/* Valor Total */}
              <Col xs={24} md={temFitas ? 4 : 3}>
                <Input
                  disabled
                  value={formatarValorMonetario(fruta.valorTotal || 0)}
                  style={{
                    borderRadius: "6px",
                    borderColor: "#d9d9d9",
                    backgroundColor: "#f0fdf4",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#15803d",
                    fontSize: "13px"
                  }}
                />
              </Col>
            </Row>

            {index < pedidoAtual.frutas.length - 1 && <Divider style={{ margin: "8px 0" }} />}
          </div>
        );
        })}
      </Card>

      {/* Valores Consolidados */}
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Valores Consolidados</span>
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
          }
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Form.Item
              label={
                <Space>
                  <TruckOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Frete</span>
                </Space>
              }
            >
              <MonetaryInput
                placeholder="Ex: 150,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.frete}
                onChange={(value) => handleChange('frete', value)}
                disabled={!canEditTab("3")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label={
                <Space>
                  <PercentageOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>ICMS</span>
                </Space>
              }
            >
              <MonetaryInput
                placeholder="Ex: 89,75"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.icms}
                onChange={(value) => handleChange('icms', value)}
                disabled={!canEditTab("3")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label={
                <Space>
                  <PercentageOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Desconto</span>
                </Space>
              }
            >
              <MonetaryInput
                placeholder="Ex: 50,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.desconto}
                onChange={(value) => handleChange('desconto', value)}
                disabled={!canEditTab("3")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              label={
                <Space>
                  <PercentageOutlined style={{ color: "#059669" }} />
                  <span style={{ fontWeight: "700", color: "#333" }}>Avaria</span>
                </Space>
              }
            >
              <MonetaryInput
                placeholder="Ex: 25,00"
                addonAfter="R$"
                size="large"
                value={valoresCalculados.avaria}
                onChange={(value) => handleChange('avaria', value)}
                disabled={!canEditTab("3")}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Seção: Dados Complementares (apenas para clientes indústria) */}
      {(() => {
        const clienteAtual = clientes?.find(c => c.id === pedidoAtual.clienteId);
        return clienteAtual?.industria && (
          <Card
            title={
              <Space>
                <BuildOutlined style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Dados Complementares</span>
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
              }
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={5}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "12px" }}>Data Entrada</span>
                    </Space>
                  }
                >
                  <DatePicker
                    style={{ 
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    format="DD/MM/YYYY"
                    placeholder="Selecione a data"
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    size="small"
                    value={pedidoAtual.indDataEntrada ? moment(pedidoAtual.indDataEntrada) : null}
                    onChange={(date) => {
                      setPedidoAtual(prev => ({
                        ...prev,
                        indDataEntrada: date ? date.toISOString() : null
                      }));
                    }}
                    disabled={!canEditTab("3")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={5}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "12px" }}>Data Descarga</span>
                    </Space>
                  }
                >
                  <DatePicker
                    style={{ 
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    format="DD/MM/YYYY"
                    placeholder="Selecione a data"
                    disabledDate={(current) => current && current > moment().endOf('day')}
                    size="small"
                    value={pedidoAtual.indDataDescarga ? moment(pedidoAtual.indDataDescarga) : null}
                    onChange={(date) => {
                      setPedidoAtual(prev => ({
                        ...prev,
                        indDataDescarga: date ? date.toISOString() : null
                      }));
                    }}
                    disabled={!canEditTab("3")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item
                  label={
                    <Space>
                      <CalculatorOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "12px" }}>Peso Médio</span>
                    </Space>
                  }
                >
                  <MonetaryInput
                    placeholder="Ex: 1.250,50"
                    addonAfter="KG"
                    size="small"
                    value={pedidoAtual.indPesoMedio}
                    onChange={(value) => {
                      setPedidoAtual(prev => ({
                        ...prev,
                        indPesoMedio: value
                      }));
                    }}
                    disabled={!canEditTab("3")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={4}>
                <Form.Item
                  label={
                    <Space>
                      <CalculatorOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "12px" }}>Média ML</span>
                    </Space>
                  }
                >
                  <MonetaryInput
                    placeholder="Ex: 500,75"
                    addonAfter="ML"
                    size="small"
                    value={pedidoAtual.indMediaMililitro}
                    onChange={(value) => {
                      setPedidoAtual(prev => ({
                        ...prev,
                        indMediaMililitro: value
                      }));
                    }}
                    disabled={!canEditTab("3")}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  label={
                    <Space>
                      <NumberOutlined style={{ color: "#059669" }} />
                      <span style={{ fontWeight: "700", color: "#333", fontSize: "12px" }}>Número NF</span>
                    </Space>
                  }
                >
                  <InputNumber
                    placeholder="Ex: 123456"
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                    }}
                    min={1}
                    max={999999999}
                    controls={false}
                    formatter={(value) => `${value}`.replace(/[^0-9]/g, '')}
                    parser={(value) => value.replace(/[^0-9]/g, '')}
                    size="small"
                    value={pedidoAtual.indNumeroNf}
                    onChange={(value) => {
                      setPedidoAtual(prev => ({
                        ...prev,
                        indNumeroNf: value
                      }));
                    }}
                    disabled={!canEditTab("3")}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );
      })()}

      {/* Resumo Financeiro */}
      <Card
        title={
          <Space>
            <CalculatorOutlined style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: "600" }}>Resumo Financeiro</span>
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
          }
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <div style={{ 
              backgroundColor: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px", 
              padding: "16px",
              textAlign: "center"
            }}>
              <Text style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block" }}>
                Valor Total Frutas
              </Text>
              <Text style={{ fontSize: "18px", fontWeight: "700", color: "#334155" }}>
                {formatarValorMonetario(valoresCalculados.valorTotalFrutas)}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={6}>
            <div style={{ 
              backgroundColor: "#fefce8", 
              border: "1px solid #fde047", 
              borderRadius: "8px", 
              padding: "16px",
              textAlign: "center"
            }}>
              <Text style={{ fontSize: "12px", color: "#a16207", marginBottom: "4px", display: "block" }}>
                Adicionais
              </Text>
              <Text style={{ fontSize: "18px", fontWeight: "700", color: "#ca8a04" }}>
                +{formatarValorMonetario(valoresCalculados.frete + valoresCalculados.icms)}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={6}>
            <div style={{ 
              backgroundColor: "#fef2f2", 
              border: "1px solid #fecaca", 
              borderRadius: "8px", 
              padding: "16px",
              textAlign: "center"
            }}>
              <Text style={{ fontSize: "12px", color: "#dc2626", marginBottom: "4px", display: "block" }}>
                Descontos
              </Text>
              <Text style={{ fontSize: "18px", fontWeight: "700", color: "#ef4444" }}>
                -{formatarValorMonetario(valoresCalculados.desconto + valoresCalculados.avaria)}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={6}>
            <div style={{ 
              backgroundColor: "#f0fdf4", 
              border: "1px solid #bbf7d0", 
              borderRadius: "8px", 
              padding: "16px",
              textAlign: "center"
            }}>
              <Text style={{ fontSize: "12px", color: "#16a34a", marginBottom: "4px", display: "block" }}>
                VALOR FINAL
              </Text>
              <Text style={{ fontSize: "20px", fontWeight: "800", color: "#15803d" }}>
                {formatarValorMonetario(valoresCalculados.valorFinal)}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {canEditTab("3") && (
        <div style={{ 
          position: "absolute", 
          bottom: "-14px", 
          left: 0, 
          right: 0,
          display: "flex", 
          justifyContent: "flex-end", 
          gap: 12, 
          padding: "16px 0", 
          borderTop: "1px solid #e8e8e8",
          backgroundColor: "#ffffff",
          zIndex: 1
        }}>
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={loading || isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={isSaving}
            size="large"
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
          >
            {isSaving ? "Salvando..." : "Atualizar Pedido"}
          </Button>
        </div>
      )}

      {/* Modal de Visualizar Áreas/Fitas */}
      <VisualizarAreasFitasModal
        open={visualizarModalOpen}
        onClose={() => {
          setVisualizarModalOpen(false);
          setFrutaSelecionada(null);
        }}
        fruta={frutaSelecionada}
        tipo={tipoVisualizacao}
        areasProprias={areasProprias}
        areasFornecedores={areasFornecedores}
        fitasBanana={fitasBanana}
      />
    </div>
  );
};

PrecificacaoTab.propTypes = {
  pedidoAtual: PropTypes.object.isRequired,
  setPedidoAtual: PropTypes.func.isRequired,
  erros: PropTypes.object.isRequired,
  setErros: PropTypes.func.isRequired,
  canEditTab: PropTypes.func.isRequired,
  frutas: PropTypes.array.isRequired,
  areasProprias: PropTypes.array.isRequired,
  areasFornecedores: PropTypes.array.isRequired,
  valoresCalculados: PropTypes.object.isRequired,
  setValoresCalculados: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isSaving: PropTypes.bool,
  calcularValores: PropTypes.func.isRequired,
  pedido: PropTypes.object,
  clientes: PropTypes.array.isRequired,
};

export default PrecificacaoTab;
