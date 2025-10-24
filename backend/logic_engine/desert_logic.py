import os
import re
import json
from typing import List, Optional, Dict, Any


class DesertLogicEngine:
    """
    사건 단서 탐지 및 추리 보조용 로직 엔진
    ------------------------------------
    - 규칙 파일: logic_engine/rules/{case_id}_rules.json
    - 기능:
        1. 텍스트 내 단서 패턴 감지
        2. 사용자 대화 흐름에서 단서 포착
        3. 특정 증거 이름에 대한 힌트 제공
    """

    def __init__(self, case_id: str):
        # 절대경로 기반으로 로드 (FastAPI/uvicorn 어디서 실행하든 안전)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        rules_path = os.path.join(base_dir, "rules", f"{case_id}_rules.json")

        self.rules: List[Dict[str, Any]] = []

        if os.path.exists(rules_path):
            try:
                with open(rules_path, "r", encoding="utf-8") as f:
                    self.rules = json.load(f)
                print(f"[DesertLogicEngine] 규칙 {len(self.rules)}개 로드 완료 ({rules_path})")
            except json.JSONDecodeError as e:
                print(f"[DesertLogicEngine] JSON 파싱 오류: {e}")
        else:
            print(f"[DesertLogicEngine] ⚠️ 규칙 파일을 찾을 수 없음: {rules_path}")

    # -----------------------------------------------------
    # 내부 유틸 함수
    # -----------------------------------------------------
    @staticmethod
    def _safe_search(pattern: str, text: str) -> bool:
        """정규식 매칭 (오류 발생 시 안전하게 문자열 포함 비교로 fallback)"""
        try:
            return bool(re.search(pattern, text, re.IGNORECASE))
        except re.error:
            return pattern in text or text in pattern

    # -----------------------------------------------------
    # 주요 기능
    # -----------------------------------------------------
    def evaluate_text(self, text: str) -> List[str]:
        """텍스트 내 단서 규칙 감지"""
        detected: List[str] = []
        for rule in self.rules:
            pattern = rule.get("pattern", "").strip()
            if not pattern:
                continue

            if self._safe_search(pattern, text):
                if rule.get("verdict", "yes") == "yes":
                    detected.append(rule.get("hint", pattern))
        return detected

    def evaluate_dialogue(self, user_input: str, ai_reply: str) -> Optional[Dict[str, Any]]:
        """사용자 입력에서 다중 단서 감지"""
        clues = self.evaluate_text(user_input)
        if clues:
            return {
                "text": None,
                "clues": clues
            }
        return None

    def get_hint_for_evidence(self, evidence_type: str) -> Optional[str]:
        """
        특정 증거 이름이나 관련 단어(evidence_type)에 맞는 힌트를 반환
        """
        for rule in self.rules:
            pattern = rule.get("pattern", "")
            hint = rule.get("hint", "")
            if re.search(pattern, evidence_type, re.IGNORECASE):
                print(f"[DesertLogicEngine] 🧠 힌트 매칭 성공: {evidence_type} ↔ {pattern}")
                return hint

        print(f"[DesertLogicEngine] 힌트 없음: {evidence_type}")
        return None


# -----------------------------------------------------
# 단독 테스트 실행용
# -----------------------------------------------------
if __name__ == "__main__":
    engine = DesertLogicEngine("case_mid")
    evidence_name = "핸드폰"
    hint = engine.get_hint_for_evidence(evidence_name)
    print(f"테스트 결과: '{evidence_name}' → {hint}")
