# 규칙 매칭 엔진 (Desert Logic AI 핵심)# logic_engine/desert_logic.py
import re, json, os

class DesertLogicEngine:
    def __init__(self, case_id: str):
        rules_path = os.path.join(os.path.dirname(__file__), "rules", f"{case_id}_rules.json")
        if os.path.exists(rules_path):
            with open(rules_path, "r", encoding="utf-8") as f:
                self.rules = json.load(f)
        else:
            self.rules = []

    def evaluate_text(self, text: str):
        """텍스트를 규칙에 따라 평가 (yes/no/irrelevant + evidence 반환)"""
        for rule in self.rules:
            if re.search(rule["pattern"], text):
                return {
                    "verdict": rule["verdict"],
                    "evidence": rule.get("evidence", "")
                }
        return {"verdict": "unknown", "evidence": ""}

    def evaluate_dialogue(self, user_input: str, ai_reply: str):
        """AI의 대답을 논리적으로 검증"""
        ai_eval = self.evaluate_text(ai_reply)
        user_eval = self.evaluate_text(user_input)

        if ai_eval["verdict"] == "no":
            return f"🤔 논리 불일치: {ai_eval['evidence']}"
        elif ai_eval["verdict"] == "yes":
            return f"🧩 논리 일치: {ai_eval['evidence']}"
        elif user_eval["verdict"] == "yes":
            return f"💬 흥미로운 단서예요. ({user_eval['evidence']})"
        else:
            return None
