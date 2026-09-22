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
          {result.requestBody !== null ? `\n\n${pretty(result.requestBody)}` : ''}
        </pre>
      </div>

      <div className="response-viewer__section">
        <h5>응답 (Response)</h5>
        <pre>{pretty(result.body)}</pre>
      </div>
    </div>
  );
}
