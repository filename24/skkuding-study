import type { EndpointConfig } from '../../api/types';

interface MethodTabsProps {
  endpoints: EndpointConfig[];
  activeId: string;
  onSelect: (id: string) => void;
}

// 엔드포인트 설정(endpoints.ts)을 읽어 HTTP 메서드 탭을 그리는 컴포넌트
export default function MethodTabs({ endpoints, activeId, onSelect }: MethodTabsProps) {
  return (
    <div className="method-tabs" role="tablist" aria-label="API 엔드포인트 선택">
      {endpoints.map((endpoint) => (
        <button
          key={endpoint.id}
          type="button"
          role="tab"
          aria-selected={endpoint.id === activeId}
          className={[
            'method-tabs__tab',
            `method-tabs__${endpoint.method.toLowerCase()}`,
            endpoint.id === activeId ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(endpoint.id)}
        >
          <span className="method-tabs__method">{endpoint.method}</span>
          <span className="method-tabs__label">{endpoint.label}</span>
        </button>
      ))}
    </div>
  );
}
