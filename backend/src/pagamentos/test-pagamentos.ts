/**
 * Script de teste para API de Pagamentos do Banco do Brasil
 * 
 * Este script testa a conexão com a API de Pagamentos usando o PagamentosService.
 * Testa os três tipos principais de pagamento:
 * 1. Transferências PIX
 * 2. Pagamento de Boletos
 * 3. Pagamento de Guias com Código de Barras
 * 
 * IMPORTANTE: Este script usa credenciais hardcoded para testes rápidos.
 * Para uso em produção, configure as credenciais no banco de dados.
 * 
 * Para executar: npx ts-node src/pagamentos/test-pagamentos.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PagamentosService } from './pagamentos.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import {
  SolicitarTransferenciaPixDto,
  SolicitarPagamentoBoletoDto,
  SolicitarPagamentoGuiaDto,
} from './dto/pagamentos.dto';

/**
 * Dados de teste para conta pagadora (homologação BB)
 * Cliente Pagador:
 * - Agência: 1607
 * - Conta Corrente: 99738672-X
 * - Convênio PGT: 731030
 */
const CONTA_TESTE = {
  agencia: '1607', // Agência do cliente pagador
  conta: '99738672', // Conta corrente do cliente pagador
  digito: 'X', // Dígito verificador da conta
  convenio: 731030 // Convênio PGT
};

/**
 * Formata data para o formato ddmmaaaa (sem zero à esquerda no dia)
 */
