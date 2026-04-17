import {
  AlignmentType,
  BorderStyle,
  ColumnBreak,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  LineRuleType,
  Packer,
  PageBreak,
  PageNumber,
  type ParagraphChild,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign as DocxVerticalAlign,
  WidthType
} from 'docx';
import { olPresetCycles, ulPresetCycles } from '../dataset/constant/List';
import { FORMAT_PLACEHOLDER } from '../dataset/constant/PageNumber';
import { ZERO } from '../dataset/constant/Common';
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
import { TextDecorationStyle } from '../dataset/enum/Text';
import { TitleLevel } from '../dataset/enum/Title';
import { VerticalAlign } from '../dataset/enum/VerticalAlign';
import { IControl, IValueSet } from '../interface/Control';
import { DeepRequired, IPadding } from '../interface/Common';
import {
  IEditorOption,
  IEditorResult,
  IExportDocxOption
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

type FileChild = Paragraph | Table;

interface IParagraphContext {
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  rowMargin?: number;
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  numbering?: {
    reference: string;
    level: number;
  };
}

interface IParagraphState {
  children: ParagraphChild[];
  context: IParagraphContext;
}

interface IImagePayload {
  data: ArrayBuffer;
  type: 'jpg' | 'png' | 'gif' | 'bmp' | 'svg';
  fallbackPng?: ArrayBuffer;
}

interface ISerializeContext {
  nextListInstance: number;
}

interface ITableCellLayout {
  width: number;
}

interface ITableSerializeContext {
  cellLayoutMap: WeakMap<ITd, ITableCellLayout>;
  borderColor?: string;
  borderWidth?: number;
  borderExternalWidth?: number;
}

const DEFAULT_DOCX_FILE_NAME = 'document.docx';
const DEFAULT_IMAGE_WIDTH = 320;
const DEFAULT_IMAGE_HEIGHT = 180;
const DEFAULT_LINE_HEIGHT = 1.15;

const docxBulletCharMap: Record<string, string> = {
  [UlStyle.DISC]: '•',
  [UlStyle.CIRCLE]: '◦',
  [UlStyle.SQUARE]: '■',
  [UlStyle.CHECKBOX]: '☑'
};

const titleHeadingMap: Record<
  TitleLevel,
  (typeof HeadingLevel)[keyof typeof HeadingLevel]
> = {
  [TitleLevel.FIRST]: HeadingLevel.HEADING_1,
  [TitleLevel.SECOND]: HeadingLevel.HEADING_2,
  [TitleLevel.THIRD]: HeadingLevel.HEADING_3,
  [TitleLevel.FOURTH]: HeadingLevel.HEADING_4,
  [TitleLevel.FIFTH]: HeadingLevel.HEADING_5,
  [TitleLevel.SIXTH]: HeadingLevel.HEADING_6
};

const orderedStyleFormatMap: Record<
  string,
  (typeof LevelFormat)[keyof typeof LevelFormat]
> = {
  [OlStyle.DECIMAL]: LevelFormat.DECIMAL,
  [OlStyle.LOWER_ALPHA]: LevelFormat.LOWER_LETTER,
  [OlStyle.UPPER_ALPHA]: LevelFormat.UPPER_LETTER,
  [OlStyle.LOWER_ROMAN]: LevelFormat.LOWER_ROMAN,
  [OlStyle.UPPER_ROMAN]: LevelFormat.UPPER_ROMAN,
  [OlStyle.DECIMAL_PAREN]: LevelFormat.DECIMAL,
  decimalZero: LevelFormat.DECIMAL_ZERO,
  lowerAlphaParen: LevelFormat.LOWER_LETTER,
  lowerRomanParen: LevelFormat.LOWER_ROMAN,
  outline: LevelFormat.DECIMAL
};

export async function exportEditorDataToDocx(
  payload: IEditorResult,
  options: IExportDocxOption = {}
) {
  const fileName = normalizeDocxFileName(options.fileName);
  const file = await createDocxDocument(payload);
  const blob = await Packer.toBlob(file);
  return {
    blob,
    fileName
  };
}

async function createDocxDocument(payload: IEditorResult) {
  const { data, options } = payload;
  const editorOptions = options as DeepRequired<IEditorOption>;
  const context = createSerializeContext();
  const headerChildren = editorOptions.header.disabled
    ? []
    : await serializeElementList(data.header || [], editorOptions, context);
  const footerChildren = editorOptions.footer.disabled
    ? []
    : await serializeElementList(data.footer || [], editorOptions, context);
  const pageNumberParagraph = createPageNumberParagraph(
    editorOptions.pageNumber
  );
  if (pageNumberParagraph) {
    footerChildren.push(pageNumberParagraph);
  }

  const sectionChildren = await serializeElementList(
    data.main,
    editorOptions,
    context
  );
  const { width, height, paperDirection } = editorOptions;
  const pageWidth =
    paperDirection === PaperDirection.HORIZONTAL ? height : width;
  const pageHeight =
    paperDirection === PaperDirection.HORIZONTAL ? width : height;

  return new Document({
    features: {
      updateFields: true
    },
    numbering: {
      config: createNumberingConfig()
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pxToTwips(pageWidth),
              height: pxToTwips(pageHeight),
              orientation:
                paperDirection === PaperDirection.HORIZONTAL
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT
            },
            margin: {
              top: pxToTwips(editorOptions.margins[0]),
              right: pxToTwips(editorOptions.margins[1]),
              bottom: pxToTwips(editorOptions.margins[2]),
              left: pxToTwips(editorOptions.margins[3]),
              header: pxToTwips(editorOptions.header.top),
              footer: pxToTwips(editorOptions.footer.bottom)
            },
            pageNumbers:
              !editorOptions.pageNumber.disabled &&
              editorOptions.pageNumber.fromPageNo === 0
                ? {
                    start: editorOptions.pageNumber.startPageNo
                  }
                : undefined
          }
        },
        headers:
          headerChildren.length > 0
            ? {
                default: new Header({
                  children: headerChildren
                })
              }
            : undefined,
        footers:
          footerChildren.length > 0
            ? {
                default: new Footer({
                  children: footerChildren
                })
              }
            : undefined,
        children: sectionChildren.length ? sectionChildren : [new Paragraph({})]
      }
    ]
  });
}

