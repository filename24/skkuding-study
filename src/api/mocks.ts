import type { ApiResult, RequestInfo } from './types';
import { API_KEY, CHICKEN_TYPES } from './types';

interface MockChicken {
  id: number;
  name: string;
  type: string;
  price: number;
  address: string;
  phone: string;
}

// 백엔드 서버가 꺼져 있을 때 사용하는 가상의 재고 장부 (브라우저 세션 동안 유지)
let mockStore: MockChicken[] = [
  {
    id: 1,
    name: '성대통닭 율전본점',
    type: 'FRIED',
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
  },
  {
    id: 2,
    name: '황금올리브 율전역점',
    type: 'SEASONED',
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
  },
  {
    id: 3,
    name: '바른양념치킨 율전점',
    type: 'SOY',
    price: 19000,
    address: '경기 수원시 장안구 화산로233번길 15',
    phone: '031-290-0003',
  },
];

function baseResult(request: RequestInfo, status: number, ok: boolean, body: unknown): ApiResult {
  return {
    status,
    ok,
    body,
    durationMs: 0,
    mode: 'demo',
    method: request.method,
    url: request.url,
    requestHeaders: request.headers,
    requestBody: request.body,
  };
}

function pathOf(request: RequestInfo): string {
  try {
    return decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return request.url;
  }
}

function lastSegment(request: RequestInfo): string | null {
  const segments = pathOf(request)
    .split('/')
    .filter(Boolean);
  return segments.length > 1 ? (segments[segments.length - 1] ?? null) : null;
}

function notFound(request: RequestInfo) {
  return baseResult(request, 404, false, {
    message: '해당 치킨집 정보가 존재하지 않습니다.',
    error: 'Not Found',
    statusCode: 404,
  });
}

function forbidden(request: RequestInfo) {
  return baseResult(request, 403, false, {
    message: 'Forbidden resource',
    error: 'Forbidden',
    statusCode: 403,
  });
}

// ValidationPipe가 실제로 돌려주는 메시지 형태를 흉내 냅니다.
function badRequest(request: RequestInfo, messages: string[]) {
  return baseResult(request, 400, false, {
    message: messages,
    error: 'Bad Request',
    statusCode: 400,
  });
}

// 백엔드의 CreateChickenDto에 적힌 class-validator 규칙을 그대로 옮겨 놓은 검사기입니다.
function validateCreateBody(body: unknown): string[] {
  const dto = (body ?? {}) as Record<string, unknown>;
  const messages: string[] = [];

  if (typeof dto.name !== 'string' || dto.name.length === 0) {
    messages.push('name should not be empty');
  }
  if (typeof dto.type !== 'string' || !CHICKEN_TYPES.includes(dto.type as never)) {
    messages.push(`type must be one of the following values: ${CHICKEN_TYPES.join(', ')}`);
  }
  if (typeof dto.price !== 'number' || !Number.isInteger(dto.price) || dto.price < 0) {
    messages.push('price must be an integer number', 'price must not be less than 0');
  }
  if (typeof dto.address !== 'string' || dto.address.length === 0) {
    messages.push('address must be a string');
  }
  if (typeof dto.phone !== 'string' || dto.phone.length === 0) {
    messages.push('phone must be a string');
  }

  return messages;
}

function validateUpdateBody(body: unknown): string[] {
  const dto = (body ?? {}) as Record<string, unknown>;
  const messages: string[] = [];

  if ('type' in dto && (typeof dto.type !== 'string' || !CHICKEN_TYPES.includes(dto.type as never))) {
    messages.push(`type must be one of the following values: ${CHICKEN_TYPES.join(', ')}`);
  }
  if ('price' in dto && (typeof dto.price !== 'number' || !Number.isInteger(dto.price) || dto.price < 0)) {
    messages.push('price must be an integer number', 'price must not be less than 0');
  }

  return messages;
}

function nextId(): number {
  return mockStore.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// Guard(403) → Pipe(400) → 컨트롤러/서비스(404, 409) 순서로 실제 서버와 같은 규칙을 적용합니다.
export function mockResponse(request: RequestInfo): ApiResult {
  const path = pathOf(request);
  const rawId = lastSegment(request);
  const isItem = path.startsWith('/chicken/');
  const isWrite = request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE';

  // 1. Guard: 데이터를 바꾸는 요청은 x-api-key를 먼저 확인합니다.
  if (isWrite && request.headers['x-api-key'] !== API_KEY) {
    return forbidden(request);
  }

  // 2. ParseIntPipe: URL의 id는 숫자로 바꿀 수 있어야 합니다.
  if (isItem) {
    const id = Number(rawId);
    if (rawId === null || rawId === '' || !Number.isInteger(id)) {
      return badRequest(request, ['Validation failed (parsint is expected)']);
    }
  }

  // 3. ValidationPipe: Body가 DTO 규칙을 만족해야 합니다.
  if (request.method === 'POST' && path === '/chicken') {
    const messages = validateCreateBody(request.body);
    if (messages.length > 0) {
      return badRequest(request, messages);
    }
  }
  if (request.method === 'PATCH' && isItem) {
    const messages = validateUpdateBody(request.body);
    if (messages.length > 0) {
      return badRequest(request, messages);
    }
  }

  if (request.method === 'GET' && path === '/chicken') {
    return baseResult(request, 200, true, { chickens: mockStore });
  }

  if (request.method === 'GET' && isItem) {
    const found = mockStore.find((item) => item.id === Number(rawId));
    return found ? baseResult(request, 200, true, found) : notFound(request);
  }

  if (request.method === 'POST' && path === '/chicken') {
    const dto = (request.body ?? {}) as Partial<MockChicken>;
    if (mockStore.some((item) => item.name === dto.name)) {
      return baseResult(request, 409, false, {
        message: '이미 해당 치킨집 정보가 존재합니다.',
        error: 'Conflict',
        statusCode: 409,
      });
    }
    const created: MockChicken = {
      id: nextId(),
      name: dto.name ?? '',
      type: dto.type ?? 'FRIED',
      price: dto.price ?? 0,
      address: dto.address ?? '',
      phone: dto.phone ?? '',
    };
    mockStore = [...mockStore, created];
    return baseResult(request, 201, true, created);
  }

  if (request.method === 'PATCH' && isItem) {
    const index = mockStore.findIndex((item) => item.id === Number(rawId));
    if (index === -1) {
      return notFound(request);
    }
    const dto = (request.body ?? {}) as Partial<MockChicken>;
    const updated: MockChicken = { ...mockStore[index], ...dto };
    mockStore = mockStore.map((item, i) => (i === index ? updated : item));
    return baseResult(request, 200, true, updated);
  }

  if (request.method === 'DELETE' && isItem) {
    const index = mockStore.findIndex((item) => item.id === Number(rawId));
    if (index === -1) {
      return notFound(request);
    }
    const [deleted] = mockStore.splice(index, 1);
    return baseResult(request, 200, true, deleted);
  }

  return baseResult(request, 404, false, {
    message: '일치하는 라우트가 없습니다.',
    statusCode: 404,
  });
}
