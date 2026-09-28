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
  {
    id: 'guard-pipe',
    heading: '요청을 걸러 내는 두 직원 · Day 3',
    concepts: [
      {
        id: 'dto-rule',
        icon: '📋',
        title: '주문서 검사표',
        subtitle: 'class-validator · @IsString, @IsEnum, @IsInt',
        analogy:
          '주문서 양식에 "상호명은 비어 있으면 안 된다", "치킨 종류는 FRIED/SEASONED/SOY/GARLIC/HONEY 중 하나", "가격은 0 이상의 정수"라고 검사 항목을 못박아 둡니다. 손님이 어긋난 칸을 채우면 카운터에서 돌려보냅니다.',
        real:
          'DTO 클래스에 붙은 class-validator 데코레이터가 실제 검사 규칙입니다. 전역 ValidationPipe가 요청 본문을 이 규칙으로 검사해 실패하면 400 Bad Request를 돌려줍니다.',
      },
      {
        id: 'guard',
        icon: '🛡️',
        title: '출입 검사 직원',
        subtitle: 'Guard · ApiKeyGuard',
        analogy:
          '직원이 아닌 사람이 가게 문을 두드리면 카운터에도 못 들어오게 막습니다. 등록·수정·삭제처럼 값을 바꾸는 요청에는 "x-api-key: chicken-admin-key" 라는 직원증을 내야 합니다.',
        real:
          'canActivate()가 true를 돌려주면 요청이 통과하고, false를 돌려주면 NestJS가 곧바로 403 Forbidden으로 거절합니다. 컨트롤러·Pipe·서비스 어느 것도 실행되지 않습니다.',
      },
      {
        id: 'parse-int-pipe',
        icon: '🔢',
        title: '가게 번호 확인표',
        subtitle: 'ParseIntPipe · Built-in Pipe',
        analogy:
          'URL의 ":id" 자리에 손님이 적어 온 값을 그대로 주방에 넘기면 안 됩니다. "한강대로3번지"처럼 숫자로 바꿀 수 없는 값은 카운터에서 400으로 돌려보냅니다.',
        real:
          '@Param("id", ParseIntPipe)는 경로 파라미터를 정수로 바꿔 줍니다. 변환할 수 없으면 400 Bad Request가 나고, 성공하면 컨트롤러는 이미 number 타입을 받습니다.',
      },
      {
        id: 'exception',
        icon: '🚨',
        title: '주방장님의 거절 사유',
        subtitle: 'Exception · NotFoundException, ConflictException',
        analogy:
          '주방장이 "그런 가게 없어요"(404), "이미 같은 상호가 있어요"(409)라고 말하면 그때 HTTP 상태코드가 정해집니다. 코드로 throw 하는 것만으로 NestJS가 알아서 응답을 만들어 줍니다.',
        real:
          'Pipe는 형식만 보고, 서비스는 데이터의 존재 여부를 봅니다. 그래서 "숫자지만 없는 id"는 404가 됩니다. ExceptionFilter를 쓰지 않아도 NestJS 기본 예외 레이어가 JSON 응답을 만듭니다.',
      },
      {
        id: 'test',
        icon: '🧪',
        title: '장부 확인 시간',
        subtitle: 'Unit Test · E2E Test',
        analogy:
          '주방장 혼자 재료를 제대로 다루는지 확인하는 게 Unit Test(chicken.service.spec.ts)이고, 주문이 음식이 나올 때까지 전체가 연결되어 돌아가는지 확인하는 게 E2E Test(test/chicken.e2e-spec.ts)입니다. 둘 다 하면 비로소 완성된 치킨이 나옵니다.',
        real:
          'Unit Test는 Service를 직접 호출해 파일 저장까지 검증하고, E2E Test는 supertest로 실제 HTTP 요청을 보내 Guard·Pipe·컨트롤러·서비스를 모두 통과시켜 상태코드를 확인합니다.',
      },
    ],
  },
  {
    id: 'know-only',
    heading: '이름만 알아 두기 (개념만)',
    concepts: [
      {
        id: 'middleware',
        icon: '🧱',
        title: '문 앞 방수판',
        subtitle: 'Middleware',
        analogy:
          'Guard가 "들어오지 못하게" 막는다면, Middleware는 요청·응답이 오가는 동안 로깅이나 CORS 같은 공통 작업을 해 줍니다. 매 요청마다 실행되지만 "허가/거부" 판단은 Guard의 역할입니다.',
        real: 'NestJS의 Middleware는 Express 미들웨어를 감싼 것으로, 앱 전역 또는 모듈 단위로 적용합니다.',
      },
      {
        id: 'interceptor',
        icon: '🕰️',
        title: '응답 포장 기사',
        subtitle: 'Interceptor',
        analogy:
          '주방에서 음식을 내놓은 뒤, 포장을 단단히 해 주고 소요 시간을 붙여 전달합니다. 호출 전후를 모두 감싸는 rxjs 기반의 껍데기입니다.',
        real: 'NestInterceptor의 intercept()에서 Observable을 반환해 응답을 변형하거나 로깅·캐시를 끼울 수 있습니다.',
      },
      {
        id: 'custom-decorator',
        icon: '🏷️',
        title: '직책 이름표',
        subtitle: 'Custom Decorator',
        analogy:
          '"이번 주문은 배달전화 예약이야"라고 컨트롤러 코드 한 줄로 붙이는 스티커입니다. 여러 파라미터에서 같은 코드를 반복하지 않게 해 줍니다.',
        real: 'createParamDecorator로 만들어 컨트롤러 시그니처에 커스텀 파라미터를 주입합니다.',
      },
      {
        id: 'exception-filter',
        icon: '🧯',
        title: '예외 기록지',
        subtitle: 'ExceptionFilter',
        analogy:
          '가게 전체가 문을 닫을 때 쓰는 비상 기록지입니다. NestJS 기본 예외 처리 방식을 통째로 바꿔, 모든 실패를 우리 포맷(JSON 규약)으로 남길 때 씁니다.',
        real: '@Catch()로 예외를 잡아 응답 본문·로그를 직접 정의할 수 있습니다. 이번 스터디에서는 기본 동작만 다룹니다.',
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

/** Unit Test와 E2E Test의 차이를 보여 주는 비교표 데이터 (Day 3) */
export const testComparison: FrameworkRow[] = [
  {
    id: 'unit',
    name: 'Unit Test',
    analogy: '🧪 치킨.service.spec.ts',
    description:
      'ChickenService를 테스트 모듈에 넣어 파일 저장과 예외(404/409)만 좁게 검증합니다. HTTP는 거치지 않아 매우 빠르고, 실패하면 어느 로직이 깨졌는지 바로 알 수 있습니다.',
  },
  {
    id: 'e2e',
    name: 'E2E Test',
    analogy: '🔗 test/chicken.e2e-spec.ts',
    description:
      'supertest로 NestJS 앱에 실제 HTTP 요청을 보냅니다. Guard(403) → Pipe(400) → 서비스(404/409) 순서로 막히는 지점까지 상태코드로 확인합니다. 느리지만 진짜 흐름을 검증합니다.',
  },
];

/** Day 3에서 실제로 만든 상태 코드별 의미 (브라우저에서 재현해 볼 수 있음) */
export const statusGuide: { status: number; who: string; meaning: string }[] = [
  { status: 400, who: 'Pipe', meaning: '주문서(id 숫자 변환, DTO 규칙)가 양식에 안 맞습니다.' },
  { status: 403, who: 'Guard', meaning: 'x-api-key가 없거나 값이 다릅니다. 컨트롤러에 오지 못했습니다.' },
  { status: 404, who: 'Service', meaning: 'Pipe는 통과했지만 장부에 그런 가게가 없습니다.' },
  { status: 409, who: 'Service', meaning: '요청은 올바른데 같은 상호가 이미 등록되어 있습니다.' },
];
