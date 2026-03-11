import { maxHeightRadioMapping } from '../../../dataset/constant/Common';
import { EditorZone } from '../../../dataset/enum/Editor';
import { DeepRequired } from '../../../interface/Common';
import { IEditorOption } from '../../../interface/Editor';
import { IElement, IElementPosition } from '../../../interface/Element';
import { IRow } from '../../../interface/Row';
import { Position } from '../../position/Position';
import { Zone } from '../../zone/Zone';
import { Draw } from '../Draw';

export class Footer {
  private readonly MIN_BAR_HEIGHT = 29;

  private draw: Draw;
  private position: Position;
  private zone: Zone;
  private options: DeepRequired<IEditorOption>;

  private elementList: IElement[];
  private rowList: IRow[];
  private positionList: IElementPosition[];

  constructor(draw: Draw, data?: IElement[]) {
    this.draw = draw;
    this.position = draw.getPosition();
    this.zone = draw.getZone();
    this.options = draw.getOptions();

    this.elementList = data || [];
    this.rowList = [];
    this.positionList = [];
  }

  public getRowList(): IRow[] {
    return this.rowList;
  }

  public setElementList(elementList: IElement[]) {
    this.elementList = elementList;
  }

  public getElementList(): IElement[] {
    return this.elementList;
  }

  public getPositionList(): IElementPosition[] {
    return this.positionList;
  }

  public compute() {
    this.recovery();
    this._computeRowList();
    this._computePositionList();
  }

  public recovery() {
    this.rowList = [];
    this.positionList = [];
  }

  private _computeRowList() {
    const innerWidth = this.draw.getInnerWidth();
    this.rowList = this.draw.computeRowList({
      innerWidth,
      elementList: this.elementList
    });
  }

  private _computePositionList() {
    const footerBottom = this.getFooterBottom();
    const innerWidth = this.draw.getInnerWidth();
    const margins = this.draw.getMargins();
    const startX = margins[3];
    const pageHeight = this.draw.getHeight();
    const barHeight = this.getHeight();
    const contentHeight = this.getRowHeight();
    const paddingY = Math.max(0, (barHeight - contentHeight) / 2);
    const startY = pageHeight - footerBottom - barHeight + Math.floor(paddingY);
    this.position.computePageRowPosition({
      positionList: this.positionList,
      rowList: this.rowList,
      pageNo: 0,
      startRowIndex: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth,
      zone: EditorZone.FOOTER
    });
  }

  public getFooterBottom(): number {
    const {
      footer: { bottom, disabled },
      scale
    } = this.options;
    if (disabled) return 0;
    return Math.floor(bottom * scale);
  }

  public getMaxHeight(): number {
    const {
      footer: { maxHeightRadio }
    } = this.options;
    const height = this.draw.getHeight();
    return Math.floor(height * maxHeightRadioMapping[maxHeightRadio]);
  }

  public getHeight(): number {
    if (this.options.footer.disabled) return 0;
    const maxHeight = this.getMaxHeight();
    const rowHeight = this.getRowHeight();
    const { scale } = this.options;
    const minHeight = this.MIN_BAR_HEIGHT * scale;
    const height = Math.max(rowHeight, minHeight);
    return height > maxHeight ? maxHeight : height;
  }

  public getRowHeight(): number {
    return this.rowList.reduce((pre, cur) => pre + cur.height, 0);
  }

  // Footer area extends at least to the bottom margin line
  public getEffectiveTopY(): number {
    const margins = this.draw.getMargins();
    const pageHeight = this.draw.getHeight();
    const contentTopY = pageHeight - this.getFooterBottom() - this.getHeight();
    const marginTopY = pageHeight - margins[2];
    return Math.min(contentTopY, marginTopY);
  }

  public getExtraHeight(): number {
    const margins = this.draw.getMargins();
    const footerHeight = this.getHeight();
    const footerBottom = this.getFooterBottom();
    const extraHeight = footerBottom + footerHeight - margins[2];
    return extraHeight <= 0 ? 0 : extraHeight;
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    ctx.save();
    ctx.globalAlpha = this.zone.isFooterActive()
      ? 1
      : this.options.footer.inactiveAlpha;
    const innerWidth = this.draw.getInnerWidth();
    const maxHeight = this.getMaxHeight();
    const rowList: IRow[] = [];
    let curRowHeight = 0;
    for (let r = 0; r < this.rowList.length; r++) {
      const row = this.rowList[r];
      if (curRowHeight + row.height > maxHeight) {
        break;
      }
      rowList.push(row);
      curRowHeight += row.height;
    }
    // Draw background color if configured
    const { backgroundColor } = this.options.footer;
    if (backgroundColor) {
      const width = this.draw.getWidth();
      const pageHeight = this.draw.getHeight();
      const footerBottom = this.getFooterBottom();
      const barHeight = this.getHeight();
      const bgY = pageHeight - footerBottom - barHeight;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, bgY, width, barHeight);
    }
    this.draw.drawRow(ctx, {
      elementList: this.elementList,
      positionList: this.positionList,
      rowList,
      pageNo,
      startIndex: 0,
      innerWidth,
      zone: EditorZone.FOOTER
    });
    ctx.restore();
  }
}
