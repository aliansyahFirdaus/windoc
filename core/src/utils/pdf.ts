import {
  PDFDocument,
  PDFImage,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb
} from 'pdf-lib';
import { FORMAT_PLACEHOLDER } from '../dataset/constant/PageNumber';
import {
  INDENT_PER_LEVEL,
  olPresetCycles,
  ulPresetCycles
} from '../dataset/constant/List';
import { ZERO } from '../dataset/constant/Common';
import { defaultTableOption } from '../dataset/constant/Table';
import { titleSizeMapping } from '../dataset/constant/Title';
import { ControlType } from '../dataset/enum/Control';
import { PaperDirection } from '../dataset/enum/Editor';
import { ElementType } from '../dataset/enum/Element';
import {
  ListStyle,
  ListType,
  OlPreset,
  OlStyle,
  UlPreset,
  UlStyle
} from '../dataset/enum/List';
import { RowFlex } from '../dataset/enum/Row';
import { TdBorder, TableBorder } from '../dataset/enum/table/Table';
import { TitleLevel } from '../dataset/enum/Title';
import { VerticalAlign } from '../dataset/enum/VerticalAlign';
import { IControl, IValueSet } from '../interface/Control';
import { DeepRequired, IPadding } from '../interface/Common';
import {
  IEditorOption,
  IEditorResult,
  IExportPdfOption
} from '../interface/Editor';
import { IElement } from '../interface/Element';
import { IPageNumber } from '../interface/PageNumber';
import { IColgroup } from '../interface/table/Colgroup';
import { ITd } from '../interface/table/Td';
import { ITr } from '../interface/table/Tr';
import {
  getTextFromElementList,
  splitListElement,
  zipElementList
} from './element';
import { splitText } from './index';

type PdfBlock =
  | IParagraphBlock
  | IImageBlock
  | ISeparatorBlock
  | IPageBreakBlock
  | ITableBlock;

type PdfInlineRun = ITextRun | ITabRun | IBadgeRun | IInlineImageRun;

interface IParagraphContext {
  alignment?: RowFlex;
  rowMargin?: number;
  listMarker?: IListMarker;
}

interface IParagraphState {
  runs: PdfInlineRun[];
  context: IParagraphContext;
}

interface IListMarker {
  text: string;
  level: number;
}

interface IParagraphBlock {
  type: 'paragraph';
  runs: PdfInlineRun[];
  context: IParagraphContext;
}

interface IImageBlock {
  type: 'image';
  image: PDFImage;
  width: number;
  height: number;
  alignment?: RowFlex;
}

interface ISeparatorBlock {
  type: 'separator';
}

interface IPageBreakBlock {
  type: 'pageBreak';
}

interface ITableBlock {
  type: 'table';
  rows: ITableRowBlock[];
  colWidths: number[];
  borderType?: TableBorder;
  borderColor?: string;
  borderWidth?: number;
  borderExternalWidth?: number;
}

interface ITableRowBlock {
  height: number;
  cells: ITableCellBlock[];
}

interface ITableCellBlock {
  colspan: number;
  rowspan: number;
  blocks: PdfBlock[];
  colIndex: number;
  width: number;
  padding?: IPadding;
  verticalAlign?: VerticalAlign;
  backgroundColor?: string;
  borderColor?: string;
  borderTypes?: TdBorder[];
}

interface ITextRun {
  type: 'text';
  text: string;
  size: number;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  color?: string;
  highlight?: string;
  superscript?: boolean;
  subscript?: boolean;
}

interface ITabRun {
  type: 'tab';
  width: number;
}

interface IBadgeRun {
  type: 'badge';
  text: string;
  size: number;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  padding?: IPadding;
}

interface IInlineImageRun {
  type: 'image';
  image: PDFImage;
  width: number;
  height: number;
}

interface ILayoutLine {
  fragments: ILineFragment[];
  width: number;
  height: number;
}

interface ILineFragment {
  kind: 'text' | 'space' | 'badge' | 'tab' | 'image';
  width: number;
  height: number;
  run: PdfInlineRun;
}

interface IParagraphLayout {
  lines: ILayoutLine[];
  height: number;
  markerWidth: number;
  listIndent: number;
}

interface ITableLayout {
  rowHeights: number[];
  totalHeight: number;
}

interface IPageState {
  page: PDFPage;
  cursorY: number;
  isEmpty: boolean;
}

interface IFontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

interface IPdfContext {
  pdfDoc: PDFDocument;
  options: DeepRequired<IEditorOption>;
  fonts: Record<'sans' | 'serif' | 'mono', IFontSet>;
  pageWidth: number;
  pageHeight: number;
  margins: number[];
  contentWidth: number;
  headerTop: number;
  footerBottom: number;
  headerGap: number;
  footerGap: number;
  separatorGap: number;
  imageCache: Map<string, PDFImage>;
}

const DEFAULT_PDF_FILE_NAME = 'document.pdf';
const DEFAULT_IMAGE_WIDTH = 320;
const DEFAULT_IMAGE_HEIGHT = 180;
const DEFAULT_LINE_HEIGHT = 1.15;
const PAGE_REGION_GAP = 12;
const SEPARATOR_HEIGHT = 12;
const LIST_GAP = 8;
const FOOTER_MIN_BAR_HEIGHT = 29;
const PDF_TEXT_FALLBACKS: Record<string, string> = {
  '⊗': 'x',
  '☑': '[x]',
  '☒': '[x]',
  '☐': '[]',
  '✓': 'v',
  '✔': 'v',
  '✗': 'x',
  '✕': 'x',
  '◦': 'o',
  '▪': '*',
  '■': '*'
};
const pdfTextCache = new WeakMap<PDFFont, Map<string, string>>();

const bulletCharMap: Record<string, string> = {
  [UlStyle.DISC]: '•',
  [UlStyle.CIRCLE]: '◦',
  [UlStyle.SQUARE]: '■',
  [UlStyle.CHECKBOX]: '☑'
};

export async function exportEditorDataToPdf(
  payload: IEditorResult,
  options: IExportPdfOption = {}
) {
  const editorOptions = payload.options as DeepRequired<IEditorOption>;
  const pdfDoc = await PDFDocument.create();
  const context = await createPdfContext(pdfDoc, editorOptions);
  const headerBlocks = editorOptions.header.disabled
    ? []
    : await parseElementList(payload.data.header || [], context, editorOptions);
  const footerBlocks = editorOptions.footer.disabled
    ? []
    : await parseElementList(payload.data.footer || [], context, editorOptions);
  const mainBlocks = await parseElementList(
    payload.data.main,
    context,
    editorOptions
  );
  const headerHeight = measureBlocksHeight(
    headerBlocks,
    context.contentWidth,
    context
  );
  const footerHeight = measureBlocksHeight(
    footerBlocks,
    context.contentWidth,
    context
  );
  const footerBarHeight = getFooterBarHeight(footerHeight, context);
  const pageNumberHeight = getPageNumberHeight(editorOptions.pageNumber);
  const contentTop = Math.max(
    context.margins[0],
    context.headerTop +
      headerHeight +
      (headerBlocks.length ? context.headerGap : 0)
  );
  const contentBottom = Math.max(
    context.margins[2],
    context.footerBottom + footerBarHeight,
    getReservedPageNumberBottom(editorOptions.pageNumber, pageNumberHeight)
  );
  const pages = renderMainBlocks(
    mainBlocks,
    context,
    contentTop,
    contentBottom
  );
  renderPageDecorations(
    pages,
    context,
    headerBlocks,
    footerBlocks,
    headerHeight,
    footerHeight,
    footerBarHeight,
    editorOptions.pageNumber
  );
  const bytes = await pdfDoc.save();
  return {
    blob: new Blob([bytes], { type: 'application/pdf' }),
    fileName: normalizePdfFileName(options.fileName)
  };
}