async function serializeElementList(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>,
  context: ISerializeContext
): Promise<FileChild[]> {
  const blocks: FileChild[] = [];
  let inlineBuffer: IElement[] = [];

  const flushInlineBuffer = async () => {
    if (!inlineBuffer.length) return;
    blocks.push(
      ...(await serializeInlineElements(inlineBuffer, options, context))
    );
    inlineBuffer = [];
  };

  for (let i = 0; i < elementList.length; i++) {
    const element = elementList[i];
    if (element.type === ElementType.AREA && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(
        ...(await serializeElementList(element.valueList, options, context))
      );
      continue;
    }
    if (element.type === ElementType.TITLE && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(
        ...(await serializeInlineElements(element.valueList, options, context, {
          heading: titleHeadingMap[element.level || TitleLevel.FIRST]
        }))
      );
      continue;
    }
    if (element.type === ElementType.LIST && element.valueList?.length) {
      await flushInlineBuffer();
      blocks.push(...(await serializeListElement(element, options, context)));
      continue;
    }
    if (element.type === ElementType.TABLE && element.trList?.length) {
      await flushInlineBuffer();
      blocks.push(await serializeTableElement(element, options, context));
      continue;
    }
    if (element.type === ElementType.PAGE_BREAK) {
      await flushInlineBuffer();
      blocks.push(
        new Paragraph({
          children: [new PageBreak()]
        })
      );
      continue;
    }
    if (element.type === ElementType.SEPARATOR) {
      await flushInlineBuffer();
      blocks.push(
        new Paragraph({
          thematicBreak: true
        })
      );
      continue;
    }
    if (
      element.type === ElementType.IMAGE &&
      element.imgDisplay &&
      element.imgDisplay !== 'inline'
    ) {
      await flushInlineBuffer();
      blocks.push(...(await serializeInlineElements([element], options)));
      continue;
    }
    if (element.type === ElementType.BLOCK) {
      await flushInlineBuffer();
      const blockText = getBlockFallbackText(element);
      if (blockText) {
        blocks.push(
          ...(await serializeInlineElements(
            [{ value: blockText }],
            options,
            context
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

async function serializeInlineElements(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>,
  _context: ISerializeContext,
  overrides: IParagraphContext = {}
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  let current: IParagraphState | null = null;

  const getParagraphContext = (element?: IElement): IParagraphContext => ({
    heading: overrides.heading,
    numbering: overrides.numbering,
    alignment:
      overrides.alignment !== undefined
        ? overrides.alignment
        : mapRowFlexToAlignment(element?.rowFlex),
    rowMargin:
      overrides.rowMargin !== undefined
        ? overrides.rowMargin
        : element?.rowMargin
  });

  const flushParagraph = (context?: IParagraphContext) => {
    if (!current) {
      if (!context) return;
      paragraphs.push(createParagraph([], context, options.defaultRowMargin));
      return;
    }
    paragraphs.push(
      createParagraph(
        current.children,
        current.context,
        options.defaultRowMargin
      )
    );
    current = null;
  };

  const ensureParagraph = (element?: IElement) => {
    if (!current) {
      current = {
        children: [],
        context: getParagraphContext(element)
      };
    }
    return current;
  };

  const appendText = (
    element: IElement,
    text: string,
    childFactory: (segment: string) => ParagraphChild,
    preserveTrailingBreak = false
  ) => {
    const normalized = normalizeText(text);
    const parts = normalized.split('\n');
    let lastSeparatorFlushedContent = false;
    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      if (segment) {
        ensureParagraph(element).children.push(childFactory(segment));
      }
      if (i < parts.length - 1) {
        if (!current) {
          paragraphs.push(
            createParagraph(
              [],
              getParagraphContext(element),
              options.defaultRowMargin
            )
          );
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
      paragraphs.push(
        createParagraph(
          [],
          getParagraphContext(element),
          options.defaultRowMargin
        )
      );
    }
  };

  for (let i = 0; i < elementList.length; i++) {
    const element = elementList[i];

    if (element.type === ElementType.HYPERLINK && element.valueList?.length) {
      const hyperlink = await createHyperlinkChild(element, options);
      if (hyperlink) {
        ensureParagraph(element).children.push(hyperlink);
      }
      continue;
    }

    if (element.type === ElementType.IMAGE) {
      const imageChild = await createImageChild(element);
      if (!imageChild) {
        appendText(
          element,
          '[Image unavailable]',
          segment =>
            createTextRun(
              segment,
              element,
              options.defaultSize,
              options.defaultFont
            ),
          i === elementList.length - 1
        );
        continue;
      }
      ensureParagraph(element).children.push(imageChild);
      continue;
    }

    if (element.type === ElementType.COLUMN_BREAK) {
      ensureParagraph(element).children.push(new ColumnBreak());
      continue;
    }

    if (element.type === ElementType.TAB) {
      appendText(
        element,
        '\t',
        segment =>
          createTextRun(
            segment,
            element,
            options.defaultSize,
            options.defaultFont
          ),
        i === elementList.length - 1
      );
      continue;
    }

    const textValue = getInlineElementText(element);
    if (!textValue) {
      continue;
    }
    appendText(
      element,
      textValue,
      segment =>
        createTextRun(
          segment,
          element,
          options.defaultSize,
          options.defaultFont
        ),
      i === elementList.length - 1
    );
  }

  if (current) {
    flushParagraph();
  }

  return paragraphs.length
    ? paragraphs
    : [createParagraph([], overrides, options.defaultRowMargin)];
}

async function serializeListElement(
  element: IElement,
  options: DeepRequired<IEditorOption>,
  context: ISerializeContext
) {
  const zipList = zipElementList(element.valueList || []);
  const listItemMap = splitListElement(zipList);
  const paragraphs: Paragraph[] = [];
  const listInstance = createListInstance(context);
  for (const listItemElements of listItemMap.values()) {
    const numbering = getListNumbering(
      getListItemNumberingElement(listItemElements, element),
      listInstance
    );
    paragraphs.push(
      ...(await serializeInlineElements(listItemElements, options, context, {
        numbering
      }))
    );
  }
  return paragraphs;
}

async function serializeTableElement(
  element: IElement,
  options: DeepRequired<IEditorOption>,
  context: ISerializeContext
) {
  const rows: TableRow[] = [];
  const trList = element.trList || [];
  const tableContext = createTableSerializeContext(element);
  for (let i = 0; i < trList.length; i++) {
    rows.push(
      await serializeTableRow(trList[i], options, context, tableContext)
    );
  }
  const tableWidth = getTableWidthFromColgroup(element.colgroup);
  return new Table({
    rows,
    width: tableWidth
      ? {
          size: pxToTwips(tableWidth),
          type: WidthType.DXA
        }
      : {
          size: 100,
          type: WidthType.PERCENTAGE
        },
    columnWidths: element.colgroup?.map(col => pxToTwips(col.width)),
    layout: TableLayoutType.FIXED,
    borders: createTableBorders(element)
  });
}

async function serializeTableRow(
  tr: ITr,
  options: DeepRequired<IEditorOption>,
  context: ISerializeContext,
  tableContext: ITableSerializeContext
) {
  const children: TableCell[] = [];
  for (let i = 0; i < tr.tdList.length; i++) {
    children.push(
      await serializeTableCell(tr.tdList[i], options, context, tableContext)
    );
  }
  return new TableRow({
    children
  });
}

async function serializeTableCell(
  td: ITd,
  options: DeepRequired<IEditorOption>,
  context: ISerializeContext,
  tableContext: ITableSerializeContext
) {
  const children = await serializeElementList(td.value, options, context);
  const shadingFill = td.backgroundColor
    ? normalizeHexColor(td.backgroundColor)
    : undefined;
  const cellWidth = tableContext.cellLayoutMap.get(td)?.width || td.width;
  return new TableCell({
    children: children.length ? children : [new Paragraph({})],
    columnSpan: td.colspan > 1 ? td.colspan : undefined,
    rowSpan: td.rowspan > 1 ? td.rowspan : undefined,
    verticalAlign: mapCellVerticalAlign(td.verticalAlign),
    width: cellWidth
      ? {
          size: pxToTwips(cellWidth),
          type: WidthType.DXA
        }
      : undefined,
    shading: shadingFill
      ? {
          fill: shadingFill,
          type: ShadingType.CLEAR
        }
      : undefined,
    margins: mapPaddingToTableMargins(td.padding),
    borders: createTableCellBorders(
      td,
      tableContext.borderColor,
      tableContext.borderWidth
    )
  });
}

function createParagraph(
  children: ParagraphChild[],
  context: IParagraphContext,
  defaultRowMargin: number
) {
  return new Paragraph({
    children,
    heading: context.heading,
    numbering: context.numbering,
    alignment: context.alignment,
    spacing: {
      line: Math.round(
        240 * (context.rowMargin || defaultRowMargin || DEFAULT_LINE_HEIGHT)
      ),
      lineRule: LineRuleType.AUTO
    }
  });
}

function createTextRun(
  text: string,
  element: IElement,
  defaultSize: number,
  defaultFont: string
) {
  const color = element.color
    ? normalizeHexColor(element.color, '000000')
    : undefined;
  const highlightFill = element.highlight
    ? normalizeHexColor(element.highlight)
    : undefined;
  return new TextRun({
    text,
    bold: !!element.bold,
    italics: !!element.italic,
    strike: !!element.strikeout,
    subScript: element.type === ElementType.SUBSCRIPT,
    superScript: element.type === ElementType.SUPERSCRIPT,
    color,
    shading: highlightFill
      ? {
          fill: highlightFill,
          type: ShadingType.CLEAR
        }
      : undefined,
    underline: element.underline
      ? {
          type: mapUnderlineType(element.textDecoration?.style)
        }
      : undefined,
    font: element.font || defaultFont,
    size: Math.round((element.size || defaultSize) * 2)
  });
}

async function createHyperlinkChild(
  element: IElement,
  options: DeepRequired<IEditorOption>
) {
  if (!element.url) {
    const fallbackText = getTextFromElementList(element.valueList || []);
    return fallbackText
      ? createTextRun(
          fallbackText,
          element.valueList?.[0] || element,
          options.defaultSize,
          options.defaultFont
        )
      : null;
  }
  const children = await createHyperlinkRuns(
    element.valueList || [],
    options.defaultSize,
    options.defaultFont
  );
  if (!children.length) {
    return null;
  }
  return new ExternalHyperlink({
    link: element.url,
    children
  });
}

async function createHyperlinkRuns(
  valueList: IElement[],
  defaultSize: number,
  defaultFont: string
) {
  const children: ParagraphChild[] = [];
  for (let i = 0; i < valueList.length; i++) {
    const element = valueList[i];
    if (element.type === ElementType.TAB) {
      children.push(createTextRun('\t', element, defaultSize, defaultFont));
      continue;
    }
    const text = normalizeText(getInlineElementText(element)).replace(
      /\n/g,
      ' '
    );
    if (text) {
      children.push(createTextRun(text, element, defaultSize, defaultFont));
    }
  }
  return children;
}

async function createImageChild(element: IElement) {
  try {
    const image = await loadImagePayload(element.value);
    const width = Math.max(1, Math.round(element.width || DEFAULT_IMAGE_WIDTH));
    const height = Math.max(
      1,
      Math.round(element.height || DEFAULT_IMAGE_HEIGHT)
    );
    if (image.type === 'svg' && image.fallbackPng) {
      return new ImageRun({
        type: 'svg',
        data: image.data,
        fallback: {
          type: 'png',
          data: image.fallbackPng
        },
        transformation: {
          width,
          height
        }
      });
    }
    return new ImageRun({
      type: image.type,
      data: image.data,
      transformation: {
        width,
        height
      }
    });
  } catch {
    return null;
  }
}

async function loadImagePayload(src: string): Promise<IImagePayload> {
  const source = src.trim();
  if (source.startsWith('data:')) {
    return getImagePayloadFromDataUrl(source);
  }
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Image request failed: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  const data = await response.arrayBuffer();
  return normalizeImagePayload(data, contentType);
}

async function getImagePayloadFromDataUrl(src: string): Promise<IImagePayload> {
  const [, meta = '', encoded = ''] = src.match(/^data:([^,]*),(.*)$/) || [];
  const mime = meta.split(';')[0] || '';
  const isBase64 = meta.includes(';base64');
  const text = isBase64 ? atob(encoded) : decodeURIComponent(encoded);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  return normalizeImagePayload(bytes.buffer, mime);
}

async function normalizeImagePayload(
  data: ArrayBuffer,
  mime: string
): Promise<IImagePayload> {
  const type = getRegularImageType(mime);
  if (type) {
    return {
      type,
      data
    };
  }
  if (mime.includes('svg')) {
    return {
      type: 'svg',
      data,
      fallbackPng: await rasterizeSvgToPng(data)
    };
  }
  const fallbackPng = await rasterizeImageToPng(data, mime);
  return {
    type: 'png',
    data: fallbackPng
  };
}

async function rasterizeSvgToPng(data: ArrayBuffer) {
  return rasterizeImageToPng(data, 'image/svg+xml');
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

function createPageNumberParagraph(pageNumber: IPageNumber) {
  if (pageNumber.disabled || pageNumber.fromPageNo > 0) {
    return null;
  }
  const children: ParagraphChild[] = [];
  const format = pageNumber.format || FORMAT_PLACEHOLDER.PAGE_NO;
  const tokens = format.split(/(\{pageNo\}|\{pageCount\})/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    const runChildren =
      token === FORMAT_PLACEHOLDER.PAGE_NO
        ? [PageNumber.CURRENT]
        : token === FORMAT_PLACEHOLDER.PAGE_COUNT
          ? [PageNumber.TOTAL_PAGES]
          : undefined;
    children.push(
      new TextRun({
        text: runChildren ? undefined : token,
        children: runChildren,
        color: normalizeHexColor(pageNumber.color || '#000000', '000000'),
        font: pageNumber.font,
        size: Math.round((pageNumber.size || 12) * 2)
      })
    );
  }
  return new Paragraph({
    children,
    alignment: mapRowFlexToAlignment(pageNumber.rowFlex)
  });
}

function createNumberingConfig() {
  const config = [
    createOrderedReference('windoc-ol-decimal', Array(9).fill(OlStyle.DECIMAL)),
    createOrderedReference(
      'windoc-ol-lower-alpha',
      Array(9).fill(OlStyle.LOWER_ALPHA)
    ),
    createOrderedReference(
      'windoc-ol-upper-alpha',
      Array(9).fill(OlStyle.UPPER_ALPHA)
    ),
    createOrderedReference(
      'windoc-ol-lower-roman',
      Array(9).fill(OlStyle.LOWER_ROMAN)
    ),
    createOrderedReference(
      'windoc-ol-upper-roman',
      Array(9).fill(OlStyle.UPPER_ROMAN)
    ),
    createOrderedReference(
      'windoc-ol-decimal-paren',
      Array(9).fill(OlStyle.DECIMAL_PAREN)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.DEFAULT}`,
      createCycleList(olPresetCycles[OlPreset.DEFAULT], 9)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.PARENTHESIS}`,
      createCycleList(olPresetCycles[OlPreset.PARENTHESIS], 9)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.OUTLINE}`,
      createCycleList(olPresetCycles[OlPreset.OUTLINE], 9)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.UPPER_ALPHA}`,
      createCycleList(olPresetCycles[OlPreset.UPPER_ALPHA], 9)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.ROMAN}`,
      createCycleList(olPresetCycles[OlPreset.ROMAN], 9)
    ),
    createOrderedReference(
      `windoc-ol-${OlPreset.ZERO_PAD}`,
      createCycleList(olPresetCycles[OlPreset.ZERO_PAD], 9)
    ),
    createBulletReference(
      'windoc-ul-disc',
      Array(9).fill(docxBulletCharMap[UlStyle.DISC])
    ),
    createBulletReference(
      'windoc-ul-circle',
      Array(9).fill(docxBulletCharMap[UlStyle.CIRCLE])
    ),
    createBulletReference(
      'windoc-ul-square',
      Array(9).fill(docxBulletCharMap[UlStyle.SQUARE])
    ),
    createBulletReference(
      'windoc-ul-checkbox',
      Array(9).fill(docxBulletCharMap[UlStyle.CHECKBOX])
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.DEFAULT}`,
      createCycleList(ulPresetCycles[UlPreset.DEFAULT], 9)
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.DIAMOND}`,
      createCycleList(ulPresetCycles[UlPreset.DIAMOND], 9)
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.HOLLOW_SQ}`,
      createCycleList(ulPresetCycles[UlPreset.HOLLOW_SQ], 9)
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.ARROW}`,
      createCycleList(ulPresetCycles[UlPreset.ARROW], 9)
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.STAR}`,
      createCycleList(ulPresetCycles[UlPreset.STAR], 9)
    ),
    createBulletReference(
      `windoc-ul-${UlPreset.CHECK_ARROW}`,
      createCycleList(ulPresetCycles[UlPreset.CHECK_ARROW], 9)
    )
  ];
  return config;
}

function createOrderedReference(reference: string, styles: string[]) {
  return {
    reference,
    levels: styles.map((style, level) => ({
      level,
      format: orderedStyleFormatMap[style] || LevelFormat.DECIMAL,
      text: getOrderedLevelText(style, level),
      alignment: AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            left: 720 * (level + 1),
            hanging: 360
          }
        }
      }
    }))
  };
}

function createBulletReference(reference: string, bullets: string[]) {
  return {
    reference,
    levels: bullets.map((bullet, level) => ({
      level,
      format: LevelFormat.BULLET,
      text: bullet,
      alignment: AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            left: 720 * (level + 1),
            hanging: 360
          }
        }
      }
    }))
  };
}

