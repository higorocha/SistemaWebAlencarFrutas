import { ConvenioCobrancaService } from './convenio-cobranca.service';
import { ConvenioCobrancaDto, ConvenioCobrancaResponseDto } from '../config/dto/convenio-cobranca.dto';
export declare class ConvenioCobrancaController {
    private readonly convenioCobrancaService;
    constructor(convenioCobrancaService: ConvenioCobrancaService);
    findConvenio(): Promise<ConvenioCobrancaResponseDto | null>;
    upsertConvenio(convenioDto: ConvenioCobrancaDto): Promise<ConvenioCobrancaResponseDto>;
    deleteConvenio(): Promise<{
        message: string;
    }>;
    existeConvenio(): Promise<{
        exists: boolean;
    }>;
}