async function createPdfContext(
  pdfDoc: PDFDocument,
  options: DeepRequired<IEditorOption>
): Promise<IPdfContext> {
  const [sans, sansBold, sansItalic, sansBoldItalic] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
  ]);
  const [serif, serifBold, serifItalic, serifBoldItalic] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.TimesRoman),
    pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
  ]);
  const [mono, monoBold, monoItalic, monoBoldItalic] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Courier),
    pdfDoc.embedFont(StandardFonts.CourierBold),
    pdfDoc.embedFont(StandardFonts.CourierOblique),
    pdfDoc.embedFont(StandardFonts.CourierBoldOblique)
  ]);
  const pageWidth =
    options.paperDirection === PaperDirection.HORIZONTAL
      ? pxToPt(options.height)
      : pxToPt(options.width);
  const pageHeight =
    options.paperDirection === PaperDirection.HORIZONTAL
      ? pxToPt(options.width)
      : pxToPt(options.height);
  const margins = options.margins.map(pxToPt);
  return {
    pdfDoc,
    options,
    fonts: {
      sans: {
        regular: sans,
        bold: sansBold,
        italic: sansItalic,
        boldItalic: sansBoldItalic
      },
      serif: {
        regular: serif,
        bold: serifBold,
        italic: serifItalic,
        boldItalic: serifBoldItalic
      },
      mono: {
        regular: mono,
        bold: monoBold,
        italic: monoItalic,
        boldItalic: monoBoldItalic
      }
    },
    pageWidth,
    pageHeight,
    margins,
    contentWidth: pageWidth - margins[1] - margins[3],
    headerTop: pxToPt(options.header.top),
    footerBottom: pxToPt(options.footer.bottom),
    headerGap: PAGE_REGION_GAP,
    footerGap: PAGE_REGION_GAP,
    separatorGap: SEPARATOR_HEIGHT,
    imageCache: new Map()
  };
}

async function parseElementList(
  elementList: IElement[],
  context: IPdfContext,
  options: DeepRequired<IEditorOption>
): Promise<PdfBlock[]> {
  const blocks: PdfBlock[] = [];
  let inlineBuffer: IElement[] = [];

  const flushInlineBuffer = async () => {
    if (!inlineBuffer.length) return;
    blocks.push(...(await parseInlineElements(inlineBuffer, context, options)));
    inlineBuffer = [];
  };

  for (let i = 0; i < elementList.length; i++) {
    const element = elementList[i];
    if (element.type === ElementType.AREA && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(
        ...(await parseElementList(element.valueList, context, options))
      );
      continue;
    }
    if (element.type === ElementType.TITLE && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(
        ...(await parseInlineElements(element.valueList, context, options, {
          alignment: element.rowFlex,
          rowMargin: element.rowMargin,
          listMarker: undefined,
          titleLevel: element.level || TitleLevel.FIRST
        }))
      );
      continue;
    }
    if (element.type === ElementType.LIST && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(...(await parseListBlock(element, context, options)));
      continue;
    }
    if (element.type === ElementType.TABLE && element.trList?.length) {
      await flushInlineBuffer();
      blocks.push(await parseTableBlock(element, context, options));
      continue;
    }
    if (element.type === ElementType.PAGE_BREAK) {
      await flushInlineBuffer();
      blocks.push({ type: 'pageBreak' });
      continue;
    }
    if (element.type === ElementType.SEPARATOR) {
      await flushInlineBuffer();
      blocks.push({ type: 'separator' });
      continue;
    }
    if (
      element.type === ElementType.IMAGE &&
      element.imgDisplay &&
      element.imgDisplay !== 'inline'
    ) {
      await flushInlineBuffer();
      const imageBlock = await createImageBlock(element, context);
      if (imageBlock) {
        blocks.push(imageBlock);
      }
      continue;
    }
    if (element.type === ElementType.BLOCK) {
      await flushInlineBuffer();
      const blockText = getBlockFallbackText(element);
      if (blockText) {
        blocks.push(
          ...(await parseInlineElements(
            [{ value: blockText }],
            context,
            options
          ))
        );
      }
      continue;
    }
    inlineBuffer.push(element);
  }

  await flushInlineBuffer();
  return blocks;
}

async function parseInlineElements(
  elementList: IElement[],
  context: IPdfContext,
  options: DeepRequired<IEditorOption>,
  overrides: IParagraphContext & { titleLevel?: TitleLevel } = {}
): Promise<PdfBlock[]> {
  const paragraphs: PdfBlock[] = [];
  let current: IParagraphState | null = null;

  const getParagraphContext = (element?: IElement): IParagraphContext => ({
    alignment:
      overrides.alignment !== undefined
        ? overrides.alignment
        : element?.rowFlex,
    rowMargin:
      overrides.rowMargin !== undefined
        ? overrides.rowMargin
        : element?.rowMargin,
    listMarker: overrides.listMarker
  });

  const ensureParagraph = (element?: IElement) => {
    if (!current) {
      current = {
        runs: [],
        context: getParagraphContext(element)
      };
    }
    return current;
  };

  const flushParagraph = (contextValue?: IParagraphContext) => {
    if (!current) {
      if (!contextValue) return;
      paragraphs.push({
        type: 'paragraph',
        runs: [],
        context: contextValue
      });
      return;
    }
    paragraphs.push({
      type: 'paragraph',
      runs: current.runs,
      context: current.context
    });
    current = null;
  };

  const appendText = (
    element: IElement,
    text: string,
    factory: (segment: string) => PdfInlineRun,
    preserveTrailingBreak = false
  ) => {
    const normalized = normalizeText(text);
    const parts = normalized.split('\n');
    let lastSeparatorFlushedContent = false;
    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      if (segment) {
        ensureParagraph(element).runs.push(factory(segment));
      }
      if (i < parts.length - 1) {
        if (!current) {
          paragraphs.push({
            type: 'paragraph',
            runs: [],
            context: getParagraphContext(element)
          });
          lastSeparatorFlushedContent = false;
        } else {
          flushParagraph();
          lastSeparatorFlushedContent = true;
        }
      }
    }
    if (
      preserveTrailingBreak &&
      normalized.endsWith('\n') &&
      lastSeparatorFlushedContent
    ) {
      paragraphs.push({
        type: 'paragraph',
        runs: [],
        context: getParagraphContext(element)
      });
    }
  };

  for (let i = 0; i < elementList.length; i++) {
    const element = elementList[i];

    if (element.type === ElementType.HYPERLINK && element.valueList?.length) {
      const children = element.valueList || [];
      for (let childIndex = 0; childIndex < children.length; childIndex++) {
        const child = children[childIndex];
        const text = normalizeText(getInlineElementText(child));
        if (!text) continue;
        appendText(
          element,
          text,
          segment => {
            const run = createTextRun(
              child,
              options,
              overrides.titleLevel,
              segment
            );
            run.color = run.color || options.defaultHyperlinkColor;
            run.underline = true;
            return run;
          },
          i === elementList.length - 1 && childIndex === children.length - 1
        );
      }
      continue;
    }

    if (element.type === ElementType.IMAGE) {
      const imageRun = await createInlineImageRun(element, context);
      if (imageRun) {
        ensureParagraph(element).runs.push(imageRun);
      }
      continue;
    }

    if (element.type === ElementType.COLUMN_BREAK) {
      flushParagraph(getParagraphContext(element));
      continue;
    }

    if (element.type === ElementType.PAGE_BREAK) {
      flushParagraph();
      paragraphs.push({ type: 'pageBreak' });
      continue;
    }

    if (element.type === ElementType.TAB) {
      ensureParagraph(element).runs.push({
        type: 'tab',
        width: pxToPt(options.defaultTabWidth)
      });
      continue;
    }

    if (element.type === ElementType.LABEL) {
      const badgeRun = createBadgeRun(element, options, overrides.titleLevel);
      ensureParagraph(element).runs.push(badgeRun);
      continue;
    }

    const textValue = getInlineElementText(element);
    if (!textValue) {
      continue;
    }
    appendText(
      element,
      textValue,
      segment => createTextRun(element, options, overrides.titleLevel, segment),
      i === elementList.length - 1
    );
  }

  if (current) {
    flushParagraph();
  }

  return paragraphs.length
    ? paragraphs
    : [
        {
          type: 'paragraph',
          runs: [],
          context: getParagraphContext()
        }
      ];
}

async function parseListBlock(
  element: IElement,
  context: IPdfContext,
  options: DeepRequired<IEditorOption>
) {
  const zipList = zipElementList(element.valueList || []);
  const listItemMap = splitListElement(zipList);
  const blocks: PdfBlock[] = [];
  const orderedCounts = Array(9).fill(0);

  for (const listItemElements of listItemMap.values()) {
    const itemElement = getListItemNumberingElement(listItemElements, element);
    const marker = getListMarker(itemElement, orderedCounts);
    blocks.push(
      ...(await parseInlineElements(listItemElements, context, options, {
        alignment: itemElement.rowFlex,
        rowMargin: itemElement.rowMargin,
        listMarker: marker
      }))
    );
  }

  return blocks;
}

