import { PartialType } from '@nestjs/swagger';
import { CreateTurmaColheitaDto } from './create-turma-colheita.dto';

export class UpdateTurmaColheitaDto extends PartialType(CreateTurmaColheitaDto) {}