import { Module, forwardRef } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesController } from './notificacoes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MobileModule } from '../mobile/mobile.module';
import { ExpoPushService } from './services/expo-push.service';

@Module({
  imports: [PrismaModule, forwardRef(() => MobileModule)],
  controllers: [NotificacoesController],
  providers: [NotificacoesService, ExpoPushService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {} 