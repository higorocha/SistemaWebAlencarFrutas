import { PartialType } from '@nestjs/mapped-types';
import { CreateControleBananaDto } from './create-controle-banana.dto';

export class UpdateControleBananaDto extends PartialType(CreateControleBananaDto) {}