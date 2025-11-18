import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsInt, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para transferência PIX individual
 */
export class TransferenciaPixDto {
  @ApiProperty({ description: 'Data do pagamento no formato ddmmaaaa', example: '13112025' })
  @IsNotEmpty()
  @IsString()
  data: string;

  @ApiProperty({ description: 'Valor do pagamento em reais', example: '1.00' })
  @IsNotEmpty()
  @IsString()
  valor: string;

  @ApiPropertyOptional({ description: 'Documento de débito' })
  @IsOptional()
  @IsString()
  documentoDebito?: string;

  @ApiPropertyOptional({ description: 'Documento de crédito' })
  @IsOptional()
  @IsString()
  documentoCredito?: string;

  @ApiProperty({ description: 'Descrição do pagamento', example: 'Pagamento via PIX' })
  @IsNotEmpty()
  @IsString()
  descricaoPagamento: string;

  @ApiProperty({ description: 'Descrição do pagamento instantâneo', example: 'PIX' })
  @IsNotEmpty()
  @IsString()
  descricaoPagamentoInstantaneo: string;

  @ApiProperty({ description: 'Forma de identificação: 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória, 5=Dados Bancários', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  formaIdentificacao: number;

  // Campos condicionais baseados em formaIdentificacao
  @ApiPropertyOptional({ description: 'DDD com dois dígitos (obrigatório se formaIdentificacao = 1)', example: '11' })
  @IsOptional()
  @IsString()
  dddTelefone?: string;

  @ApiPropertyOptional({ description: 'Telefone do favorecido (nove dígitos) (obrigatório se formaIdentificacao = 1)', example: '985732102' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ description: 'Email do favorecido (obrigatório se formaIdentificacao = 2)', example: 'teste@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'CPF do favorecido (obrigatório se formaIdentificacao = 3)', example: '12345678900' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ description: 'CNPJ do favorecido (opcional para validação quando formaIdentificacao = 1 ou 2)', example: '95127446000198' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Chave aleatória PIX (obrigatório se formaIdentificacao = 4)', example: '9e881f18-cc66-4fc7-8f2c-a795dbb2bfc1' })
  @IsOptional()
  @IsString()
  identificacaoAleatoria?: string;

  // Campos para formaIdentificacao = 5 (Dados Bancários)
  @ApiPropertyOptional({ description: 'Número COMPE do banco (obrigatório se formaIdentificacao = 5)', example: 1 })
  @IsOptional()
  @IsInt()
  numeroCOMPE?: number;

  @ApiPropertyOptional({ description: 'Número ISPB do banco (obrigatório se formaIdentificacao = 5)', example: 0 })
  @IsOptional()
  @IsInt()
  numeroISPB?: number;

  @ApiPropertyOptional({ description: 'Tipo de conta (obrigatório se formaIdentificacao = 5)', example: 1 })
  @IsOptional()
  @IsInt()
  tipoConta?: number;

  @ApiPropertyOptional({ description: 'Agência (obrigatório se formaIdentificacao = 5)', example: 4267 })
  @IsOptional()
  @IsInt()
  agencia?: number;

  @ApiPropertyOptional({ description: 'Conta (obrigatório se formaIdentificacao = 5)', example: 1704959 })
  @IsOptional()
  @IsInt()
  conta?: number;

  @ApiPropertyOptional({ description: 'Dígito verificador da conta (obrigatório se formaIdentificacao = 5)', example: '8' })
  @IsOptional()
  @IsString()
  digitoVerificadorConta?: string;
}

/**
 * DTO para solicitar transferência PIX
 */
export class SolicitarTransferenciaPixDto {
  @ApiProperty({ description: 'ID da conta corrente para realizar o pagamento (usado para buscar credenciais)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  contaCorrenteId: number;

  @ApiPropertyOptional({ description: 'Número da requisição (gerado automaticamente se não informado)', example: 1234567 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999999)
  numeroRequisicao?: number;

  @ApiPropertyOptional({ description: 'IDs das colheitas (TurmaColheitaPedidoCusto) para relacionar com os itens. Deve corresponder à ordem de listaTransferencias', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  colheitaIds?: number[];

  @ApiPropertyOptional({ description: 'Número do contrato (Convênio PGT) - ignorado, contrato vem da conta corrente', example: 731030 })
  @IsOptional()
  @IsInt()
  numeroContrato?: number;

  @ApiProperty({ description: 'Agência de débito', example: '1607' })
  @IsNotEmpty()
  @IsString()
  agenciaDebito: string;

  @ApiProperty({ description: 'Conta corrente de débito', example: '99738672' })
  @IsNotEmpty()
  @IsString()
  contaCorrenteDebito: string;

  @ApiProperty({ description: 'Dígito verificador da conta corrente', example: 'X' })
  @IsNotEmpty()
  @IsString()
  digitoVerificadorContaCorrente: string;

  @ApiProperty({ description: 'Tipo de pagamento: 126=Pagamento de fornecedores, 128=Pagamentos diversos', example: 126 })
  @IsNotEmpty()
  @IsInt()
  tipoPagamento: number;

  @ApiProperty({ description: 'Lista de transferências PIX (máximo 320 registros)', type: [TransferenciaPixDto] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(320, { message: 'Lista de transferências não pode ter mais de 320 registros' })
  @ValidateNested({ each: true })
  @Type(() => TransferenciaPixDto)
  listaTransferencias: TransferenciaPixDto[];
}

/**
 * DTO para lançamento de pagamento de boleto
 */
export class LancamentoBoletoDto {
  @ApiPropertyOptional({ description: 'Número do documento de débito' })
  @IsOptional()
  @IsString()
  numeroDocumentoDebito?: string;

  @ApiProperty({ description: 'Número do código de barras do boleto', example: '83630000000641400052836100812355200812351310' })
  @IsNotEmpty()
  @IsString()
  numeroCodigoBarras: string;

  @ApiProperty({ description: 'Data do pagamento no formato ddmmaaaa', example: '13112025' })
  @IsNotEmpty()
  @IsString()
  dataPagamento: string;

  @ApiProperty({ description: 'Valor do pagamento total do boleto', example: '64.14' })
  @IsNotEmpty()
  @IsString()
  valorPagamento: string;

  @ApiProperty({ description: 'Descrição do pagamento', example: 'Pagamento de boleto' })
  @IsNotEmpty()
  @IsString()
  descricaoPagamento: string;

  @ApiPropertyOptional({ description: 'Código do seu documento' })
  @IsOptional()
  @IsString()
  codigoSeuDocumento?: string;

  @ApiPropertyOptional({ description: 'Código do nosso documento' })
  @IsOptional()
  @IsString()
  codigoNossoDocumento?: string;

  @ApiProperty({ description: 'Valor original do boleto', example: '64.14' })
  @IsNotEmpty()
  @IsString()
  valorNominal: string;

  @ApiPropertyOptional({ description: 'Valor do desconto', example: '0.00' })
  @IsOptional()
  @IsString()
  valorDesconto?: string;

  @ApiPropertyOptional({ description: 'Valor de mora/multa', example: '0.00' })
  @IsOptional()
  @IsString()
  valorMoraMulta?: string;

  @ApiPropertyOptional({ description: 'Código do tipo de pagador: 1=CPF, 2=CNPJ', example: 1 })
  @IsOptional()
  @IsInt()
  codigoTipoPagador?: number;

  @ApiPropertyOptional({ description: 'Documento do pagador' })
  @IsOptional()
  @IsString()
  documentoPagador?: string;

  @ApiProperty({ description: 'Código do tipo de beneficiário: 1=CPF, 2=CNPJ', example: 1 })
  @IsNotEmpty()
  @IsInt()
  codigoTipoBeneficiario: number;

  @ApiProperty({ description: 'Documento do beneficiário (CPF ou CNPJ)', example: '12345678900' })
  @IsNotEmpty()
  @IsString()
  documentoBeneficiario: string;

  @ApiPropertyOptional({ description: 'Código do tipo de avalista: 1=CPF, 2=CNPJ' })
  @IsOptional()
  @IsInt()
  codigoTipoAvalista?: number;

  @ApiPropertyOptional({ description: 'Documento do avalista' })
  @IsOptional()
  @IsString()
  documentoAvalista?: string;
}

/**
 * DTO para solicitar pagamento de boleto
 */
export class SolicitarPagamentoBoletoDto {
  @ApiProperty({ description: 'ID da conta corrente para realizar o pagamento (usado para buscar credenciais)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  contaCorrenteId: number;

  @ApiPropertyOptional({ description: 'Número da requisição (gerado automaticamente se não informado)', example: 1234567 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999999)
  numeroRequisicao?: number;

  @ApiPropertyOptional({ description: 'Código do contrato (Convênio PGT) - ignorado, contrato vem da conta corrente', example: 731030 })
  @IsOptional()
  @IsInt()
  codigoContrato?: number;

  @ApiProperty({ description: 'Número da agência de débito', example: '1607' })
  @IsNotEmpty()
  @IsString()
  numeroAgenciaDebito: string;

  @ApiProperty({ description: 'Número da conta corrente de débito', example: '99738672' })
  @IsNotEmpty()
  @IsString()
  numeroContaCorrenteDebito: string;

  @ApiProperty({ description: 'Dígito verificador da conta corrente de débito', example: 'X' })
  @IsNotEmpty()
  @IsString()
  digitoVerificadorContaCorrenteDebito: string;

  @ApiProperty({ description: 'Lista de lançamentos de boletos (máximo 150 registros)', type: [LancamentoBoletoDto] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(150, { message: 'Lista de lançamentos não pode ter mais de 150 registros' })
  @ValidateNested({ each: true })
  @Type(() => LancamentoBoletoDto)
  lancamentos: LancamentoBoletoDto[];
}

/**
 * DTO para lançamento de pagamento de guia com código de barras
 */
export class LancamentoGuiaDto {
  @ApiProperty({ description: 'Código de barras da guia', example: '83630000000641400052836100812355200812351310' })
  @IsNotEmpty()
  @IsString()
  codigoBarras: string;

  @ApiProperty({ description: 'Data do pagamento no formato ddmmaaaa', example: '13112025' })
  @IsNotEmpty()
  @IsString()
  dataPagamento: string;

  @ApiProperty({ description: 'Valor do pagamento em reais', example: '64.14' })
  @IsNotEmpty()
  @IsString()
  valorPagamento: string;

  @ApiPropertyOptional({ description: 'Número do documento de débito' })
  @IsOptional()
  @IsString()
  numeroDocumentoDebito?: string;

  @ApiProperty({ description: 'Descrição do pagamento', example: 'Pagamento de guia' })
  @IsNotEmpty()
  @IsString()
  descricaoPagamento: string;

  @ApiPropertyOptional({ description: 'Código do seu documento (até 20 caracteres)' })
  @IsOptional()
  @IsString()
  codigoSeuDocumento?: string;
}

/**
 * DTO para solicitar pagamento de guia com código de barras
 */
export class SolicitarPagamentoGuiaDto {
  @ApiProperty({ description: 'ID da conta corrente para realizar o pagamento (usado para buscar credenciais)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  contaCorrenteId: number;

  @ApiPropertyOptional({ description: 'Número da requisição (gerado automaticamente se não informado)', example: 1234567 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999999)
  numeroRequisicao?: number;

  @ApiPropertyOptional({ description: 'Código do contrato (Convênio PGT) - ignorado, contrato vem da conta corrente', example: 731030 })
  @IsOptional()
  @IsInt()
  codigoContrato?: number;

  @ApiProperty({ description: 'Número da agência de débito', example: '1607' })
  @IsNotEmpty()
  @IsString()
  numeroAgenciaDebito: string;

  @ApiProperty({ description: 'Número da conta corrente de débito', example: '99738672' })
  @IsNotEmpty()
  @IsString()
  numeroContaCorrenteDebito: string;

  @ApiProperty({ description: 'Dígito verificador da conta corrente de débito', example: 'X' })
  @IsNotEmpty()
  @IsString()
  digitoVerificadorContaCorrenteDebito: string;

  @ApiProperty({ description: 'Lista de lançamentos de guias (máximo 200 registros)', type: [LancamentoGuiaDto] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(200, { message: 'Lista de lançamentos não pode ter mais de 200 registros' })
  @ValidateNested({ each: true })
  @Type(() => LancamentoGuiaDto)
  lancamentos: LancamentoGuiaDto[];
}

/**
 * DTO para consultar status de solicitação
 */
export class ConsultarStatusSolicitacaoDto {
  @ApiProperty({ description: 'Número da requisição', example: 1234567 })
  @IsNotEmpty()
  @IsInt()
  numeroRequisicao: number;
}

/**
 * DTOs de resposta (tipos genéricos - serão tipados conforme resposta da API)
 */
export class RespostaTransferenciaPixDto {
  @ApiPropertyOptional()
  numeroRequisicao?: number;

  @ApiPropertyOptional()
  estadoRequisicao?: number;

  @ApiPropertyOptional()
  quantidadeTransferencias?: number;

  @ApiPropertyOptional()
  valorTransferencias?: number;

  @ApiPropertyOptional()
  quantidadeTransferenciasValidas?: number;

  @ApiPropertyOptional()
  valorTransferenciasValidas?: number;

  @ApiPropertyOptional()
  listaTransferencias?: any[];
}

export class RespostaPagamentoBoletoDto {
  @ApiPropertyOptional()
  numeroRequisicao?: number;

  @ApiPropertyOptional()
  estadoRequisicao?: number;

  @ApiPropertyOptional()
  quantidadeLancamentos?: number;

  @ApiPropertyOptional()
  valorLancamentos?: number;

  @ApiPropertyOptional()
  quantidadeLancamentosValidos?: number;

  @ApiPropertyOptional()
  valorLancamentosValidos?: number;

  @ApiPropertyOptional()
  lancamentos?: any[];
}

export class RespostaPagamentoGuiaDto {
  @ApiPropertyOptional()
  numeroRequisicao?: number;

  @ApiPropertyOptional()
  codigoEstado?: number;

  @ApiPropertyOptional()
  estadoRequisicao?: number;

  @ApiPropertyOptional()
  quantidadeLancamentos?: number;

  @ApiPropertyOptional()
  valorLancamentos?: number;

  @ApiPropertyOptional()
  quantidadeLancamentosValidos?: number;

  @ApiPropertyOptional()
  valorLancamentosValidos?: number;

  @ApiPropertyOptional()
  quantidadePagamentos?: number;

  @ApiPropertyOptional()
  valorPagamentos?: number;

  @ApiPropertyOptional()
  quantidadePagamentosValidos?: number;

  @ApiPropertyOptional()
  valorPagamentosValidos?: number;

  @ApiPropertyOptional()
  lancamentos?: any[];

  @ApiPropertyOptional()
  pagamentos?: any[];
}

/**
 * DTO para liberação de pagamentos (liberar-pagamentos)
 */
export class LiberarPagamentosDto {
  @ApiProperty({
    description: 'Número da requisição (lote) a ser liberado',
    example: 123456,
  })
  @IsNotEmpty()
  @IsInt()
  numeroRequisicao: number;

  @ApiProperty({
    description: 'Indicador de float: N=obedece prazos de float; S=dispensa prazos (cobra tarifa se aplicável)',
    example: 'N',
  })
  @IsNotEmpty()
  @IsString()
  indicadorFloat: 'S' | 'N';
}

/**
 * DTO para cancelamento de pagamentos (cancelar-pagamentos)
 */
export class CancelarPagamentosDto {
  @ApiProperty({
    description: 'ID da conta corrente a ser usada para cancelamento (para buscar contrato e credenciais)',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Lista de códigos de pagamento a serem cancelados',
    type: [String],
    example: ['97310301234560001'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  listaCodigosPagamento: string[];
}

