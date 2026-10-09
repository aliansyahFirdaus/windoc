import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeightRule,
  ImageRun,
  LineRuleType,
  Packer,
  type IRunOptions,
  type ParagraphChild,
  PageOrientation,
  Paragraph,
  ShadingType,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign as DocxVerticalAlign,
  WidthType,
  XmlAttributeComponent,
  XmlComponent
} from 'docx';
import { ZERO } from '../dataset/constant/Common';
import { FORMAT_PLACEHOLDER } from '../dataset/constant/PageNumber';
import { PaperDirection } from '../dataset/enum/Editor';
import { ElementType } from '../dataset/enum/Element';
import { RowFlex } from '../dataset/enum/Row';
import { TableBorder, TdBorder } from '../dataset/enum/table/Table';
import { VerticalAlign } from '../dataset/enum/VerticalAlign';
import type { Draw } from '../core/draw/Draw';
import { IEditorOption, IExportDocxOption } from '../interface/Editor';
import { IElement, IElementPosition } from '../interface/Element';
import { IRow, IRowElement } from '../interface/Row';
import { ITd } from '../interface/table/Td';
import {
  loadImagePayload,
  mapUnderlineType,
  normalizeDocxFileName,
  normalizeHexColor
} from './docx';

// Layout-driven DOCX export: every windoc row becomes one paragraph with the
// row's exact height, every page break lands where windoc paginated, and x
// positions follow windoc's positionList. Word therefore never re-wraps or
// re-paginates, so the file matches the canvas preview.

const PX_TO_TWIP = 15;
// px drift tolerated before a run is re-anchored with a tab stop
const ANCHOR_EPS = 0.5;
// generous negative right indent so a row never re-wraps in Word
const RIGHT_SLACK_TWIP = -14400;
// smallest exact line, for spacer paragraphs
const TINY_TWIP = 1;

type FileChild = Paragraph | Table;

interface IZone {
  // layout x (scaled) of the zone's text column left edge, and its width
  startX: number;
  width: number;
  positionList: IElementPosition[];
}

interface IRowOptions {
  pageBreakBefore?: boolean;
  // extra space before the first / after the last row (cell padding)
  padTop?: number;
  padBottom?: number;
  // spacing before was already emitted (spacer or previous row's after)
  skipLead?: boolean;
  // next row's spacing before, carried here (twips)
  extraAfter?: number;
  // layout y of the row (scaled), for separator rounding
  rowY?: number;
}

interface IExportContext {
  draw: Draw;
  scale: number;
  measureCtx: CanvasRenderingContext2D;
}

const tw = (ctx: IExportContext, layoutPx: number) =>
  Math.round((layoutPx / ctx.scale) * PX_TO_TWIP);
const pxTw = (px: number) => Math.round(px * PX_TO_TWIP);

export async function exportDrawToDocx(
  draw: Draw,
  options: IExportDocxOption = {}
) {
  const canvas = document.createElement('canvas');
  const measureCtx = canvas.getContext('2d')!;
  const ctx: IExportContext = {
    draw,
    scale: draw.getOptions().scale,
    measureCtx
  };
  const file = await createDocument(ctx);
  const blob = await Packer.toBlob(file);
  return { blob, fileName: normalizeDocxFileName(options.fileName) };
}

async function createDocument(ctx: IExportContext) {
  const { draw, scale } = ctx;
  const opts = draw.getOptions();
  const width = draw.getOriginalWidth();
  const height = draw.getOriginalHeight();
  const margins = draw.getOriginalMargins();
  const header = draw.getHeader();
  const footer = draw.getFooter();
  const headerTop = header.getHeaderTop() / scale;
  const headerExtra = header.getExtraHeight() / scale;
  const footerExtra = footer.getExtraHeight() / scale;
  const layoutMargins = draw.getMargins();

  const body = await serializeMain(ctx, layoutMargins[3]);
  const headerChildren = opts.header.disabled
    ? []
    : await serializeRows(ctx, header.getRowList(), {
        startX: layoutMargins[3],
        width: draw.getInnerWidth(),
        positionList: header.getPositionList()
      });
  const footerChildren = opts.footer.disabled
    ? []
    : await serializeFooter(ctx, width, height, margins);

  const { pageNumber } = draw.getOptions();
  endWithParagraph(headerChildren);
  endWithParagraph(footerChildren);
  return new Document({
    compatabilityModeVersion: 15,
    // LibreOffice formats PAGE/NUMPAGES results from the paragraph style
    styles: {
      paragraphStyles: [
        {
          id: PAGE_NUMBER_STYLE,
          name: 'Windoc Page Number',
          run: pageNumberRunStyle(pageNumber)
        }
      ]
    },
    defaultTabStop: pxTw(width),
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pxTw(width),
              height: pxTw(height),
              orientation:
                opts.paperDirection === PaperDirection.HORIZONTAL
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT
            },
            margin: {
              top: pxTw(margins[0] + headerExtra),
              right: pxTw(margins[1]),
              bottom: pxTw(margins[2] + footerExtra),
              left: pxTw(margins[3]),
              header: pxTw(headerTop),
              footer: pxTw(footer.getFooterBottom() / scale),
              gutter: 0
            }
          }
        },
        headers: headerChildren.length
          ? { default: new Header({ children: headerChildren }) }
          : undefined,
        footers: footerChildren.length
          ? { default: new Footer({ children: footerChildren }) }
          : undefined,
        children: body.length ? body : [new Paragraph({})]
      }
    ]
  });
}

