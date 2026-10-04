import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChickenType } from '@prisma/client';

export { ChickenType };

/**
 * 신규 치킨집 등록용 주문서 양식.
 */
export class CreateChickenDto {
  /** 상호명. 중복될 수 없습니다. */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 치킨 종류. */
  @IsEnum(ChickenType)
  type: ChickenType;

  /** 가격(원). 0원 이상 */
  @IsInt()
  @Min(0)
  price: number;

  /** 주소. */
  @IsString()
  @IsNotEmpty()
  address: string;

  /** 전화번호. */
  @IsString()
  @IsNotEmpty()
  phone: string;

  /** 초기 재고 수량 (기본값: 10) */
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  /** 매운맛 단계 (마이그레이션 실습 필드, 기본값: 0) */
  @IsOptional()
  @IsInt()
  @Min(0)
  spicyLevel?: number;
}

/**
 * 치킨집 정보 수정용 주문서 양식.
 */
export class UpdateChickenDto {
  @IsOptional()
  @IsEnum(ChickenType)
  type?: ChickenType;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  spicyLevel?: number;
}

/**
 * 대량 치킨집 등록용 DTO (Prisma createMany 실습용).
 */
export class BatchCreateChickenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChickenDto)
  chickens: CreateChickenDto[];
}

/**
 * 원자적 재고 변경용 DTO (Atomic Update 실습용).
 */
export class UpdateStockDto {
  @IsInt()
  quantity: number;
}

/**
 * 낙관적 동시성 제어(OCC)를 사용한 치킨 정보 수정 DTO.
 */
export class OccUpdateChickenDto extends UpdateChickenDto {
  /** 내가 읽었던 당시의 버전 번호 (필수) */
  @IsInt()
  @Min(0)
  version: number;
}

/**
 * 치킨 목록 조회 쿼리 파라미터 DTO (페이지네이션 및 프로젝션 실습용).
 */
export class QueryChickenDto {
  /** Offset 페이지 번호 (1부터 시작) */
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

  /** Cursor 기준 ID (이 ID 다음부터 조회) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  /** 프로젝션 모드 ('all' | 'select' | 'omit') */
  @IsOptional()
  @IsString()
  projection?: 'all' | 'select' | 'omit' = 'all';
}