function getOrderedLevelText(style: string, level: number) {
  const placeholder = `%${level + 1}`;
  if (style === 'outline') {
    return (
      Array.from({ length: level + 1 }, (_, index) => `%${index + 1}`).join(
        '.'
      ) + '.'
    );
  }
  if (style.endsWith('Paren') || style === OlStyle.DECIMAL_PAREN) {
    return `${placeholder})`;
  }
  return `${placeholder}.`;
}

function createCycleList(source: string[] = [], size: number) {
  const result: string[] = [];
  for (let i = 0; i < size; i++) {
    result.push(source[i % source.length]);
  }
  return result;
}

function getListNumbering(element: IElement, instance?: number) {
  const level = Math.max(0, Math.min(element.listLevel || 0, 8));
  if (element.listType === ListType.UL) {
    const reference = element.listPreset
      ? `windoc-ul-${element.listPreset}`
      : `windoc-ul-${element.listStyle || ListStyle.DISC}`;
    return {
      reference,
      level,
      instance
    };
  }
  const reference = element.listPreset
    ? `windoc-ol-${element.listPreset}`
    : getOrderedReferenceFromStyle(element.listStyle);
  return {
    reference,
    level,
    instance
  };
}

function getOrderedReferenceFromStyle(style: string | undefined) {
  switch (style) {
    case OlStyle.LOWER_ALPHA:
      return 'windoc-ol-lower-alpha';
    case OlStyle.UPPER_ALPHA:
      return 'windoc-ol-upper-alpha';
    case OlStyle.LOWER_ROMAN:
      return 'windoc-ol-lower-roman';
    case OlStyle.UPPER_ROMAN:
      return 'windoc-ol-upper-roman';
    case OlStyle.DECIMAL_PAREN:
      return 'windoc-ol-decimal-paren';
    default:
      return 'windoc-ol-decimal';
  }
}

