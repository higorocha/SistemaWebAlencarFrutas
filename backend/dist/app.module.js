"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const config_module_1 = require("./config/config.module");
const config_email_module_1 = require("./config-email/config-email.module");
const config_whatsapp_module_1 = require("./config-whatsapp/config-whatsapp.module");
const conta_corrente_module_1 = require("./conta-corrente/conta-corrente.module");
const convenio_cobranca_module_1 = require("./convenio-cobranca/convenio-cobranca.module");
const credenciais_api_module_1 = require("./credenciais-api/credenciais-api.module");
const notificacoes_module_1 = require("./notificacoes/notificacoes.module");
const prisma_service_1 = require("./prisma/prisma.service");
const culturas_module_1 = require("./culturas/culturas.module");
const areas_module_1 = require("./areas/areas.module");
const frutas_module_1 = require("./frutas/frutas.module");
const clientes_module_1 = require("./clientes/clientes.module");
const pedidos_module_1 = require("./pedidos/pedidos.module");
const fornecedores_module_1 = require("./fornecedores/fornecedores.module");
const areas_fornecedores_module_1 = require("./areas-fornecedores/areas-fornecedores.module");
const fitas_banana_module_1 = require("./fitas-banana/fitas-banana.module");
const controle_banana_module_1 = require("./controle-banana/controle-banana.module");
const historico_fitas_module_1 = require("./historico-fitas/historico-fitas.module");
const turma_colheita_module_1 = require("./turma-colheita/turma-colheita.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
                {
                    ttl: 3600000,
                    limit: 100,
                },
            ]),
            auth_module_1.AuthModule,
            config_module_1.ConfigModule,
            config_email_module_1.ConfigEmailModule,
            config_whatsapp_module_1.ConfigWhatsAppModule,
            conta_corrente_module_1.ContaCorrenteModule,
            convenio_cobranca_module_1.ConvenioCobrancaModule,
            credenciais_api_module_1.CredenciaisAPIModule,
            notificacoes_module_1.NotificacoesModule,
            culturas_module_1.CulturasModule,
            areas_module_1.AreasModule,
            frutas_module_1.FrutasModule,
            clientes_module_1.ClientesModule,
            pedidos_module_1.PedidosModule,
            fornecedores_module_1.FornecedoresModule,
            areas_fornecedores_module_1.AreasFornecedoresModule,
            fitas_banana_module_1.FitasBananaModule,
            controle_banana_module_1.ControleBananaModule,
            historico_fitas_module_1.HistoricoFitasModule,
            turma_colheita_module_1.TurmaColheitaModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map