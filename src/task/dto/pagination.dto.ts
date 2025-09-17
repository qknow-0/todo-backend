import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Min(10)
  limit?: number = 10;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(data: T[], meta: Omit<PaginatedResponse<T>['meta'], 'hasNext' | 'hasPrev'>) {
    this.data = data;
    this.meta = {
      ...meta,
      hasNext: meta.page < meta.totalPages,
      hasPrev: meta.page > 1,
    };
  }
}