function createTableBorders(element: IElement) {
  const outerBorder = createBorder(
    element.borderColor,
    BorderStyle.SINGLE,
    element.borderExternalWidth || element.borderWidth
  );
  const innerBorder = createBorder(
    element.borderColor,
    BorderStyle.SINGLE,
    element.borderWidth
  );
  switch (element.borderType) {
    case TableBorder.EMPTY:
      return {
        top: noneBorder(),
        bottom: noneBorder(),
        left: noneBorder(),
        right: noneBorder(),
        insideHorizontal: noneBorder(),
        insideVertical: noneBorder()
      };
    case TableBorder.EXTERNAL:
      return {
        top: outerBorder,
        bottom: outerBorder,
        left: outerBorder,
        right: outerBorder,
        insideHorizontal: noneBorder(),
        insideVertical: noneBorder()
      };
    case TableBorder.INTERNAL:
      return {
        top: noneBorder(),
        bottom: noneBorder(),
        left: noneBorder(),
        right: noneBorder(),
        insideHorizontal: innerBorder,
        insideVertical: innerBorder
      };
    case TableBorder.DASH:
      return {
        top: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderExternalWidth || element.borderWidth
        ),
        bottom: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderExternalWidth || element.borderWidth
        ),
        left: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderExternalWidth || element.borderWidth
        ),
        right: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderExternalWidth || element.borderWidth
        ),
        insideHorizontal: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderWidth
        ),
        insideVertical: createBorder(
          element.borderColor,
          BorderStyle.DASHED,
          element.borderWidth
        )
      };
    default:
      return {
        top: outerBorder,
        bottom: outerBorder,
        left: outerBorder,
        right: outerBorder,
        insideHorizontal: innerBorder,
        insideVertical: innerBorder
      };
  }
}

