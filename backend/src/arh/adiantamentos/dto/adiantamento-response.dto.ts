export class AdiantamentoResponseDto {
  id: number;
  funcionarioId: number;
  valorTotal: number;
  quantidadeParcelas: number;
  saldoDevedor: number;
  quantidadeParcelasRemanescentes: number;
  observacoes?: string;
  usuarioCriacaoId: number;
  createdAt: Date;
  updatedAt: Date;
  funcionario?: {
    id: number;
    nome: string;
    cpf: string;
  };
  usuarioCriacao?: {
    id: number;
    nome: string;
  };
  lancamentosAdiantamento?: Array<{
    id: number;
    folhaId: number;
    funcionarioPagamentoId: number;
    valorDeduzido: number;
    parcelaNumero: number;
    createdAt: Date;
    competenciaFolha?: string; // Campo calculado: "MM/AAAA - 1Q" ou "MM/AAAA - 2Q"
    folha?: {
      id: number;
      competenciaMes: number;
      competenciaAno: number;
      periodo: number;
    };
  }>;
}
