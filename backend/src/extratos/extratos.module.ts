import { Module } from '@nestjs/common';
import { ExtratosController } from './extratos.controller';
import { ExtratosService } from './extratos.service';
import { LancamentoExtratoController } from './lancamento-extrato.controller';
import { LancamentoExtratoService } from './lancamento-extrato.service';
import { CredenciaisAPIModule } from '../credenciais-api/credenciais-api.module';
import { ContaCorrenteModule } from '../conta-corrente/conta-corrente.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo de extratos para integração com a API do Banco do Brasil
 * 
 * Este módulo fornece funcionalidades para:
 * - Consulta de extratos bancários
 * - Autenticação OAuth2 com cache de token
 * - Integração com credenciais e conta corrente armazenadas no banco de dados
 * - Cache inteligente de extratos mensais
 * - Gerenciamento de lançamentos de extrato salvos no banco de dados
 * 
 * Dependências:
 * - CredenciaisAPIModule: Para buscar credenciais de extratos do banco de dados
 * - ContaCorrenteModule: Para buscar dados da conta corrente
 * - PrismaModule: Para acesso ao banco de dados (lançamentos)
 */
@Module({
  imports: [
    CredenciaisAPIModule, // Importa o módulo de credenciais para buscar dados de extratos
    ContaCorrenteModule,  // Importa o módulo de conta corrente para buscar dados da conta
    PrismaModule,         // Importa o módulo Prisma para acesso ao banco de dados
  ],
  controllers: [
    ExtratosController,        // Controller com endpoints de consulta de extratos na API BB
    LancamentoExtratoController, // Controller com endpoints de gerenciamento de lançamentos salvos
  ],
  providers: [
    ExtratosService,           // Service com lógica de negócio e integração BB API
    LancamentoExtratoService,  // Service com lógica de CRUD e vinculação de lançamentos
  ],
  exports: [
    ExtratosService,           // Exporta o service para uso em outros módulos se necessário
    LancamentoExtratoService,  // Exporta o service para uso em outros módulos (ex: jobs)
  ],
})
export class ExtratosModule {}
