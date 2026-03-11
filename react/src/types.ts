export type EditorInstance = {
  command: {
    executeUndo: () => void;
    executeRedo: () => void;
    executePainter: (options: { isDblclick: boolean }) => void;
    executeFormat: () => void;
    executeFont: (family: string) => void;
    executeSize: (size: number) => void;
    executeSizeAdd: () => void;
    executeSizeMinus: () => void;
    executeBold: () => void;
    executeItalic: () => void;
    executeUnderline: (options?: { style?: string }) => void;
    executeStrikeout: () => void;
    executeSuperscript: () => void;
    executeSubscript: () => void;
    executeColor: (color: string | null) => void;
    executeHighlight: (color: string | null) => void;
    executeTitle: (level: string | null) => void;
    executeRowFlex: (flex: string) => void;
    executeRowMargin: (margin: number) => void;
    executeList: (type: string | null, style?: string) => void;
    executeListWithPreset: (
      type: string,
      style: string,
      preset: string
    ) => void;
    executeListIndent: () => void;
    executeListOutdent: () => void;
    executeInsertTable: (rows: number, cols: number) => void;
    executeImage: (options: {
      value: string;
      width: number;
      height: number;
    }) => void;
    executeHyperlink: (options: {
      url: string;
      valueList: { value: string; size: number }[];
    }) => void;
    executeSeparator: (
      payload: number[],
      option?: { lineWidth?: number; color?: string }
    ) => void;
    executePageBreak: () => void;
    executeAddWatermark: (options: {
      data: string;
      type?: string;
      color?: string;
      opacity?: number;
      size?: number;
      font?: string;
      rotation?: number;
      inFront?: boolean;
      width?: number;
      height?: number;
      repeat?: boolean;
    }) => void;
    executeDeleteWatermark: () => void;
    executeSetZone: (zone: string) => void;
    executeSearch: (text: string | null, options?: object) => void;
    executeReplace: (text: string) => void;
    executeSearchNavigatePre: () => void;
    executeSearchNavigateNext: () => void;
    executePrint: () => void;
    executePageMode: (mode: string) => void;
    executeColumnCount: (count: number) => void;
    executeColumnBreak: () => void;
    executeColumnGap: (gap: number) => void;
    executePageScaleRecovery: () => void;
    executePageScaleMinus: () => void;
    executePageScaleAdd: () => void;
    executePaperSize: (width: number, height: number) => void;
    executePaperDirection: (direction: string) => void;
    executeSetPaperMargin: (margins: number[]) => void;
    executeMode: (mode: string) => void;
    executeLocationCatalog: (id: string) => void;
    executeLocationGroup: (id: string) => void;
    executeDeleteGroup: (id: string) => void;
    executeSetGroup: () => string | null;
    executeInsertControl: (element: object) => void;
    executeInsertElementList: (elements: object[]) => void;
    executeDeleteElementById: (options: {
      id?: string;
      conceptId?: string;
    }) => void;
    getOptions: () => {
      header: { disabled: boolean };
      footer: { disabled: boolean };
      [key: string]: unknown;
    };
    executeUpdateOptions: (options: object) => void;
    executeForceUpdate: () => void;
    getCatalog: () => Promise<ICatalogItem[] | null>;
    getWordCount: () => Promise<number>;
    getGroupIds: () => Promise<string[]>;
    getValue: () => {
      version: string;
      data: { header?: object[]; main: object[]; footer?: object[] };
      options: object;
    };
    executeSetValue: (payload: {
      header?: object[];
      main?: object[];
      footer?: object[];
    }) => void;
    getHTML: () => { header: string; main: string; footer: string };
    executeSetHTML: (payload: {
      header?: string;
      main?: string;
      footer?: string;
    }) => void;
    getImage: (payload?: {
      pixelRatio?: number;
      mode?: string;
    }) => Promise<string[]>;
    getControlValue: (
      options?: object
    ) => Array<{
      conceptId?: string;
      value: string | null;
      extension?: unknown;
    }>;
    setControlValue: (options: object) => void;
    getRangeText: () => string;
    getRangeContext: () => { startRowNo: number; startColNo: number } | null;
    getPaperMargin: () => number[];
    getSearchNavigateInfo: () => { index: number; count: number } | null;
  };
  listener: {
    rangeStyleChange: ((payload: RangeStylePayload) => void) | null;
    visiblePageNoListChange: ((payload: number[]) => void) | null;
    pageSizeChange: ((payload: number) => void) | null;
    intersectionPageNoChange: ((payload: number) => void) | null;
    pageScaleChange: ((payload: number) => void) | null;
    controlChange: ((payload: { state: string }) => void) | null;
    pageModeChange: ((payload: string) => void) | null;
    contentChange: (() => void) | null;
    saved: ((payload: object) => void) | null;
  };
  register: {
    contextMenuList: (items: object[]) => void;
    shortcutList: (items: object[]) => void;
  };
  eventBus: {
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    [key: string]: unknown;
  };
  override: {
    drop?: ((evt: DragEvent) => unknown) | undefined;
    paste?: ((evt?: ClipboardEvent) => unknown) | undefined;
    copy?: (() => unknown) | undefined;
    [key: string]: unknown;
  };
  version: string;
  destroy: () => void;
  use: (plugin: object) => void;
};

export type ICatalogItem = {
  id: string;
  name: string;
  level: string;
  pageNo: number;
  subCatalog: ICatalogItem[];
};

export type RangeStylePayload = {
  type?: string;
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeout: boolean;
  color?: string;
  highlight?: string;
  rowFlex?: string;
  rowMargin: number;
  undo: boolean;
  redo: boolean;
  painter: boolean;
  level?: string;
  listType?: string;
  dashArray: number[];
  groupIds?: string[];
};

export interface IComment {
  id: string;
  content: string;
  userName: string;
  rangeText: string;
  createdDate: string;
}
