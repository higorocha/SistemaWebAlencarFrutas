import { Module } from '@nestjs/common';
import { ConfigWhatsAppService } from './config-whatsapp.service';
import { ConfigWhatsAppController } from './config-whatsapp.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigWhatsAppController],
  providers: [ConfigWhatsAppService],
  exports: [ConfigWhatsAppService],
})
export class ConfigWhatsAppModule {} 