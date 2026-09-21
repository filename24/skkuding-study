// 치킨 메뉴 종류를 정해진 옵션으로 고정하는 열거형(Enum)
export enum ChickenType {
  FRIED = 'FRIED', // 후라이드 치킨
  SEASONED = 'SEASONED', // 양념 치킨
  SOY = 'SOY', // 간장 치킨
  GARLIC = 'GARLIC', // 마늘 치킨
  HONEY = 'HONEY', // 허니 치킨
}

// 신규 치킨집 등록 시 필요한 정보 양식 (주문서 양식 = DTO)
export class CreateChickenDto {
  name: string;
  type: ChickenType;
  price: number;
  address: string;
  phone: string;
}

// 치킨집 정보 수정 시 필요한 정보 양식 (선택적으로 일부 필드만 수정 가능하도록 ? 기호 사용)
export class UpdateChickenDto {
  type?: ChickenType;
  price?: number;
  address?: string;
  phone?: string;
}
