export class AreaFornecedorResponseDto {
  id: number;
  fornecedorId: number;
  nome: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  fornecedor?: {
    id: number;
    nome: string;
  };
}

