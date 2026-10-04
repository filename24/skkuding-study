import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

/**
 * 주문 목록 조회 쿼리 파라미터 DTO.
 */
export class QueryOrderDto {
  /** Offset 페이지 번호 (기본 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** 가져올 개수 (기본 10) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  /** Cursor 기준 주문 ID */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  /** 관계 로딩 전략 ('join' | 'query') */
  @IsOptional()
  @IsIn(['join', 'query'])
  strategy?: 'join' | 'query' = 'join';
}
