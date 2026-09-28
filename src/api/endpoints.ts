import type {
  ApiResult,
  EndpointConfig,
  FlowStepDef,
  RequestValues,
} from './types';
import { API_KEY, CHICKEN_TYPES } from './types';

// ─────────────────────────────────────────────────────────────
// ★ API 명세서 설정 파일
// API(엔드포인트·필드)가 수정되면 이 파일의 설정만 고치면 됩니다.
// 요청 폼, 데이터 흐름 progress, 전송 클라이언트는 설정을 읽어 자동으로 따라갑니다.
// ─────────────────────────────────────────────────────────────

function errorMessage(result: ApiResult | null): string {
  if (!result || typeof result.body !== 'object' || result.body === null) return '';
  const body = result.body as { message?: unknown };
  if (Array.isArray(body.message)) {
    return body.message.join(' / ');
  }
  return typeof body.message === 'string' ? body.message : '';
}

function chickenCount(result: ApiResult | null): number | null {
  if (!result || typeof result.body !== 'object' || result.body === null) return null;
  const chickens = (result.body as { chickens?: unknown }).chickens;
  return Array.isArray(chickens) ? chickens.length : null;
}

function statusLine(result: ApiResult | null): string {
  if (!result) return '';
  if (result.ok) return `→ HTTP ${result.status} 성공`;
  const byStatus: Record<number, string> = {
    400: 'ValidationPipe가 주문서를 거절했습니다',
    403: 'Guard가 출입을 거절했습니다',
    404: '장부에 그런 가게가 없습니다',
    409: '같은 상호가 이미 등록되어 있습니다',
  };
  const reason = byStatus[result.status] ?? '요청 처리에 실패했습니다';
  return `→ HTTP ${result.status} 실패 — ${reason}: ${errorMessage(result)}`;
}

function serviceDetail(id: string, values: RequestValues): string {
  const chickenId = values.id ?? '';
  switch (id) {
    case 'find-all':
      return 'findAll() 호출\n→ 장부에서 전체 치킨집 목록을 읽어옵니다';
    case 'find-one':
      return `findById(${chickenId}) 호출\n→ 숫자로 변환된 id로 가게를 찾습니다`;
    case 'create':
      return 'create(dto) 호출\n→ 중복 확인 후 새 가게를 목록에 push 합니다';
    case 'update':
      return `update(${chickenId}, dto) 호출\n→ { ...기존 가게, ...수정 내용 }으로 일부 필드만 갱신합니다`;
    case 'delete':
      return `delete(${chickenId}) 호출\n→ splice(index, 1)로 가게를 목록에서 제거합니다`;
    default:
      return '컨트롤러에서 확인이 끝나 주방장(Service)을 부르지 않습니다\n→ 요청이 그 앞에서 막혔습니다';
  }
}

function fileDetail(id: string, result: ApiResult | null): string {
  const count = chickenCount(result);
  const lines: (string | null)[] = ['readData() → chickens.json 파일 읽기'];

  switch (id) {
    case 'find-all':
      lines.push(
        count !== null ? `→ 장부에 ${count}개 가게가 저장되어 있습니다` : null,
        statusLine(result),
      );
      break;
    case 'find-one':
      lines.push(
        result === null
          ? null
          : result.ok
            ? '→ 일치하는 가게를 장부에서 찾았습니다'
            : '→ 그런 가게가 장부에 없습니다 (NotFoundException)',
        statusLine(result),
      );
      break;
    case 'create':
      lines.push('writeData() → 새 가게 정보를 장부에 저장', statusLine(result));
      break;
    case 'update':
      lines.push('writeData() → 수정된 내용을 장부에 다시 저장', statusLine(result));
      break;
    case 'delete':
      lines.push('writeData() → 삭제 후 남은 목록을 장부에 저장', statusLine(result));
      break;
    default:
      lines.push(statusLine(result));
  }

  return lines.filter(Boolean).join('\n');
}

// ── 이번 주에 추가된 두 직원 ─────────────────────────────────
// Guard: 카운터에 오기 전 "이 사람이 직원인가"를 확인
// Pipe : 카운터에서 주방으로 넘기기 전 "주문서가 양식에 맞는지"를 확인

