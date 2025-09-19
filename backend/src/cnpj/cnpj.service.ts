import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CnpjService {
  private readonly logger = new Logger(CnpjService.name);

  async consultarCnpj(cnpj: string): Promise<any> {
    // Remover caracteres não numéricos
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    // Validar se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido - deve ter 14 dígitos');
    }

    try {
      this.logger.log(`Consultando CNPJ: ${cnpjLimpo}`);

      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AlencarFrutas/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Verificar se há erro na resposta da API
      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado');
      }

      this.logger.log(`CNPJ consultado com sucesso: ${data.nome}`);

      // Retornar dados limpos e padronizados
      return {
        nome: data.nome || '',
        fantasia: data.fantasia || '',
        cnpj: data.cnpj || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        email: data.email || '',
        telefone: data.telefone || '',
        situacao: data.situacao || '',
        abertura: data.abertura || '',
        tipo: data.tipo || '',
        porte: data.porte || '',
        natureza_juridica: data.natureza_juridica || '',
        atividade_principal: data.atividade_principal ? [data.atividade_principal] : [],
        atividades_secundarias: data.atividades_secundarias || [],
        capital_social: data.capital_social || ''
      };

    } catch (error) {
      this.logger.error(`Erro ao consultar CNPJ ${cnpjLimpo}:`, error.message);
      throw error;
    }
  }
}