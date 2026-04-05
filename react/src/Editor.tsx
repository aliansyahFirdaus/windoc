'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { EditorInstance, RangeStylePayload } from './types';
import { EditorProvider } from './EditorContext';
import { FooterProvider, useFooter } from './FooterContext';
import EditorToolbar from './EditorToolbar';
import EditorFooter from './EditorFooter';

interface EditorOptions {
  margins?: number[];
  defaultBasicRowMarginHeight?: number;
  watermark?: { data: string; size?: number; color?: string; opacity?: number };
  header?: { top?: number; disabled?: boolean };
  footer?: { bottom?: number; disabled?: boolean; backgroundColor?: string };
  pageNumber?: {
    disabled?: boolean;
    format?: string;
    color?: string;
    font?: string;
    size?: number;
    rowFlex?: string;
    bottom?: number;
  };
  placeholder?: { data: string };
  zone?: { tipDisabled?: boolean };
  maskMargin?: number[];
  scrollContainerSelector?: string;
  [key: string]: unknown;
}

interface EditorData {
  header?: object[];
  main: object[];
  footer?: object[];
}

interface EditorProps {
  /** Initial document data */
  defaultValue?: EditorData;
  /** Editor configuration options */
  options?: EditorOptions;
  /** Called when editor content changes */
  onChange?: (data: object) => void;
  /** Called when editor instance is ready */
  onReady?: (editor: EditorInstance) => void;
  /** Show built-in toolbar (default: true) */
  toolbar?: boolean;
  /** Show built-in footer/statusbar (default: true) */
  footer?: boolean;
  /** Custom toolbar component to replace built-in one */
  renderToolbar?: React.ReactNode;
  /** Custom footer component to replace built-in one */
  renderFooter?: React.ReactNode;
  /** Additional content rendered inside EditorProvider (e.g. sidebars) */
  children?: React.ReactNode;
  /** CSS class for the editor container */
  className?: string;
  /** Inline style for the editor container */
  style?: React.CSSProperties;
  /** Enable drag-and-drop badge insertion */
  onDrop?: (e: React.DragEvent, editor: EditorInstance) => void;
  /** Called when cursor/selection style changes — use this instead of overwriting editor.listener.rangeStyleChange via onReady */
  onRangeStyleChange?: (payload: RangeStylePayload) => void;
}

export function Editor({
  defaultValue,
  options: userOptions,
  onChange,
  onReady,
  onRangeStyleChange,
  toolbar = true,
  footer = true,
  renderToolbar,
  renderFooter,
  children,
  className,
  style,
  onDrop: userOnDrop
}: EditorProps) {
  return (
    <FooterProvider>
      <EditorInner
        defaultValue={defaultValue}
        options={userOptions}
        onChange={onChange}
        onReady={onReady}
        onRangeStyleChange={onRangeStyleChange}
        toolbar={toolbar}
        footer={footer}
        renderToolbar={renderToolbar}
        renderFooter={renderFooter}
        className={className}
        style={style}
        onDrop={userOnDrop}
      >
        {children}
      </EditorInner>
    </FooterProvider>
  );
}

