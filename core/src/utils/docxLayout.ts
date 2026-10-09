import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeightRule,
  HorizontalPositionRelativeFrom,
  ImageRun,
  LevelFormat,
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
  TextWrappingType,
  VerticalAlign as DocxVerticalAlign,
  VerticalPositionRelativeFrom,
  WidthType,
  XmlAttributeComponent,
  XmlComponent
} from 'docx';
import { ZERO } from '../dataset/constant/Common';
import { olPresetCycles } from '../dataset/constant/List';
import { FORMAT_PLACEHOLDER } from '../dataset/constant/PageNumber';
import { PaperDirection } from '../dataset/enum/Editor';
import { ElementType } from '../dataset/enum/Element';
import { ListType } from '../dataset/enum/List';
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

interface IListPlan {
  reference: string;
  native: boolean;
  // Word numbering levels, from windoc's marker style per level
  levels: Map<number, { format: ILevelFormat; text: string }>;
}

type ILevelFormat = (typeof LevelFormat)[keyof typeof LevelFormat];

interface IExportContext {
  draw: Draw;
  scale: number;
  measureCtx: CanvasRenderingContext2D;
  lists: Map<string, IListPlan>;
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
    measureCtx,
    lists: new Map()
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

  planLists(ctx);
  const body = await serializeMain(ctx, layoutMargins[3]);
  const headerChildren = opts.header.disabled
    ? []
    : await serializeRows(ctx, header.getRowList(), {
        startX: layoutMargins[3],
        width: draw.getInnerWidth(),
        positionList: header.getPositionList()
      });
  const footerResult = opts.footer.disabled
    ? { children: [], distance: footer.getFooterBottom() / scale }
    : await serializeFooter(ctx, width, height, margins);
  const footerChildren = footerResult.children;

