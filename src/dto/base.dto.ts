import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BasePaginationDto {
  @ApiProperty({
    type: String,
    description: 'page number',
  })
  @IsString()
  pageNumber: string;

  @ApiProperty({
    type: String,
    description: 'pageSize',
  })
  @IsString()
  pageSize: string;
}
