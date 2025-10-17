import json, os, re
from collections import Counter

# ✅ 조사·불용어 제거용 리스트
STOPWORDS = {
    "그리고", "하지만", "그러나", "있다", "하였다", "했다", "것이다",
    "사건", "인물", "단서", "이", "가", "은", "는", "을", "를", "의",
    "와", "과", "에서", "에게", "한", "되었다", "했다", "한다",
    "없음", "있음", "입니다", "이었", "이었다", "하며"
}

# ✅ 조사 및 특수문자 제거
def clean_token(token: str):
    token = re.sub(r"[^가-힣A-Za-z0-9]", "", token)  # 특수문자 제거
    token = re.sub(r"(은|는|이|가|을|를|의|에|에서|로|으로|과|와|과의|였다|였다)$", "", token)
    return token.strip()

# ✅ 텍스트에서 의미 있는 키워드 추출
def extract_keywords(text):
    tokens = re.findall(r"[가-힣A-Za-z0-9]{2,}", text)
    cleaned = [clean_token(t) for t in tokens if t not in STOPWORDS]
    cleaned = [t for t in cleaned if len(t) >= 2 and not re.search(r"^[0-9]+$", t)]  # 숫자 제외
    return cleaned

# ✅ 딕셔너리/리스트 → 문자열 안전 변환
def safe_text(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)

# ✅ 규칙 생성 로직
def generate_rules_from_case(case_file):
    with open(case_file, "r", encoding="utf-8") as f:
        case_data = json.load(f)

    overview = safe_text(case_data.get("case_overview", ""))
    solution = safe_text(case_data.get("solution", ""))
    characters = " ".join(safe_text(c.get("description", "")) for c in case_data.get("characters", []))
    evidence = " ".join(safe_text(e.get("description", "")) for e in case_data.get("evidence", []))

    all_text = " ".join([overview, solution, characters, evidence])
    keywords = extract_keywords(all_text)

    # 🔹 단어 빈도 기반 상위 추출
    freq = Counter(keywords)
    top_keywords = [w for w, count in freq.most_common(20) if count > 1 and len(w) >= 2]

    rules = []
    for kw in top_keywords:
        rules.append({
            "pattern": kw,
            "verdict": "yes",
            "evidence": f"'{kw}'는 사건의 핵심 단서입니다."
        })

    # 🔹 사건 전반 공통 부정 규칙 추가
    rules += [
        {"pattern": "살해|범인|흉기", "verdict": "no", "evidence": "이 사건은 단순 살인사건이 아닙니다."},
        {"pattern": "기억|실험|루프", "verdict": "yes", "evidence": "이 사건은 실험과 기억 조작과 관련이 있습니다."}
    ]

    base = os.path.basename(case_file).replace(".json", "")
    output_dir = os.path.join(os.path.dirname(__file__), "rules")
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, f"{base}_rules.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)

    print(f"✅ {out_path} 생성 완료 (규칙 {len(rules)}개)")
    return out_path

# ✅ 실행 부분
if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    cases_dir = os.path.join(base_dir, "cases")

    for fname in ["case_high.json", "case_mid.json", "case_low.json"]:
        path = os.path.join(cases_dir, fname)
        if os.path.exists(path):
            generate_rules_from_case(path)
        else:
            print(f"⚠️ {fname} 파일을 찾을 수 없습니다: {path}")
