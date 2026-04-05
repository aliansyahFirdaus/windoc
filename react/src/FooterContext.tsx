'use client';

import { createContext, useContext, useState } from 'react';

interface FooterContextValue {
  pageNoList: string;
  pageNo: number;
  pageSize: number;
  wordCount: number;
  rowNo: number;
  colNo: number;
  pageScale: number;
  paperDirection: string;
  paperWidth: number;
  paperHeight: number;
  setPageNoList: (v: string) => void;
  setPageNo: (v: number) => void;
  setPageSize: (v: number) => void;
  setWordCount: (v: number) => void;
  setRowNo: (v: number) => void;
  setColNo: (v: number) => void;
  setPageScale: (v: number) => void;
  setPaperDirection: (v: string) => void;
  setPaperWidth: (v: number) => void;
  setPaperHeight: (v: number) => void;
  handleToggleCatalogAction?: () => void;
}

const FooterContext = createContext<FooterContextValue | null>(null);

export function FooterProvider({
  handleToggleCatalogAction,
  children
}: {
  handleToggleCatalogAction?: () => void;
  children: React.ReactNode;
}) {
  const [pageNoList, setPageNoList] = useState('1');
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [rowNo, setRowNo] = useState(0);
  const [colNo, setColNo] = useState(0);
  const [pageScale, setPageScale] = useState(100);
  const [paperDirection, setPaperDirection] = useState('vertical');
  const [paperWidth, setPaperWidth] = useState(794);
  const [paperHeight, setPaperHeight] = useState(1123);

  return (
    <FooterContext.Provider
      value={{
        pageNoList,
        pageNo,
        pageSize,
        wordCount,
        rowNo,
        colNo,
        pageScale,
        paperDirection,
        paperWidth,
        paperHeight,
        setPageNoList,
        setPageNo,
        setPageSize,
        setWordCount,
        setRowNo,
        setColNo,
        setPageScale,
        setPaperDirection,
        setPaperWidth,
        setPaperHeight,
        handleToggleCatalogAction
      }}
    >
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  const ctx = useContext(FooterContext);
  if (!ctx) throw new Error('useFooter must be used within FooterProvider');
  return ctx;
}
