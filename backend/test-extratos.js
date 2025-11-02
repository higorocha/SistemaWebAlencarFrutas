#!/usr/bin/env node

/**
 * Script temporário para testar o serviço de extratos
 * Executa testes dos endpoints de extratos diretamente
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5002';

// Configurar axios com timeout
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para fazer requisições com tratamento de erro
async function makeRequest(method, endpoint, params = {}) {
  try {
    console.log(`\n🚀 ${method.toUpperCase()} ${endpoint}`);
    if (Object.keys(params).length > 0) {
      console.log('📋 Parâmetros:', params);
    }
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await api.get(endpoint, { params });
    }
    
    console.log('✅ Status:', response.status);
    console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    const errorMessage = error.response?.status 
      ? `HTTP ${error.response.status} - ${error.message}`
      : error.message;
    
    console.log('❌ Erro:', errorMessage);
    
    // Detalhes adicionais para diferentes tipos de erro
    if (error.code === 'ECONNRESET') {
      console.log('⚠️  Erro de conexão: A conexão com o servidor foi resetada');
      console.log('💡 Possíveis causas:');
      console.log('   • Servidor externo indisponível (API Banco do Brasil pode estar fora do ar)');
      console.log('   • Timeout na requisição (servidor demorou muito para responder)');
      console.log('   • Problema de rede ou firewall');
      console.log('   • Data de consulta pode ser inválida (ex: domingo ou feriado)');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⚠️  Timeout: A requisição excedeu o tempo limite');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Conexão recusada: O servidor não está aceitando conexões');
    }
    
    if (error.response?.data) {
      console.log('📄 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    } else if (error.config) {
      console.log('🔗 URL da requisição:', error.config.url || endpoint);
      if (error.config.params) {
        console.log('📋 Parâmetros enviados:', error.config.params);
      }
    }
    
    return null;
  }
}

// Função para formatar data no formato DDMMYYYY COM zeros à esquerda
// O DTO do serviço valida exatamente 8 dígitos, então precisamos enviar COM zeros
// O serviço remove os zeros automaticamente antes de enviar para a API do BB
function formatarDataDDMMYYYY(data) {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

// Função para salvar resultado em arquivo JSON
function salvarResultadoEmArquivo(dados, periodoInicio, periodoFim) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const nomeArquivo = `extratos-${periodoInicio}-${periodoFim}-${timestamp}.json`;
    const caminhoArquivo = path.join(__dirname, nomeArquivo);
    
    // Criar objeto com metadados e dados
    const resultadoCompleto = {
      metadata: {
        consultadoEm: new Date().toISOString(),
        periodoInicio,
        periodoFim,
        totalLancamentos: dados.lancamentos?.length || 0,
        url: BASE_URL
      },
      dados: dados
    };
    
    // Salvar com formatação JSON (2 espaços de indentação)
    fs.writeFileSync(caminhoArquivo, JSON.stringify(resultadoCompleto, null, 2), 'utf8');
    
    return caminhoArquivo;
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error.message);
    return null;
  }
}

// Função para formatar data no formato DD-MM-YYYY
function formatarDataDDMMYYYYComHifen(data) {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}-${mes}-${ano}`;
}

// Função principal de teste
async function testarExtratosService() {
  console.log('🧪 ===== TESTE DO SERVIÇO DE EXTRATOS =====');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Teste 1: Health Check
  console.log('\n📋 TESTE 1: Health Check');
  console.log('─'.repeat(50));
  const healthResult = await makeRequest('GET', '/api/extratos/health');
  
  if (healthResult?.status === 'healthy') {
    console.log('✅ Serviço de extratos está operacional!');
    if (healthResult.contaInfo) {
      console.log(`🏦 Conta configurada: Agência ${healthResult.contaInfo.agencia}, Conta ${healthResult.contaInfo.conta}`);
    }
  } else {
    console.log('❌ Serviço de extratos não está operacional');
    console.log('💡 Verifique se as credenciais de extratos e conta corrente estão cadastradas');
    return;
  }
  
  // Teste 2: Consulta de Extratos (Outubro completo)
  console.log('\n📋 TESTE 2: Consulta de Extratos (Outubro 2025)');
  console.log('─'.repeat(50));
  
  // Criar datas: 01/10/2025 até 31/10/2025
  const dataInicio = new Date(2025, 9, 1); // Mês 9 = Outubro (0-indexed)
  const dataFim = new Date(2025, 9, 31);   // Mês 9 = Outubro (0-indexed)
  
  const dataInicioFormatada = formatarDataDDMMYYYY(dataInicio);
  const dataFimFormatada = formatarDataDDMMYYYY(dataFim);
  
  console.log(`📅 Período: ${dataInicioFormatada} até ${dataFimFormatada} (Outubro completo)`);
  console.log(`📅 Período legível: 01/10/2025 até 31/10/2025`);
  console.log(`📝 Nota: O script envia COM zeros à esquerda (${dataInicioFormatada}, ${dataFimFormatada})`);
  console.log(`📝 O serviço remove os zeros automaticamente antes de enviar para a API do BB`);
  console.log(`📝 API do BB receberá: ${parseInt(dataInicioFormatada.slice(0, 2), 10)}${parseInt(dataInicioFormatada.slice(2, 4), 10)}${dataInicioFormatada.slice(4)} até ${parseInt(dataFimFormatada.slice(0, 2), 10)}${parseInt(dataFimFormatada.slice(2, 4), 10)}${dataFimFormatada.slice(4)}`);
  
  const extratosResult = await makeRequest('GET', '/api/extratos', {
    dataInicio: dataInicioFormatada,
    dataFim: dataFimFormatada
  });
  
  if (extratosResult) {
    console.log(`\n📊 Resumo da consulta:`);
    console.log(`   • Total de lançamentos: ${extratosResult.total || 0}`);
    console.log(`   • Período consultado: ${extratosResult.periodoInicio} até ${extratosResult.periodoFim}`);
    console.log(`   • Lançamentos encontrados: ${extratosResult.lancamentos?.length || 0}`);
    
    // Salvar resultado completo em arquivo JSON
    const caminhoArquivo = salvarResultadoEmArquivo(
      extratosResult,
      dataInicioFormatada,
      dataFimFormatada
    );
    
    if (caminhoArquivo) {
      console.log(`\n💾 Resultado completo salvo em:`);
      console.log(`   📁 ${caminhoArquivo}`);
      const stats = fs.statSync(caminhoArquivo);
      const tamanhoKB = (stats.size / 1024).toFixed(2);
      console.log(`   📊 Tamanho: ${tamanhoKB} KB`);
    }
    
    if (extratosResult.lancamentos?.length > 0) {
      console.log(`\n💰 Primeiros 3 lançamentos encontrados:`);
      const primeirosLancamentos = extratosResult.lancamentos.slice(0, 3);
      primeirosLancamentos.forEach((lancamento, index) => {
        console.log(`\n   📌 Lançamento ${index + 1}:`);
        console.log(`      • Valor: R$ ${lancamento.valorLancamento}`);
        console.log(`      • Descrição: ${lancamento.descricao}`);
        console.log(`      • Data: ${lancamento.dataLancamento}`);
        console.log(`      • Situação: ${lancamento.situacao}`);
        if (lancamento.nomeFavorecido) {
          console.log(`      • Favorecido: ${lancamento.nomeFavorecido}`);
        }
      });
      
      if (extratosResult.lancamentos.length > 3) {
        console.log(`\n   ... e mais ${extratosResult.lancamentos.length - 3} lançamento(s)`);
        console.log(`   📄 Ver arquivo JSON completo para todos os lançamentos`);
      }
    } else {
      console.log('ℹ️ Nenhum lançamento encontrado para o período de outubro');
    }
  }
  
  console.log('\n🏁 ===== TESTE CONCLUÍDO =====');
}

// Executar testes
testarExtratosService()
  .then(() => {
    console.log('\n✅ Teste executado com sucesso!');
    console.log('\n📋 Resumo do teste:');
    console.log('   1. Health Check - Verificação do status do serviço');
    console.log('   2. Consulta de Extratos (Outubro 2025) - Período completo');
    console.log('\n💡 Para usar os endpoints:');
    console.log('   • GET /api/extratos/health - Verificar status');
    console.log('   • GET /api/extratos?dataInicio=DDMMYYYY&dataFim=DDMMYYYY - Consulta básica');
    console.log('   • GET /api/extratos/mensal - Extratos mensais com cache');
    console.log('   • GET /api/extratos/periodo?inicio=DD-MM-YYYY&fim=DD-MM-YYYY - Consulta por período');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro durante a execução do teste:', error);
    process.exit(1);
  });
