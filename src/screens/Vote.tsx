import { useMemo, useState } from "react";
import { CLASSMATES, QUESTIONS } from "../lib/mock";
import { loadVotes, saveVotes, type Profile } from "../lib/store";

const PER_DAY = QUESTIONS.length;
const COLORS = ["yellow", "pink", "green", ""];

function pickFour(round: number): string[] {
  const names = [...CLASSMATES];
  const out: string[] = [];
  let s = round * 9301 + 49297;
  while (out.length < 4) {
    s = (s * 233280 + 12345) % 2147483647;
    out.push(names.splice(s % names.length, 1)[0]);
  }
  return out;
}

export function Vote({ profile }: { profile: Profile }) {
  const [votes, setVotes] = useState(() => loadVotes());
  const [round, setRound] = useState(0);
  const options = useMemo(() => pickFour(votes.answered + round), [votes.answered, round]);
  const done = votes.answered >= PER_DAY;
  const question = QUESTIONS[votes.answered % QUESTIONS.length];

  // 데모에서는 내가 투표할 때마다 가끔 표를 받은 것처럼 보여줍니다. 건너뛰면 받지 않습니다.
  const answer = (picked: boolean) => {
    const gain = picked && votes.answered % 2 === 0 ? 1 : 0;
    const next = { answered: votes.answered + 1, received: votes.received + gain };
    setVotes(next);
    saveVotes(next);
  };

  const reset = () => {
    const next = { ...votes, answered: 0 };
    setVotes(next);
    saveVotes(next);
  };

  return (
    <main className="screen">
      <div className="topbar">
        <h2>
          {profile.grade}학년 {profile.classNo}반 투표
        </h2>
        <span className="tag">
          {Math.min(votes.answered, PER_DAY)}/{PER_DAY}
        </span>
      </div>

      <div className="card blue">
        <div className="row">
          <span className="big">{votes.received}</span>
          <span>표를 받았어요</span>
        </div>
        <p className="muted">누가 뽑았는지는 비밀이에요.</p>
      </div>

      {done ? (
        <div className="card green">
          <h2>오늘 투표 끝!</h2>
          <p>내일 새 질문이 열려요.</p>
          <button className="btn small" onClick={reset}>
            데모: 다시 하기
          </button>
        </div>
      ) : (
        <>
          <div className="card yellow">
            <h1>{question}</h1>
          </div>
          <div className="vote-grid">
            {options.map((name, i) => (
              <button key={name} className={`btn ${COLORS[i]}`} onClick={() => answer(true)}>
                {name}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn small grow" onClick={() => setRound((r) => r + 1)}>
              다른 친구 보기
            </button>
            <button className="btn small grow" onClick={() => answer(false)}>
              건너뛰기
            </button>
          </div>
        </>
      )}
      <p className="muted">데모 반 친구예요. 질문은 칭찬만 있어요.</p>
    </main>
  );
}