// ParseIntPipe가 URL의 id를 검사하는(= /chicken/:id) 엔드포인트입니다.
const ID_ENDPOINTS: ReadonlySet<string> = new Set([
  'find-one',
  'update',
  'delete',
  'error-bad-id',
  'error-not-found',
]);

// 요청이 어느 직원 앞에서 막히는지를 알려 줍니다. (끝까지 통과하면 null)
function stoppedAt(id: string): 'guard' | 'pipe' | null {
  if (id === 'error-no-key') return 'guard';
  if (id === 'error-bad-body' || id === 'error-bad-id') return 'pipe';
  return null;
}

function guardStep(): FlowStepDef {
  return {
    id: 'guard',
    icon: '🛡️',
    title: '출입 검사 직원 (Guard)',
    hint: '요청을 허용할지 거부할지 결정',
    describe: (_values, request) => {
      const apiKey = request.headers['x-api-key'];
      const lines = [
        `x-api-key: ${apiKey ?? '(헤더 없음)'}`,
        '→ ApiKeyGuard.canActivate()가 헤더를 확인합니다',
      ];
      lines.push(
        apiKey === API_KEY
          ? "→ 'chicken-admin-key'와 일치합니다. 통과!"
          : '→ 값이 없거나 다릅니다. 여기서 요청이 끝났습니다 (403)',
      );
      return lines.join('\n');
    },
  };
}

function pipeStep(endpointId: string): FlowStepDef {
  return {
    id: 'pipe',
    icon: '📋',
    title: '주문서 검사 직원 (Pipe)',
    hint: '요청 데이터를 변환하고 검증',
    describe: (values, request) => {
      if (endpointId === 'error-no-key') {
        return [
          '요청이 Guard에서 이미 끝났기 때문에 Pipe까지 오지 않았습니다',
          '→ 주문서 검사도, 컨트롤러도 실행되지 않은 상태입니다',
        ].join('\n');
      }

      if (ID_ENDPOINTS.has(endpointId)) {
        return [
          `URL의 id 값: "${values.id ?? ''}"`,
          '→ ParseIntPipe가 숫자로 변환해 줍니다',
          Number.isInteger(Number(values.id))
            ? '→ 숫자 변환 성공. 컨트롤러에 전달합니다'
            : '→ 숫자로 바꿀 수 없습니다. 여기서 끝났습니다 (400)',
        ].join('\n');
      }

      if (request.body === null) {
        return 'Body 없음 — Pipe가 검사할 주문서가 없습니다\n→ 경로 파라미터만 확인하면 됩니다';
      }

      const body = request.body as Record<string, unknown>;
      const lines = Object.keys(body).map((field) => `✓ ${field} — DTO 규칙 확인`);
      lines.push('→ ValidationPipe + class-validator가 DTO의 규칙을 검사합니다');
      lines.push(
        '   (whitelist: DTO에 없는 필드는 잘라냅니다)',
        '   (name: 비어있지 않은 문자열, type: FRIED/SEASONED/SOY/GARLIC/HONEY, price: 0 이상의 정수)',
      );
      return lines.join('\n');
    },
  };
}

// ApiKeyGuard가 붙어 있는(= x-api-key 헤더를 보내야 하는) 엔드포인트입니다.
const GUARDED_ENDPOINTS: ReadonlySet<EndpointConfig['id']> = new Set([
  'create',
  'update',
  'delete',
  'error-bad-body',
  'error-no-key',
]);

