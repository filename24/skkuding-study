import type { Concept } from '../../data/concepts';

interface ConceptCardProps {
  concept: Concept;
}

// 하나의 개념을 치킨집 비유 + 실제 개념으로 설명하는 카드
export default function ConceptCard({ concept }: ConceptCardProps) {
  return (
    <article className="concept-card">
      <header className="concept-card__header">
        <span className="concept-card__icon" aria-hidden="true">
          {concept.icon}
        </span>
        <h4 className="concept-card__title">
          {concept.title}
          <code className="concept-card__subtitle">{concept.subtitle}</code>
        </h4>
      </header>
      <p className="concept-card__analogy">{concept.analogy}</p>
      <p className="concept-card__real">{concept.real}</p>
    </article>
  );
}
