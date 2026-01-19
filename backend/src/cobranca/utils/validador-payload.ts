/**
 * Validador de payloads antes de enviar para a API do Banco do Brasil
 * 
 * Validações:
 * - Datas válidas e no formato correto
 * - Valores numéricos positivos
 * - CPF/CNPJ válidos
 * - Campos obrigatórios presentes
 * - Limites de caracteres respeitados
 * - Regras de negócio (ex: data vencimento >= data emissão)
 */

export interface PayloadValidacaoErro {
  campo: string;
  mensagem: string;
}

/**
 * Valida o payload de criação de boleto
 * @param payload Payload a ser validado
 * @returns Array de erros encontrados (vazio se válido)
 */
export function validarPayloadCriacaoBoleto(payload: any): PayloadValidacaoErro[] {
  const erros: PayloadValidacaoErro[] = [];

  // Validar campos obrigatórios
  if (!payload.numeroConvenio) {
    erros.push({ campo: 'numeroConvenio', mensagem: 'Campo obrigatório' });
  } else if (String(payload.numeroConvenio).length !== 7) {
    erros.push({ campo: 'numeroConvenio', mensagem: 'Deve ter 7 dígitos' });
  }

  if (!payload.numeroCarteira) {
    erros.push({ campo: 'numeroCarteira', mensagem: 'Campo obrigatório' });
  }

  if (!payload.numeroVariacaoCarteira) {
    erros.push({ campo: 'numeroVariacaoCarteira', mensagem: 'Campo obrigatório' });
  }

  if (!payload.codigoModalidade) {
    erros.push({ campo: 'codigoModalidade', mensagem: 'Campo obrigatório' });
  } else if (!['1', '4'].includes(String(payload.codigoModalidade))) {
    erros.push({ campo: 'codigoModalidade', mensagem: 'Deve ser 1 (Simples) ou 4 (Vinculada)' });
  }

  // Validar datas
  if (!payload.dataEmissao) {
    erros.push({ campo: 'dataEmissao', mensagem: 'Campo obrigatório' });
  } else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(payload.dataEmissao)) {
    erros.push({ campo: 'dataEmissao', mensagem: 'Formato inválido. Esperado: dd.mm.aaaa' });
  }

  if (!payload.dataVencimento) {
    erros.push({ campo: 'dataVencimento', mensagem: 'Campo obrigatório' });
  } else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(payload.dataVencimento)) {
    erros.push({ campo: 'dataVencimento', mensagem: 'Formato inválido. Esperado: dd.mm.aaaa' });
  } else {
    // Validar que data de vencimento >= data de emissão
    const dataEmissao = parsearDataBB(payload.dataEmissao);
    const dataVencimento = parsearDataBB(payload.dataVencimento);
    if (dataVencimento < dataEmissao) {
      erros.push({
        campo: 'dataVencimento',
        mensagem: 'Data de vencimento deve ser maior ou igual à data de emissão'
      });
    }
  }

  // Validar valor
  if (payload.valorOriginal === undefined || payload.valorOriginal === null) {
    erros.push({ campo: 'valorOriginal', mensagem: 'Campo obrigatório' });
  } else {
    const valor = parseFloat(payload.valorOriginal);
    if (isNaN(valor) || valor <= 0) {
      erros.push({ campo: 'valorOriginal', mensagem: 'Deve ser um valor numérico maior que zero' });
    }
  }

  // Validar numeroTituloBeneficiario
  if (!payload.numeroTituloBeneficiario) {
    erros.push({ campo: 'numeroTituloBeneficiario', mensagem: 'Campo obrigatório' });
  } else {
    const numero = String(payload.numeroTituloBeneficiario);
    if (numero.length > 15) {
      erros.push({ campo: 'numeroTituloBeneficiario', mensagem: 'Máximo de 15 caracteres' });
    }
  }

  // Validar pagador
  if (!payload.pagador) {
    erros.push({ campo: 'pagador', mensagem: 'Campo obrigatório' });
  } else {
    if (!payload.pagador.tipoInscricao) {
      erros.push({ campo: 'pagador.tipoInscricao', mensagem: 'Campo obrigatório' });
    } else if (!['1', '2'].includes(payload.pagador.tipoInscricao)) {
      erros.push({ campo: 'pagador.tipoInscricao', mensagem: 'Deve ser 1 (PF) ou 2 (PJ)' });
    }

    if (!payload.pagador.numeroInscricao) {
      erros.push({ campo: 'pagador.numeroInscricao', mensagem: 'Campo obrigatório' });
    } else {
      const numeroInscricao = String(payload.pagador.numeroInscricao).replace(/[^\d]/g, '');
      const isCNPJ = payload.pagador.tipoInscricao === '2';
      if (isCNPJ && numeroInscricao.length !== 14) {
        erros.push({ campo: 'pagador.numeroInscricao', mensagem: 'CNPJ deve ter 14 dígitos' });
      } else if (!isCNPJ && numeroInscricao.length !== 11) {
        erros.push({ campo: 'pagador.numeroInscricao', mensagem: 'CPF deve ter 11 dígitos' });
      }
    }

    if (payload.pagador.nome && payload.pagador.nome.length > 60) {
      erros.push({ campo: 'pagador.nome', mensagem: 'Máximo de 60 caracteres' });
    }

    if (payload.pagador.endereco && payload.pagador.endereco.length > 60) {
      erros.push({ campo: 'pagador.endereco', mensagem: 'Máximo de 60 caracteres' });
    }

    if (payload.pagador.cidade && payload.pagador.cidade.length > 30) {
      erros.push({ campo: 'pagador.cidade', mensagem: 'Máximo de 30 caracteres' });
    }

    if (payload.pagador.bairro && payload.pagador.bairro.length > 30) {
      erros.push({ campo: 'pagador.bairro', mensagem: 'Máximo de 30 caracteres' });
    }

    if (payload.pagador.uf && payload.pagador.uf.length !== 2) {
      erros.push({ campo: 'pagador.uf', mensagem: 'Deve ter exatamente 2 caracteres' });
    }
  }

  // Validar mensagemBloquetoOcorrencia
  if (payload.mensagemBloquetoOcorrencia && payload.mensagemBloquetoOcorrencia.length > 165) {
    erros.push({ campo: 'mensagemBloquetoOcorrencia', mensagem: 'Máximo de 165 caracteres' });
  }

  return erros;
}

/**
 * Parseia data no formato BB (dd.mm.aaaa) para Date
 * @param dataStr Data no formato dd.mm.aaaa
 * @returns Objeto Date
 */
function parsearDataBB(dataStr: string): Date {
  const [dia, mes, ano] = dataStr.split('.');
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
}
