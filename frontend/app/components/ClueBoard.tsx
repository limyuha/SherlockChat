export default function ClueBoard() {
  const clues = [
    { name: '피해자', info: '회사원, 32세 남성' },
    { name: '용의자 A', info: '동료, 평소 갈등 있음' },
    { name: '흉기', info: '주방용 칼로 추정' },
  ]
  return (
    <div>
      <h3 className="font-bold mb-2">🧾 단서 정리</h3>
      <ul className="space-y-1">
        {clues.map((c, i) => (
          <li key={i} className="border-b border-gray-300 pb-1">
            <strong>{c.name}</strong>: {c.info}
          </li>
        ))}
      </ul>
    </div>
  )
}