async function serializeMain(ctx: IExportContext, startX: number) {
  const { draw } = ctx;
  const zone: IZone = {
    startX,
    width: draw.getInnerWidth(),
    positionList: draw.getPosition().getOriginalMainPositionList()
  };
  const children: FileChild[] = [];
  const pageRowList = draw.getPageRowList();
  for (let p = 0; p < pageRowList.length; p++) {
    children.push(
      ...(await serializeRows(ctx, pageRowList[p], zone, {
        pageBreakBefore: p > 0
      }))
    );
  }
  return children;
}

async function serializeRows(
  ctx: IExportContext,
  rowList: IRow[],
  zone: IZone,
  options: IRowOptions = {}
): Promise<FileChild[]> {
  const { pageBreakBefore = false, padTop = 0, padBottom = 0 } = options;
  const children: FileChild[] = [];
  for (let r = 0; r < rowList.length; r++) {
    const row = rowList[r];
    const isFirst = r === 0;
    const isLast = r === rowList.length - 1;
    const table = row.elementList.find(el => el.type === ElementType.TABLE);
    if (table) {
      // a table carries neither pageBreakBefore nor spacing: use a spacer
      if ((isFirst && (pageBreakBefore || padTop)) || row.offsetY) {
        children.push(
          createSpacerParagraph(
            isFirst && pageBreakBefore,
            (isFirst ? padTop : 0) + (row.offsetY || 0) / ctx.scale
          )
        );
      }
      const position =
        zone.positionList[row.startIndex + row.elementList.indexOf(table)];
      children.push(await serializeTable(ctx, table, position, zone));
      // the table's row is taller than the table itself (row margin)
      const rest =
        (row.height + (row.spaceBelow || 0)) / ctx.scale -
        table.height! +
        (isLast ? padBottom : 0);
      if (rest * PX_TO_TWIP >= 1) {
        children.push(createSpacerParagraph(false, rest));
      }
      continue;
    }
    const rowOptions: IRowOptions = {
      pageBreakBefore: isFirst && pageBreakBefore,
      padTop: isFirst ? padTop : 0,
      padBottom: isLast ? padBottom : 0
    };
    // LibreOffice collapses one paragraph's spacing after with the next one's
    // spacing before (Word adds them), so a row's lead rides on the previous
    // row's spacing after and the two never meet
    if (!isFirst && isTextRow(rowList[r - 1])) rowOptions.skipLead = true;
    rowOptions.rowY = rowY(zone, row);
    if (!isLast && isTextRow(rowList[r + 1])) {
      rowOptions.extraAfter = rowLead(ctx, rowList[r + 1], {
        rowY: rowY(zone, rowList[r + 1])
      });
    }
    // spacing before is dropped right after a page break, so a page that
    // starts with spacing gets it from a spacer that carries the break
    const lead = rowOptions.pageBreakBefore ? rowLead(ctx, row, rowOptions) : 0;
    if (lead) {
      children.push(createSpacerParagraph(true, lead / PX_TO_TWIP));
      rowOptions.pageBreakBefore = false;
      rowOptions.skipLead = true;
    }
    children.push(await serializeRow(ctx, row, zone, rowOptions));
  }
  return children;
}

function rowY(zone: IZone, row: IRow) {
  return zone.positionList[row.startIndex]?.coordinate.leftTop[1];
}

function isTextRow(row: IRow) {
  return !row.elementList.some(el => el.type === ElementType.TABLE);
}

