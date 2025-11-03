"use client";
import { createContext, useContext, useEffect, useState } from "react";

type CaseData = {
  title: string;
  headline: string;
  summary_tag: string;
  summary_desc: string;
  background?: string;
  image?: string;
  difficulty: string;
  case_overview: any;
  characters: any[];
  evidence: any[];
};

const CaseContext = createContext<{ cases: Record<string, CaseData> }>({ cases: {} });

export const CaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [cases, setCases] = useState<Record<string, CaseData>>({});

  useEffect(() => {
    Promise.all([
      fetch("/cases/case_high.json").then((res) => res.json()),
      fetch("/cases/case_mid.json").then((res) => res.json()),
      fetch("/cases/case_low.json").then((res) => res.json()),
    ]).then(([high, mid, low]) => {
      setCases({
        상: high,
        중: mid,
        하: low,
      });
    });
  }, []);

  return <CaseContext.Provider value={{ cases }}>{children}</CaseContext.Provider>;
};

export const useCases = () => useContext(CaseContext);
