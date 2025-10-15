import ArticleCard from './ArticleCard'

const articles = [
  {
    title: '병실의 괴담',
    date: '2025-10-14',
    location: '서울 병원',
    image: '/hospital_room.jpg', // ✅ public 폴더 이미지 경로
    summary: '깨어나 보니 병실엔 아무도 없었다. 하지만 침대 밑에서...'
  },
  {
    title: '신촌역 마지막 열차',
    date: '2025-10-13',
    location: '신촌역',
    
    image: '/station.jpg',
    summary: '마지막 열차가 도착하지 않았다. 그러나 플랫폼엔 누군가 있었다.'
  },
  {
    title: '산장의 밤',
    date: '2025-10-12',
    location: '공포게임 산장',
    image: '/cabin.jpg',
    summary: '친구들과 떠난 산장 여행, 하지만 돌아온 건 나 혼자였다...'
  }
]

export default function ArticleList() {
  return (
    <section className="grid grid-cols-3 gap-8 p-8">
      {articles.map((article, index) => (
        <ArticleCard key={index} article={article} />
      ))}
    </section>
  )
}