async function serializeRow(
  ctx: IExportContext,
  row: IRow,
  zone: IZone,
  options: IRowOptions,
  suffix?: {
    tabStop: number;
    tabType: (typeof TabStopType)[keyof typeof TabStopType];
    children: ParagraphChild[];
    style?: string;
  }
) {
  const { pageBreakBefore = false } = options;
  const { draw, scale } = ctx;
  const positions = zone.positionList;
  const children: ParagraphChild[] = [];
  const tabStops: number[] = [];
  const firstPosition = positions[row.startIndex];
  // pen: unscaled px from the zone's left edge, as Word will lay it out
  let pen = 0;
  let indent = firstPosition
    ? (firstPosition.coordinate.leftTop[0] - zone.startX) / scale
    : 0;
  let started = false;

  const anchorTo = (layoutX: number) => {
    const target = (layoutX - zone.startX) / scale;
    if (!started) {
      indent = target;
      pen = target;
      started = true;
      return;
    }
    if (target - pen > ANCHOR_EPS) {
      tabStops.push(pxTw(target));
      children.push(new TextRun({ children: [new Tab()] }));
      pen = target;
    }
  };

  // list marker is drawn by ListParticle, not part of the element list
  if (row.isList && firstPosition) {
    const listParticle = draw.getListParticle();
    const markerX = listParticle.getListMarkerX(row, firstPosition);
    const marker = markerX === null ? null : listParticle.getListMarker(row);
    if (markerX !== null && marker) {
      anchorTo(markerX);
      children.push(createTextRun(ctx, marker.text, marker.styleElement));
      pen += measure(ctx, marker.text, marker.styleElement);
    }
  }

  let run: { text: string; element: IRowElement } | null = null;
  const flush = () => {
    if (!run) return;
    children.push(createTextRun(ctx, run.text, run.element));
    run = null;
  };

  for (let j = 0; j < row.elementList.length; j++) {
    const element = row.elementList[j];
    const position = positions[row.startIndex + j];
    if (!position) continue;
    if (element.hide || element.control?.hide || element.area?.hide) continue;
    if (element.type === ElementType.SEPARATOR) {
      flush();
      return createSeparatorParagraph(
        ctx,
        row,
        element,
        position.coordinate.leftTop[0],
        position.coordinate.leftTop[1],
        zone,
        options
      );
    }
    if (
      element.value === ZERO ||
      element.type === ElementType.TAB ||
      element.type === ElementType.PAGE_BREAK ||
      element.type === ElementType.COLUMN_BREAK
    ) {
      continue;
    }
    const x = position.coordinate.leftTop[0];
    const layoutWidth = element.metrics.width / scale;
    if (element.type === ElementType.IMAGE) {
      flush();
      anchorTo(x);
      const image = await createImageRun(element);
      if (image) children.push(image);
      pen += layoutWidth;
      continue;
    }
    if (element.type === ElementType.LABEL) {
      flush();
      const padding =
        element.label?.padding || draw.getOptions().label.defaultPadding;
      anchorTo(x + padding[3] * scale);
      children.push(
        createTextRun(ctx, element.value, element, labelShading(ctx, element))
      );
      pen += measure(ctx, element.value, element);
      continue;
    }
    const text = getElementText(element);
    if (!text) continue;
    const natural = measure(ctx, text, element);
    const target = (x - zone.startX) / scale;
    const isDrift = !started || target - pen > ANCHOR_EPS;
    // windoc widens spaces when justifying; mirror it with char spacing
    const extra = layoutWidth - natural;
    const needsSpacing = Math.abs(extra) * PX_TO_TWIP >= 1;
    const canJoin =
      run && !isDrift && !needsSpacing && isSameRunStyle(run.element, element);
    if (canJoin) {
      run!.text += text;
    } else {
      flush();
      anchorTo(x);
      if (needsSpacing) {
        children.push(
          createTextRun(ctx, text, element, undefined, pxTw(extra))
        );
      } else {
        run = { text, element };
      }
    }
    pen = target + layoutWidth;
  }
  flush();

  // a row without content only holds space; LibreOffice drops spacing on an
  // empty paragraph at the top of a page, so give it all as line height
  if (!children.length && !suffix) {
    const total =
      (options.skipLead ? 0 : rowLead(ctx, row, options)) +
      rowLine(ctx, row).lineTw +
      rowSpacing(ctx, row, options).after;
    return createSpacerParagraph(pageBreakBefore, total / PX_TO_TWIP);
  }

  const stops: {
    type: (typeof TabStopType)[keyof typeof TabStopType];
    position: number;
  }[] = tabStops.map(position => ({ type: TabStopType.LEFT, position }));
  if (suffix) {
    stops.push({ type: suffix.tabType, position: suffix.tabStop });
    children.push(new TextRun({ children: [new Tab()] }), ...suffix.children);
  }
  return new Paragraph({
    children,
    run: hasInlineImage(row) ? { size: IMAGE_MARK_HALF_POINTS } : undefined,
    style: suffix?.style,
    pageBreakBefore,
    widowControl: false,
    tabStops: stops,
    indent: { left: pxTw(indent), right: RIGHT_SLACK_TWIP },
    spacing: rowSpacing(ctx, row, options)
  });
}

