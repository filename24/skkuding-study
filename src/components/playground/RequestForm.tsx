import { useEffect, useState } from 'react';
import type { EndpointConfig, FieldDef, RequestValues } from '../../api/types';

interface RequestFormProps {
  endpoint: EndpointConfig;
  running: boolean;
  onSubmit: (values: RequestValues) => void;
}

function initialValues(endpoint: EndpointConfig): RequestValues {
  const values: RequestValues = {};
  for (const field of [...(endpoint.pathParams ?? []), ...(endpoint.bodyFields ?? [])]) {
    if (field.defaultValue !== undefined) {
      values[field.key] = String(field.defaultValue);
    }
  }
  return values;
}

// 엔드포인트 설정(endpoints.ts)을 읽어 요청 폼을 자동으로 그리는 컴포넌트
export default function RequestForm({ endpoint, running, onSubmit }: RequestFormProps) {
  const [values, setValues] = useState<RequestValues>(() => initialValues(endpoint));

  useEffect(() => {
    setValues(initialValues(endpoint));
  }, [endpoint]);

  const update = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  const renderField = (field: FieldDef, isPath: boolean) => (
    <label
      key={`${isPath ? 'path' : 'body'}-${field.key}`}
      className="request-form__field"
    >
      <span className="request-form__label-text">
        {field.label}
        {isPath && <em className="request-form__tag">URL 파라미터</em>}
        {field.required && <em className="request-form__required">필수</em>}
      </span>
      {field.type === 'select' ? (
        <select
          value={values[field.key] ?? ''}
          onChange={(e) => update(field.key, e.target.value)}
          disabled={running}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={values[field.key] ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => update(field.key, e.target.value)}
          disabled={running}
        />
      )}
    </label>
  );

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <p className="request-form__description">{endpoint.description}</p>

      {(endpoint.pathParams?.length ?? 0) > 0 && (
        <div className="request-form__group">
          <h5>경로</h5>
          {endpoint.pathParams!.map((field) => renderField(field, true))}
        </div>
      )}

      {(endpoint.bodyFields?.length ?? 0) > 0 && (
        <div className="request-form__group">
          <h5>요청 본문 (Body)</h5>
          {endpoint.bodyFields!.map((field) => renderField(field, false))}
        </div>
      )}

      <button type="submit" className="request-form__submit" disabled={running}>
        {running ? '전송 중...' : `${endpoint.method} 요청 보내기`}
      </button>
    </form>
  );
}
