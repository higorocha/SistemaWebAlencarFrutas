import { Injectable } from '@nestjs/common';
import { TipoContratoFuncionario } from '@prisma/client';

interface CalculoParametros {
  tipoContrato: TipoContratoFuncionario;
  isGerencial?: boolean; // Indica se o cargo é gerencial
  salarioBaseReferencia?: number;
  valorDiariaAplicada?: number;
  diasTrabalhados?: number;
  horasExtras?: number;
  valorHoraExtra?: number;
  ajudaCusto?: number;
  extras?: number;
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
      isGerencial = false,
      salarioBaseReferencia = 0,
      valorDiariaAplicada = 0,
      diasTrabalhados = 0,
      horasExtras = 0,
      valorHoraExtra = 0,
      ajudaCusto = 0,
      extras = 0,
      adiantamento = 0,
    } = params;

    // Cálculo do valor base:
    // - Mensalistas Gerenciais: recebem salário / 2 (quinzenal), não influenciado por dias
    // - Mensalistas Não Gerenciais: (salário / 30) × dias trabalhados (proporcional)
    // - Diaristas: diária × dias trabalhados
    const valorBase =
      tipoContrato === TipoContratoFuncionario.DIARISTA
        ? valorDiariaAplicada * diasTrabalhados
        : isGerencial
          ? salarioBaseReferencia / 2 // Gerenciais: metade do salário (quinzenal fixa)
          : (salarioBaseReferencia * diasTrabalhados) / 30; // Não gerenciais: proporcional aos dias

    const valorHorasExtras = horasExtras * valorHoraExtra;
    const valorBruto = Math.max(valorBase + ajudaCusto + valorHorasExtras + extras, 0);
    const valorLiquido = Math.max(valorBruto - adiantamento, 0);

    return {
      valorBase,
      valorHorasExtras,
      valorBruto,
      valorLiquido,
    };
  }
}