// Word (and LibreOffice for DOCX) puts the baseline of an exact line at 80%
// of the line height; windoc puts it at row.ascent. Pick a line height that
// lands the baseline on row.ascent and give the rest to spacing, keeping the
// row's total height unchanged.
const EXACT_BASELINE_RATIO = 0.8;

// An inline picture taller than an exact line gets clipped or moved, so
// picture rows use "at least": the line is the picture plus the paragraph
// mark's descent (a 1pt mark keeps that tiny) and the baseline lands on
// row.ascent like any other row.
const IMAGE_MARK_HALF_POINTS = 2;
const IMAGE_MARK_DESCENT_PX = 0.3;

function hasInlineImage(row: IRow) {
  return row.elementList.some(el => el.type === ElementType.IMAGE);
}

function rowLine(
  ctx: IExportContext,
  row: IRow,
  baseline = row.ascent / ctx.scale
) {
  const { scale } = ctx;
  const height = row.height / scale;
  if (hasInlineImage(row)) {
    const lineTw = pxTw(Math.min(baseline, height) + IMAGE_MARK_DESCENT_PX);
    return {
      lineTw,
      beforeTw: 0,
      afterTw: Math.max(0, pxTw(height) - lineTw),
      atLeast: true
    };
  }
  const ascent = Math.min(baseline, height);
  const line = Math.min(
    ascent / EXACT_BASELINE_RATIO,
    (height - ascent) / (1 - EXACT_BASELINE_RATIO)
  );
  const lineTw = Math.max(TINY_TWIP, pxTw(line));
  const beforeTw = Math.max(
    0,
    pxTw(ascent) - Math.round(lineTw * EXACT_BASELINE_RATIO)
  );
  const afterTw = Math.max(0, pxTw(height) - lineTw - beforeTw);
  return { lineTw, beforeTw, afterTw, atLeast: false };
}

// all space above the row's line box, in twips
function rowLead(ctx: IExportContext, row: IRow, options: IRowOptions) {
  const separator = row.elementList.find(
    el => el.type === ElementType.SEPARATOR
  );
  const baseline =
    separator && options.rowY !== undefined
      ? separatorBaseline(
          ctx,
          row,
          options.rowY,
          separator.lineWidth || ctx.draw.getOptions().separator.lineWidth
        )
      : undefined;
  return (
    rowLine(ctx, row, baseline).beforeTw +
    tw(ctx, (row.offsetY || 0) + (row.spaceAbove || 0)) +
    pxTw(options.padTop || 0)
  );
}

function rowSpacing(ctx: IExportContext, row: IRow, options: IRowOptions) {
  const { lineTw, afterTw, atLeast } = rowLine(ctx, row);
  return {
    before: options.skipLead ? 0 : rowLead(ctx, row, options),
    after:
      afterTw +
      tw(ctx, row.spaceBelow || 0) +
      pxTw(options.padBottom || 0) +
      (options.extraAfter || 0),
    line: lineTw,
    lineRule: atLeast ? LineRuleType.AT_LEAST : LineRuleType.EXACT
  };
}

// Separator: an inline line image standing on the baseline. A paragraph
// border would be simpler, but LibreOffice adds its thickness to the height
// inside table cells only, so the image keeps every renderer on windoc's y.
function createSeparatorParagraph(
  ctx: IExportContext,
  row: IRow,
  element: IRowElement,
  x: number,
  rowY: number,
  zone: IZone,
  options: IRowOptions
) {
  const { scale } = ctx;
  const opts = ctx.draw.getOptions();
  const lineWidth = element.lineWidth || opts.separator.lineWidth;
  const sideGap = 4;
  const left = (x - zone.startX) / scale + sideGap;
  const width = Math.max(1, (element.width || 0) - sideGap * 2);
  const color = element.color || opts.separator.strokeStyle;
  const line = rowLine(ctx, row, separatorBaseline(ctx, row, rowY, lineWidth));
  return new Paragraph({
    pageBreakBefore: options.pageBreakBefore,
    widowControl: false,
    indent: { left: pxTw(left), right: RIGHT_SLACK_TWIP },
    children: [
      new ImageRun({
        type: 'png',
        data: createLineImage(width, lineWidth, color, element.dashArray),
        transformation: { width, height: lineWidth }
      })
    ],
    spacing: {
      before: options.skipLead ? 0 : rowLead(ctx, row, options),
      after:
        line.afterTw +
        tw(ctx, row.spaceBelow || 0) +
        pxTw(options.padBottom || 0) +
        (options.extraAfter || 0),
      line: line.lineTw,
      lineRule: LineRuleType.EXACT
    }
  });
}

