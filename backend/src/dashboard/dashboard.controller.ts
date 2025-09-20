// src/dashboard/dashboard.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados consolidados da dashboard geral' })
  @ApiResponse({
    status: 200,
    description: 'Dados da dashboard retornados com sucesso',
    type: DashboardResponseDto,
  })
  async getDashboardData(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardData();
  }
}