async function parseTableBlock(
  element: IElement,
  context: IPdfContext,
  options: DeepRequired<IEditorOption>
): Promise<ITableBlock> {
  const placements = computeTableCellPlacement(
    element.trList || [],
    element.colgroup || []
  );
  const rows: ITableRowBlock[] = [];
  for (let rowIndex = 0; rowIndex < (element.trList || []).length; rowIndex++) {
    const tr = element.trList![rowIndex];
    const cells: ITableCellBlock[] = [];
    for (let cellIndex = 0; cellIndex < tr.tdList.length; cellIndex++) {
      const td = tr.tdList[cellIndex];
      const placement = placements.get(td);
      cells.push({
        colspan: td.colspan,
        rowspan: td.rowspan,
        blocks: await parseElementList(td.value, context, options),
        colIndex: placement?.colIndex || 0,
        width: placement?.width || td.width || 0,
        padding: td.padding || options.table.tdPadding,
        verticalAlign: td.verticalAlign,
        backgroundColor: td.backgroundColor,
        borderColor: td.borderColor,
        borderTypes: td.borderTypes
      });
    }
    rows.push({
      height: Math.max(tr.height || 0, options.table.defaultTrMinHeight),
      cells
    });
  }
  return {
    type: 'table',
    rows,
    colWidths: (element.colgroup || []).map(col => col.width),
    borderType: element.borderType,
    borderColor: element.borderColor || options.table.defaultBorderColor,
    borderWidth: element.borderWidth || 1,
    borderExternalWidth: element.borderExternalWidth
  };
}

async function createImageBlock(
  element: IElement,
  context: IPdfContext
): Promise<IImageBlock | null> {
  const image = await loadPdfImage(element.value, context);
  if (!image) {
    return null;
  }
  return {
    type: 'image',
    image,
    width: pxToPt(
      Math.max(1, Math.round(element.width || DEFAULT_IMAGE_WIDTH))
    ),
    height: pxToPt(
      Math.max(1, Math.round(element.height || DEFAULT_IMAGE_HEIGHT))
    ),
    alignment: element.rowFlex
  };
}

async function createInlineImageRun(
  element: IElement,
  context: IPdfContext
): Promise<IInlineImageRun | null> {
  const image = await loadPdfImage(element.value, context);
  if (!image) {
    return null;
  }
  return {
    type: 'image',
    image,
    width: pxToPt(
      Math.max(1, Math.round(element.width || DEFAULT_IMAGE_WIDTH))
    ),
    height: pxToPt(
      Math.max(1, Math.round(element.height || DEFAULT_IMAGE_HEIGHT))
    )
  };
}

function createTextRun(
  element: IElement,
  options: DeepRequired<IEditorOption>,
  titleLevel: TitleLevel | undefined,
  text: string
): ITextRun {
  const titleSize = getTitleSize(titleLevel, options);
  const size = element.size || titleSize || options.defaultSize;
  const isTitle = !!titleLevel;
  return {
    type: 'text',
    text,
    size,
    font: element.font || options.defaultFont,
    bold: isTitle ? true : !!element.bold,
    italic: !!element.italic,
    underline: !!element.underline,
    strikeout: !!element.strikeout,
    color: element.color || (isTitle ? '#000000' : undefined),
    highlight: element.highlight,
    superscript: element.type === ElementType.SUPERSCRIPT,
    subscript: element.type === ElementType.SUBSCRIPT
  };
}

function createBadgeRun(
  element: IElement,
  options: DeepRequired<IEditorOption>,
  titleLevel: TitleLevel | undefined
): IBadgeRun {
  const titleSize = getTitleSize(titleLevel, options);
  return {
    type: 'badge',
    text: element.value,
    size: element.size || titleSize || options.defaultSize,
    font: element.font || options.defaultFont,
    bold: titleLevel ? true : !!element.bold,
    italic: !!element.italic,
    underline: !!element.underline,
    strikeout: !!element.strikeout,
    color: element.label?.color || element.color,
    backgroundColor: element.label?.backgroundColor,
    borderColor: element.label?.borderColor,
    padding: element.label?.padding || [2, 4, 2, 4]
  };
}

function renderMainBlocks(
  blocks: PdfBlock[],
  context: IPdfContext,
  contentTop: number,
  contentBottom: number
) {
  const pages: IPageState[] = [];
  const contentEnd = context.pageHeight - contentBottom;

  const createPage = () => {
    const page = context.pdfDoc.addPage([
      context.pageWidth,
      context.pageHeight
    ]);
    const state: IPageState = {
      page,
      cursorY: contentTop,
      isEmpty: true
    };
    pages.push(state);
    return state;
  };

  let currentPage = createPage();

  const ensureSpace = (height: number) => {
    if (currentPage.cursorY + height <= contentEnd || currentPage.isEmpty) {
      return;
    }
    currentPage = createPage();
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'pageBreak') {
      currentPage = createPage();
      continue;
    }

    if (block.type === 'paragraph') {
      currentPage = renderParagraphAcrossPages(
        block,
        currentPage,
        pages,
        context,
        contentTop,
        contentEnd
      );
      continue;
    }

    if (block.type === 'separator') {
      ensureSpace(context.separatorGap);
      renderSeparator(
        currentPage.page,
        context,
        currentPage.cursorY,
        context.margins[3],
        context.contentWidth
      );
      currentPage.cursorY += context.separatorGap;
      currentPage.isEmpty = false;
      continue;
    }

    if (block.type === 'image') {
      ensureSpace(block.height);
      renderImageBlock(currentPage.page, block, context, currentPage.cursorY);
      currentPage.cursorY += block.height;
      currentPage.isEmpty = false;
      continue;
    }

    const tableLayout = layoutTable(block, context.contentWidth, context);
    currentPage = renderTableAcrossPages(
      block,
      tableLayout,
      currentPage,
      pages,
      context,
      contentTop,
      contentEnd
    );
  }

  return pages;
}

function renderParagraphAcrossPages(
  block: IParagraphBlock,
  currentPage: IPageState,
  pages: IPageState[],
  context: IPdfContext,
  contentTop: number,
  contentEnd: number
) {
  const layout = layoutParagraph(block, context.contentWidth, context);
  for (let lineIndex = 0; lineIndex < layout.lines.length; lineIndex++) {
    const line = layout.lines[lineIndex];
    if (
      currentPage.cursorY + line.height > contentEnd &&
      !currentPage.isEmpty
    ) {
      const page = context.pdfDoc.addPage([
        context.pageWidth,
        context.pageHeight
      ]);
      currentPage = {
        page,
        cursorY: contentTop,
        isEmpty: true
      };
      pages.push(currentPage);
    }
    renderParagraphLine(
      currentPage.page,
      block,
      line,
      lineIndex === 0,
      layout,
      context,
      currentPage.cursorY,
      context.margins[3],
      context.contentWidth
    );
    currentPage.cursorY += line.height;
    currentPage.isEmpty = false;
  }
  return currentPage;
}

function renderTableAcrossPages(
  block: ITableBlock,
  tableLayout: ITableLayout,
  currentPage: IPageState,
  pages: IPageState[],
  context: IPdfContext,
  contentTop: number,
  contentEnd: number
) {
  const scaledColWidths = scaleColumnWidths(
    block.colWidths,
    context.contentWidth
  );
  let tableTop = currentPage.cursorY;

  for (let rowIndex = 0; rowIndex < block.rows.length; rowIndex++) {
    const row = block.rows[rowIndex];
    const rowHeight = tableLayout.rowHeights[rowIndex];
    const spanHeight = getSpanningRowHeight(
      block.rows,
      tableLayout.rowHeights,
      rowIndex
    );
    if (currentPage.cursorY + spanHeight > contentEnd && !currentPage.isEmpty) {
      const page = context.pdfDoc.addPage([
        context.pageWidth,
        context.pageHeight
      ]);
      currentPage = {
        page,
        cursorY: contentTop,
        isEmpty: true
      };
      pages.push(currentPage);
      tableTop = currentPage.cursorY;
    }

    const rowTop = currentPage.cursorY;
    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
      const cell = row.cells[cellIndex];
      const cellX =
        context.margins[3] + getColumnOffset(scaledColWidths, cell.colIndex);
      const cellWidth = getColumnSpanWidth(
        scaledColWidths,
        cell.colIndex,
        cell.colspan
      );
      const cellHeight = getRowSpanHeight(
        tableLayout.rowHeights,
        rowIndex,
        cell.rowspan
      );
      renderTableCell(
        currentPage.page,
        cell,
        context,
        block,
        cellX,
        rowTop,
        cellWidth,
        cellHeight
      );
    }
    currentPage.cursorY += rowHeight;
    currentPage.isEmpty = false;
  }

  return currentPage;
}