// SeparatorParticle strokes from Math.round(y + ascent) in scaled px; the
// image stands on the baseline, so the baseline sits one line width lower
function separatorBaseline(
  ctx: IExportContext,
  row: IRow,
  rowY: number,
  lineWidth: number
) {
  return (Math.round(rowY + row.ascent) - rowY) / ctx.scale + lineWidth;
}

// line bitmap at 4x so it stays crisp when Word scales it to px size
function createLineImage(
  width: number,
  height: number,
  color: string,
  dashArray?: number[]
) {
  const ratio = 4;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = color;
  ctx.lineWidth = canvas.height;
  if (dashArray?.length) ctx.setLineDash(dashArray.map(v => v * ratio));
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  const binary = atob(canvas.toDataURL('image/png').split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Word appends a full-height empty paragraph when a header, footer or cell
// ends with a table; end it with a 1-twip one instead
function endWithParagraph(children: FileChild[]) {
  if (children[children.length - 1] instanceof Table) {
    children.push(createSpacerParagraph(false));
  }
  return children;
}

function createSpacerParagraph(pageBreakBefore: boolean, height = 0) {
  return new Paragraph({
    pageBreakBefore,
    widowControl: false,
    children: [new TextRun({ text: '', size: 2 })],
    spacing: {
      before: 0,
      after: 0,
      line: Math.max(TINY_TWIP, pxTw(height)),
      lineRule: LineRuleType.EXACT
    }
  });
}

async function serializeTable(
  ctx: IExportContext,
  element: IRowElement,
  position: IElementPosition,
  zone: IZone
) {
  const { draw, scale } = ctx;
  const opts = draw.getOptions();
  const tableX = position.coordinate.leftTop[0];
  const trList = element.trList || [];
  const colgroup = element.colgroup || [];
  const rows: TableRow[] = [];
  for (let t = 0; t < trList.length; t++) {
    const tr = trList[t];
    const cells: TableCell[] = [];
    let rowTopBorder = 0;
    for (let d = 0; d < tr.tdList.length; d++) {
      const td = tr.tdList[d];
      const padding = td.padding || opts.table.tdPadding;
      const borders = createCellBorders(ctx, element, td);
      // the first row's top border is laid out above the row and a left
      // border pushes text by half its width; windoc draws both over the cell
      const topBorder = t === 0 ? borderPx(borders.top) : 0;
      rowTopBorder = Math.max(rowTopBorder, topBorder);
      // LibreOffice adds vertical cell margins on top of an exact row
      // height, so vertical padding travels as paragraph spacing instead
      const cellChildren = await serializeRows(
        ctx,
        td.rowList || [],
        {
          startX: (td.x! + padding[3]) * scale + tableX,
          width: (td.width! - padding[1] - padding[3]) * scale,
          positionList: td.positionList || []
        },
        { padTop: Math.max(0, padding[0] - topBorder), padBottom: padding[2] }
      );
      cells.push(
        new TableCell({
          children: cellChildren.length
            ? endWithParagraph(cellChildren)
            : [createSpacerParagraph(false)],
          columnSpan: td.colspan > 1 ? td.colspan : undefined,
          rowSpan: td.rowspan > 1 ? td.rowspan : undefined,
          width: { size: pxTw(td.width!), type: WidthType.DXA },
          verticalAlign: mapVerticalAlign(td.verticalAlign),
          margins: {
            top: 0,
            right: pxTw(padding[1]),
            bottom: 0,
            left: pxTw(Math.max(0, padding[3] - borderPx(borders.left) / 2)),
            marginUnitType: WidthType.DXA
          },
          shading: td.backgroundColor
            ? {
                fill: normalizeHexColor(td.backgroundColor, 'FFFFFF'),
                type: ShadingType.CLEAR,
                color: 'auto'
              }
            : undefined,
          borders
        })
      );
    }
    rows.push(
      new TableRow({
        children: cells,
        cantSplit: true,
        height: {
          value: pxTw(tr.height! - rowTopBorder),
          rule: HeightRule.EXACT
        }
      })
    );
  }
  return new Table({
    rows,
    layout: TableLayoutType.FIXED,
    width: { size: pxTw(element.width!), type: WidthType.DXA },
    columnWidths: colgroup.map(col => pxTw(col.width)),
    indent: { size: tw(ctx, tableX - zone.startX), type: WidthType.DXA },
    borders: noTableBorders()
  });
}

// windoc strokes every cell edge itself; map that per cell so Word draws the
// same set of lines (outer lines come from the edge cells)
function createCellBorders(ctx: IExportContext, table: IElement, td: ITd) {
  const opts = ctx.draw.getOptions();
  const color = normalizeHexColor(
    td.borderColor || table.borderColor || opts.table.defaultBorderColor,
    '000000'
  );
  const width = table.borderWidth || 1;
  const externalWidth = table.borderExternalWidth || width;
  const isDash = table.borderType === TableBorder.DASH;
  const line = (w: number) => ({
    style: isDash ? BorderStyle.DASHED : BorderStyle.SINGLE,
    size: Math.max(2, Math.round(w * 6)),
    color
  });
  const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const isTop = td.rowIndex === 0;
  const isLeft = td.colIndex === 0;
  const isBottom = td.rowIndex! + td.rowspan === table.trList!.length;
  const isRight = td.colIndex! + td.colspan === table.colgroup!.length;
  const edge = (outer: boolean) => (outer ? line(externalWidth) : line(width));
  let top: ReturnType<typeof line> | typeof none = none;
  let right: ReturnType<typeof line> | typeof none = none;
  let bottom: ReturnType<typeof line> | typeof none = none;
  let left: ReturnType<typeof line> | typeof none = none;
  switch (table.borderType) {
    case TableBorder.EMPTY:
      break;
    case TableBorder.EXTERNAL:
      if (isTop) top = edge(true);
      if (isBottom) bottom = edge(true);
      if (isLeft) left = edge(true);
      if (isRight) right = edge(true);
      break;
    case TableBorder.INTERNAL:
      if (!isTop) top = edge(false);
      if (!isBottom) bottom = edge(false);
      if (!isLeft) left = edge(false);
      if (!isRight) right = edge(false);
      break;
    default:
      top = edge(isTop);
      bottom = edge(isBottom);
      left = edge(isLeft);
      right = edge(isRight);
  }
  if (td.borderTypes?.includes(TdBorder.TOP)) top = line(width);
  if (td.borderTypes?.includes(TdBorder.RIGHT)) right = line(width);
  if (td.borderTypes?.includes(TdBorder.BOTTOM)) bottom = line(width);
  if (td.borderTypes?.includes(TdBorder.LEFT)) left = line(width);
  return { top, right, bottom, left };
}

// border size is in eighths of a point
function borderPx(border: { style: string; size: number }) {
  return border.style === BorderStyle.NONE ? 0 : (border.size / 8) * (4 / 3);
}

function noTableBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  return {
    top: none,
    bottom: none,
    left: none,
    right: none,
    insideHorizontal: none,
    insideVertical: none
  };
}

function mapVerticalAlign(verticalAlign?: VerticalAlign) {
  switch (verticalAlign) {
    case VerticalAlign.MIDDLE:
      return DocxVerticalAlign.CENTER;
    case VerticalAlign.BOTTOM:
      return DocxVerticalAlign.BOTTOM;
    default:
      return DocxVerticalAlign.TOP;
  }
}

// Footer band: Word footers cannot be colored, so the bar is a 1x1 table that
// spans the full page width (negative indent) with the footer rows inside.
// The page number joins the footer row closest to its baseline (tab + shift).
async function serializeFooter(
  ctx: IExportContext,
  pageWidth: number,
  pageHeight: number,
  margins: number[]
): Promise<FileChild[]> {
  const { draw, scale } = ctx;
  const footer = draw.getFooter();
  const opts = draw.getOptions();
  const barHeight = footer.getHeight() / scale;
  const contentHeight = footer.getRowHeight() / scale;
  const paddingTop =
    Math.floor(Math.max(0, (barHeight - contentHeight) / 2) * scale) / scale;
  const zone: IZone = {
    startX: draw.getMargins()[3],
    width: draw.getInnerWidth(),
    positionList: footer.getPositionList()
  };
  const rowList = footer.getRowList();
  const textWidth = pageWidth - margins[1] - margins[3];
  const pageNumber = createPageNumberRuns(ctx, pageHeight, textWidth);
  let pageNumberRow = -1;
  if (pageNumber) {
    pageNumberRow = rowList.length - 1;
    for (let r = 0; r < rowList.length; r++) {
      const top =
        zone.positionList[rowList[r].startIndex].coordinate.leftTop[1] / scale;
      if (pageNumber.baseline <= top + rowList[r].height / scale) {
        pageNumberRow = r;
        break;
      }
    }
  }
  const children: FileChild[] = [];
  for (let r = 0; r < rowList.length; r++) {
    const row = rowList[r];
    const rowOptions: IRowOptions = { padTop: r === 0 ? paddingTop : 0 };
    if (r !== pageNumberRow) {
      children.push(...(await serializeRows(ctx, [row], zone, rowOptions)));
      continue;
    }
    const top = zone.positionList[row.startIndex].coordinate.leftTop[1] / scale;
    const shift = pageNumber!.baseline - (top + row.ascent / scale);
    children.push(
      await serializeRow(ctx, row, zone, rowOptions, {
        tabStop: pageNumber!.tabStop,
        tabType: pageNumber!.tabType,
        children: pageNumber!.runs(shift),
        style: PAGE_NUMBER_STYLE
      })
    );
  }
  const fill = opts.footer.backgroundColor
    ? normalizeHexColor(opts.footer.backgroundColor, 'FFFFFF')
    : undefined;
  const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };
  const band = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: pxTw(pageWidth), type: WidthType.DXA },
    columnWidths: [pxTw(pageWidth)],
    indent: { size: -pxTw(margins[3]), type: WidthType.DXA },
    borders: noTableBorders(),
    rows: [
      new TableRow({
        cantSplit: true,
        height: { value: pxTw(barHeight), rule: HeightRule.EXACT },
        children: [
          new TableCell({
            width: { size: pxTw(pageWidth), type: WidthType.DXA },
            margins: {
              top: 0,
              bottom: 0,
              left: pxTw(margins[3]),
              right: pxTw(margins[1]),
              marginUnitType: WidthType.DXA
            },
            shading: fill
              ? { fill, type: ShadingType.CLEAR, color: 'auto' }
              : undefined,
            borders: { top: none, right: none, bottom: none, left: none },
            children: children.length
              ? children
              : [createSpacerParagraph(false)]
          })
        ]
      })
    ]
  });
  return [band];
}

