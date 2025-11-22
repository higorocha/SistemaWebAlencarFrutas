import { Injectable } from '@nestjs/common';
import { TipoContratoFuncionario } from '@prisma/client';

interface CalculoParametros {
  tipoContrato: TipoContratoFuncionario;
  salarioBaseReferencia?: number;
  valorDiariaAplicada?: number;
  diasTrabalhados?: number;
  horasExtras?: number;
  valorHoraExtra?: number;
  ajudaCusto?: number;
  descontosExtras?: number;
  adiantamento?: number;
}

export interface CalculoResultado {
  valorBase: number;
  valorHorasExtras: number;
  valorBruto: number;
  valorLiquido: number;
}

@Injectable()
export class FolhaCalculoService {
  calcularValores(params: CalculoParametros): CalculoResultado {
    const {
      tipoContrato,
      salarioBaseReferencia = 0,
      valorDiariaAplicada = 0,
      diasTrabalhados = 0,
      horasExtras = 0,
      valorHoraExtra = 0,
      ajudaCusto = 0,
      descontosExtras = 0,
      adiantamento = 0,
    } = params;

    // Mensalistas recebem salário / 2 (quinzenal)
    // Diaristas recebem diária * dias trabalhados
    const valorBase =
      tipoContrato === TipoContratoFuncionario.DIARISTA
        ? valorDiariaAplicada * diasTrabalhados
        : salarioBaseReferencia / 2; // Mensalistas recebem metade do salário (quinzenal)

    const valorHorasExtras = horasExtras * valorHoraExtra;
    const valorBruto = Math.max(valorBase + ajudaCusto + valorHorasExtras - descontosExtras, 0);
    const valorLiquido = Math.max(valorBruto - adiantamento, 0);

    return {
      valorBase,
      valorHorasExtras,
      valorBruto,
      valorLiquido,
    };
  }
}

