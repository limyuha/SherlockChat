export default function ArticleCard({ article }: { article: any }) {
  return (
    <article className="article-card space-y-3 p-4 rounded-xl border border-red-800 bg-black/40 backdrop-blur-sm shadow-[0_0_25px_rgba(255,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(255,0,0,0.6)]">
      {/* 제목 */}
      <h2 className="text-2xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse">
        {article.title}
      </h2>

      {/* 날짜/위치 */}
      <p className="text-sm text-red-300 opacity-80 tracking-wide">
        🕒 {article.date} · 📍 {article.location}
      </p>

      {/* 이미지 */}
      {article.image && (
        <div className="relative overflow-hidden rounded-lg border border-red-900">
          <img
            src={article.image}
            alt="article"
            className="rounded-lg w-full max-h-64 object-cover brightness-[0.8] saturate-[1.3] transition-all duration-500 hover:brightness-[1.1] hover:saturate-[1.6] hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      )}

      {/* 본문 요약 */}
      <p className="text-red-200 leading-relaxed mt-3 text-base tracking-wide drop-shadow-[0_0_6px_rgba(255,0,0,0.5)]">
        {article.summary}
      </p>
    </article>
  )
}
