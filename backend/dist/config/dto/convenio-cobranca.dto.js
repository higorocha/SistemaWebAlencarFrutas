"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvenioCobrancaResponseDto = exports.ConvenioCobrancaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ConvenioCobrancaDto {
    contaCorrenteId;
    juros;
    diasAberto;
    multaAtiva;
    layoutBoletoFundoBranco;
    valorMulta;
    carenciaMulta;
    convenio;
    carteira;
    variacao;
}
exports.ConvenioCobrancaDto = ConvenioCobrancaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta corrente associada',
        example: 1,
    }),
    (0, class_validator_1.IsInt)({ message: 'ID da conta corrente deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ConvenioCobrancaDto.prototype, "contaCorrenteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Percentual de juros ao mês',
        example: 2.5,
        minimum: 0,
        maximum: 100,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Juros deve ser um número válido' }),
    (0, class_validator_1.Min)(0, { message: 'Juros não pode ser negativo' }),
    (0, class_validator_1.Max)(100, { message: 'Juros não pode ser superior a 100%' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ConvenioCobrancaDto.prototype, "juros", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade de dias em aberto',
        example: 30,
        minimum: 1,
        maximum: 365,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Dias em aberto deve ser um número válido' }),
    (0, class_validator_1.Min)(1, { message: 'Dias em aberto deve ser pelo menos 1' }),
    (0, class_validator_1.Max)(365, { message: 'Dias em aberto não pode ser superior a 365' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ConvenioCobrancaDto.prototype, "diasAberto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se a multa está ativa',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'Multa ativa deve ser verdadeiro ou falso' }),
    __metadata("design:type", Boolean)
], ConvenioCobrancaDto.prototype, "multaAtiva", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se o layout do boleto tem fundo branco',
        example: false,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'Layout boleto fundo branco deve ser verdadeiro ou falso' }),
    __metadata("design:type", Boolean)
], ConvenioCobrancaDto.prototype, "layoutBoletoFundoBranco", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor da multa em percentual (obrigatório se multa ativa)',
        example: 5.0,
        required: false,
        minimum: 0,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor da multa deve ser um número válido' }),
    (0, class_validator_1.Min)(0, { message: 'Valor da multa não pode ser negativo' }),
    (0, class_validator_1.Max)(100, { message: 'Valor da multa não pode ser superior a 100%' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Object)
], ConvenioCobrancaDto.prototype, "valorMulta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Carência da multa em dias (obrigatório se multa ativa)',
        example: 7,
        required: false,
        minimum: 0,
        maximum: 30,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Carência da multa deve ser um número válido' }),
    (0, class_validator_1.Min)(0, { message: 'Carência da multa não pode ser negativa' }),
    (0, class_validator_1.Max)(30, { message: 'Carência da multa não pode ser superior a 30 dias' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Object)
], ConvenioCobrancaDto.prototype, "carenciaMulta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número do convênio bancário',
        example: 'CONV123456',
    }),
    (0, class_validator_1.IsString)({ message: 'Convênio deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Convênio é obrigatório' }),
    __metadata("design:type", String)
], ConvenioCobrancaDto.prototype, "convenio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Carteira bancária',
        example: '18',
    }),
    (0, class_validator_1.IsString)({ message: 'Carteira deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Carteira é obrigatória' }),
    __metadata("design:type", String)
], ConvenioCobrancaDto.prototype, "carteira", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Variação da carteira',
        example: '027',
    }),
    (0, class_validator_1.IsString)({ message: 'Variação deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Variação é obrigatória' }),
    __metadata("design:type", String)
], ConvenioCobrancaDto.prototype, "variacao", void 0);
class ConvenioCobrancaResponseDto extends ConvenioCobrancaDto {
    id;
    createdAt;
    updatedAt;
}
exports.ConvenioCobrancaResponseDto = ConvenioCobrancaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único do convênio',
        example: 1,
    }),
    __metadata("design:type", Number)
], ConvenioCobrancaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConvenioCobrancaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConvenioCobrancaResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=convenio-cobranca.dto.js.map