function createTableCellBorders(
  td: ITd,
  inheritedColor?: string,
  inheritedWidth?: number
) {
  if (!td.borderTypes?.length && !td.borderColor) {
    return undefined;
  }
  const color = td.borderColor || inheritedColor;
  const createCellBorder = () =>
    createBorder(color, BorderStyle.SINGLE, inheritedWidth);
  if (td.borderColor && !td.borderTypes?.length) {
    return {
      top: createCellBorder(),
      right: createCellBorder(),
      bottom: createCellBorder(),
      left: createCellBorder()
    };
  }
  const top = td.borderTypes?.includes(TdBorder.TOP)
    ? createCellBorder()
    : noneBorder();
  const right = td.borderTypes?.includes(TdBorder.RIGHT)
    ? createCellBorder()
    : noneBorder();
  const bottom = td.borderTypes?.includes(TdBorder.BOTTOM)
    ? createCellBorder()
    : noneBorder();
  const left = td.borderTypes?.includes(TdBorder.LEFT)
    ? createCellBorder()
    : noneBorder();
  return {
    top,
    right,
    bottom,
    left
  };
}

function createBorder(
  color = '#000000',
  style = BorderStyle.SINGLE,
  width = 1
) {
  return {
    style,
    color: normalizeHexColor(color, '000000') || '000000',
    size: pxBorderToDocxSize(width)
  };
}

