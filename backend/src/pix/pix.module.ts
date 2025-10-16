import { Module } from '@nestjs/common';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { CredenciaisAPIModule } from '../credenciais-api/credenciais-api.module';

/**
 * Módulo PIX para integração com a API do Banco do Brasil
 * 
 * Este módulo fornece funcionalidades para:
 * - Consulta de transações PIX recebidas
 * - Autenticação OAuth2 com cache de token
 * - Integração com credenciais armazenadas no banco de dados
 * 
 * Dependências:
 * - CredenciaisAPIModule: Para buscar credenciais PIX do banco de dados
 */
@Module({
  imports: [
    CredenciaisAPIModule, // Importa o módulo de credenciais para buscar dados PIX
  ],
  controllers: [
    PixController, // Controller com endpoints de consulta PIX
  ],
  providers: [
    PixService, // Service com lógica de negócio e integração BB API
  ],
  exports: [
    PixService, // Exporta o service para uso em outros módulos se necessário
  ],
})
export class PixModule {}
