import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { StatusBoleto } from '@prisma/client';

// DTO para informações básicas do usuário
export class UsuarioInfoDto {
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  @Expose()
  nome: string;

  @ApiPropertyOptional({ description: 'Email do usuário', example: 'joao@email.com' })
  @Expose()
  email?: string;
}

// DTO para log do boleto
export class BoletoLogDto {
  @ApiProperty({ description: 'ID do log', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Tipo de operação', example: 'CRIACAO' })
  @Expose()
  tipoOperacao: string;

  @ApiProperty({ description: 'Descrição da operação', example: 'Boleto criado com sucesso' })
  @Expose()
  descricaoOperacao: string;

  @ApiPropertyOptional({ description: 'Dados antes da operação' })
  @Expose()
  dadosAntes?: any;

  @ApiPropertyOptional({ description: 'Dados depois da operação' })
  @Expose()
  dadosDepois?: any;

  @ApiPropertyOptional({ description: 'Usuário que realizou a operação' })
  @Expose()
  usuario?: UsuarioInfoDto;

  @ApiPropertyOptional({ description: 'Endereço IP' })
  @Expose()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  @Expose()
  mensagemErro?: string;

  @ApiProperty({ description: 'Data de criação do log' })
  @Expose()
  createdAt: Date;
}

export class BoletoResponseDto {
  @ApiProperty({ description: 'ID do boleto', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'ID do pedido', example: 1 })
  @Expose()
  pedidoId: number;

  @ApiProperty({ description: 'ID do convênio de cobrança', example: 1 })
  @Expose()
  convenioCobrancaId: number;

  @ApiProperty({ description: 'ID da conta corrente', example: 1 })
  @Expose()
  contaCorrenteId: number;

  @ApiProperty({ description: 'Valor original do boleto', example: 123.45 })
  @Expose()
  valorOriginal: number;

  @ApiProperty({ description: 'Data de vencimento', example: '2026-12-31T00:00:00.000Z' })
  @Expose()
  dataVencimento: Date;

  @ApiProperty({ description: 'Data de emissão', example: '2026-01-15T00:00:00.000Z' })
  @Expose()
  dataEmissao: Date;

  @ApiPropertyOptional({ description: 'Data de pagamento', example: '2026-12-31T00:00:00.000Z' })
  @Expose()
  dataPagamento?: Date | null;

  @ApiPropertyOptional({ description: 'Data de baixa', example: '2026-12-31T00:00:00.000Z' })
  @Expose()
  dataBaixa?: Date | null;

  @ApiProperty({ description: 'Status do boleto', enum: StatusBoleto, example: 'ABERTO' })
  @Expose()
  statusBoleto: StatusBoleto;

  @ApiProperty({ description: 'Nosso número (20 dígitos)', example: '00031285570000030000' })
  @Expose()
  nossoNumero: string;

  @ApiProperty({ description: 'Número do título beneficiário (Seu Número)', example: 'PED-2026-0001' })
  @Expose()
  numeroTituloBeneficiario: string;

  @ApiPropertyOptional({ description: 'Número do título cliente (apenas dev)', example: '00031285570000030000' })
  @Expose()
  numeroTituloCliente?: string | null;

  @ApiProperty({ description: 'Linha digitável', example: '00190.00009 01234.567890 12345.678901 2 98760000012345' })
  @Expose()
  linhaDigitavel: string;

  @ApiProperty({ description: 'Código de barras', example: '00198760000012345000000012345678901234567890' })
  @Expose()
  codigoBarras: string;

  @ApiPropertyOptional({ description: 'URL do QR Code PIX' })
  @Expose()
  qrCodePix?: string | null;

  @ApiPropertyOptional({ description: 'TxID do PIX' })
  @Expose()
  txidPix?: string | null;

  @ApiPropertyOptional({ description: 'URL do PIX' })
  @Expose()
  urlPix?: string | null;

  @ApiProperty({ description: 'Número do convênio (denormalizado)', example: '3128557' })
  @Expose()
  numeroConvenio: string;

  @ApiProperty({ description: 'Número da carteira (denormalizado)', example: '17' })
  @Expose()
  numeroCarteira: string;

  @ApiProperty({ description: 'Número da variação (denormalizado)', example: '35' })
  @Expose()
  numeroVariacaoCarteira: string;

  @ApiProperty({ description: 'Data de criação', example: '2026-01-15T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização', example: '2026-01-15T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

export class BoletoResponseCompletoDto extends BoletoResponseDto {
  @ApiPropertyOptional({ description: 'Usuário que criou o boleto' })
  @Expose()
  usuarioCriacao?: UsuarioInfoDto;

  @ApiPropertyOptional({ description: 'Usuário que alterou o boleto' })
  @Expose()
  usuarioAlteracao?: UsuarioInfoDto;

  @ApiPropertyOptional({ description: 'Usuário que baixou o boleto' })
  @Expose()
  usuarioBaixa?: UsuarioInfoDto;

  @ApiPropertyOptional({ description: 'Usuário que registrou o pagamento' })
  @Expose()
  usuarioPagamento?: UsuarioInfoDto;

  @ApiPropertyOptional({ description: 'Nome do pagador' })
  @Expose()
  pagadorNome?: string;

  @ApiPropertyOptional({ description: 'Número de inscrição do pagador (CPF/CNPJ)' })
  @Expose()
  pagadorNumeroInscricao?: string;

  @ApiPropertyOptional({ description: 'Tipo de inscrição do pagador' })
  @Expose()
  pagadorTipoInscricao?: string;

  @ApiPropertyOptional({ description: 'Endereço do pagador' })
  @Expose()
  pagadorEndereco?: string;

  @ApiPropertyOptional({ description: 'Bairro do pagador' })
  @Expose()
  pagadorBairro?: string;

  @ApiPropertyOptional({ description: 'Cidade do pagador' })
  @Expose()
  pagadorCidade?: string;

  @ApiPropertyOptional({ description: 'UF do pagador' })
  @Expose()
  pagadorUf?: string;

  @ApiPropertyOptional({ description: 'CEP do pagador' })
  @Expose()
  pagadorCep?: string;

  @ApiPropertyOptional({ description: 'Telefone do pagador' })
  @Expose()
  pagadorTelefone?: string;

  @ApiPropertyOptional({ description: 'Email do pagador' })
  @Expose()
  pagadorEmail?: string;

  @ApiPropertyOptional({ description: 'Indica se foi atualizado via webhook' })
  @Expose()
  atualizadoPorWebhook?: boolean;

  @ApiPropertyOptional({ description: 'Data do webhook de pagamento' })
  @Expose()
  dataWebhookPagamento?: Date;

  @ApiPropertyOptional({ description: 'IP do webhook' })
  @Expose()
  ipAddressWebhook?: string;

  @ApiPropertyOptional({ description: 'Logs do boleto', type: [BoletoLogDto] })
  @Expose()
  logs?: BoletoLogDto[];
}

export class ListarBoletosResponseDto {
  @ApiProperty({ description: 'Quantidade de registros retornados', example: 10 })
  quantidadeRegistros: number;

  @ApiProperty({ description: 'Indicador de continuidade', example: 'N' })
  indicadorContinuidade: string;

  @ApiPropertyOptional({ description: 'Próximo índice para paginação', example: 300 })
  proximoIndice?: number;

  @ApiProperty({ description: 'Lista de boletos', type: [BoletoResponseDto] })
  boletos: BoletoResponseDto[];
}
