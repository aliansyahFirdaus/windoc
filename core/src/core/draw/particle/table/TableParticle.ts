import { ElementType, IElement, TableBorder } from '../../../..';
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table';
import { DeepRequired } from '../../../../interface/Common';
import { IEditorOption } from '../../../../interface/Editor';
import { ITableCellSelection } from '../../../../interface/Range';
import { ITd } from '../../../../interface/table/Td';
import { ITr } from '../../../../interface/table/Tr';
import { deepClone } from '../../../../utils';
import { RangeManager } from '../../../range/RangeManager';
import { Draw } from '../../Draw';

interface IDrawTableBorderOption {
  ctx: CanvasRenderingContext2D;
  startX: number;
  startY: number;
  width: number;
  height: number;
  borderExternalWidth?: number;
  isDrawFullBorder?: boolean;
}

interface IDrawHorizontalBorderOption {
  ctx: CanvasRenderingContext2D;
  startX: number;
  endX: number;
  y: number;
}

export class TableParticle {
  private draw: Draw;
  private range: RangeManager;
  private options: DeepRequired<IEditorOption>;

  constructor(draw: Draw) {
    this.draw = draw;
    this.range = draw.getRange();
    this.options = draw.getOptions();
  }

  public getTrListGroupByCol(payload: ITr[]): ITr[] {
    const trList = deepClone(payload);
    for (let t = 0; t < payload.length; t++) {
      const tr = trList[t];
      for (let d = tr.tdList.length - 1; d >= 0; d--) {
        const td = tr.tdList[d];
        const { rowspan, rowIndex, colIndex } = td;
        const curRowIndex = rowIndex! + rowspan - 1;
        if (curRowIndex !== d) {
          const changeTd = tr.tdList.splice(d, 1)[0];
          trList[curRowIndex]?.tdList.splice(colIndex!, 0, changeTd);
        }
      }
    }
    return trList;
  }

