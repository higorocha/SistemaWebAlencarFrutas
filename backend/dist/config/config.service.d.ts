import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigDadosEmpresaDto, UpdateConfigDadosEmpresaDto, ConfigDadosEmpresaResponseDto } from './dto/config-dados-empresa.dto';
export declare class ConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    findDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto | null>;
    saveDadosEmpresa(createConfigDadosEmpresaDto: CreateConfigDadosEmpresaDto): Promise<ConfigDadosEmpresaResponseDto>;
    updateDadosEmpresa(id: number, updateConfigDadosEmpresaDto: UpdateConfigDadosEmpresaDto): Promise<ConfigDadosEmpresaResponseDto>;
    deleteDadosEmpresa(id: number): Promise<{
        message: string;
    }>;
    findAllDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto[]>;
    findDadosEmpresaById(id: number): Promise<ConfigDadosEmpresaResponseDto>;
}
