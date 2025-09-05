import { Module } from '@nestjs/common';
import { ConfigEmailService } from './config-email.service';
import { ConfigEmailController } from './config-email.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigEmailController],
  providers: [ConfigEmailService],
  exports: [ConfigEmailService],
})
export class ConfigEmailModule {} 