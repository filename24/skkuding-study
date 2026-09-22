import SplitLayout from './components/layout/SplitLayout';
import EducationPanel from './components/education/EducationPanel';
import PlaygroundPanel from './components/playground/PlaygroundPanel';
import { endpoints } from './api/endpoints';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🍗 치킨집으로 배우는 NestJS</h1>
        <p>치킨집의 구성원으로 이해하는 NestJS 핵심 개념과, 요청 데이터가 흘러가는 실시간 과정</p>
      </header>
      <SplitLayout
        left={<EducationPanel />}
        right={<PlaygroundPanel endpoints={endpoints} />}
      />
    </div>
  );
}
