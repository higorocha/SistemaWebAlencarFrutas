// controllers/pixController.js

const createApiClient = require("../utils/apiClient");
const { CredenciaisAPI } = require("../models");

/**
 * Controller para obter transações PIX.
 * GET /api/pix-transactions?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
 */
exports.getPixTransactions = async (req, res) => {
  try {
    const { inicio, fim } = req.query;

    // Formatar as datas para 'yyyy-MM-dd'T'HH:mm:ss.SSS'
    const formattedInicio = formatDate(inicio, false);
    const formattedFim = formatDate(fim, true);

    if (!formattedInicio || !formattedFim) {
      return res
        .status(400)
        .json({
          error:
            'Parâmetros "inicio" e "fim" inválidos. Formato esperado: YYYY-MM-DD.',
        });
    }

    // Obter token de acesso
    const accessToken = await obterTokenDeAcesso();

    if (!accessToken) {
      return res.status(500).json({ error: "Erro ao obter token de acesso." });
    }

    // Consultar transações PIX
    const transacoes = await consultarTransacoesPix(
      accessToken,
      formattedInicio,
      formattedFim
    );

    res.json(transacoes);
  } catch (error) {
    // Se o erro tiver detalhes específicos da API do BB
    if (error.response && error.response.data) {
      return res
        .status(error.response.status)
        .json({
          error:
            error.response.data.detail || "Erro ao consultar transações PIX.",
        });
    }

    console.error("Erro no controlador getPixTransactions:", error.message);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

/**
 * Função para obter o token de acesso com cache.
 */
let cachedToken = null;
let tokenExpiry = null;

/**
 * Função para obter o token de acesso com cache.
 */
const obterTokenDeAcesso = async () => {
  // Verifica se o token está em cache e ainda é válido
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  // Antes de criar o apiClient ou dentro da função, adicione:
  const credencialPix = await CredenciaisAPI.findOne({
    where: { modalidadeApi: "002 - Pix" },
  });
  if (!credencialPix) {
    throw new Error(
      "Credencial de PIX não cadastrada. Favor cadastrar as credenciais de PIX."
    );
  }

  const apiClient = createApiClient(credencialPix.developerAppKey);
  try {
    const response = await apiClient.post(
      process.env.BB_API_AUTH_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "pix.read cob.read",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: credencialPix.clienteId,
          password: credencialPix.clienteSecret,
        },
      }
    );

    cachedToken = response.data.access_token;
    // Define a expiração para alguns minutos antes de expirar
    const expiresIn = response.data.expires_in || 3600; // segundos
    tokenExpiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes

    return cachedToken;
  } catch (error) {
    console.error(
      "Erro ao obter token de acesso:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Função para consultar transações PIX com paginação.
 */
const consultarTransacoesPix = async (token, inicio, fim) => {
  const apiClient = createApiClient();
  const transacoes = [];
  let paginaAtual = 0;
  let hasMorePages = true;

  try {
    while (hasMorePages) {
      const response = await apiClient.get(process.env.BB_API_BASE_URL, {
        params: {
          inicio,
          fim,
          "paginacao.paginaAtual": paginaAtual,
          "paginacao.itensPorPagina": 100,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      if (!data || !data.pix || data.pix.length === 0) {
        hasMorePages = false;
        break;
      }

      // Adicionar transações à lista
      transacoes.push(...data.pix);

      // Verificar se há mais páginas
      const paginacao = data.parametros?.paginacao;
      const totalPaginas = paginacao?.quantidadeDePaginas || 0;
      paginaAtual += 1;
      hasMorePages = paginaAtual < totalPaginas;
    }
  } catch (error) {
    console.error(
      "Erro ao consultar transações PIX:",
      error.response?.data || error.message
    );
    throw error;
  }

  return transacoes;
};

/**
 * Função para formatar datas no formato 'yyyy-MM-dd'T'HH:mm:ss.SSS'.
 */
const formatDate = (dateStr, endOfDay = false) => {
  const date = new Date(dateStr);

  if (isNaN(date)) {
    return null;
  }

  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Meses de 0 a 11
  let day = date.getDate().toString().padStart(2, "0");

  let hours = "00";
  let minutes = "00";
  let seconds = "00";
  let milliseconds = "000";

  if (endOfDay) {
    hours = "23";
    minutes = "59";
    seconds = "59";
    milliseconds = "999";
  }

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
};
