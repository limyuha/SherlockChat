import os, re, json

class DesertLogicEngine:
    def __init__(self, case_id: str):
        rules_path = os.path.join(os.path.dirname(__file__), "rules", f"{case_id}_rules.json")
        if os.path.exists(rules_path):
            with open(rules_path, "r", encoding="utf-8") as f:
                self.rules = json.load(f)
        else:
            self.rules = []

    def evaluate_text(self, text: str):
        """텍스트 내 단서 규칙 감지 (안전하고 자연스럽게)"""
        detected = []
        for rule in self.rules:
            pattern = rule.get("pattern", "").strip()
            if not pattern:
                continue

            # 안전하게 이스케이프 후 단어 경계 검색
            safe_pattern = re.escape(pattern)
            if re.search(rf"\b{safe_pattern}\b", text, re.IGNORECASE):
                verdict = rule.get("verdict", "yes")
                if verdict == "yes":
                    detected.append(rule.get("hint", pattern))
        return detected

    def evaluate_dialogue(self, user_input: str, ai_reply: str):
        """사용자 입력에서 다중 단서 감지"""
        user_clues = self.evaluate_text(user_input)
        if user_clues:
            return {
                "text": "💡 탐정 노트에 기록할 만한 단서가 포착됐습니다.",
                "clues": user_clues
            }
        return None
