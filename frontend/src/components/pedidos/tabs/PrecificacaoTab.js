// src/components/pedidos/tabs/PrecificacaoTab.js

import React, { useState, useEffect } from "react";
import { Button, Space, Form, Input, Row, Col, Typography, Card, Divider, Tooltip, DatePicker, InputNumber } from "antd";
import PropTypes from "prop-types";
import {
  SaveOutlined,
  CloseOutlined,
  AppleOutlined,
  CalculatorOutlined,
  DollarOutlined,
  CarOutlined,
  PercentageOutlined,
  TruckOutlined,
  CalendarOutlined,
  BuildOutlined,
  NumberOutlined
} from "@ant-design/icons";
import { MonetaryInput } from "../../../components/common/inputs";
import { formatarValorMonetario } from "../../../utils/formatters";
import { FormButton } from "../../common/buttons";
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

  // ✅ FUNÇÃO AUXILIAR: Calcular valorTotalFrutas considerando múltiplas frutas
  const calcularValorTotalFrutas = (frutas) => {
    return frutas.reduce((total, frutaItem) => {
      const quantidadeParaCalculo = frutaItem.quantidadePrecificada || (() => {
        if (frutaItem.unidadePrecificada === frutaItem.unidadeMedida1) {
          return frutaItem.quantidadeReal || 0;
        } else if (frutaItem.unidadePrecificada === frutaItem.unidadeMedida2) {
          return frutaItem.quantidadeReal2 || 0;
        } else {
          return frutaItem.quantidadeReal || 0;
        }
      })();

      const valorUnit = frutaItem.valorUnitario || 0;
      return total + (quantidadeParaCalculo * valorUnit);
    }, 0);
  };

  // ✅ FUNÇÃO AUXILIAR: Atualizar valores calculados
  const atualizarValoresCalculados = (frutas, valoresAtuais) => {
    const valorTotalFrutas = calcularValorTotalFrutas(frutas);
    
    const novosValores = {
      ...valoresAtuais,
      valorTotalFrutas,
      valorFinal: valorTotalFrutas + (valoresAtuais.frete || 0) + (valoresAtuais.icms || 0) - (valoresAtuais.desconto || 0) - (valoresAtuais.avaria || 0)
    };

    setValoresCalculados(novosValores);
  };

  // ✅ CORREÇÃO: Recalcular valores automaticamente quando o componente é montado ou pedidoAtual muda
  useEffect(() => {
    if (pedidoAtual?.frutas && pedidoAtual.frutas.length > 0) {
      // Usar função auxiliar para calcular valores iniciais
      atualizarValoresCalculados(pedidoAtual.frutas, valoresCalculados);
    }
  }, [pedidoAtual?.frutas]); // Dependência apenas nas frutas para evitar loops infinitos

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

    // ✅ CORREÇÃO: Calcular valores automaticamente para campos de precificação
    if (['frete', 'icms', 'desconto', 'avaria'].includes(field)) {
      // Usar callback para garantir estado atual e evitar condições de corrida
      setValoresCalculados(prevValores => {
        const frete = field === 'frete' ? (processedValue || 0) : (prevValores.frete || 0);
        const icms = field === 'icms' ? (processedValue || 0) : (prevValores.icms || 0);
        const desconto = field === 'desconto' ? (processedValue || 0) : (prevValores.desconto || 0);
        const avaria = field === 'avaria' ? (processedValue || 0) : (prevValores.avaria || 0);

        return {
          ...prevValores,
          [field]: processedValue || 0,
          valorFinal: (prevValores.valorTotalFrutas || 0) + frete + icms - desconto - avaria
        };
      });
    }
  };

  // Atualizar fruta específica
  const handleFrutaChange = (index, field, value) => {
    setPedidoAtual(prev => {
      const novasFrutas = prev.frutas.map((fruta, i) => {
        if (i === index) {
          // Para campos numéricos, garantir que seja um número válido ou undefined
          let processedValue = value;
          if (['valorUnitario', 'valorTotal', 'quantidadePrecificada'].includes(field)) {
            if (value === null || value === '' || value === undefined) {
              processedValue = undefined;
            } else {
              processedValue = Number(value);
            }
          }

          const frutaAtualizada = { ...fruta, [field]: processedValue };

          // Se alterou o valor unitário ou quantidade precificada, calcular o valor total da fruta
          if (field === 'valorUnitario' || field === 'quantidadePrecificada') {
            const quantidadeParaCalculo = field === 'quantidadePrecificada' ? (processedValue || 0) : (fruta.quantidadePrecificada || 0);
            const valorUnit = field === 'valorUnitario' ? (processedValue || 0) : (fruta.valorUnitario || 0);

            frutaAtualizada.valorTotal = quantidadeParaCalculo * valorUnit;
          }

          return frutaAtualizada;
        }
        return fruta;
      });

      // ✅ CORREÇÃO: Recalcular valores consolidados imediatamente com as novas frutas
      if (['valorUnitario', 'quantidadePrecificada', 'unidadePrecificada'].includes(field)) {
        // Usar as frutas atualizadas para o cálculo
        const valorTotalFrutas = calcularValorTotalFrutas(novasFrutas);
        
        const novosValores = {
          ...valoresCalculados,
          valorTotalFrutas,
          valorFinal: valorTotalFrutas + (valoresCalculados.frete || 0) + (valoresCalculados.icms || 0) - (valoresCalculados.desconto || 0) - (valoresCalculados.avaria || 0)
        };

        // Atualizar valores calculados usando callback para garantir estado atual
        setValoresCalculados(prevValores => ({
          ...prevValores,
          valorTotalFrutas,
          valorFinal: valorTotalFrutas + (prevValores.frete || 0) + (prevValores.icms || 0) - (prevValores.desconto || 0) - (prevValores.avaria || 0)
        }));
      }

      return { ...prev, frutas: novasFrutas };
    });
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
          
          // Determinar a quantidade correta baseado na nova unidade
          let quantidadeParaCalculo = 0;
          if (novaUnidade === frutaItem.unidadeMedida1) {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          } else if (novaUnidade === frutaItem.unidadeMedida2) {
            quantidadeParaCalculo = frutaItem.quantidadeReal2 || 0;
          } else {
            quantidadeParaCalculo = frutaItem.quantidadeReal || 0;
          }

          // SEMPRE atualizar quantidadePrecificada com o valor da nova unidade
          frutaAtualizada.quantidadePrecificada = quantidadeParaCalculo;

          frutaAtualizada.valorTotal = quantidadeParaCalculo * (frutaItem.valorUnitario || 0);
          
          return frutaAtualizada;
        }
        return frutaItem;
      });
      
      return { ...prev, frutas: novasFrutas };
    });
    
    // ✅ CORREÇÃO: Recalcular valores consolidados após alterar unidade
    // Usar callback para garantir que temos o estado mais atual
    setValoresCalculados(prevValores => {
      const valorTotalFrutas = calcularValorTotalFrutas(pedidoAtual.frutas);
      
      return {
        ...prevValores,
        valorTotalFrutas,
        valorFinal: valorTotalFrutas + (prevValores.frete || 0) + (prevValores.icms || 0) - (prevValores.desconto || 0) - (prevValores.avaria || 0)
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
        <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "8px 0", borderBottom: "2px solid #e8e8e8" }}>
          <Col xs={24} md={7}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <AppleOutlined style={{ marginRight: 8 }} />
              Fruta
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Prevista
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Colhida
            </span>
          </Col>
          <Col xs={24} md={4}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Quant. Precificada
            </span>
          </Col>
          <Col xs={24} md={4}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <DollarOutlined style={{ marginRight: 8 }} />
              Valor Unit.
            </span>
          </Col>
          <Col xs={24} md={3}>
            <span style={{ color: "#059669", fontSize: "14px", fontWeight: "700" }}>
              <CalculatorOutlined style={{ marginRight: 8 }} />
              Total
            </span>
          </Col>
        </Row>

        {pedidoAtual.frutas.map((fruta, index) => {
          return (
            <div key={index}>
              <Row gutter={[16, 16]} align="baseline">
                {/* Nome da Fruta */}
                <Col xs={24} md={7}>
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

                {/* Quantidade Prevista */}
                <Col xs={24} md={3}>
                  <Input
                    disabled
                    value={`${fruta.quantidadePrevista || '0'} ${fruta.unidadeMedida1 || ''}`.trim()}
                    style={{
                      borderRadius: "6px",
                      fontSize: "13px",
                      textAlign: "center"
                    }}
                  />
                </Col>

                {/* Quantidade Colhida */}
                <Col xs={24} md={3}>
                  <Input
                    disabled
                    value={(() => {
                      // Lógica inteligente do VisualizarPedidoModal: verificar unidade precificada
                      // Só exibir se houver unidade de precificação
                      if (!fruta.unidadePrecificada) return '-';

                      // Usar a unidade precificada
                      const unidadePrecificada = fruta.unidadePrecificada;

                      // Se tem unidade precificada diferente, mostrar a quantidade correspondente
                      let qtd = fruta.quantidadeReal || 0;
                      let unidade = unidadePrecificada;

                      // Se existe quantidadeReal2 e unidadeMedida2, pode ser que seja a quantidade precificada
                      if (fruta.quantidadeReal2 && fruta.unidadeMedida2 &&
                          fruta.unidadePrecificada === fruta.unidadeMedida2) {
                        qtd = fruta.quantidadeReal2;
                      }

                      return `${qtd} ${unidade}`;
                    })()}
                    style={{
                      borderRadius: "6px",
                      fontSize: "13px",
                      textAlign: "center",
                      color: "#10b981",
                      fontWeight: "600"
                    }}
                  />
                </Col>

                {/* Quantidade Precificada */}
                <Col xs={24} md={4}>
                  <MonetaryInput
                    placeholder="Ex: 1.250,00"
                    addonAfter={fruta.unidadePrecificada || fruta.unidadeMedida1 || 'UND'}
                    size="large"
                    value={fruta.quantidadePrecificada}
                    onChange={(value) => handleFrutaChange(index, 'quantidadePrecificada', value)}
                    disabled={!canEditTab("3")}
                    style={{
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  />
                </Col>

                {/* Valor Unitário */}
                <Col xs={24} md={4}>
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
                <Col xs={24} md={3}>
                  <Input
                    disabled
                    value={formatarValorMonetario(fruta.valorTotal || 0)}
                    style={{
                      borderRadius: "6px",
                      borderColor: "#d9d9d9",
                      backgroundColor: "#f0fdf4",
                      textAlign: "left",
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
