import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Configurar fuso horário ANTES de tudo
process.env.TZ = 'America/Sao_Paulo';

// Carregar variáveis de ambiente
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    // Executar comando SQL para configurar timezone da sessão
    this.$executeRaw`SET timezone = 'America/Sao_Paulo'`.catch(console.error);
  }

  async onModuleInit() {
    await this.$connect();
    // Configurar timezone após conectar
    try {
      await this.$executeRaw`SET timezone = 'America/Sao_Paulo'`;
      console.log('✅ Timezone configurado para America/Sao_Paulo');
    } catch (error) {
      console.error('❌ Erro ao configurar timezone:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
} 