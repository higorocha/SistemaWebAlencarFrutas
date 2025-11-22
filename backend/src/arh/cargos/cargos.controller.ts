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
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ListCargoQueryDto } from './dto/list-cargo-query.dto';
import { UpdateCargoStatusDto } from './dto/update-cargo-status.dto';

@ApiTags('ARH - Cargos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/arh/cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Get()
  list(@Query() query: ListCargoQueryDto) {
    return this.cargosService.list(query);
  }

  @Get('ativos')
  listActive() {
    return this.cargosService.listActive();
  }

  @Post()
  create(@Body() dto: CreateCargoDto) {
    return this.cargosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCargoDto) {
    return this.cargosService.update(id, dto);
  }

  @Patch(':id/ativo')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCargoStatusDto,
  ) {
    return this.cargosService.updateStatus(id, dto);
  }
}