function renderPageDecorations(
  pages: IPageState[],
  context: IPdfContext,
  headerBlocks: PdfBlock[],
  footerBlocks: PdfBlock[],
  headerHeight: number,
  footerHeight: number,
  footerBarHeight: number,
  pageNumber: IPageNumber
) {
  const totalPages = pages.length;
  for (let index = 0; index < pages.length; index++) {
    const pageState = pages[index];
    if (headerBlocks.length) {
      renderBlocksInRegion(
        pageState.page,
        headerBlocks,
        context,
        context.margins[3],
        context.headerTop,
        context.contentWidth
      );
    }
    if (footerBarHeight > 0) {
      if (context.options.footer.backgroundColor) {
        pageState.page.drawRectangle({
          x: 0,
          y: context.footerBottom,
          width: context.pageWidth,
          height: footerBarHeight,
          color: toPdfColor(context.options.footer.backgroundColor, '#FFFFFF')
        });
      }
      if (footerBlocks.length) {
        const footerTop =
          context.pageHeight - context.footerBottom - footerBarHeight;
        const footerContentTop =
          footerTop + Math.max(0, (footerBarHeight - footerHeight) / 2);
        renderBlocksInRegion(
          pageState.page,
          footerBlocks,
          context,
          context.margins[3],
          footerContentTop,
          context.contentWidth
        );
      }
    }
    renderPageNumber(pageState.page, context, pageNumber, index, totalPages);
  }
}

function renderBlocksInRegion(
  page: PDFPage,
  blocks: PdfBlock[],
  context: IPdfContext,
  x: number,
  top: number,
  width: number
) {
  let cursorY = top;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'pageBreak') {
      continue;
    }
    if (block.type === 'paragraph') {
      const layout = layoutParagraph(block, width, context);
      for (let lineIndex = 0; lineIndex < layout.lines.length; lineIndex++) {
        const line = layout.lines[lineIndex];
        renderParagraphLine(
          page,
          block,
          line,
          lineIndex === 0,
          layout,
          context,
          cursorY,
          x,
          width
        );
        cursorY += line.height;
      }
      continue;
    }
    if (block.type === 'separator') {
      renderSeparator(page, context, cursorY, x, width);
      cursorY += context.separatorGap;
      continue;
    }
    if (block.type === 'image') {
      renderImageBlock(page, block, context, cursorY, x, width);
      cursorY += block.height;
      continue;
    }
    const tableLayout = layoutTable(block, width, context);
    const scaledColWidths = scaleColumnWidths(block.colWidths, width);
    for (let rowIndex = 0; rowIndex < block.rows.length; rowIndex++) {
      const row = block.rows[rowIndex];
      const rowTop = cursorY;
      for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        const cell = row.cells[cellIndex];
        const cellX = x + getColumnOffset(scaledColWidths, cell.colIndex);
        const cellWidth = getColumnSpanWidth(
          scaledColWidths,
          cell.colIndex,
          cell.colspan
        );
        const cellHeight = getRowSpanHeight(
          tableLayout.rowHeights,
          rowIndex,
          cell.rowspan
        );
        renderTableCell(
          page,
          cell,
          context,
          block,
          cellX,
          rowTop,
          cellWidth,
          cellHeight
        );
      }
      cursorY += tableLayout.rowHeights[rowIndex];
    }
  }
}

function renderParagraphLine(
  page: PDFPage,
  block: IParagraphBlock,
  line: ILayoutLine,
  isFirstLine: boolean,
  layout: IParagraphLayout,
  context: IPdfContext,
  top: number,
  baseX: number,
  regionWidth: number
) {
  const alignment = normalizeAlignment(block.context.alignment);
  const lineWidth = line.width;
  const availableWidth = Math.max(
    1,
    regionWidth - layout.listIndent - layout.markerWidth
  );
  const justifyExtra =
    alignment === RowFlex.JUSTIFY && !isLastParagraphLine(layout, line)
      ? getJustifyExtra(line, availableWidth)
      : 0;
  let offsetX = 0;
  if (alignment === RowFlex.CENTER) {
    offsetX = (availableWidth - lineWidth) / 2;
  } else if (alignment === RowFlex.RIGHT) {
    offsetX = availableWidth - lineWidth;
  }

  const lineStart =
    baseX + layout.listIndent + layout.markerWidth + Math.max(0, offsetX);

  if (isFirstLine && block.context.listMarker) {
    const markerRun = getMarkerRun(block, context);
    const markerText = block.context.listMarker.text;
    drawTextRun(
      page,
      markerRun,
      markerText,
      baseX + layout.listIndent,
      top,
      line.height,
      context
    );
  }

  let cursorX = lineStart;
  for (let index = 0; index < line.fragments.length; index++) {
    const fragment = line.fragments[index];
    if (fragment.kind === 'space' && justifyExtra > 0) {
      cursorX += justifyExtra;
    }
    drawLineFragment(page, fragment, cursorX, top, line.height, context);
    cursorX += fragment.width;
  }
}

function renderSeparator(
  page: PDFPage,
  context: IPdfContext,
  top: number,
  x: number,
  width: number
) {
  const lineY = toPdfY(context.pageHeight, top + SEPARATOR_HEIGHT / 2);
  page.drawLine({
    start: { x, y: lineY },
    end: { x: x + width, y: lineY },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6)
  });
}

function renderImageBlock(
  page: PDFPage,
  block: IImageBlock,
  context: IPdfContext,
  top: number,
  baseX = context.margins[3],
  width = context.contentWidth
) {
  const alignment = normalizeAlignment(block.alignment);
  let x = baseX;
  if (alignment === RowFlex.CENTER) {
    x += Math.max(0, (width - block.width) / 2);
  } else if (alignment === RowFlex.RIGHT) {
    x += Math.max(0, width - block.width);
  }
  page.drawImage(block.image, {
    x,
    y: toPdfY(context.pageHeight, top, block.height),
    width: block.width,
    height: block.height
  });
}

function renderTableCell(
  page: PDFPage,
  cell: ITableCellBlock,
  context: IPdfContext,
  table: ITableBlock,
  x: number,
  top: number,
  width: number,
  height: number
) {
  if (cell.backgroundColor) {
    page.drawRectangle({
      x,
      y: toPdfY(context.pageHeight, top, height),
      width,
      height,
      color: toPdfColor(cell.backgroundColor)
    });
  }

  drawTableCellBorders(page, cell, context, table, x, top, width, height);

  const padding = getPadding(cell.padding || defaultTableOption.tdPadding).map(
    pxToPt
  );
  const contentWidth = Math.max(1, width - padding[1] - padding[3]);
  const contentHeight = measureBlocksHeight(cell.blocks, contentWidth, context);
  let contentTop = top + padding[0];
  if (cell.verticalAlign === VerticalAlign.CENTER) {
    contentTop = top + (height - contentHeight) / 2;
  } else if (cell.verticalAlign === VerticalAlign.BOTTOM) {
    contentTop = top + height - contentHeight - padding[2];
  }
  renderBlocksInRegion(
    page,
    cell.blocks,
    context,
    x + padding[3],
    contentTop,
    contentWidth
  );
}

function renderPageNumber(
  page: PDFPage,
  context: IPdfContext,
  pageNumber: IPageNumber,
  pageIndex: number,
  totalPages: number
) {
  if (
    pageNumber.disabled ||
    pageIndex < pageNumber.fromPageNo ||
    (Number.isInteger(pageNumber.maxPageNo) &&
      pageIndex >= pageNumber.maxPageNo!)
  ) {
    return;
  }
  let text = pageNumber.format || FORMAT_PLACEHOLDER.PAGE_NO;
  const currentValue =
    pageIndex + pageNumber.startPageNo - pageNumber.fromPageNo;
  const totalValue = totalPages - pageNumber.fromPageNo;
  text = text.replace(
    new RegExp(FORMAT_PLACEHOLDER.PAGE_NO, 'g'),
    `${currentValue}`
  );
  text = text.replace(
    new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT, 'g'),
    `${Math.max(0, totalValue)}`
  );
  const font = getFont(
    pageNumber.font || context.options.defaultFont,
    false,
    false,
    context
  );
  const size = pageNumber.size || 12;
  const bottom = pxToPt(pageNumber.bottom || 0);
  const safeText = sanitizeTextForPdf(text, font);
  const width = font.widthOfTextAtSize(safeText, size);
  const descenderHeight = Math.max(
    0,
    font.heightAtSize(size) - font.heightAtSize(size, { descender: false })
  );
  let x = context.margins[3];
  const alignment = normalizeAlignment(pageNumber.rowFlex);
  if (alignment === RowFlex.CENTER) {
    x = (context.pageWidth - width) / 2;
  } else if (alignment === RowFlex.RIGHT) {
    x = context.pageWidth - context.margins[1] - width;
  }
  page.drawText(safeText, {
    x,
    // Canvas draw uses the alphabetic baseline at `pageHeight - bottom`.
    // pdf-lib positions text from the text box bottom, so compensate by the
    // descender height to keep the baseline aligned.
    y: bottom - descenderHeight,
    size,
    font,
    color: toPdfColor(pageNumber.color, '#000000')
  });
}

