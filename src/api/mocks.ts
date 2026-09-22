import type { ApiResult, RequestInfo } from './types';

interface MockChicken {
  name: string;
  type: string;
  price: number;
  address: string;
  phone: string;
}

// 백엔드 서버가 꺼져 있을 때 사용하는 가상의 재고 장부 (브라우저 세션 동안 유지)
let mockStore: MockChicken[] = [
  {
    name: '성대통닭 율전본점',
    type: 'FRIED',
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
  },
  {
    name: '황금올리브 율전역점',
    type: 'SEASONED',
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
  },
  {
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

function nameOf(request: RequestInfo): string | null {
  const segments = pathOf(request)
    .split('/')
    .filter(Boolean);
  return segments.length > 1 ? segments.slice(1).join('/') : null;
}

function notFound(request: RequestInfo) {
  return baseResult(request, 404, false, {
    message: '해당 치킨집 정보가 존재하지 않습니다.',
    error: 'Not Found',
    statusCode: 404,
  });
}

// 실제 서버와 같은 규칙(404/409 포함)으로 목 응답을 만듭니다.
export function mockResponse(request: RequestInfo): ApiResult {
  const path = pathOf(request);
  const name = nameOf(request);

  if (request.method === 'GET' && path === '/chicken') {
    return baseResult(request, 200, true, { chickens: mockStore });
  }

  if (request.method === 'GET' && path.startsWith('/chicken/')) {
    const found = mockStore.find((item) => item.name === name);
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
      name: dto.name ?? '',
      type: dto.type ?? 'FRIED',
      price: dto.price ?? 0,
      address: dto.address ?? '',
      phone: dto.phone ?? '',
    };
    mockStore = [...mockStore, created];
    return baseResult(request, 201, true, created);
  }

  if (request.method === 'PATCH' && path.startsWith('/chicken/')) {
    const index = mockStore.findIndex((item) => item.name === name);
    if (index === -1) {
      return notFound(request);
    }
    const dto = (request.body ?? {}) as Partial<MockChicken>;
    const updated: MockChicken = { ...mockStore[index], ...dto };
    mockStore = mockStore.map((item, i) => (i === index ? updated : item));
    return baseResult(request, 200, true, updated);
  }

  if (request.method === 'DELETE' && path.startsWith('/chicken/')) {
    const index = mockStore.findIndex((item) => item.name === name);
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