  const { pageNumber } = draw.getOptions();
  endWithParagraph(headerChildren);
  endWithParagraph(footerChildren);
  return new Document({
    compatabilityModeVersion: 15,
    numbering: { config: createNumberingConfig(ctx) },
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
              footer: pxTw(footerResult.distance),
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

// A unit is what becomes one block in the DOCX: a table, a single row, or
// every row of one list item (a numbered paragraph with line breaks, so Enter
// in Word continues the numbering)
type IUnit =
  | { kind: 'table'; row: IRow; table: IRowElement }
  | { kind: 'row'; row: IRow }
  | { kind: 'list'; rows: IRow[] };

async function serializeRows(
  ctx: IExportContext,
  rowList: IRow[],
  zone: IZone,
  options: IRowOptions = {}
): Promise<FileChild[]> {
  const { pageBreakBefore = false, padTop = 0, padBottom = 0 } = options;
  const units = groupUnits(ctx, rowList, zone);
  const children: FileChild[] = [];
  for (let u = 0; u < units.length; u++) {
    const unit = units[u];
    const isFirst = u === 0;
    const isLast = u === units.length - 1;
    if (unit.kind === 'table') {
      const { row, table } = unit;
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
    const first = unitFirstRow(unit);
    const rowOptions: IRowOptions = {
      pageBreakBefore: isFirst && pageBreakBefore,
      padTop: isFirst ? padTop : 0,
      padBottom: isLast ? padBottom : 0,
      rowY: rowY(zone, first)
    };
    // LibreOffice collapses one paragraph's spacing after with the next one's
    // spacing before (Word adds them), so a unit's lead rides on the previous
    // unit's spacing after and the two never meet
    if (!isFirst && units[u - 1].kind !== 'table') rowOptions.skipLead = true;
    const next = units[u + 1];
    if (next && next.kind !== 'table') {
      rowOptions.extraAfter = unitLead(ctx, next, zone, {});
    }
    // spacing before is dropped right after a page break, so a page that
    // starts with spacing gets it from a spacer that carries the break
    const lead = rowOptions.pageBreakBefore
      ? unitLead(ctx, unit, zone, rowOptions)
      : 0;
    if (lead) {
      children.push(createSpacerParagraph(true, lead / PX_TO_TWIP));
      rowOptions.pageBreakBefore = false;
      rowOptions.skipLead = true;
    }
    children.push(
      unit.kind === 'list'
        ? await serializeListItem(ctx, unit.rows, zone, rowOptions)
        : await serializeRow(ctx, unit.row, zone, rowOptions)
    );
  }
  return children;
}

function unitFirstRow(unit: IUnit) {
  return unit.kind === 'list' ? unit.rows[0] : unit.row;
}

function unitLead(
  ctx: IExportContext,
  unit: IUnit,
  zone: IZone,
  options: IRowOptions
) {
  if (unit.kind === 'list') return listLead(ctx, unit.rows[0], options);
  const row = unitFirstRow(unit);
  return rowLead(ctx, row, { ...options, rowY: rowY(zone, row) });
}

function groupUnits(ctx: IExportContext, rowList: IRow[], zone: IZone) {
  const units: IUnit[] = [];
  for (let r = 0; r < rowList.length; r++) {
    const row = rowList[r];
    const table = row.elementList.find(el => el.type === ElementType.TABLE);
    if (table) {
      units.push({ kind: 'table', row, table });
      continue;
    }
    if (isNativeListStart(ctx, row, zone)) {
      const rows = [row];
      while (
        r + 1 < rowList.length &&
        isListContinuation(row, rowList[r + 1])
      ) {
        rows.push(rowList[++r]);
      }
      units.push({ kind: 'list', rows });
      continue;
    }
    units.push({ kind: 'row', row });
  }
  return units;
}

function rowY(zone: IZone, row: IRow) {
  return zone.positionList[row.startIndex]?.coordinate.leftTop[1];
}

interface ILine {
  children: ParagraphChild[];
  tabStops: number[];
  // unscaled px from the zone's left edge, where Word's pen currently is
  pen: number;
  started: boolean;
  indent: number;
  // w:position for every text run (half-points as string), list items only
  position?: `${number}pt`;
}

// Emit one windoc row's content into a paragraph line. Runs follow Word's
// natural advance; wherever windoc placed something elsewhere (tabs, labels,
// list text) a left tab stop re-anchors the pen on windoc's x.
async function appendRowRuns(
  ctx: IExportContext,
  row: IRow,
  zone: IZone,
  line: ILine
) {
  const { draw, scale } = ctx;
  const positions = zone.positionList;
  const anchorTo = (layoutX: number) => {
    const target = (layoutX - zone.startX) / scale;
    if (!line.started) {
      line.indent = target;
      line.pen = target;
      line.started = true;
      return;
    }
    if (target - line.pen > ANCHOR_EPS) {
      line.tabStops.push(pxTw(target));
      line.children.push(new TextRun({ children: [new Tab()] }));
      line.pen = target;
    }
  };

  let run: { text: string; element: IRowElement } | null = null;
  const flush = () => {
    if (!run) return;
    line.children.push(
      createTextRun(
        ctx,
        run.text,
        run.element,
        undefined,
        undefined,
        line.position
      )
    );
    run = null;
  };

  for (let j = 0; j < row.elementList.length; j++) {
    const element = row.elementList[j];
    const position = positions[row.startIndex + j];
    if (!position) continue;
    if (element.hide || element.control?.hide || element.area?.hide) continue;
    if (
      element.value === ZERO ||
      element.type === ElementType.TAB ||
      element.type === ElementType.PAGE_BREAK ||
      element.type === ElementType.COLUMN_BREAK ||
      element.type === ElementType.SEPARATOR
    ) {
      continue;
    }
    const x = position.coordinate.leftTop[0];
    const layoutWidth = element.metrics.width / scale;
    if (element.type === ElementType.IMAGE) {
      flush();
      anchorTo(x);
      const image = await createImageRun(element);
      if (image) line.children.push(image);
      line.pen += layoutWidth;
      continue;
    }
    if (element.type === ElementType.LABEL) {
      flush();
      const padding =
        element.label?.padding || draw.getOptions().label.defaultPadding;
      anchorTo(x + padding[3] * scale);
      line.children.push(
        createTextRun(
          ctx,
          element.value,
          element,
          labelShading(ctx, element),
          undefined,
          line.position
        )
      );
      line.pen += measure(ctx, element.value, element);
      continue;
    }
    const text = getElementText(element);
    if (!text) continue;
    const natural = measure(ctx, text, element);
    const target = (x - zone.startX) / scale;
    const isDrift = !line.started || target - line.pen > ANCHOR_EPS;
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
        line.children.push(
          createTextRun(
            ctx,
            text,
            element,
            undefined,
            pxTw(extra),
            line.position
          )
        );
      } else {
        run = { text, element };
      }
    }
    line.pen = target + layoutWidth;
  }
  flush();
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
  },
  // floating drawing anchored in this paragraph (footer band)
  anchor?: ParagraphChild
) {
  const { pageBreakBefore = false } = options;
  const { draw, scale } = ctx;
  const firstPosition = zone.positionList[row.startIndex];
  const separatorIndex = row.elementList.findIndex(
    el => el.type === ElementType.SEPARATOR
  );
  if (separatorIndex >= 0) {
    const position = zone.positionList[row.startIndex + separatorIndex];
    if (position) {
      return createSeparatorParagraph(
        ctx,
        row,
        row.elementList[separatorIndex],
        position.coordinate.leftTop[0],
        position.coordinate.leftTop[1],
        zone,
        options
      );
    }
  }
  const line: ILine = {
    children: [],
    tabStops: [],
    pen: 0,
    started: false,
    indent: firstPosition
      ? (firstPosition.coordinate.leftTop[0] - zone.startX) / scale
      : 0
  };

  // literal list marker (lists that cannot map onto Word numbering)
  if (row.isList && firstPosition) {
    const listParticle = draw.getListParticle();
    const markerX = listParticle.getListMarkerX(row, firstPosition);
    const marker = markerX === null ? null : listParticle.getListMarker(row);
    if (markerX !== null && marker) {
      line.indent = (markerX - zone.startX) / scale;
      line.pen = line.indent;
      line.started = true;
      line.children.push(createTextRun(ctx, marker.text, marker.styleElement));
      line.pen += measure(ctx, marker.text, marker.styleElement);
    }
  }

  await appendRowRuns(ctx, row, zone, line);
  const { children } = line;
  if (anchor) children.unshift(anchor);

  // a row without content only holds space; LibreOffice drops spacing on an
  // empty paragraph at the top of a page, so give it all as line height
  if (!line.started && !suffix) {
    const total =
      (options.skipLead ? 0 : rowLead(ctx, row, options)) +
      rowLine(ctx, row).lineTw +
      rowSpacing(ctx, row, options).after;
    return createSpacerParagraph(pageBreakBefore, total / PX_TO_TWIP, anchor);
  }

  const stops: {
    type: (typeof TabStopType)[keyof typeof TabStopType];
    position: number;
  }[] = line.tabStops.map(position => ({ type: TabStopType.LEFT, position }));
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
    indent: { left: pxTw(line.indent), right: RIGHT_SLACK_TWIP },
    spacing: rowSpacing(ctx, row, options)
  });
}

