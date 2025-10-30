"use client";
export default function CasePanel({ article, clues, unlockedEvidence, activeTab, mode, story1 }: any) {
  return (
    <>
      {activeTab === 'story' && (
        <section className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-red-500">
              {mode === '상' ? '📖 산장의 목소리' : mode === '중' ? '📖 하숙집 밀실 살인사건' : '📖 사라진 USB'}
            </h2>
            <pre className="whitespace-pre-wrap text-red-400 text-xs sm:text-sm bg-black/30 border border-red-900 p-3 sm:p-4 rounded-md overflow-x-auto">
              {story1 || '로딩 중...'}
            </pre>
          </div>
        </section>
      )}

      {activeTab === 'overview' && (
        <section className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base">
          {/* 사건 개요 */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-red-500">📍 사건 개요</h2>

            {mode === '상' && (
              <ul className="space-y-1 leading-relaxed">
                <li>유형: 스릴러 / 심리 실험</li>
                <li>장소: {article.case_overview?.setting}</li>
                <li>시간: {article.case_overview?.time}</li>
                <li>난이도: {article.difficulty || '상'}</li>
              </ul>
            )}

            {mode === '중' && (
              <ul className="space-y-1 leading-relaxed">
                <li>유형: 살인사건 추리</li>
                <li>장소: {article.case_overview?.setting}</li>
                <li>시간: {article.case_overview?.time}</li>
                <li>피해자: {article.case_overview?.victim}</li>
                <li>사망 원인: {article.case_overview?.death_cause}</li>
                <li>난이도: {article.difficulty || '중'}</li>
              </ul>
            )}

            {mode === '하' && (
              <ul className="space-y-1 leading-relaxed">
                <li>장소: {article.case_overview?.setting}</li>
                <li>시간: {article.case_overview?.time}</li>
                <li>피해자: {article.case_overview?.victim}</li>
                <li>난이도: {article.difficulty || '하'}</li>
                <li>사건 유형: {article.case_overview?.death_cause || '일상 속 해프닝'}</li>
              </ul>
            )}
          </div>

          {/* 등장 인물 */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-red-500">👥 등장 인물</h2>
            <ul className="space-y-2 leading-relaxed">
              {article.characters?.map((c: any, i: number) => {
                const isUnlocked = clues.some((clue: string) =>
                  c.name.includes(clue) ||
                  (c.role && c.role.includes(clue)) ||
                  (c.occupation && c.occupation.includes(clue))
                )
                return (
                  <li
                    key={i}
                    className={`border-b border-red-800 pb-1 transition-all ${
                      isUnlocked
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-red-700 hover:text-red-400'
                    }`}
                  >
                    <strong>{c.name}</strong> — {c.role || c.occupation}
                    {isUnlocked ? (
                      <p className="text-xs sm:text-sm text-red-400 mt-1">{c.description}</p>
                    ) : (
                      <p className="text-xs italic text-gray-700">[🔒] 추가 정보 미확인</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* 증거 목록 + 감지된 단서 */}
      {activeTab === 'evidence' && (
        <section className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base">
          {/* 증거 목록 */}
          <div className="bg-black/40 p-3 sm:p-4 md:p-6 rounded-xl border border-gray-700">
            <h3 className="text-base sm:text-lg font-bold mb-2 text-red-500">
              🔍 증거 목록
              <span className="ml-2 text-xs sm:text-sm text-gray-400">
                (총 {article?.evidence?.length || 0}개 중{" "}
                {unlockedEvidence.length}개 발견)
              </span>
            </h3>

            {article?.evidence?.length > 0 ? (
              <ul className="space-y-3">
                {article.evidence.map((ev: any, i: number) => {
                  const unlocked =
                    unlockedEvidence.includes(ev.type) ||
                    unlockedEvidence.some((c: string) =>
                      ev.description.includes(c)
                    )

                  return (
                    <li
                      key={ev.id || i}
                      className={`transition-all p-2 rounded-md ${
                        unlocked
                          ? "bg-emerald-900/20 border border-emerald-600 text-emerald-300"
                          : "bg-black/20 border border-gray-700 text-gray-500 italic"
                      }`}
                    >
                      {unlocked ? (
                        <>
                          <div className="font-semibold text-emerald-400">
                            🔓 {ev.type}
                          </div>
                          <p className="mt-1 leading-relaxed">{ev.description || "설명 없음"}</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>🔒 잠긴 단서</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-gray-600 italic">아직 발견된 증거가 없습니다.</p>
            )}
          </div>

          {/* 감지된 단서 */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-red-500">💡 감지된 단서</h2>
            {clues.length ? (
              <ul className="space-y-1 text-red-400">
                {clues.map((c: string, i: number) => (
                  <li key={i}>🔸 {c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic">단서가 아직 감지되지 않았습니다.</p>
            )}
          </div>
        </section>
      )}
    </>
  )
}
