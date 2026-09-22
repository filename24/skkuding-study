import { useState } from 'react';
import { useApiRequest } from '../../hooks/useApiRequest';
import MethodTabs from './MethodTabs';
import RequestForm from './RequestForm';
import DataFlowProgress from './DataFlowProgress';
import ResponseViewer from './ResponseViewer';
import type { EndpointConfig, RequestValues } from '../../api/types';

interface PlaygroundPanelProps {
  endpoints: EndpointConfig[];
}

// 우측 패널: 요청 전송 + 데이터 흐름 progress + 응답 확인
export default function PlaygroundPanel({ endpoints }: PlaygroundPanelProps) {
  const [activeId, setActiveId] = useState(endpoints[0]?.id ?? '');
  const endpoint = endpoints.find((item) => item.id === activeId) ?? endpoints[0];
  const { steps, result, running, mode, run } = useApiRequest();

  const handleSubmit = (values: RequestValues) => {
    if (endpoint) {
      void run(endpoint, values);
    }
  };

  return (
    <div className="playground-panel">
      <header className="panel-header">
        <h2>📡 실시간 데이터 흐름</h2>
        <p>HTTP 요청이 치킨집 안에서 어떻게 처리되는지 단계별로 지켜보세요.</p>
      </header>

      {mode === 'demo' && (
        <div className="playground-panel__demo-banner" role="status">
          백엔드 서버가 꺼져 있어 <strong>목 데이터</strong>로 데모 중입니다.{' '}
          <code>day-2-nestjs</code> 브랜치의 서버를 켜면 실제 응답을 볼 수 있어요.
        </div>
      )}

      <MethodTabs endpoints={endpoints} activeId={activeId} onSelect={setActiveId} />
      {endpoint && <RequestForm endpoint={endpoint} running={running} onSubmit={handleSubmit} />}
      <DataFlowProgress steps={steps} />
      {result && <ResponseViewer result={result} />}
    </div>
  );
}
