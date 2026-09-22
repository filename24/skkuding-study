import ConceptSection from './ConceptSection';
import ComparisonTable from './ComparisonTable';
import { conceptGroups, frameworkComparison } from '../../data/concepts';

// 좌측 패널: 노션 스터디 내용을 일반인 눈높이로 풀어낸 교육 화면
export default function EducationPanel() {
  return (
    <div className="education-panel">
      <header className="panel-header">
        <h2>📚 스터디 개념 정리</h2>
        <p>치킨집 구성원으로 읽으면 NestJS 구조가 한눈에 보입니다.</p>
      </header>

      {conceptGroups.map((group) => (
        <ConceptSection key={group.id} group={group} />
      ))}

      <ComparisonTable rows={frameworkComparison} />

      <div className="education-panel__setup">
        <h3>직접 따라하기</h3>
        <p>
          백엔드 코드는 <code>day-2-nestjs</code> 브랜치에 있습니다. 서버를 켜면 오른쪽에서 실제
          응답을 받아볼 수 있어요.
        </p>
        <pre>{`git checkout day-2-nestjs
cd chicken-project
pnpm install
pnpm run start:dev`}</pre>
      </div>
    </div>
  );
}
