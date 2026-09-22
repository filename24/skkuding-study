import type { ReactNode } from 'react';

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

// 화면을 좌우 2분할하는 레이아웃 (좁은 화면에서는 세로 스택)
export default function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div className="split-layout">
      <section className="split-layout__pane split-layout__left">{left}</section>
      <section className="split-layout__pane split-layout__right">{right}</section>
    </div>
  );
}
