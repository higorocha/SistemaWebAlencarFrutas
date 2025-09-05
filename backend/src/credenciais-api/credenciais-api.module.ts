import { Module } from '@nestjs/common';
import { CredenciaisAPIService } from './credenciais-api.service';
import { CredenciaisAPIController } from './credenciais-api.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CredenciaisAPIController],
  providers: [CredenciaisAPIService],
  exports: [CredenciaisAPIService],
})
export class CredenciaisAPIModule {} 