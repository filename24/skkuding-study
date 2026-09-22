export interface Concept {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  analogy: string;
  real: string;
}

export interface ConceptGroup {
  id: string;
  heading: string;
  concepts: Concept[];
}

// 노션 스터디 내용을 일반인 눈높이로 풀어낸 개념 데이터
export const conceptGroups: ConceptGroup[] = [
  {
    id: 'core',
    heading: '치킨집의 주요 구성원',
    concepts: [
      {
        id: 'client',
        icon: '🙋',
        title: '손님',
        subtitle: 'Client · 브라우저 · 모바일 앱',
        analogy:
          '"후라이드 치킨 한 마리 포장해주세요", "메뉴판 좀 보여주세요"라고 주문(HTTP 요청)을 보냅니다.',
        real: '서버에 HTTP 요청을 보내는 모든 외부 사용자입니다.',
      },
      {
        id: 'controller',
        icon: '🛎️',
        title: '카운터 직원',
        subtitle: 'Controller',
        analogy:
          '매장 입구에서 손님을 가장 먼저 맞이하는 직원입니다. 요청(GET: 메뉴 조회, POST: 주문 등록)을 받아 주문서를 확인한 뒤 주방으로 넘깁니다. 카운터 직원은 직접 닭을 튀기지 않습니다.',
        real: '요청 접수·라우팅과 완료된 결과 전달(HTTP 응답)만 담당합니다.',
      },
      {
        id: 'service',
        icon: '👨‍🍳',
        title: '주방장',
        subtitle: 'Service · Provider',
        analogy:
          '카운터에서 넘겨받은 주문서를 바탕으로 실제로 닭을 염지하고 튀기는 핵심 전문가입니다.',
        real: '비즈니스 로직(메뉴 확인, 가격 계산, 재고 수정)을 모두 처리합니다.',
      },
      {
        id: 'module',
        icon: '🏪',
        title: '치킨집 매장 건물',
        subtitle: 'Module',
        analogy:
          '카운터 직원과 주방장이 한 건물 안에서 유기적으로 일할 수 있도록 묶어주는 매장 자체입니다. "우리 매장에는 이 카운터 직원과 저 주방장이 함께 일합니다"라고 등록해둡니다.',
        real: '컨트롤러와 프로바이더를 하나로 묶어 등록하는 역할을 합니다.',
      },
    ],
  },
  {
    id: 'extra',
    heading: '추가 핵심 개념',
    concepts: [
      {
        id: 'enum',
        icon: '📜',
        title: '치킨 공식 메뉴판 옵션',
        subtitle: 'Enum · 열거형',
        analogy:
          '손님이 "노릇노릇한닭", "바삭바삭닭"처럼 제멋대로 부르면 주방장이 어떤 메뉴인지 혼란스러워집니다. 메뉴판에 정해진 공식 메뉴(후라이드, 양념, 간장...)만 선택할 수 있도록 옵션을 엄격하게 제한합니다.',
        real: '오타를 방지하고, 정해진 값 외의 엉뚱한 문자열이 들어오지 못하도록 막아줍니다.',
      },
      {
        id: 'dto',
        icon: '📋',
        title: '치킨 주문서 양식',
        subtitle: 'DTO · Data Transfer Object',
        analogy:
          '손님이 주문을 제멋대로 말하면 주문이 누락되거나 오류가 납니다. 치킨 종류(Enum), 수량, 배달 주소, 전화번호처럼 꼭 필요한 정보의 규격을 미리 정해둔 주문서 종이입니다.',
        real: '계층 간에 전달되는 데이터의 구조를 정의한 클래스입니다.',
      },
      {
        id: 'di',
        icon: '🧑‍💼',
        title: '점장님의 직원 배치',
        subtitle: 'DI · 의존성 주입',
        analogy:
          '카운터 직원이 주방장을 직접 고용해서 데려오는 것이 아닙니다. 치킨집 점장(NestJS 프레임워크)이 알아서 유능한 주방장을 채용해 카운터 직원에게 "너는 이 주방장과 함께 일해라" 하고 주방장 객체를 전달(주입)해 줍니다.',
        real: '프레임워크가 의존 객체를 생성해 주입해 주어 코드가 훨씬 유연해집니다.',
      },
      {
        id: 'json',
        icon: '📒',
        title: '식자재 재고 장부',
        subtitle: 'JSON 파일',
        analogy:
          'DB를 배우기 전까지는, 메뉴 목록과 가게 정보가 적혀 있는 텍스트 장부 파일(chickens.json)을 냉장고 창고 삼아 데이터를 저장하고 읽어옵니다.',
        real: '실무에서는 데이터베이스(DB)로 대체됩니다.',
      },
    ],
  },
];

export interface FrameworkRow {
  id: string;
  name: string;
  analogy: string;
  description: string;
}

export const frameworkComparison: FrameworkRow[] = [
  {
    id: 'express',
    name: 'Express',
    analogy: '🚚 1인 푸드트럭',
    description:
      '규칙이 정해져 있지 않아 자유롭게 빠르게 만들 수 있습니다. 하지만 규모가 커지고 여러 직원이 들어오면 어디에 주방 도구가 있는지 엉망이 되기 쉽습니다.',
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    analogy: '🍗 프랜차이즈 치킨 매장',
    description:
      '카운터(Controller), 주방(Service), 매장(Module)의 역할 분담 규칙이 명확합니다. 다른 사람과 협업할 때 누가 보더라도 쉽게 코드를 이해하고 관리할 수 있습니다.',
  },
];