function flowSteps(id: EndpointConfig['id']): FlowStepDef[] {
  const hasKey = GUARDED_ENDPOINTS.has(id);

  return [
    {
      id: 'client',
      icon: '🙋',
      title: '손님 (Client)',
      hint: 'HTTP 요청을 보냅니다',
      describe: (_values, request) => {
        const lines = [`METHOD   ${request.method}`, `URL      ${request.url}`];
        for (const [key, value] of Object.entries(request.headers)) {
          lines.push(`HEADER   ${key}: ${value}`);
        }
        if (request.body !== null) {
          lines.push(`BODY     ${JSON.stringify(request.body)}`);
        }
        return lines.join('\n');
      },
    },
    ...(hasKey ? [guardStep()] : []),
    pipeStep(id),
    {
      id: 'controller',
      icon: '🛎️',
      title: '카운터 (Controller)',
      hint: '요청 접수 및 라우팅',
      describe: () => {
        const stop = stoppedAt(id);
        if (stop === 'guard') {
          return '→ Guard에서 403으로 막혔기 때문에 카운터까지 오지 않았습니다';
        }
        if (stop === 'pipe') {
          return '→ Pipe에서 400으로 막혔기 때문에 카운터까지 오지 않았습니다';
        }
        return "@Controller('chicken')가 요청을 접수합니다\n카운터는 직접 닭을 튀기지 않고, 주방장(Service)에게 처리를 넘깁니다";
      },
    },
    {
      id: 'service',
      icon: '👨‍🍳',
      title: '주방장 (Service)',
      hint: '비즈니스 로직 처리',
      describe: (values) => serviceDetail(id, values),
    },
    {
      id: 'file',
      icon: '📒',
      title: '재고 장부 (chickens.json)',
      hint: '장부 읽기 및 쓰기',
      describe: (_values, _request, result) => {
        if (stoppedAt(id)) {
          return '→ 요청이 앞에서 막혔기 때문에 장부를 읽지도 쓰지도 않았습니다';
        }
        return fileDetail(id, result);
      },
    },
    {
      id: 'response',
      icon: '🍗',
      title: '완성된 응답 (HTTP Response)',
      hint: '처리 결과를 손님에게 전달합니다',
      describe: (_values, _request, result) => {
        if (result === null) return '서버 응답을 기다리는 중...';
        return [
          result.ok
            ? `HTTP ${result.status} — 주문 처리 완료!`
            : `HTTP ${result.status} — 주문 처리 실패`,
          result.mode === 'live'
            ? '→ 실제 NestJS 서버에서 온 응답입니다'
            : '→ 백엔드가 꺼져 있어 목 데이터로 재현한 응답입니다',
        ].join('\n');
      },
    },
  ];
}

// Guard가 막는 API에는 헤더 입력칸을 노출합니다.
// defaultValue를 빈 문자열로 주면 처음부터 "키가 없는 요청"을 보내 403을 재현합니다.
function apiKeyHeader(hint: string, defaultValue: string = API_KEY): EndpointConfig['headerFields'] {
  return [
    {
      key: 'x-api-key',
      label: 'x-api-key',
      type: 'text',
      placeholder: 'chicken-admin-key',
      defaultValue,
      hint,
    },
  ];
}

const idPathParam = (defaultValue: string) => [
  {
    key: 'id',
    label: '가게 번호 (id)',
    type: 'number' as const,
    required: true,
    placeholder: '1',
    defaultValue,
    hint: '숫자가 아니면 ParseIntPipe가 400으로 거절합니다',
  },
];

// ── API 명세서 ──────────────────────────────────────────────

