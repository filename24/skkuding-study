import { statusGuide } from '../../data/concepts';

/** 400/403/404/409가 각각 "어느 직원이 막은 것인지" 보여 주는 표 (Day 3) */
export default function StatusGuide() {
  return (
    <section className="status-guide">
      <h3 className="concept-section__heading">상태 코드는 누가 막은 것일까요?</h3>
      <table className="status-guide__table">
        <thead>
          <tr>
            <th scope="col">상태 코드</th>
            <th scope="col">막은 주체</th>
            <th scope="col">왜 그런가요</th>
          </tr>
        </thead>
        <tbody>
          {statusGuide.map((row) => (
            <tr key={row.status}>
              <td>
                <span className={`status-guide__code is-${row.who.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
              <td>{row.who}</td>
              <td>{row.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="status-guide__tip">
        오른쪽 플레이그라운드에서 API Key를 지우거나 값을 어긋나게 넣어 보면 위 상태 코드를 직접
        재현할 수 있어요.
      </p>
    </section>
  );
}
