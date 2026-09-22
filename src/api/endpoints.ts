import type {
  ApiResult,
  EndpointConfig,
  FlowStepDef,
  RequestValues,
} from './types';
import { CHICKEN_TYPES } from './types';

// ─────────────────────────────────────────────────────────────
// ★ API 명세서 설정 파일
// API(엔드포인트·필드)가 수정되면 이 파일의 설정만 고치면 됩니다.
// 요청 폼, 데이터 흐름 progress, 전송 클라이언트는 설정을 읽어 자동으로 따라갑니다.
// ─────────────────────────────────────────────────────────────

function errorMessage(result: ApiResult | null): string {
  if (!result || typeof result.body !== 'object' || result.body === null) return '';
  const message = (result.body as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

function chickenCount(result: ApiResult | null): number | null {
  if (!result || typeof result.body !== 'object' || result.body === null) return null;
  const chickens = (result.body as { chickens?: unknown }).chickens;
  return Array.isArray(chickens) ? chickens.length : null;
}

function statusLine(result: ApiResult | null): string {
  if (!result) return '';
  return result.ok
    ? `→ HTTP ${result.status} 성공`
    : `→ HTTP ${result.status} 실패 — ${errorMessage(result) || '요청 처리에 실패했습니다'}`;
}

function serviceDetail(id: string, values: RequestValues): string {
  const name = values.name ?? '';
  switch (id) {
    case 'find-all':
      return 'findAll() 호출\n→ 장부에서 전체 치킨집 목록을 읽어옵니다';
    case 'find-by-name':
      return `findByName('${name}') 호출\n→ 상호명이 일치하는 가게를 찾습니다`;
    case 'create':
      return 'create(dto) 호출\n→ 중복 검사 후 새 가게를 목록에 push 합니다';
    case 'update':
      return `update('${name}', dto) 호출\n→ { ...기존 가게, ...수정 내용 }으로 일부 필드만 갱신합니다`;
    case 'delete':
      return `delete('${name}') 호출\n→ splice(index, 1)로 가게를 목록에서 제거합니다`;
    default:
      return '비즈니스 로직을 처리합니다';
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
    case 'find-by-name':
      lines.push(
        result === null
          ? null
          : result.ok
            ? '→ 일치하는 가게를 장부에서 찾았습니다'
            : '→ 일치하는 가게가 장부에 없습니다',
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

function flowSteps(id: EndpointConfig['id']): FlowStepDef[] {
  return [
    {
      id: 'client',
      icon: '🙋',
      title: '손님 (Client)',
      hint: 'HTTP 요청을 보냅니다',
      describe: (_values, request) => {
        const lines = [`METHOD   ${request.method}`, `URL      ${request.url}`];
        if (request.body !== null) {
          lines.push(`BODY     ${JSON.stringify(request.body)}`);
        }
        return lines.join('\n');
      },
    },
    {
      id: 'controller',
      icon: '🛎️',
      title: '카운터 (Controller)',
      hint: '요청 접수 및 라우팅',
      describe: (_values, request) =>
        `@Controller('chicken')가 ${request.method} 요청을 접수합니다\n카운터는 직접 닭을 튀기지 않고, 주방장(Service)에게 처리를 넘깁니다`,
    },
    {
      id: 'dto',
      icon: '📋',
      title: '주문서 (DTO)',
      hint: '주문서 양식 확인',
      describe: (_values, request) => {
        if (request.body === null) {
          return 'Body 없음 — 주문서 없이 간단한 조회 요청입니다';
        }
        const fields = Object.keys(request.body as Record<string, unknown>);
        return [
          ...fields.map((field) => `✓ ${field} — 양식과 일치하는지 확인`),
          '→ 검증된 데이터만 주방장(Service)에게 전달됩니다',
        ].join('\n');
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
      describe: (_values, _request, result) => fileDetail(id, result),
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

// ── API 명세서 (Notion의 치킨집 API 명세표) ──────────────────

export const endpoints: EndpointConfig[] = [
  {
    id: 'find-all',
    method: 'GET',
    label: '메뉴판 보기',
    pathTemplate: '/chicken',
    description: '모든 치킨집 메뉴판을 한 번에 봅니다. 전체 목록 배열을 반환합니다.',
    flowSteps: flowSteps('find-all'),
  },
  {
    id: 'find-by-name',
    method: 'GET',
    label: '가게 찾기',
    pathTemplate: '/chicken/:name',
    pathParams: [
      {
        key: 'name',
        label: '상호명',
        type: 'text',
        required: true,
        placeholder: '성대통닭 율전본점',
        defaultValue: '성대통닭 율전본점',
      },
    ],
    description: '상호명으로 특정 치킨집을 찾습니다. 없는 가게면 404가 돌아옵니다.',
    flowSteps: flowSteps('find-by-name'),
  },
  {
    id: 'create',
    method: 'POST',
    label: '가게 등록',
    pathTemplate: '/chicken',
    bodyFields: [
      {
        key: 'name',
        label: '상호명',
        type: 'text',
        required: true,
        placeholder: 'BBQ 비타민점',
        defaultValue: 'BBQ 비타민점',
      },
      {
        key: 'type',
        label: '치킨 종류 (Enum)',
        type: 'select',
        required: true,
        options: [...CHICKEN_TYPES],
        defaultValue: 'HONEY',
      },
      { key: 'price', label: '가격 (원)', type: 'number', required: true, defaultValue: '22000' },
      { key: 'address', label: '주소', type: 'text', required: true, defaultValue: '수원시 영통구 매탄로 42' },
      { key: 'phone', label: '전화번호', type: 'text', required: true, defaultValue: '031-290-0004' },
    ],
    description:
      '새로운 치킨집을 등록합니다. 이미 등록된 가게면 409(Conflict)가 돌아옵니다.',
    flowSteps: flowSteps('create'),
  },
  {
    id: 'update',
    method: 'PATCH',
    label: '가게 수정',
    pathTemplate: '/chicken/:name',
    pathParams: [
      { key: 'name', label: '상호명', type: 'text', required: true, defaultValue: '성대통닭 율전본점' },
    ],
    bodyFields: [
      {
        key: 'type',
        label: '치킨 종류 (Enum)',
        type: 'select',
        options: [...CHICKEN_TYPES],
        defaultValue: 'GARLIC',
      },
      { key: 'price', label: '가격 (원)', type: 'number', defaultValue: '19000' },
    ],
    description:
      '기존 치킨집의 정보(가격/종류 등)를 일부만 수정합니다. PATCH는 필요한 필드만 골라 보낼 수 있어요.',
    flowSteps: flowSteps('update'),
  },
  {
    id: 'delete',
    method: 'DELETE',
    label: '가게 삭제',
    pathTemplate: '/chicken/:name',
    pathParams: [
      { key: 'name', label: '상호명', type: 'text', required: true, defaultValue: '성대통닭 율전본점' },
    ],
    description: '폐업한 치킨집을 장부에서 삭제합니다.',
    flowSteps: flowSteps('delete'),
  },
];
