"use client";
export default function CasePanel({ article, clues, unlockedEvidence, activeTab, story1 }: any) {
  const backgroundImage = article.background || "/textures/blood/blood3.png";

  const fieldNames: Record<string, string> = {
    setting: "장소",
    time: "시간",
    victim: "피해자",
    death_cause: "사망 원인",
    victim_characteristics: "피해자 성격",
    room_characteristics: "방의 특징",
  };

  return (
    <div className="relative">
      {/* 배경 이미지 (자동 반영) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* 실제 내용 */}
      <div className="relative z-10 space-y-6 text-xs sm:text-sm md:text-base">

        {/* 스토리 탭 */}
        {activeTab === "story" && (
          <section>
            <h2 className="text-xl font-bold text-red-500 mb-3">📖 {article.title}</h2>
            <pre className="whitespace-pre-wrap text-red-400 bg-black/40 border border-red-900 p-4 rounded-md leading-relaxed">
              {story1 || "로딩 중..."}
            </pre>
          </section>
        )}

        {/* 사건 개요 탭 */}
        {activeTab === "overview" && (
          <section>
            <h2 className="text-lg font-bold text-red-500 mb-3">📍 사건 개요</h2>
            <ul className="space-y-1 leading-relaxed">
              {Object.entries(article.case_overview || {}).map(([key, value]) => (
                <li key={key}>
                  <strong>{fieldNames[key] || key}:</strong> {String(value)}
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-bold text-red-500 mt-5 mb-3">👥 등장 인물</h2>
            <ul className="space-y-2">
              {article.characters?.map((c: any, i: number) => {
                const isUnlocked =
                  clues.some((clue: string) =>
                    [c.name, c.role, c.occupation].some((f) => f?.includes(clue))
                  ) || false;
                return (
                  <li
                    key={i}
                    className={`border-b border-red-800 pb-1 transition-all ${
                      isUnlocked
                        ? "text-red-400 hover:text-red-300"
                        : "text-red-700 hover:text-red-400"
                    }`}
                  >
                    <strong>{c.name}</strong> — {c.occupation || c.role}
                    <p className="text-xs mt-1">
                      {isUnlocked ? c.description : "🔒 [정보 잠김]"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 증거 탭 */}
        {activeTab === "evidence" && (
          <section>
            <h2 className="text-lg font-bold text-red-500 mb-3">🔍 증거 목록</h2>
            <ul className="space-y-3">
              {article.evidence?.map((ev: any, i: number) => {
                const unlocked =
                  unlockedEvidence.includes(ev.type) ||
                  clues.some((c: string) => ev.description.includes(c));
                return (
                  <li
                    key={i}
                    className={`p-3 rounded-md border transition-all ${
                      unlocked
                        ? "bg-emerald-900/20 border-emerald-600 text-emerald-300"
                        : "bg-black/20 border-gray-700 text-gray-500 italic"
                    }`}
                  >
                    {unlocked ? (
                      <>
                        <div className="font-semibold text-emerald-400">🔓 {ev.type}</div>
                        <p className="mt-1 leading-relaxed">{ev.description}</p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>🔒 잠긴 단서</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <h2 className="text-lg font-bold text-red-500 mt-6 mb-3">💡 감지된 단서</h2>
            {clues.length > 0 ? (
              <ul className="space-y-1 text-red-400">
                {clues.map((c: string, i: number) => (
                  <li key={i}>🔸 {c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic">단서가 아직 감지되지 않았습니다.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
