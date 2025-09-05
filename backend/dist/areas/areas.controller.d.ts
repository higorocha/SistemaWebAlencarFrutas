import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
export declare class AreasController {
    private readonly areasService;
    constructor(areasService: AreasService);
    create(createAreaDto: CreateAreaDto): Promise<AreaResponseDto>;
    findAll(): Promise<AreaResponseDto[]>;
    findOne(id: string): Promise<AreaResponseDto>;
    update(id: string, updateAreaDto: UpdateAreaDto): Promise<AreaResponseDto>;
    remove(id: string): Promise<void>;
}