const PAGE_NUMBER_STYLE = 'WindocPageNumber';

class FieldCharAttributes extends XmlAttributeComponent<{ type: string }> {
  protected readonly xmlKeys = { type: 'w:fldCharType' };
}

class FieldChar extends XmlComponent {
  constructor(type: 'begin' | 'separate' | 'end') {
    super('w:fldChar');
    this.root.push(new FieldCharAttributes({ type }));
  }
}

class InstrTextAttributes extends XmlAttributeComponent<{ space: string }> {
  protected readonly xmlKeys = { space: 'xml:space' };
}

class InstrText extends XmlComponent {
  constructor(instruction: string) {
    super('w:instrText');
    this.root.push(new InstrTextAttributes({ space: 'preserve' }));
    this.root.push(` ${instruction} `);
  }
}

// begin | instr | separate | result | end, each in its own run: docx's
// PageNumber packs them into one run with no result, which LibreOffice then
// renders at a ~1pt fallback size
function createFieldRuns(
  instruction: string,
  cached: string,
  style: Omit<IRunOptions, 'text' | 'children'>
) {
  return [
    new TextRun({ ...style, children: [new FieldChar('begin')] }),
    new TextRun({ ...style, children: [new InstrText(instruction)] }),
    new TextRun({ ...style, children: [new FieldChar('separate')] }),
    new TextRun({ ...style, text: cached }),
    new TextRun({ ...style, children: [new FieldChar('end')] })
  ];
}

