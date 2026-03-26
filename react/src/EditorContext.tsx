'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { EditorInstance, RangeStylePayload } from './types';

interface EditorContextValue {
  editorRef: MutableRefObject<EditorInstance | null>;
  isApple: boolean;
  rangeStyle: RangeStylePayload | null;
  isInTable: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  editorRef,
  rangeStyle,
  isInTable,
  children
}: {
  editorRef: MutableRefObject<EditorInstance | null>;
  rangeStyle: RangeStylePayload | null;
  isInTable: boolean;
  children: React.ReactNode;
}) {
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    setIsApple(/Mac OS X/.test(navigator.userAgent));
  }, []);

  return (
    <EditorContext.Provider value={{ editorRef, isApple, rangeStyle, isInTable }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
