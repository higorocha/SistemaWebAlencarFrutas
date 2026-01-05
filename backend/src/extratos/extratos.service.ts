import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CredenciaisAPIService } from '../credenciais-api/credenciais-api.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import { createExtratosApiClient, createExtratosAuthClient, BB_EXTRATOS_API_URLS } from '../utils/bb-extratos-client';
import { LancamentoExtratoDto, ConsultaExtratosResponseDto, ExtratosMensaisResponseDto } from './dto/extratos.dto';

/**
 * Service para integração com a API de extratos do Banco do Brasil
 * Implementa autenticação OAuth2, cache de token e consulta paginada de extratos
 */
@Injectable()
export class ExtratosService {
  // Cache de token em memória por credencial (chave: credencialId)
  private cachedTokens: Map<number, { token: string; expiry: Date }> = new Map();

  // Cache de extratos mensais
  private cachedExtratosMensal: LancamentoExtratoDto[] | null = null;
  private ultimaConsultaMensal: string | null = null;

  constructor(
    private readonly credenciaisAPIService: CredenciaisAPIService,
    private readonly contaCorrenteService: ContaCorrenteService
  ) {}

  /**
   * Formata data do formato DDMMYYYY para o formato usado pela API do BB
   * 
   * Conforme documentação da API:
   * - Formato: DDMMAAAA (omitir zeros à esquerda APENAS no DIA)
   * - Exemplo: 19042023 (dia 19, mês 04, ano 2023)
   * 
   * Regras:
   * - DIA: 1 ou 2 dígitos (sem zero à esquerda se dia < 10)
   * - MÊS: SEMPRE 2 dígitos (com zero à esquerda se mês < 10)
   * - ANO: SEMPRE 4 dígitos
   * 
   * @param dateStr Data no formato DDMMYYYY
   * @returns Data formatada: D ou DD + MM + YYYY (mês sempre 2 dígitos)
   */
  private formatDateForAPI(dateStr: string): string {
    if (!/^\d{8}$/.test(dateStr)) {
      throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
    }

    const dia = parseInt(dateStr.slice(0, 2), 10);
    const mes = parseInt(dateStr.slice(2, 4), 10);
    const ano = parseInt(dateStr.slice(4), 10);

    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
      throw new BadRequestException(`Data inválida: ${dateStr}`);
    }

