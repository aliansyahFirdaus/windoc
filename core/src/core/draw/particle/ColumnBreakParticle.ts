import { DeepRequired } from '../../../interface/Common';
import { IEditorOption } from '../../../interface/Editor';
import { IRowElement } from '../../../interface/Row';
import { Draw } from '../Draw';

export class ColumnBreakParticle {
  private draw: Draw;
  private options: DeepRequired<IEditorOption>;

  constructor(draw: Draw) {
    this.draw = draw;
    this.options = draw.getOptions();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      pageBreak: { lineDash }
    } = this.options;
    const { scale, defaultRowMargin } = this.options;
    const elementWidth = element.width! * scale;
    const offsetY =
      this.draw.getDefaultBasicRowMarginHeight() * defaultRowMargin;
    ctx.save();
    ctx.strokeStyle = '#DCDCDC';
    ctx.setLineDash(lineDash);
    ctx.translate(0, 0.5 + offsetY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + elementWidth, y);
    ctx.stroke();
    ctx.restore();
  }
}