// ---- native lists --------------------------------------------------------
// A list maps onto Word numbering when every item's windoc marker equals what
// Word's counters would print; otherwise it keeps literal marker text.

const olStyleFormat: Record<string, { format: ILevelFormat; suffix: string }> =
  {
    decimal: { format: LevelFormat.DECIMAL, suffix: '.' },
    decimalParen: { format: LevelFormat.DECIMAL, suffix: ')' },
    decimalZero: { format: LevelFormat.DECIMAL_ZERO, suffix: '.' },
    lowerAlpha: { format: LevelFormat.LOWER_LETTER, suffix: '.' },
    lowerAlphaParen: { format: LevelFormat.LOWER_LETTER, suffix: ')' },
    upperAlpha: { format: LevelFormat.UPPER_LETTER, suffix: '.' },
    lowerRoman: { format: LevelFormat.LOWER_ROMAN, suffix: '.' },
    lowerRomanParen: { format: LevelFormat.LOWER_ROMAN, suffix: ')' },
    upperRoman: { format: LevelFormat.UPPER_ROMAN, suffix: '.' },
    outline: { format: LevelFormat.DECIMAL, suffix: '.' }
  };

function isListItemStart(row: IRow) {
  const first = row.elementList[0];
  return !!row.isList && first?.value === ZERO && !first.listWrap;
}

