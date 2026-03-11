import { createContext, useContext } from 'react';
import type EditorClass from '@windoc/core';

type EditorInstance = InstanceType<typeof EditorClass>;

interface EditorContextValue {
  editor: EditorInstance | null;
}

export const EditorContext = createContext<EditorContextValue>({
  editor: null
});

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx.editor) {
    throw new Error('useEditorContext must be used inside <Editor />');
  }
  return ctx as { editor: EditorInstance };
}
