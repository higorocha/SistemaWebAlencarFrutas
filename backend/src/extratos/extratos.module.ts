import { Module } from '@nestjs/common';
import { ExtratosController } from './extratos.controller';
import { ExtratosService } from './extratos.service';
import { CredenciaisAPIModule } from '../credenciais-api/credenciais-api.module';
import { ContaCorrenteModule } from '../conta-corrente/conta-corrente.module';

/**
 * Módulo de extratos para integração com a API do Banco do Brasil
 * 
 * Este módulo fornece funcionalidades para:
 * - Consulta de extratos bancários
 * - Autenticação OAuth2 com cache de token
 * - Integração com credenciais e conta corrente armazenadas no banco de dados
 * - Cache inteligente de extratos mensais
 * 
 * Dependências:
 * - CredenciaisAPIModule: Para buscar credenciais de extratos do banco de dados
 * - ContaCorrenteModule: Para buscar dados da conta corrente
 */
@Module({
  imports: [
    CredenciaisAPIModule, // Importa o módulo de credenciais para buscar dados de extratos
    ContaCorrenteModule,  // Importa o módulo de conta corrente para buscar dados da conta
  ],
  controllers: [
    ExtratosController, // Controller com endpoints de consulta de extratos
  ],
  providers: [
    ExtratosService, // Service com lógica de negócio e integração BB API
  ],
  exports: [
    ExtratosService, // Exporta o service para uso em outros módulos se necessário
  ],
})
export class ExtratosModule {}