  public getRangeRowCol(): ITd[][] | null {
    const { isTable, index, trIndex, tdIndex } = this.draw
      .getPosition()
      .getPositionContext();
    if (!isTable) return null;
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange();
    const originalElementList = this.draw.getOriginalElementList();
    const element = originalElementList[index!];
    const curTrList = element.trList!;
    if (!isCrossRowCol) {
      return [[curTrList[trIndex!].tdList[tdIndex!]]];
    }
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!];
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!];
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!;
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1);
    const startRowIndex = startTd.rowIndex!;
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1);
    const rowCol: ITd[][] = [];
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t];
      const tdList: ITd[] = [];
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        const tdColIndex = td.colIndex!;
        const tdRowIndex = td.rowIndex!;
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          tdList.push(td);
        }
      }
      if (tdList.length) {
        rowCol.push(tdList);
      }
    }
    return rowCol.length ? rowCol : null;
  }

  private _drawOuterBorder(payload: IDrawTableBorderOption) {
    const {
      ctx,
      startX,
      startY,
      width,
      height,
      isDrawFullBorder,
      borderExternalWidth
    } = payload;
    const { scale } = this.options;
    const lineWidth = ctx.lineWidth;
    if (borderExternalWidth) {
      ctx.lineWidth = borderExternalWidth * scale;
    }
    ctx.beginPath();
    const x = Math.round(startX);
    const y = Math.round(startY);
    // Round endpoints to integers so the stroke lands on crisp pixel
    // boundaries after the translate(0.5, 0.5) trick.
    // Without rounding, x + width (= Math.round(startX) + tableWidth) is
    // often a float, making the right end of the top border anti-aliased
    // (appears lighter/dimmer) and misaligned from cell border coords
    // which use Math.round(startX + width).
    const rx = Math.round(startX + width);
    const ry = Math.round(startY + height);
    ctx.translate(0.5, 0.5);
    if (isDrawFullBorder) {
      ctx.rect(x, y, rx - x, ry - y);
    } else if (borderExternalWidth) {
      // When a distinct external border width is set, keep the L-shape
      // (left + top) here at the external width. The cell loop cannot
      // easily match this width for the top-border segments.
      ctx.moveTo(x, ry);
      ctx.lineTo(x, y);
      ctx.lineTo(rx, y);
    } else {
      // Standard case: draw only the left border here. The top border is
      // drawn cell-by-cell in the cell loop (for rowIndex === 0 cells) to
      // avoid double-drawing at junction points where vertical dividers
      // meet the top horizontal line. That double-stroke made the
      // junction pixels darker, causing the middle of the top border
      // to appear thinner/lighter by comparison.
      ctx.moveTo(x, ry);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (borderExternalWidth) {
      ctx.lineWidth = lineWidth;
    }
    ctx.translate(-0.5, -0.5);
  }

  private _drawHorizontalBorder(payload: IDrawHorizontalBorderOption) {
    const { ctx, startX, endX, y } = payload;
    const x = Math.round(startX);
    const rx = Math.round(endX);
    const ty = Math.round(y);
    ctx.beginPath();
    ctx.translate(0.5, 0.5);
    ctx.moveTo(x, ty);
    ctx.lineTo(rx, ty);
    ctx.stroke();
    ctx.translate(-0.5, -0.5);
  }

  private _drawSlash(
    ctx: CanvasRenderingContext2D,
    td: ITd,
    startX: number,
    startY: number
  ) {
    const { scale } = this.options;
    ctx.save();
    const lx = Math.round(td.x! * scale + startX);
    const ty = Math.round(td.y! * scale + startY);
    const rx = Math.round((td.x! + td.width!) * scale + startX);
    const by = Math.round((td.y! + td.height!) * scale + startY);
    if (td.slashTypes?.includes(TdSlash.FORWARD)) {
      ctx.moveTo(rx, ty);
      ctx.lineTo(lx, by);
    }
    if (td.slashTypes?.includes(TdSlash.BACK)) {
      ctx.moveTo(lx, ty);
      ctx.lineTo(rx, by);
    }
    ctx.stroke();
    ctx.restore();
  }

  private _drawBorder(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const {
      colgroup,
      trList,
      borderType,
      borderColor,
      borderWidth = 1,
      borderExternalWidth
    } = element;
    if (!colgroup || !trList) return;
    const {
      scale,
      table: { defaultBorderColor }
    } = this.options;
    const tableWidth = element.width! * scale;
    const tableHeight = element.height! * scale;
    const isEmptyBorderType = borderType === TableBorder.EMPTY;
    const isExternalBorderType = borderType === TableBorder.EXTERNAL;
    const isInternalBorderType = borderType === TableBorder.INTERNAL;
    ctx.save();
    if (borderType === TableBorder.DASH) {
      ctx.setLineDash([3, 3]);
    }
    ctx.lineWidth = borderWidth * scale;
    ctx.strokeStyle = borderColor || defaultBorderColor;
    if (!isEmptyBorderType && !isInternalBorderType) {
      this._drawOuterBorder({
        ctx,
        startX,
        startY,
        width: tableWidth,
        height: tableHeight,
        borderExternalWidth,
        isDrawFullBorder: isExternalBorderType
      });
    }
    const firstTr = trList[0];
    const lastTr = trList[trList.length - 1];
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t];
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        if (td.slashTypes?.length) {
          this._drawSlash(ctx, td, startX, startY);
        }
        if (
          !td.borderTypes?.length &&
          (isEmptyBorderType || isExternalBorderType)
        ) {
          continue;
        }
        // Compute all four cell corners with independent Math.round calls so
        // that no float arithmetic (x-width, y+height) propagates into the
        // canvas path. This is critical when scale is non-integer (e.g. 1.2):
        // td.width! * scale is a float, and integer ± float = float → the
        // translate(0.5,0.5) trick only works when coordinates are integers.
        const lx = Math.round(td.x! * scale + startX);
        const ty = Math.round(td.y! * scale + startY);
        const rx = Math.round((td.x! + td.width!) * scale + startX);
        const by = Math.round((td.y! + td.height!) * scale + startY);
        if (td.borderColor) {
          ctx.save();
          ctx.strokeStyle = td.borderColor;
        }
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        if (td.borderTypes?.includes(TdBorder.TOP)) {
          ctx.moveTo(lx, ty);
          ctx.lineTo(rx, ty);
          ctx.stroke();
        }
        if (td.borderTypes?.includes(TdBorder.RIGHT)) {
          ctx.moveTo(rx, ty);
          ctx.lineTo(rx, by);
          ctx.stroke();
        }
        if (td.borderTypes?.includes(TdBorder.BOTTOM)) {
          ctx.moveTo(rx, by);
          ctx.lineTo(lx, by);
          ctx.stroke();
        }
        if (td.borderTypes?.includes(TdBorder.LEFT)) {
          ctx.moveTo(lx, ty);
          ctx.lineTo(lx, by);
          ctx.stroke();
        }
        if (!isEmptyBorderType && !isExternalBorderType) {
          // Top border: drawn per-cell for the first logical row so that
          // cell segments never double-stroke the junction pixels where
          // the vertical dividers start. This prevents the junctions from
          // appearing darker than the segments between them.
          // Skip when borderExternalWidth is set: _drawOuterBorder handles
          // the top border there with a different line width.
          if (td.rowIndex === 0 && !borderExternalWidth) {
            ctx.moveTo(lx, ty);
            ctx.lineTo(rx, ty);
          }
          if (
            !isInternalBorderType ||
            td.colIndex! + td.colspan < colgroup.length
          ) {
            ctx.moveTo(rx, ty);
            ctx.lineTo(rx, by);
            if (
              borderExternalWidth &&
              borderExternalWidth !== borderWidth &&
              td.colIndex! + td.colspan === colgroup.length
            ) {
              const lineWidth = ctx.lineWidth;
              ctx.lineWidth = borderExternalWidth * scale;
              ctx.stroke();
              ctx.beginPath();
              ctx.lineWidth = lineWidth;
            }
          }
          if (
            !isInternalBorderType ||
            td.rowIndex! + td.rowspan < trList.length
          ) {
            const isBottomEdge = td.rowIndex! + td.rowspan === trList.length;
            const isSetExternalBottomBorder =
              borderExternalWidth &&
              borderExternalWidth !== borderWidth &&
              isBottomEdge;
            if (isSetExternalBottomBorder) {
              ctx.stroke();
              ctx.beginPath();
            }
            ctx.moveTo(rx, by);
            ctx.lineTo(lx, by);
            if (isSetExternalBottomBorder) {
              const lineWidth = ctx.lineWidth;
              ctx.lineWidth = borderExternalWidth * scale;
              ctx.stroke();
              ctx.beginPath();
              ctx.lineWidth = lineWidth;
            }
          }
          ctx.stroke();
        }
        ctx.translate(-0.5, -0.5);
        // For cells with per-cell border color, also redraw outer edges
        // (top for first row, left for first column) to cover _drawOuterBorder
        if (td.borderColor && !isEmptyBorderType && !isExternalBorderType) {
          ctx.translate(0.5, 0.5);
          ctx.beginPath();
          if (td.rowIndex === 0) {
            ctx.moveTo(lx, ty);
            ctx.lineTo(rx, ty);
          }
          if (td.colIndex === 0) {
            ctx.moveTo(lx, ty);
            ctx.lineTo(lx, by);
          }
          if (td.rowIndex === 0 || td.colIndex === 0) {
            ctx.stroke();
          }
          ctx.translate(-0.5, -0.5);
        }
        if (td.borderColor) {
          ctx.restore();
        }
      }
    }
    if (
      !isEmptyBorderType &&
      !isExternalBorderType &&
      !borderExternalWidth &&
      firstTr?.splitBoundaryTop
    ) {
      this._drawHorizontalBorder({
        ctx,
        startX,
        endX: startX + tableWidth,
        y: startY
      });
    }
    if (
      !isEmptyBorderType &&
      !isExternalBorderType &&
      !borderExternalWidth &&
      lastTr?.splitBoundaryBottom
    ) {
      this._drawHorizontalBorder({
        ctx,
        startX,
        endX: startX + tableWidth,
        y: startY + tableHeight
      });
    }
    ctx.restore();
  }

  private _drawBackgroundColor(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const { trList } = element;
    if (!trList) return;
    const { scale } = this.options;
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t];
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        if (!td.backgroundColor) continue;
        ctx.save();
        const lx = Math.round(td.x! * scale + startX);
        const ty = Math.round(td.y! * scale + startY);
        const rx = Math.round((td.x! + td.width!) * scale + startX);
        const by = Math.round((td.y! + td.height!) * scale + startY);
        ctx.fillStyle = td.backgroundColor;
        ctx.fillRect(lx, ty, rx - lx, by - ty);
        ctx.restore();
      }
    }
  }

  public getTableWidth(element: IElement): number {
    return element.colgroup!.reduce((pre, cur) => pre + cur.width, 0);
  }

  public getTableHeight(element: IElement): number {
    const trList = element.trList;
    if (!trList?.length) return 0;
    return this.getTdListByColIndex(trList, 0).reduce(
      (pre, cur) => pre + cur.height!,
      0
    );
  }

  public getRowCountByColIndex(trList: ITr[], colIndex: number): number {
    return this.getTdListByColIndex(trList, colIndex).reduce(
      (pre, cur) => pre + cur.rowspan,
      0
    );
  }

  public getTdListByColIndex(trList: ITr[], colIndex: number): ITd[] {
    const data: ITd[] = [];
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList;
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d];
        const min = td.colIndex!;
        const max = min + td.colspan - 1;
        if (colIndex >= min && colIndex <= max) {
          data.push(td);
        }
      }
    }
    return data;
  }

  public getTdListByRowIndex(trList: ITr[], rowIndex: number) {
    const data: ITd[] = [];
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList;
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d];
        const min = td.rowIndex!;
        const max = min + td.rowspan - 1;
        if (rowIndex >= min && rowIndex <= max) {
          data.push(td);
        }
      }
    }
    return data;
  }

  public computeRowColInfo(element: IElement) {
    const { colgroup, trList } = element;
    if (!colgroup || !trList) return;
    let preX = 0;
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t];
      const isLastTr = trList.length - 1 === t;
      let rowMinHeight = 0;
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        let colIndex = 0;
        if (trList.length > 1 && t !== 0) {
          const preTd = tr.tdList[d - 1];
          const start = preTd ? preTd.colIndex! + preTd.colspan : d;
          for (let c = start; c < colgroup.length; c++) {
            const rowCount = this.getRowCountByColIndex(trList.slice(0, t), c);
            if (rowCount === t) {
              colIndex = c;
              let preColWidth = 0;
              for (let preC = 0; preC < c; preC++) {
                preColWidth += colgroup[preC].width;
              }
              preX = preColWidth;
              break;
            }
          }
        } else {
          const preTd = tr.tdList[d - 1];
          if (preTd) {
            colIndex = preTd.colIndex! + preTd.colspan;
          }
        }
        let width = 0;
        for (let col = 0; col < td.colspan; col++) {
          width += colgroup[col + colIndex].width;
        }
        let height = 0;
        for (let row = 0; row < td.rowspan; row++) {
          const curTr = trList[row + t] || trList[t];
          height += curTr.height;
        }
        if (rowMinHeight === 0 || rowMinHeight > height) {
          rowMinHeight = height;
        }
        const isLastRowTd = tr.tdList.length - 1 === d;
        let isLastColTd = isLastTr;
        if (!isLastColTd) {
          if (td.rowspan > 1) {
            const nextTrLength = trList.length - 1 - t;
            isLastColTd = td.rowspan - 1 === nextTrLength;
          }
        }
        const isLastTd = isLastTr && isLastRowTd;
        td.isLastRowTd = isLastRowTd;
        td.isLastColTd = isLastColTd;
        td.isLastTd = isLastTd;
        td.x = preX;
        let preY = 0;
        for (let preR = 0; preR < t; preR++) {
          const preTdList = trList[preR].tdList;
          for (let preD = 0; preD < preTdList.length; preD++) {
            const td = preTdList[preD];
            if (
              colIndex >= td.colIndex! &&
              colIndex < td.colIndex! + td.colspan
            ) {
              preY += td.height!;
              break;
            }
          }
        }
        td.y = preY;
        td.width = width;
        td.height = height;
        td.rowIndex = t;
        td.colIndex = colIndex;
        td.trIndex = t;
        td.tdIndex = d;
        preX += width;
        if (isLastRowTd && !isLastTd) {
          preX = 0;
        }
      }
    }
  }

  public drawRange(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const { scale, rangeAlpha, rangeColor } = this.options;
    const { type, trList } = element;
    if (!trList || type !== ElementType.TABLE) return;
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange();
    if (!isCrossRowCol) return;
    let startTd = trList[startTrIndex!].tdList[startTdIndex!];
    let endTd = trList[endTrIndex!].tdList[endTdIndex!];
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!;
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1);
    const startRowIndex = startTd.rowIndex!;
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1);
    ctx.save();
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t];
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        const tdColIndex = td.colIndex!;
        const tdRowIndex = td.rowIndex!;
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          const x = td.x! * scale;
          const y = td.y! * scale;
          const width = td.width! * scale;
          const height = td.height! * scale;
          ctx.globalAlpha = rangeAlpha;
          ctx.fillStyle = rangeColor;
          ctx.fillRect(x + startX, y + startY, width, height);
        }
      }
    }
    ctx.restore();
  }

  private _isSelectedCell(
    element: IElement,
    tr: ITr,
    td: ITd,
    selection: ITableCellSelection
  ): boolean {
    if (
      selection.pagingId &&
      selection.rootTrId &&
      selection.colIndex !== undefined
    ) {
      return (
        element.pagingId === selection.pagingId &&
        (tr.id === selection.rootTrId ||
          tr.splitRootId === selection.rootTrId) &&
        td.colIndex === selection.colIndex
      );
    }
    if (selection.tableId && element.id !== selection.tableId) {
      return false;
    }
    if (selection.trId && tr.id !== selection.trId) {
      return false;
    }
    if (selection.tdId) {
      return td.id === selection.tdId;
    }
    return false;
  }

  public drawCellRange(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number,
    selection: ITableCellSelection
  ) {
    const { scale, rangeAlpha, rangeColor } = this.options;
    const { type, trList } = element;
    if (!trList || type !== ElementType.TABLE) return;
    ctx.save();
    ctx.globalAlpha = rangeAlpha;
    ctx.fillStyle = rangeColor;
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t];
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d];
        if (!this._isSelectedCell(element, tr, td, selection)) {
          continue;
        }
        const x = td.x! * scale;
        const y = td.y! * scale;
        const width = td.width! * scale;
        const height = td.height! * scale;
        ctx.fillRect(x + startX, y + startY, width, height);
      }
    }
    ctx.restore();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    this._drawBackgroundColor(ctx, element, startX, startY);
    this._drawBorder(ctx, element, startX, startY);
  }
}
