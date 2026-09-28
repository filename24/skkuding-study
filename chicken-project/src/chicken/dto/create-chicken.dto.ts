import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * 치킨 메뉴 종류를 정해진 옵션으로 고정하는 열거형(Enum).
 *
 * 메뉴판에 없는 메뉴를 손님이 주문하면 주방장이 곤란하듯,
 * 이 목록에 없는 값은 `@IsEnum` 검증에서 걸러집니다.
 */
export enum ChickenType {
  FRIED = 'FRIED', // 후라이드 치킨
  SEASONED = 'SEASONED', // 양념 치킨
  SOY = 'SOY', // 간장 치킨
  GARLIC = 'GARLIC', // 마늘 치킨
  HONEY = 'HONEY', // 허니 치킨
}

/**
 * 신규 치킨집 등록용 주문서 양식.
 *
 * 필드에 붙은 class-validator 데코레이터가 "이 주문서가 양식에 맞게 작성되었는지 검사할 규칙"입니다.
 * {@link setupApp}에서 등록한 전역 `ValidationPipe`가 요청마다 이 규칙을 실행합니다.
 */
export class CreateChickenDto {
  /** 상호명. 비어 있거나 숫자 같은 값이 들어오면 400으로 거절됩니다. */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** 치킨 종류. 메뉴판에 있는 값(FRIED, SEASONED, ...)만 허용합니다. */
  @IsEnum(ChickenType)
  type: ChickenType;

  /** 가격(원). 0원 이상의 정수만 허용합니다. */
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
}

/**
 * 치킨집 정보 수정용 주문서 양식.
 *
 * `@IsOptional()`은 "값이 아예 없으면 통과시키는" 규칙입니다.
 * 덕분에 가격만 바꾸고 싶을 때 address/phone을 억지로 넣지 않아도 됩니다.
 * 대상 가게는 id로 지정하므로 `name`은 수정할 수 없습니다.
 */
export class UpdateChickenDto {
  /** 바꿀 치킨 종류. */
  @IsOptional()
  @IsEnum(ChickenType)
  type?: ChickenType;

  /** 바꿀 가격(원). */
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  /** 바꿀 주소. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  /** 바꿀 전화번호. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}
