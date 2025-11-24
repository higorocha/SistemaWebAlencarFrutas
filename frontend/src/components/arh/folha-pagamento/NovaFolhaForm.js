// src/components/arh/folha-pagamento/NovaFolhaForm.js

import React from "react";
import PropTypes from "prop-types";
import { Form, Input, Row, Col, Card, Space, Typography, DatePicker, Select } from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const NovaFolhaForm = ({ folhaAtual, setFolhaAtual, erros, setErros }) => {
  const handleChange = (field, value) => {
    setFolhaAtual((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando modificado
    if (erros[field]) {
      setErros((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const calcularDatasQuinzena = (mes, ano, periodo) => {
    if (!mes || !ano || !periodo) return { dataInicial: null, dataFinal: null };

    let dataInicial, dataFinal;
    const primeiroDiaMes = dayjs().year(ano).month(mes - 1).date(1);
    const ultimoDiaMes = dayjs().year(ano).month(mes - 1).endOf('month');

    // Encontrar o primeiro sábado do mês (dia da semana 6 = sábado no dayjs)
    const encontrarProximoSabado = (data) => {
      let dataAtual = data;
      while (dataAtual.day() !== 6) { // 6 = sábado
        dataAtual = dataAtual.add(1, 'day');
      }
      return dataAtual;
    };

    const primeiroSabado = encontrarProximoSabado(primeiroDiaMes);

    if (periodo === 1) {
      // Primeira quinzena: primeiro sábado até o segundo sábado (inclusive)
      dataInicial = primeiroSabado;
      dataFinal = primeiroSabado.add(6, 'days'); // Segundo sábado (7 dias depois)
    } else {
      // Segunda quinzena: terceiro sábado até o último sábado do mês
      const terceiroSabado = primeiroSabado.add(14, 'days'); // Terceiro sábado (14 dias depois do primeiro)
      
      // Encontrar o último sábado do mês
      let ultimoSabado = terceiroSabado;
      let proximoSabado = terceiroSabado.add(7, 'days');
      
      // Encontrar o último sábado que ainda está dentro do mês
      while (proximoSabado.month() === mes - 1 && proximoSabado.year() === ano) {
        ultimoSabado = proximoSabado;
        proximoSabado = proximoSabado.add(7, 'days');
      }
      
      dataInicial = terceiroSabado;
      dataFinal = ultimoSabado;
    }

    return { dataInicial, dataFinal };
  };

  const handleCompetenciaChange = (date) => {
    if (date) {
      const mes = date.month() + 1; // dayjs usa 0-11 para meses
      const ano = date.year();
      const periodo = folhaAtual.periodo;

      const novasDatas = calcularDatasQuinzena(mes, ano, periodo);

      setFolhaAtual((prev) => ({
        ...prev,
        competenciaMes: mes,
        competenciaAno: ano,
        dataInicial: novasDatas.dataInicial,
        dataFinal: novasDatas.dataFinal,
      }));
      // Limpar erros de competência
      if (erros.competenciaMes || erros.competenciaAno) {
        setErros((prev) => ({
          ...prev,
          competenciaMes: undefined,
          competenciaAno: undefined,
        }));
      }
    } else {
      setFolhaAtual((prev) => ({
        ...prev,
        competenciaMes: undefined,
        competenciaAno: undefined,
        dataInicial: null,
        dataFinal: null,
      }));
    }
  };

  const handlePeriodoChange = (periodo) => {
    const mes = folhaAtual.competenciaMes;
    const ano = folhaAtual.competenciaAno;

    const novasDatas = calcularDatasQuinzena(mes, ano, periodo);

    setFolhaAtual((prev) => ({
      ...prev,
      periodo,
      dataInicial: novasDatas.dataInicial,
      dataFinal: novasDatas.dataFinal,
    }));

    // Limpar erro do período
    if (erros.periodo) {
      setErros((prev) => ({
        ...prev,
        periodo: undefined,
      }));
    }
  };

  // Converter competenciaMes e competenciaAno para dayjs
  const competenciaValue = folhaAtual.competenciaMes && folhaAtual.competenciaAno
    ? dayjs().month(folhaAtual.competenciaMes - 1).year(folhaAtual.competenciaAno)
    : null;

  return (
    <div>
      <Form layout="vertical" size="large">
        {/* Seção: Competência */}
        <Card
          title={
            <Space>
              <CalendarOutlined style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: "600" }}>
                Competência da Folha
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
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Competência (Mês/Ano)</Text>
                  </Space>
                }
                validateStatus={erros.competenciaMes || erros.competenciaAno ? "error" : ""}
                help={erros.competenciaMes || erros.competenciaAno}
                required
              >
                <DatePicker
                  picker="month"
                  placeholder="Selecione o mês e ano"
                  value={competenciaValue}
                  onChange={handleCompetenciaChange}
                  format="MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Quinzena</Text>
                  </Space>
                }
                validateStatus={erros.periodo ? "error" : ""}
                help={erros.periodo}
                required
              >
                <Select
                  placeholder="Selecione a quinzena"
                  value={folhaAtual.periodo || undefined}
                  onChange={handlePeriodoChange}
                  size="large"
                >
                  <Select.Option value={1}>1ª Quinzena</Select.Option>
                  <Select.Option value={2}>2ª Quinzena</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Data Inicial</Text>
                  </Space>
                }
                validateStatus={erros.dataInicial ? "error" : ""}
                help={erros.dataInicial}
                required
              >
                <DatePicker
                  placeholder="Selecione a data inicial"
                  value={folhaAtual.dataInicial ? dayjs(folhaAtual.dataInicial) : null}
                  onChange={(date) => {
                    setFolhaAtual((prev) => ({
                      ...prev,
                      dataInicial: date,
                    }));
                    if (erros.dataInicial) {
                      setErros((prev) => ({
                        ...prev,
                        dataInicial: undefined,
                      }));
                    }
                  }}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined style={{ color: "#059669" }} />
                    <Text strong>Data Final</Text>
                  </Space>
                }
                validateStatus={erros.dataFinal ? "error" : ""}
                help={erros.dataFinal}
                required
              >
                <DatePicker
                  placeholder="Selecione a data final"
                  value={folhaAtual.dataFinal ? dayjs(folhaAtual.dataFinal) : null}
                  onChange={(date) => {
                    setFolhaAtual((prev) => ({
                      ...prev,
                      dataFinal: date,
                    }));
                    if (erros.dataFinal) {
                      setErros((prev) => ({
                        ...prev,
                        dataFinal: undefined,
                      }));
                    }
                  }}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                  size="large"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={
                  <Space>
                    <FileTextOutlined style={{ color: "#059669" }} />
                    <Text strong>Referência</Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Ex.: Folha equipe campo"
                  value={folhaAtual.referencia || ""}
                  onChange={(e) => handleChange("referencia", e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

NovaFolhaForm.propTypes = {
  folhaAtual: PropTypes.object.isRequired,
  setFolhaAtual: PropTypes.func.isRequired,
  erros: PropTypes.object,
  setErros: PropTypes.func,
};

export default NovaFolhaForm;

