"use client";
import React from "react";

export default function ClueBoard({ clues }: { clues: string[] }) {
  return (
    <div className="mt-4 border-t border-red-500 pt-2">
      <h3 className="text-red-500 font-bold text-lg mb-2">🧩 감지된 단서</h3>
      <ul className="space-y-1 text-red-400 text-sm">
        {clues.length === 0 ? (
          <li className="italic text-gray-500">아직 감지된 단서가 없습니다.</li>
        ) : (
          clues.map((clue, i) => <li key={i}>- {clue}</li>)
        )}
      </ul>
    </div>
  );
}
