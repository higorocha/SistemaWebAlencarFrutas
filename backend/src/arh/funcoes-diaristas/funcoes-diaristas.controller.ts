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
import { FuncoesDiaristasService } from './funcoes-diaristas.service';
import { CreateFuncaoDiaristaDto } from './dto/create-funcao-diarista.dto';
import { UpdateFuncaoDiaristaDto } from './dto/update-funcao-diarista.dto';
import { ListFuncaoQueryDto } from './dto/list-funcao-query.dto';
import { UpdateFuncaoStatusDto } from './dto/update-funcao-status.dto';

@ApiTags('ARH - Funções')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/arh/funcoes')
export class FuncoesDiaristasController {
  constructor(private readonly service: FuncoesDiaristasService) {}

  @Get()
  list(@Query() query: ListFuncaoQueryDto) {
    return this.service.list(query);
  }

  @Get('ativas')
  listActive() {
    return this.service.listActive();
  }

  @Post()
  create(@Body() dto: CreateFuncaoDiaristaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuncaoDiaristaDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/ativo')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuncaoStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}

