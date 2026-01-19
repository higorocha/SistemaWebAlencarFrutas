import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CobrancaService } from './services/cobranca.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Controller para receber webhooks do Banco do Brasil
 * 
 * O evento que aciona o Webhook da API Cobrança é o recebimento pelo Banco do Brasil
 * de uma Baixa Operacional de um boleto.
 * 
 * Segurança:
 * - Autenticação mútua via certificado TLS (validado pelo servidor)
 * - Log de IP e headers para auditoria
 */
@ApiTags('Cobrança - Webhooks')
@Controller('api/cobranca/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly cobrancaService: CobrancaService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Recebe webhook de baixa operacional do Banco do Brasil
   * 
   * Este endpoint é chamado pelo BB quando um boleto é pago (baixa operacional).
   * O BB envia os dados do boleto pago e o sistema atualiza o status local.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de baixa operacional',
    description: `
      Recebe notificação do Banco do Brasil quando um boleto é pago (baixa operacional).
      
      **Funcionalidades:**
      - Atualiza status do boleto para PAGO
      - Registra data de pagamento
      - Cria log de auditoria
      - Marca como atualizado via webhook
      
      **Segurança:**
      - Autenticação mútua via certificado TLS (validado pelo servidor)
      - IP e headers são logados para auditoria
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos no webhook'
  })
  async receberWebhook(@Body() body: any, @Req() req: any): Promise<{ success: boolean }> {
    const inicioProcessamento = new Date();
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📥 [WEBHOOK] NOVO WEBHOOK RECEBIDO DO BANCO DO BRASIL`);
      console.log(`${'='.repeat(80)}`);
      console.log(`🕐 Horário de Recebimento: ${inicioProcessamento.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`🌐 IP de Origem: ${ipAddress}`);
      console.log(`🖥️  User-Agent: ${userAgent.substring(0, 100)}`);
      console.log(`📦 Content-Type: ${req.headers['content-type'] || 'N/A'}`);
      console.log(`📏 Content-Length: ${req.headers['content-length'] || 'N/A'} bytes`);

      // Validar estrutura básica do payload
      if (!body) {
        console.error(`❌ [WEBHOOK] ERRO: Payload vazio recebido do Banco do Brasil`);
        console.log(`${'='.repeat(80)}\n`);
        throw new Error('Payload vazio');
      }

      // Logar JSON completo recebido para debug
      console.log(`\n📋 [WEBHOOK] Payload JSON Completo Recebido:`);
      console.log(`${'─'.repeat(80)}`);
      console.log(JSON.stringify(body, null, 2));
      console.log(`${'─'.repeat(80)}\n`);

      // O webhook pode receber um array de boletos ou um objeto único
      // Normalizar para array para processar uniformemente
      const boletosWebhook: any[] = Array.isArray(body) ? body : [body];

      if (boletosWebhook.length === 0) {
        console.warn(`⚠️ [WEBHOOK] ATENÇÃO: Array de boletos vazio recebido`);
        console.log(`${'='.repeat(80)}\n`);
        return { success: false };
      }

      console.log(`📊 [WEBHOOK] RESUMO DO PROCESSAMENTO:`);
      console.log(`   • Total de boletos recebidos: ${boletosWebhook.length}`);
      console.log(`   • Tipo de payload: ${Array.isArray(body) ? 'Array' : 'Objeto único'}`);
      console.log(`\n🔄 [WEBHOOK] Iniciando processamento de ${boletosWebhook.length} boleto(s)...\n`);

      let processadosComSucesso = 0;
      let processadosComErro = 0;

      // Processar cada boleto do array
      for (let index = 0; index < boletosWebhook.length; index++) {
        const itemBoleto = boletosWebhook[index];
        const numeroBoleto = index + 1;
        
        try {
          console.log(`${'─'.repeat(80)}`);
          console.log(`📌 [WEBHOOK] Processando Boleto ${numeroBoleto}/${boletosWebhook.length}`);
          console.log(`${'─'.repeat(80)}`);

          // Extrair nosso número do payload
          // O webhook de baixa operacional usa o campo "id"
          const nossoNumero =
            itemBoleto.id ||
            itemBoleto.numero ||
            itemBoleto.numeroTituloCliente ||
            itemBoleto.nossoNumero ||
            itemBoleto.titulo?.id ||
            itemBoleto.titulo?.numero;

          if (!nossoNumero) {
            console.error(`❌ [WEBHOOK] ERRO no Boleto ${numeroBoleto}: Não foi possível identificar o nosso número no payload`);
            console.error(`   Dados recebidos: ${JSON.stringify(itemBoleto).substring(0, 300)}`);
            processadosComErro++;
            continue;
          }

          console.log(`   📋 Nosso Número: ${nossoNumero}`);
          console.log(`   💰 Valor Original: ${itemBoleto.valorOriginal ? (itemBoleto.valorOriginal / 100).toFixed(2) : 'N/A'}`);
          console.log(`   💵 Valor Pago: ${itemBoleto.valorPagoSacado ? (itemBoleto.valorPagoSacado / 100).toFixed(2) : 'N/A'}`);
          console.log(`   📅 Data Vencimento: ${itemBoleto.dataVencimento || 'N/A'}`);
          console.log(`   📅 Data Liquidação: ${itemBoleto.dataLiquidacao || 'N/A'}`);

          // Buscar boleto local
          console.log(`   🔍 Buscando boleto ${nossoNumero} no banco de dados local...`);
          const boleto = await this.prisma.boleto.findUnique({
            where: { nossoNumero: String(nossoNumero) }
          });

          if (!boleto) {
            console.warn(`   ⚠️  ATENÇÃO: Boleto ${nossoNumero} não encontrado no sistema local`);
            console.warn(`   📝 Possíveis causas: boleto não foi criado localmente, nosso número diferente, ou já foi removido`);
            processadosComErro++;
            continue; // Continuar com próximo boleto ao invés de retornar erro
          }

          console.log(`   ✅ Boleto encontrado no sistema local (ID: ${boleto.id})`);
          console.log(`   📊 Status atual no sistema: ${boleto.statusBoleto}`);
          console.log(`   💼 Pedido associado: ${boleto.pedidoId || 'N/A'}`);

          // Extrair data de pagamento do payload
          console.log(`   📅 Extraindo data de pagamento do payload...`);
          // O webhook de baixa operacional usa "dataLiquidacao" no formato "dd/MM/yyyyHH:mm:ss" (sem espaço)
          // Exemplo: "25/03/202105:37:00" -> "25/03/2021 05:37:00"
          let dataPagamento = new Date();
          let fonteDataPagamento = 'Data atual (fallback)';
          
          if (itemBoleto.dataLiquidacao && itemBoleto.dataLiquidacao.trim() !== '') {
            fonteDataPagamento = 'dataLiquidacao';
            // Formato: "dd/MM/yyyyHH:mm:ss" (pode ter ou não espaço entre data e hora)
            // Exemplos: "25/03/202105:37:00" ou "25/03/2021 05:37:00"
            let dataLiquidacaoFormatada = itemBoleto.dataLiquidacao.trim();
            
            // Se não tiver espaço entre data e hora, adicionar (ex: "25/03/202105:37:00" -> "25/03/2021 05:37:00")
            if (!dataLiquidacaoFormatada.includes(' ')) {
              // Procurar onde a hora começa (após 4 dígitos do ano)
              const match = dataLiquidacaoFormatada.match(/^(\d{2}\/\d{2}\/\d{4})(\d{2}:\d{2}:\d{2})/);
              if (match) {
                dataLiquidacaoFormatada = `${match[1]} ${match[2]}`;
              }
            }
            
            // Tentar parsear a data
            try {
              // Formato esperado: "dd/MM/yyyy HH:mm:ss"
              // Converter para formato ISO ou usar Date diretamente
              const [dataPart, horaPart] = dataLiquidacaoFormatada.split(' ');
              if (dataPart && horaPart) {
                const [dia, mes, ano] = dataPart.split('/');
                const [hora, minuto, segundo] = horaPart.split(':');
                dataPagamento = new Date(
                  parseInt(ano),
                  parseInt(mes) - 1,
                  parseInt(dia),
                  parseInt(hora),
                  parseInt(minuto),
                  parseInt(segundo) || 0
                );
              } else {
                // Fallback: tentar parse direto
                dataPagamento = new Date(dataLiquidacaoFormatada);
              }
            } catch (err) {
              console.warn(`   ⚠️  Erro ao parsear dataLiquidacao "${itemBoleto.dataLiquidacao}", usando data atual`);
              fonteDataPagamento = 'Data atual (erro no parse)';
            }
          } else if (itemBoleto.agendamentoPagamento?.momento) {
            fonteDataPagamento = 'agendamentoPagamento.momento';
            // Formato: "aaaa-mm-dd hh:mm:ss" (outro formato possível)
            dataPagamento = new Date(itemBoleto.agendamentoPagamento.momento);
          } else if (itemBoleto.dataRecebimentoTitulo && itemBoleto.dataRecebimentoTitulo.trim() !== '') {
            fonteDataPagamento = 'dataRecebimentoTitulo';
            // Formato: "dd.mm.aaaa" -> converter para Date
            const [dia, mes, ano] = itemBoleto.dataRecebimentoTitulo.split('.');
            if (dia && mes && ano) {
              dataPagamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            }
          } else if (itemBoleto.dataCreditoLiquidacao && itemBoleto.dataCreditoLiquidacao.trim() !== '') {
            fonteDataPagamento = 'dataCreditoLiquidacao';
            // Formato: "dd.mm.aaaa" -> converter para Date
            const [dia, mes, ano] = itemBoleto.dataCreditoLiquidacao.split('.');
            if (dia && mes && ano) {
              dataPagamento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
            }
          } else if (itemBoleto.dataPagamento) {
            fonteDataPagamento = 'dataPagamento';
            dataPagamento = new Date(itemBoleto.dataPagamento);
          }
          
          console.log(`   ✅ Data de pagamento extraída: ${dataPagamento.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
          console.log(`   📌 Fonte da data: ${fonteDataPagamento}`);

          // Processar pagamento usando método centralizado do service
          console.log(`   💳 Processando pagamento do boleto...`);
          console.log(`   ⚙️  Atualizando status para PAGO...`);
          console.log(`   📝 Criando registro de pagamento...`);
          console.log(`   📊 Atualizando valores do pedido...`);
          
          await this.cobrancaService.processarPagamentoBoleto(
            boleto.id,
            {
              dataPagamento,
              responsePayloadBanco: itemBoleto as any
            },
            true, // viaWebhook = true
            undefined, // Webhook não tem usuário
            ipAddress
          );

          console.log(`   ✅ SUCESSO! Boleto ${nossoNumero} processado completamente`);
          console.log(`   ✓ Status atualizado para PAGO`);
          console.log(`   ✓ Pagamento registrado no sistema`);
          console.log(`   ✓ Pedido atualizado`);
          processadosComSucesso++;

        } catch (error) {
          console.error(`\n   ❌ ERRO ao processar Boleto ${numeroBoleto}:`);
          console.error(`   🔴 Mensagem: ${error.message}`);
          console.error(`   📋 Stack Trace: ${error.stack?.substring(0, 500)}`);
          console.error(`   📦 Dados do boleto: ${JSON.stringify(itemBoleto).substring(0, 300)}`);
          processadosComErro++;
          // Continuar processando outros boletos mesmo se um falhar
        }
        
        console.log(``); // Linha em branco para separar
      }

      const fimProcessamento = new Date();
      const tempoProcessamento = fimProcessamento.getTime() - inicioProcessamento.getTime();

      console.log(`${'='.repeat(80)}`);
      console.log(`📊 [WEBHOOK] RESUMO FINAL DO PROCESSAMENTO`);
      console.log(`${'='.repeat(80)}`);
      console.log(`   ✅ Boletos processados com sucesso: ${processadosComSucesso}`);
      console.log(`   ❌ Boletos com erro: ${processadosComErro}`);
      console.log(`   📊 Total recebido: ${boletosWebhook.length}`);
      console.log(`   ⏱️  Tempo de processamento: ${tempoProcessamento}ms`);
      console.log(`   🕐 Horário de conclusão: ${fimProcessamento.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`   ${processadosComSucesso > 0 ? '✅ WEBHOOK PROCESSADO COM SUCESSO' : '⚠️  WEBHOOK PROCESSADO COM ERROS'}`);
      console.log(`${'='.repeat(80)}\n`);

      // Retornar sucesso se pelo menos um boleto foi processado
      return { success: processadosComSucesso > 0 };

    } catch (error) {
      const fimProcessamento = new Date();
      const tempoProcessamento = fimProcessamento.getTime() - inicioProcessamento.getTime();

      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [WEBHOOK] ERRO CRÍTICO NO PROCESSAMENTO DO WEBHOOK`);
      console.error(`${'='.repeat(80)}`);
      console.error(`   🔴 Tipo de erro: ${error.constructor.name}`);
      console.error(`   🔴 Mensagem: ${error.message}`);
      console.error(`   📋 Stack Trace completo:`);
      console.error(error.stack);
      console.error(`   ⏱️  Tempo até erro: ${tempoProcessamento}ms`);
      console.error(`   🕐 Horário do erro: ${fimProcessamento.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.error(`   📦 Payload recebido: ${JSON.stringify(body).substring(0, 500)}`);
      console.error(`${'='.repeat(80)}\n`);

      // Retornar 200 mesmo em caso de erro para não causar retentativas
      // O BB pode tentar novamente se necessário
      // Mas não queremos causar loops infinitos de retentativas
      return { success: false };
    }
  }

}
