import type { ApiResult } from '../../api/types';

interface ResponseViewerProps {
  result: ApiResult;
}

function pretty(body: unknown): string {
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

// 각 상태코드가 "어느 직원이 막은 것인지"를 알려 주는 안내 문구
const REJECTION_NOTES: Record<number, string> = {
  400: '💡 Pipe(ValidationPipe / ParseIntPipe)가 주문서를 검사하다가 막았습니다. 컨트롤러와 서비스에 도달하지 않았어요.',
  403: '💡 Guard가 출입을 검사하다가 막았습니다. 주문서와 상관없이 여기서 끝납니다.',
  404: '💡 Pipe는 숫자라는 것까지만 확인했고, 서비스가 "그런 가게 없어요"라고 알려준 것입니다.',
  409: '💡 요청은 올바르지만 같은 상호가 이미 있어서 서비스가 거절했습니다.',
};

function describeRejection(result: ApiResult) {
  const note = REJECTION_NOTES[result.status];
  if (!note) return null;
  return <p className="response-viewer__note">{note}</p>;
}

// 실제 전송된 요청과 서버 응답(상태코드·소요시간)을 보여주는 뷰어
export default function ResponseViewer({ result }: ResponseViewerProps) {
  const statusClass = result.ok
    ? 'is-ok'
    : result.status >= 500
      ? 'is-error'
      : 'is-warn';

  return (
    <div className="response-viewer">
      <div className="response-viewer__meta">
        <span className={`response-viewer__status ${statusClass}`}>{result.status}</span>
        <span className="response-viewer__badge">
          {result.mode === 'live' ? 'LIVE · 실제 서버 응답' : 'DEMO · 목 데이터 응답'}
        </span>
        <span className="response-viewer__duration">{result.durationMs}ms</span>
      </div>

      <div className="response-viewer__section">
        <h5>요청 (Request)</h5>
        <pre>
          {result.method} {result.url}
          {Object.keys(result.requestHeaders).length > 0
            ? `\n\n${Object.entries(result.requestHeaders)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')}`
            : ''}
          {result.requestBody !== null ? `\n\n${pretty(result.requestBody)}` : ''}
        </pre>
      </div>

      <div className="response-viewer__section">
        <h5>응답 (Response)</h5>
        <pre>{pretty(result.body)}</pre>
        {describeRejection(result)}
      </div>
    </div>
  );
}