function rowListId(row: IRow) {
  return row.elementList.find(el => el.listId)?.listId;
}

// mirrors ListParticle._getListMarkerText
function levelSpec(element: IElement, markerText: string) {
  const level = Math.min(element.listLevel ?? 0, 8);
  if (element.listType === ListType.UL) {
    return { level, format: LevelFormat.BULLET, text: markerText };
  }
  const cycle = element.listPreset
    ? olPresetCycles[element.listPreset]
    : undefined;
  const style = cycle ? cycle[level % cycle.length] : 'decimal';
  const spec = olStyleFormat[style] || olStyleFormat.decimal;
  return { level, format: spec.format, text: `%${level + 1}${spec.suffix}` };
}

function planLists(ctx: IExportContext) {
  const listParticle = ctx.draw.getListParticle();
  const counters = new Map<string, number[]>();
  const visit = (rowList: IRow[]) => {
    for (const row of rowList) {
      const table = row.elementList.find(el => el.type === ElementType.TABLE);
      if (table) {
        for (const tr of table.trList || []) {
          for (const td of tr.tdList) visit(td.rowList || []);
        }
        continue;
      }
      if (!isListItemStart(row)) continue;
      const listId = rowListId(row);
      if (!listId) continue;
      let plan = ctx.lists.get(listId);
      if (!plan) {
        plan = {
          reference: `windoc-list-${ctx.lists.size + 1}`,
          native: true,
          levels: new Map()
        };
        ctx.lists.set(listId, plan);
      }
      const marker = listParticle.getListMarker(row);
      if (!marker || hasInlineImage(row)) {
        plan.native = false;
        continue;
      }
      const spec = levelSpec(row.elementList[0], marker.text);
      const known = plan.levels.get(spec.level);
      if (known && (known.format !== spec.format || known.text !== spec.text)) {
        plan.native = false;
      }
      plan.levels.set(spec.level, spec);
      // Word counts per level and restarts deeper levels; windoc must agree
      const count = counters.get(listId) || [];
      counters.set(listId, count);
      count[spec.level] = (count[spec.level] || 0) + 1;
      count.length = spec.level + 1;
      if (
        spec.format !== LevelFormat.BULLET &&
        count[spec.level] !== (row.listIndex ?? 0) + 1
      ) {
        plan.native = false;
      }
    }
  };
  ctx.draw.getPageRowList().forEach(visit);
}