function formatarData(data: Date): string {
  const dia = data.getDate(); // Sem zero à esquerda
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

/**
 * Função principal de teste
 */
async function executarTestes() {
  console.log('🚀 [TEST-PAGAMENTOS] Iniciando testes da API de Pagamentos do Banco do Brasil');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Criar aplicação NestJS (sem logs)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const pagamentosService = app.get(PagamentosService);
  const contaCorrenteService = app.get(ContaCorrenteService);

  try {
    // Buscar conta de teste (ignorando dígito)
    const todasContas = await contaCorrenteService.findAll();
    const contaTeste = todasContas.find(
      c => c.agencia === CONTA_TESTE.agencia &&
      c.contaCorrente === CONTA_TESTE.conta
    );

    if (!contaTeste || !contaTeste.id) {
      throw new Error(
        `Conta de teste não encontrada: Agência ${CONTA_TESTE.agencia}, Conta ${CONTA_TESTE.conta}. ` +
        `Por favor, cadastre a conta corrente no sistema antes de executar o teste.`
      );
    }

    // Data de pagamento (hoje)
    const dataPagamento = formatarData(new Date());

    // 1. Testar transferência PIX
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📤 TESTE 1: Transferência PIX');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const dadosTransferenciaPix: SolicitarTransferenciaPixDto = {
      contaCorrenteId: contaTeste.id,
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1,
      numeroContrato: CONTA_TESTE.convenio,
      agenciaDebito: contaTeste.agencia,
      contaCorrenteDebito: contaTeste.contaCorrente,
      digitoVerificadorContaCorrente: contaTeste.contaCorrenteDigito,
      tipoPagamento: 126, // 126 = Pagamento de fornecedores
      listaTransferencias: [
        {
          data: dataPagamento,
          valor: '1.00',
          descricaoPagamento: 'Teste de transferência PIX via API - Homologação BB',
          descricaoPagamentoInstantaneo: 'Teste PIX API Homologação',
          formaIdentificacao: 1, // 1=Telefone
          dddTelefone: '11',
          telefone: '985732102',
          cnpj: '95127446000198',
        }
      ]
    };

    const resultadoPix = await pagamentosService.solicitarTransferenciaPix(dadosTransferenciaPix);
    console.log('✅ [TEST-PAGAMENTOS] Transferência PIX realizada com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', resultadoPix.numeroRequisicao);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Testar pagamento de boleto
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💳 TESTE 2: Pagamento de Boleto');
    console.log('═══════════════════════════════════════════════════════════════');

    const dadosPagamentoBoleto: SolicitarPagamentoBoletoDto = {
      contaCorrenteId: contaTeste.id,
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1,
      codigoContrato: CONTA_TESTE.convenio,
      numeroAgenciaDebito: contaTeste.agencia,
      numeroContaCorrenteDebito: contaTeste.contaCorrente,
      digitoVerificadorContaCorrenteDebito: contaTeste.contaCorrenteDigito,
      lancamentos: [
        {
          numeroCodigoBarras: '83630000000641400052836100812355200812351310',
          dataPagamento: dataPagamento,
          valorPagamento: '64.14',
          descricaoPagamento: 'Teste de pagamento de boleto via API',
          valorNominal: '64.14',
          codigoTipoBeneficiario: 1,
          documentoBeneficiario: '12345678900',
        }
      ]
    };

    const resultadoBoleto = await pagamentosService.solicitarPagamentoBoleto(dadosPagamentoBoleto);
    console.log('✅ [TEST-PAGAMENTOS] Pagamento de boleto realizado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', resultadoBoleto.numeroRequisicao);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Testar pagamento de guia com código de barras
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 TESTE 3: Pagamento de Guia com Código de Barras');
    console.log('═══════════════════════════════════════════════════════════════');

    const dadosPagamentoGuia: SolicitarPagamentoGuiaDto = {
      contaCorrenteId: contaTeste.id,
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1,
      codigoContrato: CONTA_TESTE.convenio,
      numeroAgenciaDebito: contaTeste.agencia,
      numeroContaCorrenteDebito: contaTeste.contaCorrente,
      digitoVerificadorContaCorrenteDebito: contaTeste.contaCorrenteDigito,
      lancamentos: [
        {
          codigoBarras: '83630000000641400052836100812355200812351310',
          dataPagamento: dataPagamento,
          valorPagamento: '64.14',
          descricaoPagamento: 'Teste de pagamento de guia via API',
        }
      ]
    };

    const resultadoGuia = await pagamentosService.solicitarPagamentoGuia(dadosPagamentoGuia);
    console.log('✅ [TEST-PAGAMENTOS] Pagamento de guia realizado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', resultadoGuia.numeroRequisicao);

    // 4. Consultar status das solicitações
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 Consultando status das solicitações...');
    console.log('═══════════════════════════════════════════════════════════════');
    
    if (resultadoPix?.numeroRequisicao) {
      console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação PIX: ${resultadoPix.numeroRequisicao}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusPix = await pagamentosService.consultarStatusTransferenciaPix(resultadoPix.numeroRequisicao);
      console.log('✅ [TEST-PAGAMENTOS] Status da solicitação PIX consultado com sucesso!');
      console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', statusPix.numeroRequisicao);
    }

    if (resultadoBoleto?.numeroRequisicao) {
      console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação de boletos: ${resultadoBoleto.numeroRequisicao}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusBoleto = await pagamentosService.consultarStatusPagamentoBoleto(resultadoBoleto.numeroRequisicao);
      console.log('✅ [TEST-PAGAMENTOS] Status da solicitação de boletos consultado com sucesso!');
      console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', statusBoleto.numeroRequisicao);
    }

    if (resultadoGuia?.numeroRequisicao) {
      console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação de guias: ${resultadoGuia.numeroRequisicao}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusGuia = await pagamentosService.consultarStatusPagamentoGuia(resultadoGuia.numeroRequisicao);
      console.log('✅ [TEST-PAGAMENTOS] Status da solicitação de guias consultado com sucesso!');
      console.log('📄 [TEST-PAGAMENTOS] Número da requisição:', statusGuia.numeroRequisicao);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ [TEST-PAGAMENTOS] Todos os testes concluídos com sucesso!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('❌ [TEST-PAGAMENTOS] Erro durante os testes:', error.message);
    if (error.response?.data) {
      console.error('📄 [TEST-PAGAMENTOS] Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  executarTestes().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export { executarTestes };
