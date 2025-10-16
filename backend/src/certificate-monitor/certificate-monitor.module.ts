import { Module } from '@nestjs/common';
import { CertificateMonitorService } from './certificate-monitor.service';
import { CertificateMonitorController } from './certificate-monitor.controller';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [CertificateMonitorController],
  providers: [CertificateMonitorService],
  exports: [CertificateMonitorService],
})
export class CertificateMonitorModule {}