function EditorInner({
  defaultValue,
  options: userOptions,
  onChange,
  onReady,
  onRangeStyleChange,
  toolbar = true,
  footer = true,
  renderToolbar,
  renderFooter,
  children,
  className,
  style,
  onDrop: userOnDrop
}: Omit<EditorProps, 'onDrop'> & { onDrop?: EditorProps['onDrop'] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);
  const [rangeStyle, setRangeStyle] = useState<RangeStylePayload | null>(null);
  const [isInTable, setIsInTable] = useState(false);

  const {
    setPageNoList,
    setPageNo,
    setPageSize,
    setWordCount,
    setRowNo,
    setColNo,
    setPageScale
  } = useFooter();

  useEffect(() => {
    let instance: EditorInstance | null = null;
    let cancelled = false;
    let closeDropdowns: ((evt: MouseEvent) => void) | null = null;

    const initEditor = async () => {
      if (!containerRef.current) return;

      const {
        default: EditorClass,
        KeyMap,
        EditorMode,
        EditorZone,
        ElementType,
        Dialog,
        Signature
      } = await import('@windoc/core');

      // Guard: if cleanup already ran before async resolved, bail out
      if (cancelled) return;

      const data = (defaultValue ?? { main: [] }) as any;

      instance = new EditorClass(
        containerRef.current!,
        data,
        ({ maskMargin: [24, 0, 24, 0], ...userOptions }) as any
      ) as unknown as EditorInstance;

      editorRef.current = instance;

      // Sync initial scale to footer
      const initialScale = (userOptions as any)?.scale ?? 1;
      setPageScale(Math.round(initialScale * 100));

      // Setup listeners
      instance.listener.rangeStyleChange = (payload: RangeStylePayload) => {
        setRangeStyle(payload);
        onRangeStyleChange?.(payload);
        const rangeContext = instance?.command.getRangeContext();
        setIsInTable(rangeContext?.isTable === true);
        if (rangeContext) {
          setRowNo(rangeContext.startRowNo + 1);
          setColNo(rangeContext.startColNo + 1);
        }
      };

      instance.listener.visiblePageNoListChange = (payload: number[]) => {
        setPageNoList(payload.map(i => i + 1).join(', '));
      };

      instance.listener.pageSizeChange = (payload: number) => {
        setPageSize(payload);
      };

      instance.listener.intersectionPageNoChange = (payload: number) => {
        setPageNo(payload + 1);
      };

      instance.listener.pageScaleChange = (payload: number) => {
        setPageScale(Math.floor(payload * 10 * 10));
      };

      instance.listener.contentChange = async () => {
        const count = await instance?.command.getWordCount();
        setWordCount(count || 0);
        if (onChange) {
          const value = instance?.command.getValue();
          if (value) onChange(value);
        }
      };

      // Register shortcuts
      instance.register.shortcutList([
        {
          key: KeyMap.P,
          mod: true,
          isGlobal: true,
          callback: (command: { executePrint: () => void }) => {
            command.executePrint();
          }
        },
        {
          key: KeyMap.MINUS,
          ctrl: true,
          isGlobal: true,
          callback: (command: { executePageScaleMinus: () => void }) => {
            command.executePageScaleMinus();
          }
        },
        {
          key: KeyMap.EQUAL,
          ctrl: true,
          isGlobal: true,
          callback: (command: { executePageScaleAdd: () => void }) => {
            command.executePageScaleAdd();
          }
        },
        {
          key: KeyMap.ZERO,
          ctrl: true,
          isGlobal: true,
          callback: (command: { executePageScaleRecovery: () => void }) => {
            command.executePageScaleRecovery();
          }
        }
      ]);

      // Register context menus
      instance.register.contextMenuList([
        {
          name: 'Signature',
          icon: 'signature',
          when: (payload: {
            isReadonly: boolean;
            editorTextFocus: boolean;
          }) => {
            return !payload.isReadonly && payload.editorTextFocus;
          },
          callback: (command: {
            executeInsertElementList: (elements: object[]) => void;
          }) => {
            new Signature({
              onConfirm(
                payload: { value: string; width: number; height: number } | null
              ) {
                if (!payload) return;
                const { value, width, height } = payload;
                if (!value || !width || !height) return;
                command.executeInsertElementList([
                  { value, width, height, type: ElementType.IMAGE }
                ]);
              }
            });
          }
        },
        {
          name: 'Format Cleanup',
          icon: 'word-tool',
          when: (payload: { isReadonly: boolean }) => !payload.isReadonly,
          callback: (command: { executeWordTool: () => void }) => {
            command.executeWordTool();
          }
        }
      ]);

      // Global click handler to close dropdowns — store ref for cleanup
      closeDropdowns = (evt: MouseEvent) => {
        const visibleDom = document.querySelector('.visible');
        if (!visibleDom) return;
        const parent = visibleDom.parentElement;
        if (parent && parent.contains(evt.target as Node)) return;
        visibleDom.classList.remove('visible');
      };
      window.addEventListener('click', closeDropdowns, { capture: true });

      // Initial content change
      const count = await instance.command.getWordCount();
      setWordCount(count || 0);

      // Notify consumer
      onReady?.(instance);
    };

    initEditor();

    return () => {
      cancelled = true;
      instance?.destroy();
      editorRef.current = null;
      if (closeDropdowns) {
        window.removeEventListener('click', closeDropdowns, { capture: true });
        closeDropdowns = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (userOnDrop && editorRef.current) {
      userOnDrop(e, editorRef.current);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <EditorProvider editorRef={editorRef} rangeStyle={rangeStyle} isInTable={isInTable}>
      {toolbar && !renderToolbar && <EditorToolbar />}
      {renderToolbar}
      {children}
      <div
        className={className ?? 'editor'}
        style={style ?? { flex: 1, minHeight: 0, overflow: 'auto' }}
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
      {footer && !renderFooter && <EditorFooter />}
      {renderFooter}
    </EditorProvider>
  );
}
