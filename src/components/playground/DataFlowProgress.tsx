import type { StepState } from '../../hooks/useApiRequest';

interface DataFlowProgressProps {
  steps: StepState[];
}

// 요청 데이터가 흘러가는 과정(손님→카운터→주문서→주방장→장부→응답)을
// 단계별로 보여주는 progress
export default function DataFlowProgress({ steps }: DataFlowProgressProps) {
  if (steps.length === 0) {
    return (
      <div className="flow-progress flow-progress--empty">
        <p>
          요청을 보내면 <strong>손님 → 카운터 → 주문서 → 주방장 → 장부 → 응답</strong> 순서로
          <br />
          데이터가 어떻게 이동하는지 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <ol className="flow-progress">
      {steps.map((step, index) => (
        <li key={step.id} className={`flow-progress__step is-${step.status}`}>
          <div className="flow-progress__marker">
            <span className="flow-progress__icon" aria-hidden="true">
              {step.icon}
            </span>
            {index < steps.length - 1 && <span className="flow-progress__line" />}
          </div>
          <div className="flow-progress__content">
            <div className="flow-progress__head">
              <strong>{step.title}</strong>
              <span className="flow-progress__status">
                {step.status === 'done' ? '완료' : step.status === 'active' ? '처리 중...' : '대기'}
              </span>
            </div>
            <p className="flow-progress__hint">{step.hint}</p>
            {step.data && <pre className="flow-progress__data">{step.data}</pre>}
          </div>
        </li>
      ))}
    </ol>
  );
}
