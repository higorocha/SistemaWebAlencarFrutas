const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { CredenciaisAPI, ContaCorrente } = require("../models");
const { logExtratos } = require("../utils/logger");

let cachedTokenExtratos = null;
let tokenExpiryExtratos = null;
let cachedExtratosMensal = null;
let ultimaConsultaMensal = null;

async function obterTokenDeAcessoExtratos() {
  if (
    cachedTokenExtratos &&
    tokenExpiryExtratos &&
    new Date() < tokenExpiryExtratos
  ) {
    return cachedTokenExtratos;
  }

  const credencialExtrato = await CredenciaisAPI.findOne({
    where: { modalidadeApi: "003 - Extratos" },
  });
  if (!credencialExtrato) {
    throw new Error(
      "Credencial de extrato não cadastrada. Favor cadastrar as credenciais de extrato."
    );
  }


  const cert = fs.readFileSync(
    path.resolve(__dirname, "../", process.env.BB_EXTRATOS_CLIENT_CERT_PATH)
  );
  const key = fs.readFileSync(
    path.resolve(__dirname, "../", process.env.BB_EXTRATOS_CLIENT_KEY_PATH)
  );
  const ca = process.env.BB_EXTRATOS_CA_CERT_PATHS.split(",").map((certFile) =>
    fs.readFileSync(path.resolve(__dirname, "../", certFile))
  );

  const httpsAgent = new https.Agent({
    cert,
    key,
    ca,
    rejectUnauthorized: true,
  });

  try {
    const response = await axios.post(
      process.env.BB_EXTRATOS_API_AUTH_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "extrato-info",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: credencialExtrato.clienteId,
          password: credencialExtrato.clienteSecret,
        },
        httpsAgent,
      }
    );

    cachedTokenExtratos = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;
    tokenExpiryExtratos = new Date(Date.now() + (expiresIn - 60) * 1000);

    return cachedTokenExtratos;
  } catch (error) {
    console.error(
      "Erro ao obter token de acesso para extratos:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function consultarExtratos(token, dataInicio, dataFim) {
  const credencialExtrato = await CredenciaisAPI.findOne({
    where: { modalidadeApi: "003 - Extratos" },
  });
  if (!credencialExtrato) {
    throw new Error(
      "Credencial de extrato não cadastrada. Favor cadastrar as credenciais de extrato."
    );
  }

  const contaCorrente = await ContaCorrente.findOne();
  if (!contaCorrente) {
    throw new Error(
      "Conta Corrente não cadastrada. Favor cadastrar uma conta corrente."
    );
  }
  const agencia = contaCorrente.agencia;
  const conta = contaCorrente.contaCorrente;

  const cert = fs.readFileSync(
    path.resolve(__dirname, "../", process.env.BB_EXTRATOS_CLIENT_CERT_PATH)
  );
  const key = fs.readFileSync(
    path.resolve(__dirname, "../", process.env.BB_EXTRATOS_CLIENT_KEY_PATH)
  );
  const ca = process.env.BB_EXTRATOS_CA_CERT_PATHS.split(",").map((certFile) =>
    fs.readFileSync(path.resolve(__dirname, "../", certFile))
  );

  const httpsAgent = new https.Agent({
    cert,
    key,
    ca,
    rejectUnauthorized: true,
  });

  const extratosApiClient = axios.create({
    baseURL: process.env.BB_EXTRATOS_API_BASE_URL,
    httpsAgent,
    timeout: 30000, // 30 segundos de timeout
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Developer-Application-Key": credencialExtrato.developerAppKey,
    },
  });

  const extratos = [];
  let paginaAtual = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      const response = await extratosApiClient.get(
        `/conta-corrente/agencia/${agencia}/conta/${conta}`,
        {
          params: {
            dataInicioSolicitacao: dataInicio,
            dataFimSolicitacao: dataFim,
            numeroPaginaSolicitacao: paginaAtual,
            quantidadeRegistroPaginaSolicitacao: 200,
          },
        }
      );

      const dataExtrato = response.data;

      if (
        !dataExtrato ||
        !dataExtrato.listaLancamento ||
        dataExtrato.listaLancamento.length === 0
      ) {
        hasMorePages = false;
        break;
      }

      extratos.push(...dataExtrato.listaLancamento);

      if (dataExtrato.numeroPaginaProximo > 0) {
        paginaAtual = dataExtrato.numeroPaginaProximo;
      } else {
        hasMorePages = false;
      }
    } catch (error) {
      console.error(
        "Erro ao consultar extratos:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  return extratos;
}

/**
 * Controlador para obter extratos bancários do BB.
 * GET /api/extratos?dataInicio=DDMMYYYY&dataFim=DDMMYYYY
 * Se não informar dataInicio e dataFim, assume o dia atual no formato ddMMyyyy.
 * Caso o usuário informe zeros à esquerda no dia ou mês, serão removidos.
 * Ex: 01122024 -> dia=01, mês=12 => removendo zero do dia => '1122024'
 */
// Função otimizada para log de memória em controllers
let contadorChamadas = 0;
const INTERVALO_LOG = 20; // Log a cada 20 chamadas
const LIMITE_HEAP_MB = 150; // Log se heap > 150MB

const logControllerMemory = (controllerName, context = '') => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Incrementar contador apenas para contextos de SUCESSO
  if (context === 'SUCESSO') {
    contadorChamadas++;
  }
  
  // Condições para fazer log:
  // 1. Sempre para INICIO e ERRO
  // 2. Para SUCESSO: apenas se heap alto OU a cada X chamadas
  const deveLogar = 
    context !== 'SUCESSO' || // INICIO, ERRO sempre logam
    heapUsedMB > LIMITE_HEAP_MB || // Heap alto
    contadorChamadas % INTERVALO_LOG === 0; // Intervalo periódico
  
  if (deveLogar) {
    const suffix = context === 'SUCESSO' && contadorChamadas % INTERVALO_LOG === 0 
      ? ` [${contadorChamadas} calls]` 
      : '';
      
    console.log(`[CONTROLLER-MEMORY] ${controllerName} ${context}${suffix}:`, {
      heapUsed: heapUsedMB + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    });
  }
};

