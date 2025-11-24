import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ConfigEmailModule } from './config-email/config-email.module';
import { ConfigWhatsAppModule } from './config-whatsapp/config-whatsapp.module';
import { ContaCorrenteModule } from './conta-corrente/conta-corrente.module';
import { ConvenioCobrancaModule } from './convenio-cobranca/convenio-cobranca.module';
import { CredenciaisAPIModule } from './credenciais-api/credenciais-api.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { PrismaModule } from './prisma/prisma.module';
import { CulturasModule } from './culturas/culturas.module';
import { AreasModule } from './areas/areas.module';
import { FrutasModule } from './frutas/frutas.module';
import { ClientesModule } from './clientes/clientes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { FornecedoresModule } from './fornecedores/fornecedores.module';
import { AreasFornecedoresModule } from './areas-fornecedores/areas-fornecedores.module';
import { FitasBananaModule } from './fitas-banana/fitas-banana.module';
import { ControleBananaModule } from './controle-banana/controle-banana.module';
import { HistoricoFitasModule } from './historico-fitas/historico-fitas.module';
import { TurmaColheitaModule } from './turma-colheita/turma-colheita.module';
import { CnpjModule } from './cnpj/cnpj.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PixModule } from './pix/pix.module';
import { ExtratosModule } from './extratos/extratos.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { CertificateMonitorModule } from './certificate-monitor/certificate-monitor.module';
import { ExtratosMonitorModule } from './extratos-monitor/extratos-monitor.module';
import { MobileModule } from './mobile/mobile.module';
import { BbWebhooksModule } from './bb-webhooks/bb-webhooks.module';
import { PdfModule } from './pdf/pdf.module';
import { ArhModule } from './arh/arh.module';
import { PedidosFinalizacaoJobModule } from './pedidos/pedidos-finalizacao-job.module';

@Module({
  imports: [
    // Configuração do Schedule Module para cron jobs
    ScheduleModule.forRoot(),
    // Configuração do Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 10, // 10 requisições por minuto
      },
      {
        ttl: 3600000, // 1 hora
        limit: 100, // 100 requisições por hora
      },
    ]),
    PrismaModule,
    AuthModule,
    ConfigModule,
    ConfigEmailModule,
    ConfigWhatsAppModule,
    ContaCorrenteModule,
    ConvenioCobrancaModule,
    CredenciaisAPIModule,
    NotificacoesModule,
    CulturasModule,
    AreasModule,
    FrutasModule,
    ClientesModule,
    PedidosModule,
    FornecedoresModule,
    AreasFornecedoresModule,
    FitasBananaModule,
    ControleBananaModule,
    HistoricoFitasModule,
    TurmaColheitaModule,
    CnpjModule,
    DashboardModule,
    PixModule,
    ExtratosModule,
    PagamentosModule,
    CertificateMonitorModule,
    ExtratosMonitorModule,
    MobileModule, // Módulo para API mobile
    BbWebhooksModule, // Módulo para webhooks do Banco do Brasil
    PdfModule, // Módulo para geração de PDFs
    ArhModule,
    PedidosFinalizacaoJobModule, // Job de finalização automática de pedidos zerados
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
