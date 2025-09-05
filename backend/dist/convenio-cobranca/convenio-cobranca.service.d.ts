import { PrismaService } from '../prisma/prisma.service';
import { ConvenioCobrancaDto, ConvenioCobrancaResponseDto } from '../config/dto/convenio-cobranca.dto';
export declare class ConvenioCobrancaService {
    private prisma;
    constructor(prisma: PrismaService);
    findConvenio(): Promise<ConvenioCobrancaResponseDto | null>;
    upsertConvenio(convenioDto: ConvenioCobrancaDto): Promise<ConvenioCobrancaResponseDto>;
    deleteConvenio(): Promise<{
        message: string;
    }>;
    private validateMultaFields;
    private validateContaCorrente;
    existeConvenio(): Promise<boolean>;
}
