import type { ApiResult, EndpointConfig, RequestInfo, RequestValues } from './types';
import { mockResponse } from './mocks';

// API 주소가 바뀌면 .env의 VITE_API_BASE_URL만 수정하면 됩니다. (기본값: http://localhost:3000)
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const DEMO_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 엔드포인트 설정(endpoints.ts)과 폼 입력값으로 실제 요청(URL·method·body)을 만듭니다.
export function buildRequest(endpoint: EndpointConfig, values: RequestValues): RequestInfo {
  let path = endpoint.pathTemplate;
  for (const param of endpoint.pathParams ?? []) {
    path = path.replace(`:${param.key}`, encodeURIComponent((values[param.key] ?? '').trim()));
  }

  let body: unknown = null;
  if (endpoint.method !== 'GET' && (endpoint.bodyFields?.length ?? 0) > 0) {
    const entries: Record<string, unknown> = {};
    for (const field of endpoint.bodyFields ?? []) {
      const raw = (values[field.key] ?? '').trim();
      if (raw === '') continue;
      entries[field.key] = field.type === 'number' ? Number(raw) : raw;
    }
    if (Object.keys(entries).length > 0) {
      body = entries;
    }
  }

  return { method: endpoint.method, url: `${BASE_URL}${path}`, body };
}

// 요청을 실제로 보내고, 네트워크 실패(서버 꺼짐 등) 시 데모 모드(목 데이터)로 폴백합니다.
export async function sendRequest(
  endpoint: EndpointConfig,
  values: RequestValues,
): Promise<ApiResult> {
  const request = buildRequest(endpoint, values);
  const startedAt = performance.now();

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.body !== null ? { 'Content-Type': 'application/json' } : undefined,
      body: request.body !== null ? JSON.stringify(request.body) : undefined,
    });
    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return {
      status: response.status,
      ok: response.ok,
      body: parsed,
      durationMs: Math.round(performance.now() - startedAt),
      mode: 'live',
      method: request.method,
      url: request.url,
      requestBody: request.body,
    };
  } catch {
    await sleep(DEMO_DELAY_MS);
    return {
      ...mockResponse(request),
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}