function createNumberingConfig(ctx: IExportContext) {
  return [...ctx.lists.values()]
    .filter(plan => plan.native)
    .map(plan => ({
      reference: plan.reference,
      levels: Array.from({ length: 9 }, (_, level) => {
        const spec = plan.levels.get(level) || {
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`
        };
        return {
          level,
          format: spec.format,
          text: spec.text,
          alignment: AlignmentType.LEFT
        };
      })
    }));
}

function listMarkerGeometry(ctx: IExportContext, row: IRow, zone: IZone) {
  const listParticle = ctx.draw.getListParticle();
  const firstPosition = zone.positionList[row.startIndex];
  if (!firstPosition) return null;
  const markerX = listParticle.getListMarkerX(row, firstPosition);
  const marker = listParticle.getListMarker(row);
  if (markerX === null || !marker) return null;
  const textIndex = row.elementList.findIndex(
    el => el.value !== ZERO && el.type !== ElementType.TAB
  );
  const textPosition =
    textIndex >= 0
      ? zone.positionList[row.startIndex + textIndex]
      : firstPosition;
  const textX = textPosition.coordinate.leftTop[0];
  if (textX - markerX <= 0) return null;
  return {
    marker,
    indent: (textX - zone.startX) / ctx.scale,
    hanging: (textX - markerX) / ctx.scale
  };
}

function isNativeListStart(ctx: IExportContext, row: IRow, zone: IZone) {
  if (!isListItemStart(row) || hasInlineImage(row)) return false;
  const listId = rowListId(row);
  if (!listId || !ctx.lists.get(listId)?.native) return false;
  if (row.elementList.some(el => el.type === ElementType.SEPARATOR)) {
    return false;
  }
  return !!listMarkerGeometry(ctx, row, zone);
}

// wrapped rows of the same item join its paragraph while they share the
// line height (a paragraph has one exact line height)
function isListContinuation(start: IRow, row: IRow) {
  return (
    !!row.isList &&
    !isListItemStart(row) &&
    rowListId(row) === rowListId(start) &&
    row.height === start.height &&
    row.ascent === start.ascent &&
    !row.offsetY &&
    !row.spaceAbove &&
    !hasInlineImage(row) &&
    !row.elementList.some(
      el => el.type === ElementType.TABLE || el.type === ElementType.SEPARATOR
    )
  );
}

function listLead(ctx: IExportContext, row: IRow, options: IRowOptions) {
  return (
    tw(ctx, (row.offsetY || 0) + (row.spaceAbove || 0)) +
    pxTw(options.padTop || 0)
  );
}

// One numbered paragraph per list item; its rows are joined with line
// breaks at windoc's wrap points. Every line is exactly the row height, so
// Word's baseline (80% of the line) is moved onto row.ascent with
// w:position, which only resolves to half-points (~0.33px).
async function serializeListItem(
  ctx: IExportContext,
  rows: IRow[],
  zone: IZone,
  options: IRowOptions
) {
  const { scale } = ctx;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const geometry = listMarkerGeometry(ctx, first, zone)!;
  const plan = ctx.lists.get(rowListId(first)!)!;
  const height = first.height / scale;
  const raise = Math.round(
    (EXACT_BASELINE_RATIO * height - first.ascent / scale) * 1.5
  );
  const position = raise ? (`${raise}` as `${number}pt`) : undefined;
  const line: ILine = {
    children: [],
    tabStops: [],
    pen: geometry.indent,
    started: true,
    indent: geometry.indent,
    position
  };
  for (let i = 0; i < rows.length; i++) {
    if (i > 0) {
      line.children.push(new TextRun({ break: 1 }));
      line.pen = geometry.indent;
    }
    await appendRowRuns(ctx, rows[i], zone, line);
  }
  return new Paragraph({
    children: line.children,
    numbering: {
      reference: plan.reference,
      level: Math.min(first.elementList[0].listLevel ?? 0, 8)
    },
    // the number is drawn with the paragraph mark's formatting
    run: { ...runStyle(ctx, geometry.marker.styleElement), position },
    pageBreakBefore: options.pageBreakBefore,
    widowControl: false,
    tabStops: [...new Set(line.tabStops)].map(tabPosition => ({
      type: TabStopType.LEFT,
      position: tabPosition
    })),
    indent: {
      left: pxTw(geometry.indent),
      hanging: pxTw(geometry.hanging),
      right: RIGHT_SLACK_TWIP
    },
    spacing: {
      before: options.skipLead ? 0 : listLead(ctx, first, options),
      after:
        tw(ctx, last.spaceBelow || 0) +
        pxTw(options.padBottom || 0) +
        (options.extraAfter || 0),
      line: pxTw(height),
      lineRule: LineRuleType.EXACT
    }
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
  return canvasToPng(canvas);
}

// Word appends a full-height empty paragraph when a header, footer or cell
// ends with a table; end it with a 1-twip one instead
function endWithParagraph(children: FileChild[]) {
  if (children[children.length - 1] instanceof Table) {
    children.push(createSpacerParagraph(false));
  }
  return children;
}

// The paragraph mark is 1pt too: Word sizes an empty paragraph by its mark
function createSpacerParagraph(
  pageBreakBefore: boolean,
  height = 0,
  anchor?: ParagraphChild
) {
  return new Paragraph({
    pageBreakBefore,
    widowControl: false,
    run: { size: 2 },
    children: anchor
      ? [anchor, new TextRun({ text: '', size: 2 })]
      : [new TextRun({ text: '', size: 2 })],
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

// Footer band: Word footers cannot be colored, so the bar is a picture
// anchored to the page (full width, behind text) and the footer rows are
// plain paragraphs placed where windoc draws them. Nothing in the footer
// takes more room than its text, so the body area is never squeezed.
async function serializeFooter(
  ctx: IExportContext,
  pageWidth: number,
  pageHeight: number,
  margins: number[]
): Promise<{ children: FileChild[]; distance: number }> {
  const { draw, scale } = ctx;
  const footer = draw.getFooter();
  const opts = draw.getOptions();
  const barHeight = footer.getHeight() / scale;
  const footerBottom = footer.getFooterBottom() / scale;
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
  const band = opts.footer.backgroundColor
    ? createBandImage(
        pageWidth,
        pageHeight - footerBottom - barHeight,
        barHeight,
        opts.footer.backgroundColor
      )
    : undefined;
  const children: FileChild[] = [];
  for (let r = 0; r < rowList.length; r++) {
    const row = rowList[r];
    let suffix: Parameters<typeof serializeRow>[4];
    if (r === pageNumberRow) {
      const top =
        zone.positionList[row.startIndex].coordinate.leftTop[1] / scale;
      suffix = {
        tabStop: pageNumber!.tabStop,
        tabType: pageNumber!.tabType,
        children: pageNumber!.runs(
          pageNumber!.baseline - (top + row.ascent / scale)
        ),
        style: PAGE_NUMBER_STYLE
      };
    }
    children.push(
      await serializeRow(ctx, row, zone, {}, suffix, r === 0 ? band : undefined)
    );
  }
  if (!children.length && band) {
    children.push(createSpacerParagraph(false, 0, band));
  }
  // the footer's last line ends where windoc's footer content ends
  const contentTop = pageHeight - footerBottom - barHeight + paddingTop;
  const distance = Math.max(0, pageHeight - contentTop - contentHeight);
  return { children, distance };
}

const EMU_PER_PX = 9525;

function createBandImage(
  width: number,
  top: number,
  height: number,
  color: string
) {
  return new ImageRun({
    type: 'png',
    data: createFillImage(color),
    transformation: { width, height },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        offset: 0
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PAGE,
        offset: Math.round(top * EMU_PER_PX)
      },
      behindDocument: true,
      allowOverlap: true,
      wrap: { type: TextWrappingType.NONE }
    }
  });
}

function createFillImage(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvasToPng(canvas);
}

function canvasToPng(canvas: HTMLCanvasElement) {
  const binary = atob(canvas.toDataURL('image/png').split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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

// character formatting of an element, as createTextRun writes it
function runStyle(ctx: IExportContext, element: IElement) {
  const opts = ctx.draw.getOptions();
  return {
    font: mapFont(element.font || opts.defaultFont),
    size: Math.round(getSize(ctx, element) * 2),
    bold: !!element.bold,
    italics: !!element.italic,
    color: normalizeHexColor(element.color || opts.defaultColor, '000000')
  };
}

function createTextRun(
  ctx: IExportContext,
  text: string,
  element: IElement,
  shading?: { fill: string; type: typeof ShadingType.CLEAR; color: string },
  characterSpacing?: number,
  position?: `${number}pt`
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
    characterSpacing,
    position
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