function pageNumberRunStyle(pageNumber: IEditorOption['pageNumber']) {
  return {
    font: mapFont(pageNumber?.font || 'sans-serif'),
    // PageNumber draws `${size}px`; half-points = px * 0.75 * 2
    size: Math.round((pageNumber?.size || 12) * 1.5),
    color: normalizeHexColor(pageNumber?.color || '#000000', '000000')
  };
}

// PageNumber renders `${size * scale}px` text with its baseline at
// height - bottom, aligned against the margins
function createPageNumberRuns(
  ctx: IExportContext,
  pageHeight: number,
  textWidth: number
) {
  const { pageNumber } = ctx.draw.getOptions();
  if (pageNumber.disabled || pageNumber.fromPageNo > 0) return null;
  const pageCount = ctx.draw.getPageCount();
  const tokens = (pageNumber.format || FORMAT_PLACEHOLDER.PAGE_NO).split(
    /(\{pageNo\}|\{pageCount\})/
  );
  const tabType =
    pageNumber.rowFlex === RowFlex.CENTER
      ? TabStopType.CENTER
      : pageNumber.rowFlex === RowFlex.RIGHT
        ? TabStopType.RIGHT
        : TabStopType.LEFT;
  const tabStop =
    tabType === TabStopType.CENTER
      ? pxTw(textWidth / 2)
      : tabType === TabStopType.RIGHT
        ? pxTw(textWidth)
        : 0;
  // w:position is integer half-points (positive raises); docx types it as a
  // measure string and writes it verbatim, so hand it the bare integer
  const position = (shift: number) => {
    const halfPoints = Math.round(-shift * 0.75 * 2);
    return halfPoints ? (`${halfPoints}` as `${number}pt`) : undefined;
  };
  return {
    baseline: pageHeight - pageNumber.bottom,
    tabType,
    tabStop,
    // shift > 0 means the number sits lower than the row baseline
    runs: (shift: number) =>
      tokens
        .filter(Boolean)
        .map(token => {
          const style = {
            ...pageNumberRunStyle(pageNumber),
            position: position(shift)
          };
          const field =
            token === FORMAT_PLACEHOLDER.PAGE_NO
              ? { instruction: 'PAGE', cached: '1' }
              : token === FORMAT_PLACEHOLDER.PAGE_COUNT
                ? { instruction: 'NUMPAGES', cached: `${pageCount}` }
                : null;
          if (!field) return [new TextRun({ text: token, ...style })];
          return createFieldRuns(field.instruction, field.cached, style);
        })
        .flat()
  };
}