function layoutParagraph(
  block: IParagraphBlock,
  width: number,
  context: IPdfContext
): IParagraphLayout {
  const markerWidth = getMarkerWidth(block, context);
  const listIndent = block.context.listMarker
    ? pxToPt(block.context.listMarker.level * INDENT_PER_LEVEL)
    : 0;
  const availableWidth = Math.max(1, width - listIndent - markerWidth);
  const tokens = tokenizeParagraphRuns(block.runs, context);
  const lines: ILayoutLine[] = [];
  let line: ILayoutLine = {
    fragments: [],
    width: 0,
    height: getEmptyLineHeight(block, context)
  };

  const commitLine = () => {
    trimTrailingSpaces(line);
    lines.push(line);
    line = {
      fragments: [],
      width: 0,
      height: getEmptyLineHeight(block, context)
    };
  };

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    if (token.kind === 'space' && !line.fragments.length) {
      continue;
    }
    if (
      token.width > availableWidth &&
      token.kind === 'text' &&
      token.run.type === 'text'
    ) {
      const segments = splitTextToken(token, availableWidth, context);
      for (
        let segmentIndex = 0;
        segmentIndex < segments.length;
        segmentIndex++
      ) {
        tokens.splice(i + segmentIndex, 0, segments[segmentIndex]);
      }
      continue;
    }
    if (line.width + token.width > availableWidth && line.fragments.length) {
      commitLine();
      i--;
      continue;
    }
    line.fragments.push(token);
    line.width += token.width;
    line.height = Math.max(line.height, token.height);
  }

  if (line.fragments.length || !lines.length) {
    commitLine();
  }

  return {
    lines,
    height: lines.reduce((sum, current) => sum + current.height, 0),
    markerWidth,
    listIndent
  };
}

function tokenizeParagraphRuns(runs: PdfInlineRun[], context: IPdfContext) {
  const fragments: ILineFragment[] = [];
  for (let index = 0; index < runs.length; index++) {
    const run = runs[index];
    if (run.type === 'tab') {
      fragments.push({
        kind: 'tab',
        width: run.width,
        height: 0,
        run
      });
      continue;
    }
    if (run.type === 'image') {
      fragments.push({
        kind: 'image',
        width: run.width,
        height: run.height,
        run
      });
      continue;
    }
    if (run.type === 'badge') {
      const badgeWidth = measureBadgeWidth(run, context);
      const badgeHeight = measureBadgeHeight(run);
      fragments.push({
        kind: 'badge',
        width: badgeWidth,
        height: badgeHeight,
        run
      });
      continue;
    }
    const parts = run.text.split(/(\s+)/);
    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
      const part = parts[partIndex];
      if (!part) continue;
      const isWhitespace = /^\s+$/.test(part);
      fragments.push({
        kind: isWhitespace ? 'space' : 'text',
        width: measureTextWidth(part, run, context),
        height: getRunHeight(run),
        run: { ...run, text: part }
      });
    }
  }
  return fragments;
}

function splitTextToken(
  token: ILineFragment,
  availableWidth: number,
  context: IPdfContext
) {
  if (token.run.type !== 'text') {
    return [token];
  }
  const chars = splitText(token.run.text);
  const result: ILineFragment[] = [];
  let current = '';
  for (let i = 0; i < chars.length; i++) {
    const next = current + chars[i];
    const width = measureTextWidth(next, token.run, context);
    if (width > availableWidth && current) {
      result.push({
        kind: 'text',
        width: measureTextWidth(current, token.run, context),
        height: getRunHeight(token.run),
        run: { ...token.run, text: current }
      });
      current = chars[i];
    } else {
      current = next;
    }
  }
  if (current) {
    result.push({
      kind: /^\s+$/.test(current) ? 'space' : 'text',
      width: measureTextWidth(current, token.run, context),
      height: getRunHeight(token.run),
      run: { ...token.run, text: current }
    });
  }
  return result.length ? result : [token];
}

function trimTrailingSpaces(line: ILayoutLine) {
  while (
    line.fragments.length &&
    line.fragments[line.fragments.length - 1].kind === 'space'
  ) {
    const fragment = line.fragments.pop()!;
    line.width -= fragment.width;
  }
}

function layoutTable(
  table: ITableBlock,
  width: number,
  context: IPdfContext
): ITableLayout {
  const rowHeights = table.rows.map(row =>
    Math.max(
      pxToPt(row.height),
      pxToPt(context.options.table.defaultTrMinHeight)
    )
  );
  const scaledColWidths = scaleColumnWidths(table.colWidths, width);

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const row = table.rows[rowIndex];
    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
      const cell = row.cells[cellIndex];
      const cellWidth = getColumnSpanWidth(
        scaledColWidths,
        cell.colIndex,
        cell.colspan
      );
      const padding = getPadding(
        cell.padding || defaultTableOption.tdPadding
      ).map(pxToPt);
      const contentWidth = Math.max(1, cellWidth - padding[1] - padding[3]);
      const contentHeight =
        measureBlocksHeight(cell.blocks, contentWidth, context) +
        padding[0] +
        padding[2];
      const spanHeight = getRowSpanHeight(rowHeights, rowIndex, cell.rowspan);
      if (contentHeight > spanHeight) {
        rowHeights[rowIndex + cell.rowspan - 1] += contentHeight - spanHeight;
      }
    }
  }

  return {
    rowHeights,
    totalHeight: rowHeights.reduce((sum, height) => sum + height, 0)
  };
}

function measureBlocksHeight(
  blocks: PdfBlock[],
  width: number,
  context: IPdfContext
) {
  let height = 0;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'pageBreak') {
      continue;
    }
    if (block.type === 'paragraph') {
      height += layoutParagraph(block, width, context).height;
      continue;
    }
    if (block.type === 'separator') {
      height += context.separatorGap;
      continue;
    }
    if (block.type === 'image') {
      height += block.height;
      continue;
    }
    height += layoutTable(block, width, context).totalHeight;
  }
  return height;
}

function drawLineFragment(
  page: PDFPage,
  fragment: ILineFragment,
  x: number,
  top: number,
  lineHeight: number,
  context: IPdfContext
) {
  if (fragment.run.type === 'tab') {
    return;
  }
  if (fragment.run.type === 'image') {
    const imageTop = top + (lineHeight - fragment.run.height) / 2;
    page.drawImage(fragment.run.image, {
      x,
      y: toPdfY(context.pageHeight, imageTop, fragment.run.height),
      width: fragment.run.width,
      height: fragment.run.height
    });
    return;
  }
  if (fragment.run.type === 'badge') {
    const badgeHeight = measureBadgeHeight(fragment.run);
    const badgeTop = top + (lineHeight - badgeHeight) / 2;
    const padding = getPadding(fragment.run.padding || [2, 4, 2, 4]).map(
      pxToPt
    );
    page.drawRectangle({
      x,
      y: toPdfY(context.pageHeight, badgeTop, badgeHeight),
      width: fragment.width,
      height: badgeHeight,
      color: toPdfColor(fragment.run.backgroundColor, '#FFFFFF'),
      borderColor: fragment.run.borderColor
        ? toPdfColor(fragment.run.borderColor)
        : undefined,
      borderWidth: fragment.run.borderColor ? 0.75 : undefined
    });
    drawTextRun(
      page,
      fragment.run,
      fragment.run.text,
      x + padding[3],
      badgeTop + padding[0],
      badgeHeight - padding[0] - padding[2],
      context
    );
    return;
  }
  if (fragment.run.type !== 'text') {
    return;
  }
  drawTextRun(
    page,
    fragment.run,
    fragment.run.text,
    x,
    top,
    lineHeight,
    context
  );
}

