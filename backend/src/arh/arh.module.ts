import { Module } from '@nestjs/common';
import { CargosModule } from './cargos/cargos.module';
import { FuncoesDiaristasModule } from './funcoes-diaristas/funcoes-diaristas.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { FolhaPagamentoModule } from './folha-pagamento/folha-pagamento.module';
import { AdiantamentosModule } from './adiantamentos/adiantamentos.module';

@Module({
  imports: [
    CargosModule,
    FuncoesDiaristasModule,
    FuncionariosModule,
    FolhaPagamentoModule,
    AdiantamentosModule,
  ],
  exports: [
    CargosModule,
    FuncoesDiaristasModule,
    FuncionariosModule,
    FolhaPagamentoModule,
    AdiantamentosModule,
  ],
})
export class ArhModule {}