function noneBorder() {
  return {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF'
  };
}

function mapPaddingToTableMargins(padding?: IPadding) {
  if (!padding) return undefined;
  return {
    top: pxToTwips(padding[0]),
    right: pxToTwips(padding[1]),
    bottom: pxToTwips(padding[2]),
    left: pxToTwips(padding[3]),
    marginUnitType: WidthType.DXA
  };
}

function mapCellVerticalAlign(verticalAlign?: VerticalAlign) {
  switch (verticalAlign) {
    case VerticalAlign.CENTER:
      return DocxVerticalAlign.CENTER;
    case VerticalAlign.BOTTOM:
      return DocxVerticalAlign.BOTTOM;
    default:
      return DocxVerticalAlign.TOP;
  }
}

function mapRowFlexToAlignment(rowFlex?: RowFlex) {
  switch (rowFlex) {
    case RowFlex.CENTER:
      return AlignmentType.CENTER;
    case RowFlex.RIGHT:
      return AlignmentType.RIGHT;
    case RowFlex.ALIGNMENT:
    case RowFlex.JUSTIFY:
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function mapUnderlineType(style?: TextDecorationStyle) {
  switch (style) {
    case TextDecorationStyle.DOUBLE:
      return UnderlineType.DOUBLE;
    case TextDecorationStyle.DASHED:
      return UnderlineType.DASH;
    case TextDecorationStyle.DOTTED:
      return UnderlineType.DOTTED;
    case TextDecorationStyle.WAVY:
      return UnderlineType.WAVE;
    default:
      return UnderlineType.SINGLE;
  }
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

function normalizeText(text = '') {
  return text.replace(new RegExp(ZERO, 'g'), '').replace(/\r\n/g, '\n');
}

function createSerializeContext(): ISerializeContext {
  return {
    nextListInstance: 1
  };
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

function createListInstance(context: ISerializeContext) {
  return context.nextListInstance++;
}

function createTableSerializeContext(
  element: IElement
): ITableSerializeContext {
  return {
    cellLayoutMap: computeTableCellLayout(
      element.trList || [],
      element.colgroup || []
    ),
    borderColor: element.borderColor,
    borderWidth: element.borderWidth,
    borderExternalWidth: element.borderExternalWidth
  };
}

function computeTableCellLayout(trList: ITr[], colgroup: IColgroup[]) {
  const cellLayoutMap = new WeakMap<ITd, ITableCellLayout>();
  if (!trList.length || !colgroup.length) {
    return cellLayoutMap;
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
        currentCol < colIndex + td.colspan && currentCol < colgroup.length;
        currentCol++
      ) {
        width += colgroup[currentCol].width;
        occupiedUntilRow[currentCol] = Math.max(
          occupiedUntilRow[currentCol],
          rowIndex + td.rowspan
        );
      }
      cellLayoutMap.set(td, { width });
      colIndex += td.colspan;
    }
  }
  return cellLayoutMap;
}

function getTableWidthFromColgroup(colgroup?: IColgroup[]) {
  if (!colgroup?.length) {
    return undefined;
  }
  return colgroup.reduce((sum, col) => sum + col.width, 0);
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

function pxBorderToDocxSize(width: number) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1;
  return Math.max(2, Math.round(safeWidth * 6));
}

function getRegularImageType(mime: string) {
  if (mime.includes('png')) return 'png' as const;
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg' as const;
  if (mime.includes('gif')) return 'gif' as const;
  if (mime.includes('bmp')) return 'bmp' as const;
  return null;
}

function normalizeDocxFileName(fileName?: string) {
  const trimmed = fileName?.trim();
  if (!trimmed) {
    return DEFAULT_DOCX_FILE_NAME;
  }
  return trimmed.toLowerCase().endsWith('.docx') ? trimmed : `${trimmed}.docx`;
}

function pxToTwips(px: number) {
  return Math.round(px * 15);
}