exports.getExtratos = async (req, res) => {
  logControllerMemory('GET_EXTRATOS', 'INICIO');
  try {
    let { dataInicio, dataFim } = req.query;
    const hoje = new Date();

    // Se não fornecidos, usar data atual no formato ddMMyyyy
    if (!dataInicio) {
      // Data atual com zero-padding (sempre no formato DDMMYYYY)
      const dia = hoje.getDate();
      const mes = (hoje.getMonth() + 1).toString().padStart(2, "0"); // Garantir 2 dígitos
      const ano = hoje.getFullYear();
      dataInicio = `${dia}${mes}${ano}`;
    } else {
      // Interpretar dataInicio
      if (!/^\d{8}$/.test(dataInicio)) {
        return res.status(400).json({
          error: 'Parâmetro "dataInicio" deve estar no formato DDMMYYYY.',
        });
      }
      const dia = parseInt(dataInicio.slice(0, 2), 10);
      const mes = parseInt(dataInicio.slice(2, 4), 10);
      const ano = parseInt(dataInicio.slice(4), 10);
      if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
        return res.status(400).json({ error: "DataInicio inválida." });
      }
      // Reconstroi removendo zeros a esquerda
      dataInicio = `${dia}${mes}${ano}`;
    }

    if (!dataFim) {
      const dia = hoje.getDate();
      const mes = (hoje.getMonth() + 1).toString().padStart(2, "0"); // Garantir 2 dígitos
      const ano = hoje.getFullYear();
      dataFim = `${dia}${mes}${ano}`;
    } else {
      if (!/^\d{8}$/.test(dataFim)) {
        return res.status(400).json({
          error: 'Parâmetro "dataFim" deve estar no formato DDMMYYYY.',
        });
      }
      const dia = parseInt(dataFim.slice(0, 2), 10);
      const mes = parseInt(dataFim.slice(2, 4), 10);
      const ano = parseInt(dataFim.slice(4), 10);
      if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
        return res.status(400).json({ error: "DataFim inválida." });
      }
      dataFim = `${dia}${mes}${ano}`;
    }

    // Validar intervalo
    // Reconvertendo para Data para validar
    const diaInicio = parseInt(dataInicio.match(/^\d+/)[0], 10); // extrai dia do inicio da string
    // Para extrair mês e ano, dividimos a string dataInicio:
    // dia pode ter 1 ou 2 dígitos
    let dayLen = diaInicio > 9 ? 2 : 1; // se diaInicio >9, dia tem 2 dígitos, senão 1
    const restInicio = dataInicio.slice(dayLen);
    const mesInicio = parseInt(restInicio.match(/^\d+/)[0], 10);
    const monthLen = mesInicio > 9 ? 2 : 1;
    const anoInicio = parseInt(restInicio.slice(monthLen), 10);

    const inicioDate = new Date(anoInicio, mesInicio - 1, diaInicio);

    const diaFimVal = parseInt(dataFim.match(/^\d+/)[0], 10);
    let dayLenFim = diaFimVal > 9 ? 2 : 1;
    const restFim = dataFim.slice(dayLenFim);
    const mesFimVal = parseInt(restFim.match(/^\d+/)[0], 10);
    const monthLenFim = mesFimVal > 9 ? 2 : 1;
    const anoFimVal = parseInt(restFim.slice(monthLenFim), 10);

    const fimDate = new Date(anoFimVal, mesFimVal - 1, diaFimVal);

    if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Datas inválidas após remover zeros a esquerda." });
    }

    if (inicioDate > fimDate) {
      return res
        .status(400)
        .json({ error: '"dataInicio" não pode ser maior que "dataFim".' });
    }

    const accessToken = await obterTokenDeAcessoExtratos();
    if (!accessToken) {
      return res.status(500).json({ error: "Erro ao obter token de acesso." });
    }

    try {
      const extratos = await consultarExtratos(accessToken, dataInicio, dataFim);
      
      // Adicionar log com todos os lançamentos
      //logExtratos(`Consulta de extratos realizada com sucesso: ${dataInicio} a ${dataFim}`, { 
        //quantidadeLancamentos: extratos.length,
        //todosLancamentos: extratos // Registrar todos os lançamentos para análise
      //}, 'info');
      
      logControllerMemory('GET_EXTRATOS', 'SUCESSO');
      res.json(extratos);
    } catch (error) {
      logExtratos(`Erro ao consultar extratos: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      logExtratos(`Erro na API do BB: ${error.message}`, error.response.data, 'error');
      return res.status(error.response.status).json({
        error: error.response.data.detail || "Erro ao consultar extratos.",
      });
    }

    logExtratos(`Erro no controlador getExtratos: ${error.message}`, null, 'error');
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

/**
 * Controlador para obter extratos mensais do início do mês até o dia anterior.
 * Se for o primeiro dia do mês, busca o mês anterior inteiro.
 * Armazena em cache para evitar consultas repetidas.
 * GET /api/extratos/mensal
 */
exports.getExtratosMensal = async (req, res) => {
  try {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    let dataInicio, dataFim;
    
    // Tratamento especial para o primeiro dia do mês
    if (diaAtual === 1) {
      // No primeiro dia do mês, buscamos o mês anterior inteiro
      // Primeiro dia do mês anterior
      const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      
      // Último dia do mês anterior (dia 0 do mês atual é o último dia do mês anterior)
      const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      
      dataInicio = `${primeiroDiaMesAnterior.getDate()}${(primeiroDiaMesAnterior.getMonth() + 1).toString().padStart(2, '0')}${primeiroDiaMesAnterior.getFullYear()}`;
      dataFim = `${ultimoDiaMesAnterior.getDate()}${(ultimoDiaMesAnterior.getMonth() + 1).toString().padStart(2, '0')}${ultimoDiaMesAnterior.getFullYear()}`;
      
      logExtratos(`Primeiro dia do mês detectado - usando mês anterior: ${dataInicio} a ${dataFim}`);
    } else {
      // Para outros dias do mês, seguimos a lógica original (início do mês até ontem)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      
      dataInicio = `${inicioMes.getDate()}${(inicioMes.getMonth() + 1).toString().padStart(2, '0')}${inicioMes.getFullYear()}`;
      dataFim = `${ontem.getDate()}${(ontem.getMonth() + 1).toString().padStart(2, '0')}${ontem.getFullYear()}`;
    }
    
    // Verifica se já temos dados em cache do mesmo dia
    const hojeFormatado = hoje.toISOString().split('T')[0];
    if (cachedExtratosMensal && ultimaConsultaMensal === hojeFormatado) {
      logExtratos(`Retornando extratos mensais do cache (${dataInicio} a ${dataFim})`);
      return res.json(cachedExtratosMensal);
    }
    
    const accessToken = await obterTokenDeAcessoExtratos();
    if (!accessToken) {
      return res.status(500).json({ error: "Erro ao obter token de acesso." });
    }
    
    try {
      logExtratos(`Iniciando consulta de extratos mensais: ${dataInicio} a ${dataFim}`);
      const extratos = await consultarExtratos(accessToken, dataInicio, dataFim);
      
      // Armazena no cache
      cachedExtratosMensal = extratos;
      ultimaConsultaMensal = hojeFormatado;
      
      // Registra o resultado completo para análise
      logExtratos(`Consulta de extratos mensais concluída: ${dataInicio} a ${dataFim}`, { 
        total: extratos.length,
        todosLancamentos: extratos // Registra todos os lançamentos para análise
      });
      
      res.json(extratos);
    } catch (error) {
      logExtratos(`Erro ao consultar extratos mensais: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      return res.status(error.response.status).json({
        error: error.response.data.detail || "Erro ao consultar extratos mensais.",
      });
    }

    logExtratos(`Erro no controlador getExtratosMensal: ${error.message}`, null, 'error');
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

/**
 * Função para consulta personalizada de extratos por período.
 * GET /api/extratos/periodo?inicio=DD-MM-YYYY&fim=DD-MM-YYYY
 */
exports.getExtratosPorPeriodo = async (req, res) => {
  try {
    // Extrair parâmetros da requisição
    const { inicio, fim } = req.query;

    // Log detalhado das datas recebidas
    logExtratos(`[PERIODO] Recebendo consulta de período: início=${inicio}, fim=${fim}`, null, 'info');

    // Converter datas do formato DD-MM-YYYY para o formato usado pela API
    const [diaInicio, mesInicio, anoInicio] = inicio.split('-');
    const [diaFim, mesFim, anoFim] = fim.split('-');

    // Montar as datas no formato EXATO que funciona em getExtratosMensal:
    // dia sem zero à esquerda, mês COM zero à esquerda (importante!), ano completo
    const dataInicio = `${parseInt(diaInicio, 10)}${mesInicio}${anoInicio}`;
    const dataFim = `${parseInt(diaFim, 10)}${mesFim}${anoFim}`;

    // Log das datas formatadas
    logExtratos(`[PERIODO] Datas formatadas para API: dataInicio=${dataInicio}, dataFim=${dataFim}`, null, 'info');

    // Validar se datas são válidas
    const inicioDate = new Date(anoInicio, parseInt(mesInicio, 10) - 1, parseInt(diaInicio, 10));
    const fimDate = new Date(anoFim, parseInt(mesFim, 10) - 1, parseInt(diaFim, 10));

    if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
      const erro = "Datas inválidas.";
      logExtratos(`[PERIODO] ${erro}`, null, 'error');
      return res.status(400).json({ error: erro });
    }

    if (inicioDate > fimDate) {
      const erro = "Data de início não pode ser maior que a data de fim.";
      logExtratos(`[PERIODO] ${erro}`, null, 'error');
      return res.status(400).json({ error: erro });
    }

    // Verificar datas futuras
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    
    if (inicioDate > hoje || fimDate > hoje) {
      const erro = "Não é possível consultar extratos de datas futuras.";
      logExtratos(`[PERIODO] ${erro}`, null, 'error');
      return res.status(400).json({ error: erro });
    }

    const accessToken = await obterTokenDeAcessoExtratos();
    if (!accessToken) {
      const erro = "Erro ao obter token de acesso.";
      logExtratos(`[PERIODO] ${erro}`, null, 'error');
      return res.status(500).json({ error: erro });
    }

    try {
      // Consultar extratos com o token obtido
      logExtratos(`[PERIODO] Iniciando consulta na API do BB: ${dataInicio} a ${dataFim}`, null, 'info');
      const extratos = await consultarExtratos(accessToken, dataInicio, dataFim);
      
      // Log temporário para análise e melhoria dos cálculos no useExtratos.js
      // TODO: Remover este log após concluir as melhorias nos cálculos
      //console.log(`[PERIODO_DEBUG] Dados completos extratos período ${dataInicio} a ${dataFim}:`, 
        //JSON.stringify(extratos));

      // Adicionar log com todos os lançamentos
      //logExtratos(`Consulta de extratos realizada com sucesso: ${dataInicio} a ${dataFim}`, { 
        //quantidadeLancamentos: extratos.length,
        //todosLancamentos: extratos // Registrar todos os lançamentos para análise
      //}, 'info');
      
      res.json(extratos);
    } catch (error) {
      logExtratos(`[PERIODO] Erro na consulta da API: ${error.message}`, error.response?.data, 'error');
      throw error;
    }
  } catch (error) {
    if (error.response && error.response.data) {
      logExtratos(`[PERIODO] Erro na API do BB: ${error.message}`, error.response.data, 'error');
      return res.status(error.response.status).json({
        error: error.response.data.detail || "Erro ao consultar extratos por período.",
      });
    }

    logExtratos(`[PERIODO] Erro no controlador getExtratosPorPeriodo: ${error.message}`, null, 'error');
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};