    // Dia: omitir zeros à esquerda (conforme documentação da API)
    // Mês: SEMPRE 2 dígitos (com zero à esquerda se < 10)
    // Ano: sempre 4 dígitos
    const diaFormatado = dia.toString(); // Sem zero à esquerda (ex: 1, 8, 19, 23)
    const mesFormatado = mes.toString().padStart(2, '0'); // Sempre 2 dígitos (ex: 01, 04, 09, 11)
    return `${diaFormatado}${mesFormatado}${ano}`;
  }

  /**
   * Converte data do formato DD-MM-YYYY para DDMMYYYY
   * @param dateStr Data no formato DD-MM-YYYY
   * @returns Data no formato DDMMYYYY
   */
  private convertPeriodoToAPI(dateStr: string): string {
    const [dia, mes, ano] = dateStr.split('-');
    
    // Montar as datas no formato EXATO que funciona: dia sem zero à esquerda, mês COM zero à esquerda
    return `${parseInt(dia, 10)}${mes}${ano}`;
  }

  /**
   * Obtém token de acesso OAuth2 com cache por credencial
   * Cada credencial tem seu próprio token cacheado
   * @param credencialExtrato Credencial específica para obter o token
   * @returns Token de acesso válido
   */
  private async obterTokenDeAcesso(credencialExtrato: any): Promise<string> {
    const credencialId = credencialExtrato.id;
    
    // Verifica se o token está em cache para esta credencial e ainda é válido
    const cached = this.cachedTokens.get(credencialId);
    if (cached && cached.expiry && new Date() < cached.expiry) {
      console.log(`✅ [EXTRATOS-SERVICE] Token em cache válido para credencial ${credencialId}`);
      return cached.token;
    }

    try {
      console.log(`🔑 [EXTRATOS-SERVICE] Obtendo novo token para credencial ${credencialId} (conta ${credencialExtrato.contaCorrenteId})`);

      // Criar cliente HTTP para autenticação
      const authClient = createExtratosAuthClient();

      // Fazer requisição de autenticação OAuth2
      const response = await authClient.post(
        BB_EXTRATOS_API_URLS.EXTRATOS_AUTH,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'extrato-info'
        }).toString(),
        {
          auth: {
            username: credencialExtrato.clienteId,
            password: credencialExtrato.clienteSecret,
          },
        }
      );

      // Cachear o token para esta credencial específica
      const accessToken = (response.data as any).access_token;
      const expiresIn = (response.data as any).expires_in || 3600; // segundos
      const expiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes
      
      this.cachedTokens.set(credencialId, {
        token: accessToken,
        expiry: expiry
      });

      console.log(`✅ [EXTRATOS-SERVICE] Token obtido e cacheado para credencial ${credencialId}`);

      return accessToken;

    } catch (error) {
      console.error(`❌ [EXTRATOS-SERVICE] Erro ao obter token de acesso para credencial ${credencialId}:`, {
        error: error.message,
        response: error.response?.data
      });
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na autenticação BB: ${error.response.data.error_description || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao obter token de acesso da API de extratos do Banco do Brasil');
    }
  }

  /**
   * Consulta extratos brutos da API com paginação automática (para uso interno)
   * Aceita contaCorrenteId para especificar qual conta usar
   * @param dataInicio Data de início no formato DDMMYYYY (sem zeros à esquerda)
   * @param dataFim Data de fim no formato DDMMYYYY (sem zeros à esquerda)
   * @param contaCorrenteId ID da conta corrente (opcional, usa a primeira se não informado)
   * @returns Array de lançamentos brutos da API
   */
  async consultarExtratosBrutos(
    dataInicio: string,
    dataFim: string,
    contaCorrenteId?: number
  ): Promise<any[]> {
    // Declarar variáveis no escopo do método para uso no catch
    let contaCorrente: any = null;
    
    try {
      // Log removido - informações já aparecem no log do job de extratos

      // PRIMEIRO: Buscar conta corrente
      if (contaCorrenteId) {
        try {
          contaCorrente = await this.contaCorrenteService.findOne(contaCorrenteId);
          // Log removido - informações já aparecem no log do job de extratos
        } catch (error) {
          console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro ao buscar conta corrente ${contaCorrenteId}:`, {
            error: error.message,
            stack: error.stack
          });
          throw error;
        }
      } else {
        const contasCorrente = await this.contaCorrenteService.findAll();
        if (!contasCorrente || contasCorrente.length === 0) {
          console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Nenhuma conta corrente cadastrada`);
          throw new NotFoundException('Conta Corrente não cadastrada. Favor cadastrar uma conta corrente.');
        }
        contaCorrente = contasCorrente[0];
        // Log removido - informações já aparecem no log do job de extratos
      }

      // SEGUNDO: Buscar credencial ESPECÍFICA para a conta corrente encontrada
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Credenciais de extratos não encontradas`);
        throw new NotFoundException('Credenciais de extratos não encontradas. Configure as credenciais primeiro.');
      }
      
      // OBRIGATORIAMENTE usar a credencial vinculada à conta solicitada
      const credencialExtrato = credenciaisExtratos.find(c => c.contaCorrenteId === contaCorrente.id);
      
      if (!credencialExtrato) {
        console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Credencial não encontrada para conta ${contaCorrente.id} (${contaCorrente.agencia}/${contaCorrente.contaCorrente}):`, {
          contaCorrenteId: contaCorrente.id,
          agencia: contaCorrente.agencia,
          conta: contaCorrente.contaCorrente,
          credenciaisDisponiveis: credenciaisExtratos.map(c => ({
            credencialId: c.id,
            contaCorrenteId: c.contaCorrenteId
          }))
        });
        throw new NotFoundException(
          `Credenciais de extratos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`
        );
      }
      
      // Log removido - informações já aparecem no log do job de extratos

      // Obter token de acesso usando a credencial específica
      let token: string;
      try {
        token = await this.obterTokenDeAcesso(credencialExtrato);
      // Log removido - informações já aparecem no log do job de extratos
      } catch (error) {
        console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro ao obter token:`, {
          error: error.message,
          stack: error.stack,
          credencialId: credencialExtrato.id
        });
        throw error;
      }

      const agencia = contaCorrente.agencia;
      const conta = contaCorrente.contaCorrente;

      // Criar cliente HTTP para consulta
      const apiClient = createExtratosApiClient(credencialExtrato.developerAppKey);

      const extratos: any[] = [];
      let paginaAtual = 1;
      let hasMorePages = true;

      // Log removido - informações já aparecem no log do job de extratos

      // Loop de paginação
      while (hasMorePages) {
        try {
          // Log da requisição sendo enviada para a API do BB
          console.log(`📤 [BB-API-REQUEST] Enviando requisição para API de Extratos - Página ${paginaAtual}:`, {
            url: `/conta-corrente/agencia/${agencia}/conta/${conta}`,
            params: {
              dataInicioSolicitacao: dataInicio,
              dataFimSolicitacao: dataFim,
              numeroPaginaSolicitacao: paginaAtual,
              quantidadeRegistroPaginaSolicitacao: 200,
            }
          });
          
          const response = await apiClient.get(
            `/conta-corrente/agencia/${agencia}/conta/${conta}`,
            {
              params: {
                dataInicioSolicitacao: dataInicio,
                dataFimSolicitacao: dataFim,
                numeroPaginaSolicitacao: paginaAtual,
                quantidadeRegistroPaginaSolicitacao: 200,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = response.data as any;

          // Verificar se há lançamentos nesta página
          if (!data || !data.listaLancamento || data.listaLancamento.length === 0) {
            console.log(`📥 [BB-API-RESPONSE] Página ${paginaAtual}: Nenhum lançamento encontrado`);
            hasMorePages = false;
            break;
          }

          // Resumo da resposta da API (ao invés do JSON completo)
          const lancamentos = data.listaLancamento || [];
          const totalLancamentos = lancamentos.length;
          const proximaPagina = data.numeroPaginaProximo > 0 ? data.numeroPaginaProximo : null;
          
          // Contar tipos de lançamentos (crédito/débito)
          const creditos = lancamentos.filter((l: any) => l.indicadorSinalLancamento === 'C').length;
          const debitos = lancamentos.filter((l: any) => l.indicadorSinalLancamento === 'D').length;
          
          // Resumo de descrições mais comuns (top 3)
          const descricoes = lancamentos
            .map((l: any) => l.textoDescricaoHistorico || 'Sem descrição')
            .reduce((acc: any, desc: string) => {
              acc[desc] = (acc[desc] || 0) + 1;
              return acc;
            }, {});
          const topDescricoes = Object.entries(descricoes)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map(([desc, count]: [string, any]) => `${desc} (${count})`)
            .join(', ');

          console.log(`📥 [BB-API-RESPONSE] Página ${paginaAtual}:`, {
            totalLancamentos,
            creditos: `${creditos} crédito${creditos !== 1 ? 's' : ''}`,
            debitos: `${debitos} débito${debitos !== 1 ? 's' : ''}`,
            proximaPagina: proximaPagina ? `Página ${proximaPagina}` : 'Última página',
            topDescricoes: topDescricoes || 'N/A',
          });

          // Adicionar lançamentos à lista (dados brutos)
          extratos.push(...lancamentos);

          // Verificar se há mais páginas
          if (data.numeroPaginaProximo > 0) {
            paginaAtual = data.numeroPaginaProximo;
          } else {
            hasMorePages = false;
          }
        } catch (error) {
          console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro na requisição da página ${paginaAtual}:`, {
            error: error.message,
            stack: error.stack,
            agencia,
            conta,
            dataInicio,
            dataFim,
            paginaAtual,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers
          });
          throw error;
        }
      }

      // Log removido - informações já aparecem no log do job de extratos
      return extratos;

    } catch (error) {
      // Log detalhado do erro
      console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro capturado:`, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack,
        contaCorrenteId,
        dataInicio,
        dataFim,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText,
        responseHeaders: error.response?.headers
      });

      // Erro será tratado no serviço chamador
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      if (error.response?.data) {
        // Log detalhado da resposta de erro
        console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Resposta de erro da API BB:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          dataStringified: JSON.stringify(error.response.data, null, 2)
        });

        // Extrair mensagem de erro mais detalhada
        let errorMessage = 'Erro ao consultar extratos';
        
        if (error.response.status === 403) {
          // Erro 403 - Forbidden: geralmente significa que a conta não tem permissão
          const erros = error.response.data.erros;
          const contaInfo = contaCorrente 
            ? `conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}`
            : contaCorrenteId 
              ? `conta ID ${contaCorrenteId}`
              : 'conta desconhecida';
              
          if (erros && Array.isArray(erros) && erros.length > 0) {
            const primeiroErro = erros[0];
            errorMessage = primeiroErro.mensagem || primeiroErro.descricao || 
                          `Acesso negado (403) para a ${contaInfo}. Verifique se a conta tem permissão para consulta de extratos via API.`;
          } else {
            errorMessage = `Acesso negado (403) para a ${contaInfo}. Verifique se a conta tem permissão para consulta de extratos via API ou se as credenciais estão vinculadas corretamente.`;
          }
        } else {
          errorMessage = error.response.data.detail || 
                        error.response.data.error_description || 
                        error.response.data.error || 
                        `Erro ao consultar extratos (Status: ${error.response.status})`;
        }
        
        console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro da API BB:`, {
          errorMessage,
          status: error.response.status,
          fullResponse: error.response.data
        });
        throw new InternalServerErrorException(`Erro na API BB: ${errorMessage}`);
      }

      console.error(`❌ [CONSULTAR-EXTRATOS-BRUTOS] Erro interno sem resposta da API`);
      throw new InternalServerErrorException('Erro interno ao consultar extratos');
    }
  }

  /**
   * Consulta extratos com paginação automática
   * Baseado EXATAMENTE no extratosController(exemplo).js
   * @param dataInicio Data de início no formato DDMMYYYY
   * @param dataFim Data de fim no formato DDMMYYYY
   * @returns Array de lançamentos de extrato
   */
  private async consultarExtratosInterno(dataInicio: string, dataFim: string): Promise<LancamentoExtratoDto[]> {
    console.log(`🔍 [EXTRATOS-SERVICE] Consultando extratos de ${dataInicio} até ${dataFim}`);

    try {
      // Buscar credenciais e conta corrente
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        throw new NotFoundException('Credenciais de extratos não encontradas. Configure as credenciais primeiro.');
      }

      // Buscar conta corrente
      const contasCorrente = await this.contaCorrenteService.findAll();
      if (!contasCorrente || contasCorrente.length === 0) {
        throw new NotFoundException('Conta Corrente não cadastrada. Favor cadastrar uma conta corrente.');
      }
      const contaCorrente = contasCorrente[0];
      
      // Buscar credencial específica para a primeira conta
      const credencialExtrato = credenciaisExtratos.find(c => c.contaCorrenteId === contaCorrente.id);
      if (!credencialExtrato) {
        throw new NotFoundException(
          `Credenciais de extratos não encontradas para a conta ${contaCorrente.contaCorrente} da agência ${contaCorrente.agencia}. Configure as credenciais para esta conta primeiro.`
        );
      }

      const agencia = contaCorrente.agencia;
      const conta = contaCorrente.contaCorrente;

      // Obter token de acesso usando a credencial específica
      const token = await this.obterTokenDeAcesso(credencialExtrato);

      // Criar cliente HTTP para consulta
      const apiClient = createExtratosApiClient(credencialExtrato.developerAppKey);

      const extratos: LancamentoExtratoDto[] = [];
      let paginaAtual = 1;
      let hasMorePages = true;

      // Loop de paginação (EXATAMENTE como no exemplo)
      while (hasMorePages) {
        console.log(`📄 [EXTRATOS-SERVICE] Consultando página ${paginaAtual}`);

        const response = await apiClient.get(
          `/conta-corrente/agencia/${agencia}/conta/${conta}`,
          {
            params: {
              dataInicioSolicitacao: dataInicio,
              dataFimSolicitacao: dataFim,
              numeroPaginaSolicitacao: paginaAtual,
              quantidadeRegistroPaginaSolicitacao: 200,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data as any;

        // Verificar se há lançamentos nesta página (EXATAMENTE como no exemplo)
        if (!data || !data.listaLancamento || data.listaLancamento.length === 0) {
          console.log(`📄 [EXTRATOS-SERVICE] Página ${paginaAtual} sem lançamentos`);
          hasMorePages = false;
          break;
        }

        // Adicionar lançamentos à lista (EXATAMENTE como no exemplo)
        extratos.push(...data.listaLancamento);
        console.log(`📄 [EXTRATOS-SERVICE] Página ${paginaAtual}: ${data.listaLancamento.length} lançamentos encontrados`);

        // Verificar se há mais páginas (EXATAMENTE como no exemplo)
        if (data.numeroPaginaProximo > 0) {
          paginaAtual = data.numeroPaginaProximo;
        } else {
          hasMorePages = false;
        }
      }

      return extratos;

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro ao consultar extratos:', error.response?.data || error.message);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      if (error.response?.data) {
        const errorMessage = error.response.data.detail || 
                           error.response.data.error_description || 
                           error.response.data.error || 
                           'Erro ao consultar extratos';
        throw new InternalServerErrorException(`Erro na API BB: ${errorMessage}`);
      }

      throw new InternalServerErrorException('Erro interno ao consultar extratos');
    }
  }

  /**
   * Consulta extratos para o período especificado
   * @param dataInicio Data de início no formato DDMMYYYY
   * @param dataFim Data de fim no formato DDMMYYYY
   * @returns Resposta formatada com lançamentos e metadados
   */
  async consultarExtratos(dataInicio: string, dataFim: string): Promise<ConsultaExtratosResponseDto> {
    console.log(`🚀 [EXTRATOS-SERVICE] Iniciando consulta de extratos`);

    try {
      // Formatar datas para a API (EXATAMENTE como no exemplo)
      const formattedDataInicio = this.formatDateForAPI(dataInicio);
      const formattedDataFim = this.formatDateForAPI(dataFim);

      // Validar datas
      const diaInicioMatch = formattedDataInicio.match(/^\d+/);
      const diaInicio = parseInt(diaInicioMatch![0], 10);
      const restInicio = formattedDataInicio.slice(diaInicio > 9 ? 2 : 1);
      const mesInicioMatch = restInicio.match(/^\d+/);
      const mesInicio = parseInt(mesInicioMatch![0], 10);
      const monthLen = mesInicio > 9 ? 2 : 1;
      const anoInicio = parseInt(restInicio.slice(monthLen), 10);

      const diaFimMatch = formattedDataFim.match(/^\d+/);
      const diaFim = parseInt(diaFimMatch![0], 10);
      const restFim = formattedDataFim.slice(diaFim > 9 ? 2 : 1);
      const mesFimMatch = restFim.match(/^\d+/);
      const mesFim = parseInt(mesFimMatch![0], 10);
      const monthLenFim = mesFim > 9 ? 2 : 1;
      const anoFim = parseInt(restFim.slice(monthLenFim), 10);

      const inicioDate = new Date(anoInicio, mesInicio - 1, diaInicio);
      const fimDate = new Date(anoFim, mesFim - 1, diaFim);

      if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
        throw new BadRequestException('Datas inválidas após formatação');
      }

      if (inicioDate > fimDate) {
        throw new BadRequestException('Data de início não pode ser posterior à data de fim');
      }

      // Consultar extratos
      const lancamentos = await this.consultarExtratosInterno(formattedDataInicio, formattedDataFim);

      // Buscar informações da conta
      const contasCorrente = await this.contaCorrenteService.findAll();
      const contaInfo = contasCorrente.length > 0 ? {
        agencia: contasCorrente[0].agencia,
        conta: contasCorrente[0].contaCorrente,
        banco: '001'
      } : undefined;

      // Formatar resposta
      const response: ConsultaExtratosResponseDto = {
        lancamentos,
        total: lancamentos.length,
        periodoInicio: formattedDataInicio,
        periodoFim: formattedDataFim,
        consultadoEm: new Date().toISOString(),
        contaInfo
      };

      console.log(`✅ [EXTRATOS-SERVICE] Consulta finalizada com sucesso: ${lancamentos.length} lançamentos`);
      return response;

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro na consulta:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao consultar extratos');
    }
  }

  /**
   * Consulta extratos mensais (do início do mês até ontem)
   * Com cache para evitar consultas repetidas
   * @returns Resposta formatada com lançamentos mensais
   */
  async consultarExtratosMensais(): Promise<ExtratosMensaisResponseDto> {
    console.log(`🚀 [EXTRATOS-SERVICE] Iniciando consulta de extratos mensais`);

    try {
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      
      let dataInicio: string, dataFim: string;
      
      // Tratamento especial para o primeiro dia do mês (EXATAMENTE como no exemplo)
      if (diaAtual === 1) {
        // No primeiro dia do mês, buscamos o mês anterior inteiro
        const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        
        dataInicio = `${primeiroDiaMesAnterior.getDate()}${(primeiroDiaMesAnterior.getMonth() + 1).toString().padStart(2, '0')}${primeiroDiaMesAnterior.getFullYear()}`;
        dataFim = `${ultimoDiaMesAnterior.getDate()}${(ultimoDiaMesAnterior.getMonth() + 1).toString().padStart(2, '0')}${ultimoDiaMesAnterior.getFullYear()}`;
        
        console.log(`📅 [EXTRATOS-SERVICE] Primeiro dia do mês detectado - usando mês anterior: ${dataInicio} a ${dataFim}`);
      } else {
        // Para outros dias do mês, seguimos a lógica original (início do mês até ontem)
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        
        dataInicio = `${inicioMes.getDate()}${(inicioMes.getMonth() + 1).toString().padStart(2, '0')}${inicioMes.getFullYear()}`;
        dataFim = `${ontem.getDate()}${(ontem.getMonth() + 1).toString().padStart(2, '0')}${ontem.getFullYear()}`;
      }
      
      // Verifica se já temos dados em cache do mesmo dia (EXATAMENTE como no exemplo)
      const hojeFormatado = hoje.toISOString().split('T')[0];
      if (this.cachedExtratosMensal && this.ultimaConsultaMensal === hojeFormatado) {
        console.log(`🔄 [EXTRATOS-SERVICE] Retornando extratos mensais do cache (${dataInicio} a ${dataFim})`);
        return {
          lancamentos: this.cachedExtratosMensal,
          total: this.cachedExtratosMensal.length,
          periodo: `${dataInicio} a ${dataFim}`,
          consultadoEm: new Date().toISOString(),
          origem: 'cache'
        };
      }
      
      // Formatar datas para a API
      const formattedDataInicio = this.formatDateForAPI(dataInicio);
      const formattedDataFim = this.formatDateForAPI(dataFim);
      
      // Consultar extratos
      const lancamentos = await this.consultarExtratosInterno(formattedDataInicio, formattedDataFim);
      
      // Armazena no cache (EXATAMENTE como no exemplo)
      this.cachedExtratosMensal = lancamentos;
      this.ultimaConsultaMensal = hojeFormatado;
      
      console.log(`✅ [EXTRATOS-SERVICE] Consulta de extratos mensais concluída: ${lancamentos.length} lançamentos`);
      
      return {
        lancamentos,
        total: lancamentos.length,
        periodo: `${dataInicio} a ${dataFim}`,
        consultadoEm: new Date().toISOString(),
        origem: 'api'
      };

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro na consulta mensal:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao consultar extratos mensais');
    }
  }

  /**
   * Consulta extratos por período personalizado
   * @param inicio Data de início no formato DD-MM-YYYY
   * @param fim Data de fim no formato DD-MM-YYYY
   * @returns Resposta formatada com lançamentos do período
   */
  async consultarExtratosPorPeriodo(inicio: string, fim: string): Promise<ConsultaExtratosResponseDto> {
    console.log(`🚀 [EXTRATOS-SERVICE] Iniciando consulta de extratos por período: ${inicio} a ${fim}`);

    try {
      // Converter datas do formato DD-MM-YYYY para DDMMYYYY (EXATAMENTE como no exemplo)
      const dataInicio = this.convertPeriodoToAPI(inicio);
      const dataFim = this.convertPeriodoToAPI(fim);

      console.log(`📅 [EXTRATOS-SERVICE] Datas formatadas para API: ${dataInicio} a ${dataFim}`);

      // Validar se datas são válidas
      const [diaInicio, mesInicio, anoInicio] = inicio.split('-');
      const [diaFim, mesFim, anoFim] = fim.split('-');

      const inicioDate = new Date(parseInt(anoInicio), parseInt(mesInicio) - 1, parseInt(diaInicio));
      const fimDate = new Date(parseInt(anoFim), parseInt(mesFim) - 1, parseInt(diaFim));

      if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
        throw new BadRequestException('Datas inválidas');
      }

      if (inicioDate > fimDate) {
        throw new BadRequestException('Data de início não pode ser maior que a data de fim');
      }

      // Verificar datas futuras
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      
      if (inicioDate > hoje || fimDate > hoje) {
        throw new BadRequestException('Não é possível consultar extratos de datas futuras');
      }

      // Consultar extratos
      const lancamentos = await this.consultarExtratosInterno(dataInicio, dataFim);

      // Buscar informações da conta
      const contasCorrente = await this.contaCorrenteService.findAll();
      const contaInfo = contasCorrente.length > 0 ? {
        agencia: contasCorrente[0].agencia,
        conta: contasCorrente[0].contaCorrente,
        banco: '001'
      } : undefined;

      // Formatar resposta
      const response: ConsultaExtratosResponseDto = {
        lancamentos,
        total: lancamentos.length,
        periodoInicio: dataInicio,
        periodoFim: dataFim,
        consultadoEm: new Date().toISOString(),
        contaInfo
      };

      console.log(`✅ [EXTRATOS-SERVICE] Consulta por período finalizada: ${lancamentos.length} lançamentos`);
      return response;

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro na consulta por período:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao consultar extratos por período');
    }
  }
}
