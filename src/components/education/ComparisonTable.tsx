import type { FrameworkRow } from '../../data/concepts';

interface ComparisonTableProps {
  rows: FrameworkRow[];
}

export default function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <section className="comparison">
      <h3 className="concept-section__heading">왜 Express 대신 NestJS인가요?</h3>
      <div className="comparison__cards">
        {rows.map((row) => (
          <article
            key={row.id}
            className={`comparison__card${row.id === 'nestjs' ? ' comparison__card--pick' : ''}`}
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
