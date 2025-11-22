import { Module } from '@nestjs/common';
import { CargosModule } from './cargos/cargos.module';
import { FuncoesDiaristasModule } from './funcoes-diaristas/funcoes-diaristas.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { FolhaPagamentoModule } from './folha-pagamento/folha-pagamento.module';

@Module({
  imports: [
    CargosModule,
    FuncoesDiaristasModule,
    FuncionariosModule,
    FolhaPagamentoModule,
  ],
  exports: [
    CargosModule,
    FuncoesDiaristasModule,
    FuncionariosModule,
    FolhaPagamentoModule,
  ],
})
export class ArhModule {}

