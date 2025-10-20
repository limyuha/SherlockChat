export default function CasePanel({ article, clues, unlockedEvidence, activeTab, mode, story1}: any) {
  return (
    <>
      {activeTab === 'story' && (
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-500">
              {mode === '상' ? '📖 난이도 상 스토리' : mode === '중' ? '📖 중 살인사건' : '📖 산장의 목소리'}
            </h2>
            <pre className="whitespace-pre-wrap text-red-400 text-sm bg-black/30 border border-red-900 p-4 rounded-md">
              {story1 || '로딩 중...'}
            </pre>
          </div>
        </section>
      )}

      {activeTab === 'overview' && (
        <section className="space-y-6">
          {/* 사건 개요 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-500">📍 사건 개요</h2>
            <ul className="space-y-1 text-sm leading-relaxed">
              <li>장소: {article.case_overview?.setting}</li>
              <li>시간: {article.case_overview?.time}</li>
              <li>피해자: {article.case_overview?.victim}</li>
              <li>사망 원인: {article.case_overview?.death_cause}</li>
            </ul>
          </div>

          {/* 등장 인물 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-500">👥 등장 인물</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
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
                        : 'text-red-600 hover:text-red-400'
                    }`}
                  >
                    <strong>{c.name}</strong> — {c.role || c.occupation}
                    {isUnlocked ? (
                      <p className="text-sm text-red-400 mt-1">{c.description}</p>
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

      {/* 🔍 증거 목록 + 💡 감지된 단서 */}
      {activeTab === 'evidence' && (
        <section className="space-y-8">
          {/* 증거 목록 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-500">🔍 증거 목록</h2>
            <ul className="space-y-2 text-sm">
              {article.evidence?.map((e: any, i: number) => {
                const isUnlocked = unlockedEvidence.includes(e.type)
                return (
                  <li
                    key={i}
                    className={`border-b border-red-800 pb-2 ${
                      isUnlocked ? 'text-red-400' : 'text-gray-700 italic'
                    } transition-all`}
                  >
                    {isUnlocked ? (
                      <>
                        <strong>{e.type}</strong> — {e.description}
                      </>
                    ) : (
                      <>[🔒] 잠긴 단서</>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 감지된 단서 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-red-500">💡 감지된 단서</h2>
            {clues.length ? (
              <ul className="space-y-1 text-sm text-red-400">
                {clues.map((c: string, i: number) => (
                  <li key={i}>🔸 {c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic text-sm">단서가 아직 감지되지 않았습니다.</p>
            )}
          </div>
        </section>
      )}
    </>
  )
}
