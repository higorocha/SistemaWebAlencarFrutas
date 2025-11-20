export class AreaFornecedorResponseDto {
  id: number;
  fornecedorId: number;
  nome: string;
  quantidadeHa?: number;
  culturaId?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  fornecedor?: {
    id: number;
    nome: string;
  };
  
  cultura?: {
    id: number;
    descricao: string;
  };
}

