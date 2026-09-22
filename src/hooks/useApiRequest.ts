import { useCallback, useRef, useState } from 'react';
import type { ApiResult, EndpointConfig, RequestValues } from '../api/types';
import { buildRequest, sendRequest } from '../api/client';

export interface StepState {
  id: string;
  title: string;
  icon: string;
  hint: string;
  status: 'pending' | 'active' | 'done';
  data: string;
}

export type RequestMode = 'live' | 'demo' | null;

const STEP_DELAY_MS = 420;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 요청 전송과 데이터 흐름 단계 애니메이션을 관리하는 훅
export function useApiRequest() {
  const [steps, setSteps] = useState<StepState[]>([]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<RequestMode>(null);
  const runIdRef = useRef(0);

  const run = useCallback(async (endpoint: EndpointConfig, values: RequestValues) => {
    const runId = ++runIdRef.current;
    const isCurrent = () => runIdRef.current === runId;
    const request = buildRequest(endpoint, values);
    const stepDefs = endpoint.flowSteps;

    const markStep = (index: number, status: StepState['status'], data: string) => {
      if (!isCurrent()) return;
      setSteps((prev) =>
        prev.map((step, i) => (i === index ? { ...step, status, data } : step)),
      );
    };

    setRunning(true);
    setResult(null);
    setSteps(
      stepDefs.map((def) => ({
        id: def.id,
        title: def.title,
        icon: def.icon,
        hint: def.hint,
        status: 'pending' as const,
        data: '',
      })),
    );

    const requestPromise = sendRequest(endpoint, values);

    // 마지막 '응답' 단계 전까지는 단계별로 순차 진행
    for (let i = 0; i < stepDefs.length - 1; i += 1) {
      markStep(i, 'active', stepDefs[i].describe(values, request, null));
      await sleep(STEP_DELAY_MS);
      if (!isCurrent()) return;
      markStep(i, 'done', stepDefs[i].describe(values, request, null));
    }

    const response = await requestPromise;
    if (!isCurrent()) return;

    const lastIndex = stepDefs.length - 1;
    markStep(lastIndex, 'active', stepDefs[lastIndex].describe(values, request, response));
    setResult(response);
    setMode(response.mode);
    await sleep(STEP_DELAY_MS);
    if (!isCurrent()) return;
    markStep(lastIndex, 'done', stepDefs[lastIndex].describe(values, request, response));
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    setSteps([]);
    setResult(null);
    setRunning(false);
    setMode(null);
  }, []);

  return { steps, result, running, mode, run, reset };
}
