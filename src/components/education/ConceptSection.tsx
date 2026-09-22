import ConceptCard from './ConceptCard';
import type { ConceptGroup } from '../../data/concepts';

interface ConceptSectionProps {
  group: ConceptGroup;
}

export default function ConceptSection({ group }: ConceptSectionProps) {
  return (
    <section className="concept-section">
      <h3 className="concept-section__heading">{group.heading}</h3>
      <div className="concept-section__list">
        {group.concepts.map((concept) => (
          <ConceptCard key={concept.id} concept={concept} />
        ))}
      </div>
    </section>
  );
}
