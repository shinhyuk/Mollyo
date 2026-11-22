import { useState } from "react";
import { SCHOOLS } from "../lib/mock";
import { saveProfile, type Profile } from "../lib/store";

/** 생일로 만 나이를 계산합니다. 생일은 이 계산에만 쓰고 저장하지 않습니다. */
export function fullAge(birth: Date, now = new Date()): number {
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const MIN_AGE = 14;

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState<"age" | "blocked" | "class">("age");
  const [birth, setBirth] = useState("");
  const [nickname, setNickname] = useState("");
  const [schoolId, setSchoolId] = useState(SCHOOLS[0].id);
  const [grade, setGrade] = useState(1);
  const [classNo, setClassNo] = useState(1);

  const checkAge = () => {
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return;
    setStep(fullAge(d) >= MIN_AGE ? "class" : "blocked");
    setBirth("");
  };

  const finish = () => {
    const p: Profile = { nickname: nickname.trim(), schoolId, grade, classNo, ageConfirmed: true };
    saveProfile(p);
    onDone(p);
  };

  return (
    <main className="screen">
      <div className="topbar">
        <span className="logo">몰려</span>
        <span className="tag">MOLLYO</span>
      </div>

      {step === "age" && (
        <>
          <h1>
            우리 반,
            <br />
            지금 어디 몰렸어?
          </h1>
          <div className="card yellow">
            <label className="field">
              생년월일
              <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
            </label>
            <p className="muted">만 {MIN_AGE}세 이상만 쓸 수 있어요. 생년월일은 확인만 하고 저장하지 않아요.</p>
            <button className="btn block" disabled={!birth} onClick={checkAge}>
              다음
            </button>
          </div>
        </>
      )}

      {step === "blocked" && (
        <div className="card pink">
          <h2>아직은 쓸 수 없어요</h2>
          <p>몰려는 만 {MIN_AGE}세부터 쓸 수 있어요. 조금만 기다려 주세요.</p>
        </div>
      )}

      {step === "class" && (
        <>
          <h1>어느 반이야?</h1>
          <div className="card">
            <label className="field">
              별명
              <input
                value={nickname}
                maxLength={12}
                placeholder="반 친구들이 알아볼 이름"
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label className="field">
              학교
              <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                {SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <label className="field grow">
                학년
                <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                  {[1, 2, 3].map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </label>
              <label className="field grow">
                반
                <select value={classNo} onChange={(e) => setClassNo(Number(e.target.value))}>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      {c}반
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted">지금은 데모 학교만 있어요. 실제 학교 목록과 반 친구 승인은 다음 단계에서 붙어요.</p>
            <button className="btn yellow block" disabled={nickname.trim().length < 2} onClick={finish}>
              시작하기
            </button>
          </div>
        </>
      )}
    </main>
  );
}