function drawTextRun(
  page: PDFPage,
  run: ITextRun | IBadgeRun,
  text: string,
  x: number,
  top: number,
  lineHeight: number,
  context: IPdfContext
) {
  const resolved = resolveTextMetrics(run, context);
  const safeText = sanitizeTextForPdf(text, resolved.font);
  let textTop = top + (lineHeight - resolved.size) / 2;
  if (run.type === 'text' && run.superscript) {
    textTop -= resolved.size * 0.25;
  }
  if (run.type === 'text' && run.subscript) {
    textTop += resolved.size * 0.2;
  }
  const textY = toPdfY(context.pageHeight, textTop, resolved.size);
  if ('highlight' in run && run.highlight) {
    page.drawRectangle({
      x,
      y: textY,
      width: resolved.font.widthOfTextAtSize(safeText, resolved.size),
      height: resolved.size * 1.05,
      color: toPdfColor(run.highlight)
    });
  }
  page.drawText(safeText, {
    x,
    y: textY,
    size: resolved.size,
    font: resolved.font,
    color: toPdfColor(run.color, '#000000')
  });
  const textWidth = resolved.font.widthOfTextAtSize(safeText, resolved.size);
  if (run.underline) {
    const underlineY = textY - 1;
    page.drawLine({
      start: { x, y: underlineY },
      end: { x: x + textWidth, y: underlineY },
      thickness: 0.75,
      color: toPdfColor(run.color, '#000000')
    });
  }
  if (run.strikeout) {
    const strikeY = textY + resolved.size * 0.35;
    page.drawLine({
      start: { x, y: strikeY },
      end: { x: x + textWidth, y: strikeY },
      thickness: 0.75,
      color: toPdfColor(run.color, '#000000')
    });
  }
}

function drawTableCellBorders(
  page: PDFPage,
  cell: ITableCellBlock,
  context: IPdfContext,
  table: ITableBlock,
  x: number,
  top: number,
  width: number,
  height: number
) {
  const tableColor =
    table.borderColor || context.options.table.defaultBorderColor;
  const innerWidth = table.borderWidth || 1;
  const outerWidth = table.borderExternalWidth || innerWidth;
  const color = cell.borderColor || tableColor;
  const isEmpty = table.borderType === TableBorder.EMPTY;
  const isExternal = table.borderType === TableBorder.EXTERNAL;
  const isInternal = table.borderType === TableBorder.INTERNAL;
  const isDash = table.borderType === TableBorder.DASH;
  const dashArray = isDash ? [3, 3] : undefined;
  const lineColor = toPdfColor(color, '#000000');
  const bottomY = toPdfY(context.pageHeight, top, height);
  const topY = toPdfY(context.pageHeight, top);
  const rightX = x + width;

  const drawEdge = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    thickness: number
  ) => {
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      thickness,
      color: lineColor,
      dashArray
    });
  };

  if (cell.borderTypes?.length) {
    if (cell.borderTypes.includes(TdBorder.TOP)) {
      drawEdge(x, topY, rightX, topY, innerWidth);
    }
    if (cell.borderTypes.includes(TdBorder.RIGHT)) {
      drawEdge(rightX, topY, rightX, bottomY, innerWidth);
    }
    if (cell.borderTypes.includes(TdBorder.BOTTOM)) {
      drawEdge(x, bottomY, rightX, bottomY, innerWidth);
    }
    if (cell.borderTypes.includes(TdBorder.LEFT)) {
      drawEdge(x, topY, x, bottomY, innerWidth);
    }
  }

  if (cell.borderColor && !cell.borderTypes?.length) {
    drawEdge(x, topY, rightX, topY, innerWidth);
    drawEdge(rightX, topY, rightX, bottomY, innerWidth);
    drawEdge(x, bottomY, rightX, bottomY, innerWidth);
    drawEdge(x, topY, x, bottomY, innerWidth);
    return;
  }

  if (isEmpty) {
    return;
  }

  if (!isInternal) {
    drawEdge(x, topY, rightX, topY, outerWidth);
    drawEdge(x, topY, x, bottomY, outerWidth);
    drawEdge(rightX, topY, rightX, bottomY, outerWidth);
    drawEdge(x, bottomY, rightX, bottomY, outerWidth);
    if (isExternal) {
      return;
    }
  }

  drawEdge(rightX, topY, rightX, bottomY, innerWidth);
  drawEdge(x, bottomY, rightX, bottomY, innerWidth);
}

function getMarkerWidth(block: IParagraphBlock, context: IPdfContext) {
  if (!block.context.listMarker) {
    return 0;
  }
  const markerRun = getMarkerRun(block, context);
  return (
    measureTextWidth(block.context.listMarker.text, markerRun, context) +
    pxToPt(LIST_GAP)
  );
}

function getMarkerRun(block: IParagraphBlock, context: IPdfContext): ITextRun {
  const firstTextRun =
    block.runs.find(run => run.type === 'text' || run.type === 'badge') || null;
  if (!firstTextRun) {
    return {
      type: 'text',
      text: '',
      size: context.options.defaultSize,
      font: context.options.defaultFont
    };
  }
  if (firstTextRun.type === 'badge') {
    return {
      type: 'text',
      text: firstTextRun.text,
      size: firstTextRun.size,
      font: firstTextRun.font,
      bold: firstTextRun.bold,
      italic: firstTextRun.italic,
      color: firstTextRun.color
    };
  }
  return firstTextRun;
}

function getEmptyLineHeight(block: IParagraphBlock, context: IPdfContext) {
  const markerRun = getMarkerRun(block, context);
  return getRunHeight(
    markerRun,
    block.context.rowMargin || context.options.defaultRowMargin
  );
}

function getRunHeight(
  run: ITextRun | IBadgeRun,
  rowMargin = DEFAULT_LINE_HEIGHT
) {
  return run.size * rowMargin;
}

function resolveTextMetrics(run: ITextRun | IBadgeRun, context: IPdfContext) {
  let size = run.size || context.options.defaultSize;
  if ('superscript' in run && run.superscript) {
    size *= 0.65;
  }
  if ('subscript' in run && run.subscript) {
    size *= 0.65;
  }
  return {
    size,
    font: getFont(
      run.font || context.options.defaultFont,
      !!run.bold,
      !!run.italic,
      context
    )
  };
}

function measureTextWidth(
  text: string,
  run: ITextRun | IBadgeRun,
  context: IPdfContext
) {
  const resolved = resolveTextMetrics(run, context);
  const safeText = sanitizeTextForPdf(text, resolved.font);
  return resolved.font.widthOfTextAtSize(safeText, resolved.size);
}

function measureBadgeWidth(run: IBadgeRun, context: IPdfContext) {
  const padding = getPadding(run.padding || [2, 4, 2, 4]).map(pxToPt);
  return measureTextWidth(run.text, run, context) + padding[1] + padding[3];
}

function measureBadgeHeight(run: IBadgeRun) {
  const padding = getPadding(run.padding || [2, 4, 2, 4]).map(pxToPt);
  return run.size + padding[0] + padding[2];
}

function getJustifyExtra(line: ILayoutLine, availableWidth: number) {
  const spaceCount = line.fragments.filter(
    fragment => fragment.kind === 'space'
  ).length;
  if (!spaceCount || line.width >= availableWidth) {
    return 0;
  }
  return (availableWidth - line.width) / spaceCount;
}

function isLastParagraphLine(layout: IParagraphLayout, line: ILayoutLine) {
  return layout.lines[layout.lines.length - 1] === line;
}

function getSpanningRowHeight(
  rows: ITableRowBlock[],
  rowHeights: number[],
  rowIndex: number
) {
  const row = rows[rowIndex];
  let maxHeight = rowHeights[rowIndex];
  for (let i = 0; i < row.cells.length; i++) {
    const cell = row.cells[i];
    maxHeight = Math.max(
      maxHeight,
      getRowSpanHeight(rowHeights, rowIndex, cell.rowspan)
    );
  }
  return maxHeight;
}

function getRowSpanHeight(
  rowHeights: number[],
  rowIndex: number,
  rowSpan: number
) {
  let height = 0;
  for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
    height += rowHeights[i] || 0;
  }
  return height;
}

function scaleColumnWidths(widths: number[], maxWidth: number) {
  const ptWidths = widths.map(pxToPt);
  const total = ptWidths.reduce((sum, width) => sum + width, 0);
  if (!total || total <= maxWidth) {
    return ptWidths;
  }
  const ratio = maxWidth / total;
  return ptWidths.map(width => width * ratio);
}

function getColumnOffset(widths: number[], colIndex: number) {
  let offset = 0;
  for (let i = 0; i < colIndex; i++) {
    offset += widths[i] || 0;
  }
  return offset;
}

