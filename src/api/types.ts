export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// 백엔드의 ChickenType 열거형(FRIED, SEASONED, SOY, GARLIC, HONEY)과 동일한 값 목록
export const CHICKEN_TYPES = ['FRIED', 'SEASONED', 'SOY', 'GARLIC', 'HONEY'] as const;

// 백엔드 ApiKeyGuard가 요구하는 실습용 API Key
// (guards/api-key.guard.ts의 API_KEY 상수와 같은 값이어야 변경 요청이 통과합니다)
export const API_KEY = import.meta.env.VITE_API_KEY ?? 'chicken-admin-key';

export type RequestValues = Record<string, string>;

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
}

// 전송 전에 계산된 실제 요청 정보
export interface RequestInfo {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface ApiResult {
  status: number;
  ok: boolean;
  body: unknown;
  durationMs: number;
  mode: 'live' | 'demo';
  method: HttpMethod;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
}

// 단계별 표시 데이터를 만드는 함수 (values: 폼 입력, request: 실제 요청, result: 서버 응답)
export type FlowStepDescribe = (
  values: RequestValues,
  request: RequestInfo,
  result: ApiResult | null,
) => string;

export interface FlowStepDef {
  id: string;
  icon: string;
  title: string;
  hint: string;
  describe: FlowStepDescribe;
}

export interface EndpointConfig {
  id: string;
  method: HttpMethod;
  label: string;
  pathTemplate: string;
  pathParams?: FieldDef[];
  bodyFields?: FieldDef[];
  headerFields?: FieldDef[];
  description: string;
  flowSteps: FlowStepDef[];
}
