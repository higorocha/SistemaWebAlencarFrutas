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

@ApiTags('ARH - Funcionários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/arh/funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Get()
  list(@Query() query: ListFuncionarioQueryDto) {
    return this.service.list(query);
  }

  @Get('resumo')
  listResumo() {
    return this.service.listResumo();
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