export const endpoints: EndpointConfig[] = [
  {
    id: 'find-all',
    method: 'GET',
    label: '메뉴판 보기',
    pathTemplate: '/chicken',
    description: '모든 치킨집 메뉴판을 한 번에 봅니다. Guard 없이 바로 카운터로 전달됩니다.',
    flowSteps: flowSteps('find-all'),
  },
  {
    id: 'find-one',
    method: 'GET',
    label: '가게 찾기',
    pathTemplate: '/chicken/:id',
    pathParams: idPathParam('1'),
    description: 'id로 특정 치킨집을 찾습니다. 숫자가 아닌 id는 400, 없는 id는 404가 돌아옵니다.',
    flowSteps: flowSteps('find-one'),
  },
  {
    id: 'create',
    method: 'POST',
    label: '가게 등록',
    pathTemplate: '/chicken',
    headerFields: apiKeyHeader('Guard가 이 값을 확인합니다. 지우면 403이 됩니다'),
    bodyFields: [
      {
        key: 'name',
        label: '상호명',
        type: 'text',
        required: true,
        placeholder: 'BBQ 비타민점',
        defaultValue: 'BBQ 비타민점',
        hint: '비어 있으면 400',
      },
      {
        key: 'type',
        label: '치킨 종류 (Enum)',
        type: 'select',
        required: true,
        options: [...CHICKEN_TYPES],
        defaultValue: 'HONEY',
        hint: '목록에 없는 값은 400',
      },
      {
        key: 'price',
        label: '가격 (원)',
        type: 'number',
        required: true,
        defaultValue: '22000',
        hint: '0 이상의 정수여야 합니다',
      },
      {
        key: 'address',
        label: '주소',
        type: 'text',
        required: true,
        defaultValue: '수원시 영통구 매탄로 42',
      },
      {
        key: 'phone',
        label: '전화번호',
        type: 'text',
        required: true,
        defaultValue: '031-290-0004',
      },
    ],
    description:
      'Guard를 통과하고(403) 주문서가 양식에 맞아야(400) 등록됩니다. 이미 있는 가게면 409입니다.',
    flowSteps: flowSteps('create'),
  },
  {
    id: 'update',
    method: 'PATCH',
    label: '가게 수정',
    pathTemplate: '/chicken/:id',
    pathParams: idPathParam('1'),
    headerFields: apiKeyHeader('Guard가 이 값을 확인합니다. 지우면 403이 됩니다'),
    bodyFields: [
      {
        key: 'type',
        label: '치킨 종류 (Enum)',
        type: 'select',
        options: [...CHICKEN_TYPES],
        defaultValue: 'GARLIC',
      },
      {
        key: 'price',
        label: '가격 (원)',
        type: 'number',
        defaultValue: '19000',
        hint: '보내지 않은 필드는 그대로 유지됩니다',
      },
    ],
    description: '바꿀 값만 담아 보냅니다. @IsOptional 덕분에 없는 필드는 그대로 둡니다.',
    flowSteps: flowSteps('update'),
  },
  {
    id: 'delete',
    method: 'DELETE',
    label: '가게 삭제',
    pathTemplate: '/chicken/:id',
    pathParams: idPathParam('1'),
    headerFields: apiKeyHeader('Guard가 이 값을 확인합니다. 지우면 403이 됩니다'),
    description: '폐업한 치킨집을 장부에서 삭제합니다. Body는 없지만 Guard는 지나야 합니다.',
    flowSteps: flowSteps('delete'),
  },
  {
    id: 'error-bad-body',
    method: 'POST',
    label: '❌ 잘못된 Body',
    pathTemplate: '/chicken',
    headerFields: apiKeyHeader('Guard는 통과시키고, 주문서 검사에서 막습니다'),
    bodyFields: [
      { key: 'name', label: '상호명 (빈 값)', type: 'text', defaultValue: '' },
      { key: 'type', label: '치킨 종류 (없는 메뉴)', type: 'text', defaultValue: 'SPICY' },
      { key: 'price', label: '가격 (문자열)', type: 'text', defaultValue: 'expensive' },
      { key: 'address', label: '주소 (숫자)', type: 'text', defaultValue: '123' },
      { key: 'phone', label: '전화번호 (빈 값)', type: 'text', defaultValue: '' },
    ],
    description: 'Guard는 통과하지만 ValidationPipe가 주문서를 400으로 거절합니다.',
    flowSteps: flowSteps('error-bad-body'),
  },
  {
    id: 'error-bad-id',
    method: 'GET',
    label: '❌ 숫자 아닌 id',
    pathTemplate: '/chicken/:id',
    pathParams: [
      {
        key: 'id',
        label: '가게 번호 (id)',
        type: 'text',
        required: true,
        defaultValue: 'chicken',
        hint: '문자를 넣으면 ParseIntPipe가 400으로 거절합니다',
      },
    ],
    description: 'ParseIntPipe가 숫자로 바꿀 수 없으면 컨트롤러에 도달하기 전에 400으로 막습니다.',
    flowSteps: flowSteps('error-bad-id'),
  },
  {
    id: 'error-not-found',
    method: 'GET',
    label: '❌ 없는 id',
    pathTemplate: '/chicken/:id',
    pathParams: idPathParam('999'),
    description: 'Pipe는 숫자라는 것까지만 확인합니다. 없는 데이터는 서비스가 404로 알려줍니다.',
    flowSteps: flowSteps('error-not-found'),
  },
  {
    id: 'error-no-key',
    method: 'DELETE',
    label: '❌ 키 없이 삭제',
    pathTemplate: '/chicken/:id',
    pathParams: idPathParam('1'),
    headerFields: apiKeyHeader('이 값을 비워서 보내보세요', ''),
    description: '헤더를 비우면 Guard가 여기서 403으로 막습니다. 컨트롤러와 서비스에 닿지 않습니다.',
    flowSteps: flowSteps('error-no-key'),
  },
];
