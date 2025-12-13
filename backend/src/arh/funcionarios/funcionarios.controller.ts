import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FuncionariosService } from './funcionarios.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { ListFuncionarioQueryDto } from './dto/list-funcionario-query.dto';
import { UpdateFuncionarioStatusDto } from './dto/update-funcionario-status.dto';
import { StatusFuncionario, TipoContratoFuncionario } from '@prisma/client';

@ApiTags('ARH - Funcionários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/arh/funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tipoContrato') tipoContrato?: string,
    @Query('cargoId') cargoId?: string,
    @Query('funcaoId') funcaoId?: string,
  ) {
    // Converter status e tipoContrato para enums se fornecidos
    const statusEnum = status && Object.values(StatusFuncionario).includes(status as StatusFuncionario)
      ? (status as StatusFuncionario)
      : undefined;
    
    const tipoContratoEnum = tipoContrato && Object.values(TipoContratoFuncionario).includes(tipoContrato as TipoContratoFuncionario)
      ? (tipoContrato as TipoContratoFuncionario)
      : undefined;

    return this.service.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status: statusEnum,
      tipoContrato: tipoContratoEnum,
      cargoId: cargoId ? Number(cargoId) : undefined,
      funcaoId: funcaoId ? Number(funcaoId) : undefined,
    });
  }

  @Get('resumo')
  listResumo() {
    return this.service.listResumo();
  }

  @Get('gerentes')
  listGerentes() {
    return this.service.listGerentes();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFuncionarioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuncionarioDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuncionarioStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}

