import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OperationType } from '../operation.entity';

export class CreateOperationDto {
  @ApiProperty({ enum: OperationType })
  @IsEnum(OperationType)
  type: OperationType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
