import { ConfigService } from './config.service';
import { CreateConfigDadosEmpresaDto, UpdateConfigDadosEmpresaDto, ConfigDadosEmpresaResponseDto } from './dto/config-dados-empresa.dto';
export declare class ConfigController {
    private configService;
    constructor(configService: ConfigService);
    findDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto | null>;
    saveDadosEmpresa(createConfigDadosEmpresaDto: CreateConfigDadosEmpresaDto): Promise<ConfigDadosEmpresaResponseDto>;
    updateDadosEmpresa(id: number, updateConfigDadosEmpresaDto: UpdateConfigDadosEmpresaDto): Promise<ConfigDadosEmpresaResponseDto>;
    deleteDadosEmpresa(id: number): Promise<{
        message: string;
    }>;
    findAllDadosEmpresa(): Promise<ConfigDadosEmpresaResponseDto[]>;
    findDadosEmpresaById(id: number): Promise<ConfigDadosEmpresaResponseDto>;
}
