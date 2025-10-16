import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CredenciaisAPIService } from '../credenciais-api/credenciais-api.service';
import { createApiClient, BB_API_URLS } from '../utils/bb-api-client';
import { TransacaoPixResponseDto, ConsultaTransacoesPixResponseDto } from './dto/pix.dto';

/**
 * Service para integração com a API PIX do Banco do Brasil
 * Implementa autenticação OAuth2, cache de token e consulta paginada de transações
 */
@Injectable()
export class PixService {
  // Cache de token em memória
  private cachedToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly credenciaisAPIService: CredenciaisAPIService
  ) {}

  /**
   * Formata data para o formato RFC 3339 esperado pela API BB
   * Baseado na documentação oficial do Banco do Brasil
   * @param dateStr Data no formato YYYY-MM-DD
   * @param endOfDay Se true, define para fim do dia (23:59:59.999)
   * @returns Data formatada como RFC 3339 com fuso UTC-3 (Brasília)
   */
  private formatDate(dateStr: string, endOfDay: boolean = false): string {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: YYYY-MM-DD`);
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let hours = '00';
    let minutes = '00';
    let seconds = '00';
    let milliseconds = '000';

    if (endOfDay) {
      hours = '23';
      minutes = '59';
      seconds = '59';
      milliseconds = '999';
    }

    // Formato RFC 3339 com fuso horário UTC-3 (Brasília)
    // Exemplo: 2023-04-19T00:00:00.000-03:00
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}-03:00`;
  }

  /**
   * Obtém token de acesso OAuth2 com cache
   * Baseado EXATAMENTE no pixController(exemplo).js
   * @returns Token de acesso válido
   */
  private async obterTokenDeAcesso(): Promise<string> {
    // Verifica se o token está em cache e ainda é válido (EXATAMENTE como no exemplo)
    if (this.cachedToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      console.log('🔄 [PIX-SERVICE] Usando token em cache');
      return this.cachedToken;
    }

    console.log('🔐 [PIX-SERVICE] Obtendo novo token de acesso...');

    try {
      // Buscar credenciais PIX do banco de dados (EXATAMENTE como no exemplo)
      const credenciaisPix = await this.credenciaisAPIService.findByBancoAndModalidade('001', '002 - Pix');
      
      if (!credenciaisPix || credenciaisPix.length === 0) {
        throw new NotFoundException(
          'Credencial de PIX não cadastrada. Favor cadastrar as credenciais de PIX.'
        );
      }

      // Usar a primeira credencial encontrada (EXATAMENTE como no exemplo)
      const credencialPix = credenciaisPix[0];

      // Criar cliente HTTP para autenticação (EXATAMENTE como no exemplo)
      const apiClient = createApiClient(credencialPix.developerAppKey);

      // Fazer requisição de autenticação OAuth2 (EXATAMENTE como no exemplo)
      const response = await apiClient.post(
        BB_API_URLS.PIX_AUTH,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'pix.read cob.read'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: credencialPix.clienteId,
            password: credencialPix.clienteSecret,
          },
        }
      );

      // Cachear o token (EXATAMENTE como no exemplo)
      this.cachedToken = (response.data as any).access_token;
      // Define a expiração para alguns minutos antes de expirar (EXATAMENTE como no exemplo)
      const expiresIn = (response.data as any).expires_in || 3600; // segundos
      this.tokenExpiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes

      console.log('✅ [PIX-SERVICE] Token obtido com sucesso');
      return this.cachedToken!;

    } catch (error) {
      console.error('❌ [PIX-SERVICE] Erro ao obter token de acesso:', error.response?.data || error.message);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na autenticação BB: ${error.response.data.error_description || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao obter token de acesso da API do Banco do Brasil');
    }
  }

  /**
   * Consulta transações PIX com paginação automática
   * Baseado EXATAMENTE no pixController(exemplo).js
   * @param inicio Data de início no formato YYYY-MM-DD
   * @param fim Data de fim no formato YYYY-MM-DD
   * @returns Array de transações PIX
   */
  private async consultarTransacoesPix(inicio: string, fim: string): Promise<TransacaoPixResponseDto[]> {
    console.log(`🔍 [PIX-SERVICE] Consultando transações PIX de ${inicio} até ${fim}`);

    try {
      // Obter token de acesso
      const token = await this.obterTokenDeAcesso();

      // Formatar datas (EXATAMENTE como no exemplo)
      const formattedInicio = this.formatDate(inicio, false);
      const formattedFim = this.formatDate(fim, true);

      // Buscar credenciais para obter o developerAppKey (EXATAMENTE como no exemplo)
      const credenciaisPix = await this.credenciaisAPIService.findByBancoAndModalidade('001', '002 - Pix');
      const credencialPix = credenciaisPix[0];

      // Criar cliente HTTP para consulta (EXATAMENTE como no exemplo)
      const apiClient = createApiClient(credencialPix.developerAppKey);

      const transacoes: TransacaoPixResponseDto[] = [];
      let paginaAtual = 0;
      let hasMorePages = true;

      // Loop de paginação (EXATAMENTE como no exemplo)
      while (hasMorePages) {
        console.log(`📄 [PIX-SERVICE] Consultando página ${paginaAtual + 1}`);

        const response = await apiClient.get(BB_API_URLS.PIX_TRANSACTIONS, {
          params: {
            inicio: formattedInicio,
            fim: formattedFim,
            'paginacao.paginaAtual': paginaAtual,
            'paginacao.itensPorPagina': 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data as any;

        // Verificar se há transações nesta página (EXATAMENTE como no exemplo)
        if (!data || !data.pix || data.pix.length === 0) {
          console.log(`📄 [PIX-SERVICE] Página ${paginaAtual + 1} sem transações`);
          hasMorePages = false;
          break;
        }

        // Adicionar transações à lista (EXATAMENTE como no exemplo)
        transacoes.push(...data.pix);
        console.log(`📄 [PIX-SERVICE] Página ${paginaAtual + 1}: ${data.pix.length} transações encontradas`);

        // Verificar se há mais páginas (EXATAMENTE como no exemplo)
        const paginacao = data.parametros?.paginacao;
        const totalPaginas = paginacao?.quantidadeDePaginas || 0;
        paginaAtual += 1;
        hasMorePages = paginaAtual < totalPaginas;
      }

      console.log(`✅ [PIX-SERVICE] Consulta finalizada: ${transacoes.length} transações encontradas`);
      return transacoes;

    } catch (error) {
      console.error('❌ [PIX-SERVICE] Erro ao consultar transações PIX:', error.response?.data || error.message);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.response?.data) {
        const errorMessage = error.response.data.detail || 
                           error.response.data.error_description || 
                           error.response.data.error || 
                           'Erro ao consultar transações PIX';
        throw new InternalServerErrorException(`Erro na API BB: ${errorMessage}`);
      }

      throw new InternalServerErrorException('Erro interno ao consultar transações PIX');
    }
  }

  /**
   * Consulta transações PIX para o período especificado
   * @param inicio Data de início no formato YYYY-MM-DD
   * @param fim Data de fim no formato YYYY-MM-DD
   * @returns Resposta formatada com transações e metadados
   */
  async consultarTransacoes(inicio: string, fim: string): Promise<ConsultaTransacoesPixResponseDto> {
    console.log(`🚀 [PIX-SERVICE] Iniciando consulta de transações PIX`);

    try {
      // Validar datas
      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);

      if (dataInicio > dataFim) {
        throw new BadRequestException('Data de início não pode ser posterior à data de fim');
      }

      // Limitar consulta a 5 dias (limitação da API do BB)
      const diffInDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays > 5) {
        throw new BadRequestException('Período de consulta não pode exceder 5 dias (limitação da API do Banco do Brasil)');
      }

      // Consultar transações
      const transacoes = await this.consultarTransacoesPix(inicio, fim);

      // Formatar resposta
      const response: ConsultaTransacoesPixResponseDto = {
        transacoes,
        total: transacoes.length,
        periodoInicio: this.formatDate(inicio, false),
        periodoFim: this.formatDate(fim, true),
        consultadoEm: new Date().toISOString()
      };

      console.log(`✅ [PIX-SERVICE] Consulta finalizada com sucesso: ${transacoes.length} transações`);
      return response;

    } catch (error) {
      console.error('❌ [PIX-SERVICE] Erro na consulta:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao consultar transações PIX');
    }
  }
}