function getColumnSpanWidth(widths: number[], colIndex: number, span: number) {
  let width = 0;
  for (let i = colIndex; i < colIndex + span; i++) {
    width += widths[i] || 0;
  }
  return width;
}

function computeTableCellPlacement(trList: ITr[], colgroup: IColgroup[]) {
  const placementMap = new WeakMap<ITd, { colIndex: number; width: number }>();
  if (!trList.length || !colgroup.length) {
    return placementMap;
  }
  const occupiedUntilRow = Array(colgroup.length).fill(0);
  for (let rowIndex = 0; rowIndex < trList.length; rowIndex++) {
    const tr = trList[rowIndex];
    let colIndex = 0;
    for (let tdIndex = 0; tdIndex < tr.tdList.length; tdIndex++) {
      while (
        colIndex < colgroup.length &&
        occupiedUntilRow[colIndex] > rowIndex
      ) {
        colIndex += 1;
      }
      const td = tr.tdList[tdIndex];
      let width = 0;
      for (
        let currentCol = colIndex;
        currentCol < colIndex + td.colspan;
        currentCol++
      ) {
        width += colgroup[currentCol]?.width || 0;
        occupiedUntilRow[currentCol] = Math.max(
          occupiedUntilRow[currentCol],
          rowIndex + td.rowspan
        );
      }
      placementMap.set(td, { colIndex, width });
      colIndex += td.colspan;
    }
  }
  return placementMap;
}

async function loadPdfImage(
  src: string,
  context: IPdfContext
): Promise<PDFImage | null> {
  if (context.imageCache.has(src)) {
    return context.imageCache.get(src)!;
  }
  try {
    const payload = await loadPdfImagePayload(src);
    const image =
      payload.type === 'jpg'
        ? await context.pdfDoc.embedJpg(payload.data)
        : await context.pdfDoc.embedPng(payload.data);
    context.imageCache.set(src, image);
    return image;
  } catch {
    return null;
  }
}

async function loadPdfImagePayload(src: string): Promise<{
  type: 'jpg' | 'png';
  data: ArrayBuffer;
}> {
  const source = src.trim();
  if (source.startsWith('data:')) {
    return getPdfImagePayloadFromDataUrl(source);
  }
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Image request failed: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  const data = await response.arrayBuffer();
  return normalizePdfImagePayload(data, contentType);
}

async function getPdfImagePayloadFromDataUrl(src: string) {
  const [, meta = '', encoded = ''] = src.match(/^data:([^,]*),(.*)$/) || [];
  const mime = meta.split(';')[0] || '';
  const isBase64 = meta.includes(';base64');
  const text = isBase64 ? atob(encoded) : decodeURIComponent(encoded);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  return normalizePdfImagePayload(bytes.buffer, mime);
}

async function normalizePdfImagePayload(data: ArrayBuffer, mime: string) {
  const lower = mime.toLowerCase();
  if (lower.includes('jpeg') || lower.includes('jpg')) {
    return {
      type: 'jpg' as const,
      data
    };
  }
  if (lower.includes('png')) {
    return {
      type: 'png' as const,
      data
    };
  }
  return {
    type: 'png' as const,
    data: await rasterizeImageToPng(data, mime)
  };
}

async function rasterizeImageToPng(data: ArrayBuffer, mime: string) {
  const blob = new Blob([data], {
    type: mime || 'image/png'
  });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || DEFAULT_IMAGE_WIDTH;
    canvas.height = image.naturalHeight || DEFAULT_IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context is unavailable');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(output => {
        if (output) {
          resolve(output);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    });
    return await pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}

function getInlineElementText(element: IElement) {
  switch (element.type) {
    case ElementType.CONTROL:
      return getControlText(element.control);
    case ElementType.DATE:
      return element.valueList?.length
        ? getTextFromElementList(element.valueList)
        : element.value;
    case ElementType.CHECKBOX:
      return element.checkbox?.value ? '☑' : '☐';
    case ElementType.RADIO:
      return element.radio?.value ? '◉' : '○';
    case ElementType.LABEL:
    case ElementType.LATEX:
    case ElementType.SUBSCRIPT:
    case ElementType.SUPERSCRIPT:
      return element.value;
    default:
      return element.value;
  }
}

function getControlText(control?: IControl | null) {
  if (!control) return '';
  if (
    control.type === ControlType.TEXT ||
    control.type === ControlType.DATE ||
    control.type === ControlType.NUMBER
  ) {
    const value = control.value?.length
      ? getTextFromElementList(control.value)
      : '';
    const content = value || control.placeholder || '';
    return `${control.preText || ''}${content}${control.postText || ''}`;
  }
  if (control.type === ControlType.SELECT) {
    const labels = getSelectedControlLabels(control.code, control.valueSets);
    const content = labels.length
      ? labels.join(control.multiSelectDelimiter || ', ')
      : control.placeholder || '';
    return `${control.preText || ''}${content}${control.postText || ''}`;
  }
  if (
    control.type === ControlType.CHECKBOX ||
    control.type === ControlType.RADIO
  ) {
    const isRadio = control.type === ControlType.RADIO;
    return (control.valueSets || [])
      .map(valueSet => {
        const checked =
          control.code?.split(',').includes(valueSet.code) || false;
        return `${checked ? (isRadio ? '◉' : '☑') : isRadio ? '○' : '☐'} ${valueSet.value}`;
      })
      .join('  ');
  }
  return '';
}

function getSelectedControlLabels(
  code: string | null | undefined,
  valueSets?: IValueSet[]
) {
  if (!code || !valueSets?.length) return [];
  return code
    .split(',')
    .map(
      selectCode =>
        valueSets.find(valueSet => valueSet.code === selectCode)?.value
    )
    .filter((value): value is string => !!value);
}

function getBlockFallbackText(element: IElement) {
  if (element.block?.iframeBlock?.src) {
    return element.block.iframeBlock.src;
  }
  if (element.block?.videoBlock?.src) {
    return element.block.videoBlock.src;
  }
  return '';
}

function getListItemNumberingElement(
  listItemElements: IElement[],
  fallback: IElement
) {
  return (
    listItemElements.find(
      listItem =>
        listItem.listId ||
        listItem.listLevel !== undefined ||
        !!listItem.listPreset ||
        !!listItem.listStyle ||
        !!listItem.listType
    ) || fallback
  );
}

function getListMarker(element: IElement, orderedCounts: number[]) {
  const level = Math.max(0, Math.min(element.listLevel || 0, 8));
  if (element.listType === ListType.UL) {
    return {
      text: getUnorderedMarkerText(element, level),
      level
    };
  }
  while (orderedCounts.length <= level) {
    orderedCounts.push(0);
  }
  orderedCounts[level] += 1;
  orderedCounts.length = level + 1;
  const style = element.listPreset
    ? getOrderedPresetStyle(element.listPreset, level)
    : getOrderedStyle(element.listStyle);
  const outlinePrefix =
    style === 'outline'
      ? orderedCounts.slice(0, level + 1).join('.')
      : undefined;
  return {
    text: formatOlNumber(orderedCounts[level] - 1, style, outlinePrefix),
    level
  };
}

function getOrderedPresetStyle(preset?: string, level = 0) {
  const cycle = preset ? olPresetCycles[preset] : undefined;
  if (!cycle?.length) {
    return 'decimal';
  }
  return cycle[level % cycle.length];
}

function getOrderedStyle(style?: string) {
  switch (style) {
    case OlStyle.LOWER_ALPHA:
      return 'lowerAlpha';
    case OlStyle.UPPER_ALPHA:
      return 'upperAlpha';
    case OlStyle.LOWER_ROMAN:
      return 'lowerRoman';
    case OlStyle.UPPER_ROMAN:
      return 'upperRoman';
    case OlStyle.DECIMAL_PAREN:
      return 'decimalParen';
    default:
      return 'decimal';
  }
}

function getUnorderedMarkerText(element: IElement, level: number) {
  if (element.listPreset) {
    const cycle = ulPresetCycles[element.listPreset];
    if (cycle?.length) {
      return cycle[level % cycle.length];
    }
  }
  return (
    bulletCharMap[element.listStyle || ListStyle.DISC] ||
    bulletCharMap[UlStyle.DISC]
  );
}

