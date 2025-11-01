import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateDatasetDto {
  @ApiProperty({
    description: 'Unique identifier for the dataset',
    example: 'dataset_001',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  dataset_id: string;

  @ApiProperty({
    description: 'Human-readable name of the dataset',
    example: 'Training Documents',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  dataset_name: string;
}