function createTextRun(
  ctx: IExportContext,
  text: string,
  element: IElement,
  shading?: { fill: string; type: typeof ShadingType.CLEAR; color: string },
  characterSpacing?: number
): ParagraphChild {
  const opts = ctx.draw.getOptions();
  const isLink = element.type === ElementType.HYPERLINK;
  const color = normalizeHexColor(
    element.color || (isLink ? opts.defaultHyperlinkColor : opts.defaultColor),
    '000000'
  );
  const highlight = element.highlight
    ? normalizeHexColor(element.highlight)
    : undefined;
  const textRun = new TextRun({
    text,
    font: mapFont(element.font || opts.defaultFont),
    size: Math.round(getSize(ctx, element) * 2),
    bold: !!element.bold,
    italics: !!element.italic,
    strike: !!element.strikeout,
    superScript: element.type === ElementType.SUPERSCRIPT,
    subScript: element.type === ElementType.SUBSCRIPT,
    underline:
      element.underline || isLink
        ? { type: mapUnderlineType(element.textDecoration?.style) }
        : undefined,
    color,
    shading:
      shading ||
      (highlight
        ? { fill: highlight, type: ShadingType.CLEAR, color: 'auto' }
        : undefined),
    characterSpacing
  });
  if (isLink && element.url) {
    return new ExternalHyperlink({ link: element.url, children: [textRun] });
  }
  return textRun;
}

function labelShading(ctx: IExportContext, element: IElement) {
  const { defaultBackgroundColor } = ctx.draw.getOptions().label;
  return {
    fill: normalizeHexColor(
      element.label?.backgroundColor || defaultBackgroundColor,
      'FFFFFF'
    )!,
    type: ShadingType.CLEAR,
    color: 'auto'
  };
}

async function createImageRun(element: IElement) {
  try {
    const image = await loadImagePayload(element.value);
    const transformation = {
      width: Math.max(1, element.width || 1),
      height: Math.max(1, element.height || 1)
    };
    if (image.type === 'svg' && image.fallbackPng) {
      return new ImageRun({
        type: 'svg',
        data: image.data,
        fallback: { type: 'png', data: image.fallbackPng },
        transformation
      });
    }
    return new ImageRun({
      type: image.type as 'png' | 'jpg' | 'gif' | 'bmp',
      data: image.data,
      transformation
    });
  } catch {
    return null;
  }
}

function getElementText(element: IElement) {
  switch (element.type) {
    case ElementType.CHECKBOX:
      return element.checkbox?.value ? '☑' : '☐';
    case ElementType.RADIO:
      return element.radio?.value ? '◉' : '○';
    default:
      return (element.value || '').replace(new RegExp(ZERO, 'g'), '');
  }
}

function getSize(ctx: IExportContext, element: IElement) {
  return (
    element.actualSize || element.size || ctx.draw.getOptions().defaultSize
  );
}

// natural advance width at scale 1, which is what Word lays out
function measure(ctx: IExportContext, text: string, element: IElement) {
  ctx.measureCtx.font = ctx.draw.getElementFont(element, 1);
  return ctx.measureCtx.measureText(text).width;
}

function isSameRunStyle(a: IElement, b: IElement) {
  return (
    a.type === b.type &&
    a.font === b.font &&
    a.size === b.size &&
    a.actualSize === b.actualSize &&
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.strikeout === !!b.strikeout &&
    a.color === b.color &&
    a.highlight === b.highlight &&
    a.url === b.url
  );
}

function mapFont(font: string) {
  const name = font.trim().replace(/^['"]|['"]$/g, '');
  switch (name.toLowerCase()) {
    case 'sans-serif':
      // canvas resolves this to Helvetica (mac) / Arial; Arial shares
      // Helvetica's metrics and exists in every DOCX viewer
      return 'Arial';
    case 'serif':
      return 'Times New Roman';
    case 'monospace':
      return 'Courier New';
    default:
      return name;
  }
}