function toAlpha(n: number, upper: boolean): string {
  let result = '';
  let num = n + 1;
  while (num > 0) {
    num--;
    result = String.fromCharCode((upper ? 65 : 97) + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

function toRoman(n: number, upper: boolean): string {
  const num = n + 1;
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = [
    'M',
    'CM',
    'D',
    'CD',
    'C',
    'XC',
    'L',
    'XL',
    'X',
    'IX',
    'V',
    'IV',
    'I'
  ];
  let result = '';
  let remaining = num;
  for (let i = 0; i < vals.length; i++) {
    while (remaining >= vals[i]) {
      result += syms[i];
      remaining -= vals[i];
    }
  }
  return upper ? result : result.toLowerCase();
}

function formatOlNumber(index: number, style: string, outlinePrefix?: string) {
  switch (style) {
    case 'decimal':
      return `${index + 1}.`;
    case 'decimalParen':
      return `${index + 1})`;
    case 'decimalZero':
      return `${String(index + 1).padStart(2, '0')}.`;
    case 'lowerAlpha':
      return `${toAlpha(index, false)}.`;
    case 'lowerAlphaParen':
      return `${toAlpha(index, false)})`;
    case 'upperAlpha':
      return `${toAlpha(index, true)}.`;
    case 'lowerRoman':
      return `${toRoman(index, false)}.`;
    case 'lowerRomanParen':
      return `${toRoman(index, false)})`;
    case 'upperRoman':
      return `${toRoman(index, true)}.`;
    case 'outline':
      return outlinePrefix ? `${outlinePrefix}.` : `${index + 1}.`;
    default:
      return `${index + 1}.`;
  }
}

function normalizeAlignment(rowFlex?: RowFlex) {
  if (rowFlex === RowFlex.ALIGNMENT) {
    return RowFlex.JUSTIFY;
  }
  return rowFlex || RowFlex.LEFT;
}

function getFont(
  family: string,
  bold: boolean,
  italic: boolean,
  context: IPdfContext
) {
  const fontSet = context.fonts[resolveFontFamily(family)];
  if (bold && italic) {
    return fontSet.boldItalic;
  }
  if (bold) {
    return fontSet.bold;
  }
  if (italic) {
    return fontSet.italic;
  }
  return fontSet.regular;
}

function resolveFontFamily(font?: string) {
  const normalized = (font || '').trim().toLowerCase();
  if (
    normalized.includes('sans-serif') ||
    normalized.includes('arial') ||
    normalized.includes('helvetica') ||
    normalized.includes('yahei') ||
    normalized.includes('microsoft') ||
    normalized.includes('inter') ||
    normalized.includes('roboto')
  ) {
    return 'sans' as const;
  }
  if (
    normalized.includes('times') ||
    normalized === 'serif' ||
    normalized.endsWith(', serif')
  ) {
    return 'serif' as const;
  }
  if (
    normalized.includes('courier') ||
    normalized.includes('mono') ||
    normalized.includes('code')
  ) {
    return 'mono' as const;
  }
  return 'sans' as const;
}

function sanitizeTextForPdf(text: string, font: PDFFont) {
  let fontCache = pdfTextCache.get(font);
  if (!fontCache) {
    fontCache = new Map();
    pdfTextCache.set(font, fontCache);
  }
  if (fontCache.has(text)) {
    return fontCache.get(text)!;
  }
  let safeText = text;
  try {
    font.encodeText(text);
  } catch {
    safeText = Array.from(text)
      .map(char => sanitizePdfChar(char, font))
      .join('');
  }
  fontCache.set(text, safeText);
  return safeText;
}

function sanitizePdfChar(char: string, font: PDFFont) {
  try {
    font.encodeText(char);
    return char;
  } catch {
    const directFallback = PDF_TEXT_FALLBACKS[char];
    if (directFallback) {
      return directFallback;
    }
    if (/^\s$/u.test(char)) {
      return ' ';
    }
    const normalized = char
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '');
    if (normalized) {
      try {
        font.encodeText(normalized);
        return normalized;
      } catch {
        return '?';
      }
    }
    return '?';
  }
}

function getPadding(padding: IPadding): Required<IPadding> {
  return [padding[0] ?? 0, padding[1] ?? 0, padding[2] ?? 0, padding[3] ?? 0];
}

function getTitleSize(
  titleLevel: TitleLevel | undefined,
  options: DeepRequired<IEditorOption>
) {
  if (!titleLevel) {
    return undefined;
  }
  return options.title[titleSizeMapping[titleLevel]];
}

function getPageNumberHeight(pageNumber: IPageNumber) {
  if (pageNumber.disabled) {
    return 0;
  }
  return pageNumber.size || 12;
}

function getFooterBarHeight(footerHeight: number, context: IPdfContext) {
  if (context.options.footer.disabled) {
    return 0;
  }
  return Math.max(footerHeight, pxToPt(FOOTER_MIN_BAR_HEIGHT));
}

function getReservedPageNumberBottom(
  pageNumber: IPageNumber,
  pageNumberHeight: number
) {
  if (pageNumber.disabled) {
    return 0;
  }
  return pxToPt(pageNumber.bottom + 4) + pageNumberHeight;
}

function normalizeText(text = '') {
  return text.replace(new RegExp(ZERO, 'g'), '').replace(/\r\n/g, '\n');
}

function normalizePdfFileName(fileName?: string) {
  const trimmed = fileName?.trim();
  if (!trimmed) {
    return DEFAULT_PDF_FILE_NAME;
  }
  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
}

function pxToPt(px: number) {
  return px * (72 / 96);
}

function toPdfY(pageHeight: number, top: number, height = 0) {
  return pageHeight - top - height;
}

function toPdfColor(color?: string, fallback = '#000000') {
  const hex = normalizeHexColor(color || fallback, '000000') || '000000';
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}

function normalizeHexColor(color: string, fallback?: string) {
  const normalized =
    normalizeHexLiteral(color) ||
    normalizeRgbColor(color) ||
    normalizeBrowserColor(color);
  if (normalized) {
    return normalized;
  }
  return fallback ? normalizeHexLiteral(fallback) || undefined : undefined;
}

function normalizeHexLiteral(color: string) {
  const value = color.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(value)) {
    return value
      .split('')
      .map(part => `${part}${part}`)
      .join('')
      .toUpperCase();
  }
  if (/^[\da-f]{4}$/i.test(value)) {
    return value
      .slice(0, 3)
      .split('')
      .map(part => `${part}${part}`)
      .join('')
      .toUpperCase();
  }
  if (/^[\da-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }
  if (/^[\da-f]{8}$/i.test(value)) {
    return value.slice(0, 6).toUpperCase();
  }
  return undefined;
}

function normalizeRgbColor(color: string) {
  const match = color.trim().match(/^rgba?\((.+)\)$/i);
  if (!match) {
    return undefined;
  }
  const parts = match[1]
    .replace(/\s*\/\s*/g, ',')
    .split(/\s*,\s*|\s+/)
    .filter(Boolean);
  if (parts.length < 3) {
    return undefined;
  }
  const red = parseRgbChannel(parts[0]);
  const green = parseRgbChannel(parts[1]);
  const blue = parseRgbChannel(parts[2]);
  if (red === null || green === null || blue === null) {
    return undefined;
  }
  const alpha = parts[3] !== undefined ? parseAlphaChannel(parts[3]) : 1;
  if (alpha === null || alpha <= 0) {
    return undefined;
  }
  const flattened =
    alpha >= 1
      ? [red, green, blue]
      : [
          flattenChannel(red, alpha),
          flattenChannel(green, alpha),
          flattenChannel(blue, alpha)
        ];
  return flattened.map(toHexChannel).join('');
}

function normalizeBrowserColor(color: string) {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return undefined;
  }
  context.fillStyle = '#000000';
  context.fillStyle = color;
  const normalized = context.fillStyle;
  if (typeof normalized !== 'string') {
    return undefined;
  }
  return normalizeHexLiteral(normalized) || normalizeRgbColor(normalized);
}

function parseRgbChannel(value: string) {
  if (value.endsWith('%')) {
    const percent = Number(value.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return clampColorChannel(Math.round((percent / 100) * 255));
  }
  const channel = Number(value);
  if (!Number.isFinite(channel)) {
    return null;
  }
  return clampColorChannel(Math.round(channel));
}

function parseAlphaChannel(value: string) {
  if (value.endsWith('%')) {
    const percent = Number(value.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return Math.min(Math.max(percent / 100, 0), 1);
  }
  const alpha = Number(value);
  if (!Number.isFinite(alpha)) {
    return null;
  }
  return Math.min(Math.max(alpha, 0), 1);
}

function clampColorChannel(value: number) {
  return Math.min(Math.max(value, 0), 255);
}

function flattenChannel(value: number, alpha: number) {
  return clampColorChannel(Math.round(255 * (1 - alpha) + value * alpha));
}

function toHexChannel(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase();
}
