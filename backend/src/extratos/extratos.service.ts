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
  // Cache de token em memória
  private cachedToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // Cache de extratos mensais
  private cachedExtratosMensal: LancamentoExtratoDto[] | null = null;
  private ultimaConsultaMensal: string | null = null;

  constructor(
    private readonly credenciaisAPIService: CredenciaisAPIService,
    private readonly contaCorrenteService: ContaCorrenteService
  ) {}

  /**
   * Formata data do formato DDMMYYYY para o formato usado pela API
   * Baseado EXATAMENTE no extratosController(exemplo).js
   * @param dateStr Data no formato DDMMYYYY
   * @returns Data formatada sem zeros à esquerda
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

    // Reconstroi removendo zeros à esquerda (EXATAMENTE como no exemplo)
    return `${dia}${mes}${ano}`;
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
   * Obtém token de acesso OAuth2 com cache
   * Baseado EXATAMENTE no extratosController(exemplo).js
   * @returns Token de acesso válido
   */
  private async obterTokenDeAcesso(): Promise<string> {
    // Verifica se o token está em cache e ainda é válido (EXATAMENTE como no exemplo)
    if (this.cachedToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      console.log('🔄 [EXTRATOS-SERVICE] Usando token em cache');
      return this.cachedToken;
    }

    console.log('🔐 [EXTRATOS-SERVICE] Obtendo novo token de acesso...');

    try {
      // Buscar credenciais de extratos do banco de dados (EXATAMENTE como no exemplo)
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        throw new NotFoundException(
          'Credencial de extratos não cadastrada. Favor cadastrar as credenciais de extratos.'
        );
      }

      // Usar a primeira credencial encontrada (EXATAMENTE como no exemplo)
      const credencialExtrato = credenciaisExtratos[0];

      // Criar cliente HTTP para autenticação (EXATAMENTE como no exemplo)
      const authClient = createExtratosAuthClient();

      // Fazer requisição de autenticação OAuth2 (EXATAMENTE como no exemplo)
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

      // Cachear o token (EXATAMENTE como no exemplo)
      this.cachedToken = (response.data as any).access_token;
      // Define a expiração para alguns minutos antes de expirar (EXATAMENTE como no exemplo)
      const expiresIn = (response.data as any).expires_in || 3600; // segundos
      this.tokenExpiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes

      console.log('✅ [EXTRATOS-SERVICE] Token obtido com sucesso');
      return this.cachedToken!;

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro ao obter token de acesso:', error.response?.data || error.message);
      
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
    console.log(`🔍 [EXTRATOS-SERVICE] Consultando extratos brutos de ${dataInicio} até ${dataFim}${contaCorrenteId ? ` (conta: ${contaCorrenteId})` : ''}`);

    try {
      // Obter token de acesso
      const token = await this.obterTokenDeAcesso();

      // Buscar credenciais de extratos
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      if (!credenciaisExtratos || credenciaisExtratos.length === 0) {
        throw new NotFoundException('Credenciais de extratos não encontradas. Configure as credenciais primeiro.');
      }
      const credencialExtrato = credenciaisExtratos[0];

      // Buscar conta corrente
      let contaCorrente;
      if (contaCorrenteId) {
        contaCorrente = await this.contaCorrenteService.findOne(contaCorrenteId);
      } else {
        const contasCorrente = await this.contaCorrenteService.findAll();
        if (!contasCorrente || contasCorrente.length === 0) {
          throw new NotFoundException('Conta Corrente não cadastrada. Favor cadastrar uma conta corrente.');
        }
        contaCorrente = contasCorrente[0];
      }

      const agencia = contaCorrente.agencia;
      const conta = contaCorrente.contaCorrente;

      // Criar cliente HTTP para consulta
      const apiClient = createExtratosApiClient(credencialExtrato.developerAppKey);

      const extratos: any[] = [];
      let paginaAtual = 1;
      let hasMorePages = true;

      // Loop de paginação
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

        // Verificar se há lançamentos nesta página
        if (!data || !data.listaLancamento || data.listaLancamento.length === 0) {
          console.log(`📄 [EXTRATOS-SERVICE] Página ${paginaAtual} sem lançamentos`);
          hasMorePages = false;
          break;
        }

        // Adicionar lançamentos à lista (dados brutos)
        extratos.push(...data.listaLancamento);
        console.log(`📄 [EXTRATOS-SERVICE] Página ${paginaAtual}: ${data.listaLancamento.length} lançamentos encontrados`);

        // Verificar se há mais páginas
        if (data.numeroPaginaProximo > 0) {
          paginaAtual = data.numeroPaginaProximo;
        } else {
          hasMorePages = false;
        }
      }

      console.log(`✅ [EXTRATOS-SERVICE] Consulta finalizada: ${extratos.length} lançamentos encontrados`);
      return extratos;

    } catch (error) {
      console.error('❌ [EXTRATOS-SERVICE] Erro ao consultar extratos brutos:', error.response?.data || error.message);

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
   * Consulta extratos com paginação automática
   * Baseado EXATAMENTE no extratosController(exemplo).js
   * @param dataInicio Data de início no formato DDMMYYYY
   * @param dataFim Data de fim no formato DDMMYYYY
   * @returns Array de lançamentos de extrato
   */
  private async consultarExtratosInterno(dataInicio: string, dataFim: string): Promise<LancamentoExtratoDto[]> {
    console.log(`🔍 [EXTRATOS-SERVICE] Consultando extratos de ${dataInicio} até ${dataFim}`);

    try {
      // Obter token de acesso
      const token = await this.obterTokenDeAcesso();

      // Buscar credenciais e conta corrente (EXATAMENTE como no exemplo)
      const credenciaisExtratos = await this.credenciaisAPIService.findByBancoAndModalidade('001', '003 - Extratos');
      const credencialExtrato = credenciaisExtratos[0];

      // Buscar conta corrente (EXATAMENTE como no exemplo)
      const contasCorrente = await this.contaCorrenteService.findAll();
      if (!contasCorrente || contasCorrente.length === 0) {
        throw new NotFoundException('Conta Corrente não cadastrada. Favor cadastrar uma conta corrente.');
      }
      const contaCorrente = contasCorrente[0];
      const agencia = contaCorrente.agencia;
      const conta = contaCorrente.contaCorrente;

      // Criar cliente HTTP para consulta (EXATAMENTE como no exemplo)
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

      console.log(`✅ [EXTRATOS-SERVICE] Consulta finalizada: ${extratos.length} lançamentos encontrados`);
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
