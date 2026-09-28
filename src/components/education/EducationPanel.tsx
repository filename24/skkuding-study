import ConceptSection from './ConceptSection';
import ComparisonTable from './ComparisonTable';
import StatusGuide from './StatusGuide';
import { conceptGroups, frameworkComparison, testComparison } from '../../data/concepts';

// 좌측 패널: 노션 스터디 내용을 일반인 눈높이로 풀어낸 교육 화면
export default function EducationPanel() {
  return (
    <div className="education-panel">
      <header className="panel-header">
        <h2>📚 스터디 개념 정리</h2>
        <p>치킨집 구성원으로 읽으면 Guard·Pipe·테스트까지 한눈에 보입니다.</p>
      </header>

      {conceptGroups.map((group) => (
        <ConceptSection key={group.id} group={group} />
      ))}

      <ComparisonTable
        title="왜 Express 대신 NestJS인가요?"
        rows={frameworkComparison}
        highlightId="nestjs"
      />

      <ComparisonTable title="테스트는 왜 두 종류로 나눌까요?" rows={testComparison} />

      <StatusGuide />

      <div className="education-panel__setup">
        <h3>직접 따라하기</h3>
        <p>
          백엔드 코드는 <code>day-3-nestjs</code> 브랜치에 있습니다. 서버를 켜면 오른쪽에서 실제
          응답을 받아볼 수 있어요.
        </p>
        <pre>{`git checkout day-3-nestjs
cd chicken-project
pnpm install
pnpm run start:dev`}</pre>
        <p>
          변경·삭제 요청에는 <code>x-api-key: chicken-admin-key</code> 헤더가 필요합니다. 값이 없으면
          Guard가 403으로 막고, 주문서(id·DTO 규칙)가 틀리면 Pipe가 400으로 막습니다.
        </p>
        <pre>{`# 전체 테스트 (Unit + E2E)
pnpm test
pnpm run test:e2e`}</pre>
      </div>
    </div>
  );
}
