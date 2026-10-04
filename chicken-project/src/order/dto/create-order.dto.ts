import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * 개별 주문 항목 DTO.
 */
export class OrderItemDto {
  /** 주문할 치킨 ID */
  @IsInt()
  @Min(1)
  chickenId: number;

  /** 주문 수량 (1마리 이상) */
  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * 치킨 주문 생성 DTO (트랜잭션 실습용).
 */
export class CreateOrderDto {
  /** 주문 손님 ID */
  @IsString()
  @IsNotEmpty()
  customerId: string;

  /** 주문할 치킨 목록 (최소 1개 이상) */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
