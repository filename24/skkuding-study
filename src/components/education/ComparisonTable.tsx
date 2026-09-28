import type { FrameworkRow } from '../../data/concepts';

interface ComparisonTableProps {
  title: string;
  rows: FrameworkRow[];
  /** 이 id를 가진 카드에 강조 스타일을 입힙니다. */
  highlightId?: string;
}

/**
 * 두 개(또는 그 이상)의 선택지를 나란히 비교하는 카드 목록.
 * Express vs NestJS, Unit Test vs E2E Test처럼 용도마다 새로 만들어 쓰고 있습니다.
 */
export default function ComparisonTable({ title, rows, highlightId }: ComparisonTableProps) {
  return (
    <section className="comparison">
      <h3 className="concept-section__heading">{title}</h3>
      <div className="comparison__cards">
        {rows.map((row) => (
          <article
            key={row.id}
            className={`comparison__card${row.id === highlightId ? ' comparison__card--pick' : ''}`}
          >
            <h4>
              {row.analogy} <code className="comparison__name">{row.name}</code>
            </h4>
            <p>{row.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
