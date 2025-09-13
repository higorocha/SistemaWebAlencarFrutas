import { PartialType } from '@nestjs/mapped-types';
import { CreateFitaBananaDto } from './create-fita-banana.dto';

export class UpdateFitaBananaDto extends PartialType(CreateFitaBananaDto) {}