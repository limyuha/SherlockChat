# logic_engine/hybrid_logic.py
import os, json, numpy as np, re
from numpy.linalg import norm
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 🔹 임베딩 유사도 계산
def cosine_similarity(a, b):
    return np.dot(a, b) / (norm(a) * norm(b))

class HybridDesertLogicEngine:
    def __init__(self, case_id: str):
        base_dir = os.path.join(os.path.dirname(__file__), "rules")
        regex_file = os.path.join(base_dir, f"{case_id}_rules.json")
        emb_file = os.path.join(base_dir, f"{case_id}_rules_emb.json")

        self.regex_rules = []
        self.emb_rules = []

        if os.path.exists(regex_file):
            with open(regex_file, "r", encoding="utf-8") as f:
                self.regex_rules = json.load(f)

        if os.path.exists(emb_file):
            with open(emb_file, "r", encoding="utf-8") as f:
                self.emb_rules = json.load(f)

    # -------------------------
    # 🧩 정규식 기반 감지
    # -------------------------
    def match_regex(self, text: str):
        for rule in self.regex_rules:
            if re.search(rule["pattern"], text, re.IGNORECASE):
                return {
                    "type": "regex",
                    "verdict": rule["verdict"],
                    "evidence": rule["evidence"],
                    "similarity": 1.0,
                }
        return None

    # -------------------------
    # 🧠 임베딩 기반 감지
    # -------------------------
    def embed_text(self, text: str):
        res = client.embeddings.create(input=text, model="text-embedding-3-small")
        return np.array(res.data[0].embedding)

    def match_embedding(self, text: str, threshold=0.83):
        if not self.emb_rules:
            return None

        query_vec = self.embed_text(text)
        best_rule, best_score = None, 0.0

        for rule in self.emb_rules:
            emb = np.array(rule["embedding"])
            score = cosine_similarity(query_vec, emb)
            if score > best_score:
                best_score, best_rule = score, rule

        if best_rule and best_score >= threshold:
            return {
                "type": "embedding",
                "verdict": best_rule["verdict"],
                "evidence": best_rule["evidence"],
                "similarity": round(best_score, 3),
            }
        return None

    # -------------------------
    # ⚔️ 혼합 감지 로직
    # -------------------------
    def evaluate_dialogue(self, user_input: str, ai_reply: str):
        # ① 우선 정규식 매칭 (빠름)
        regex_match = self.match_regex(user_input)
        if regex_match:
            return f"🧩 규칙 일치: {regex_match['evidence']}"

        # ② 임베딩 기반 감지
        semantic_match = self.match_embedding(user_input)
        if semantic_match:
            return f"🧠 의미 감지: {semantic_match['evidence']} (유사도 {semantic_match['similarity']})"

        return None

    # -------------------------
    # 🔍 단서 추출
    # -------------------------
    def extract_clue_from_feedback(self, feedback_text: str):
        import re
        match = re.search(r"['\"](.+?)['\"]", feedback_text)
        if match:
            return match.group(1)
        return None
