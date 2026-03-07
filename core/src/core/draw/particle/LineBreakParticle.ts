import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class LineBreakParticle {
  private options: DeepRequired<IEditorOption>
  public static readonly WIDTH = 12
  public static readonly HEIGHT = 9
  public static readonly GAP = 3

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const {
      scale,
      lineBreak: { color, lineWidth }
    } = this.options
    ctx.save()
    ctx.beginPath()
    const top = y - (LineBreakParticle.HEIGHT * scale) / 2
    const left = x + element.metrics.width
    ctx.translate(left, top)
    ctx.scale(scale, scale)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(12, 0)
    ctx.lineTo(12, 6)
    ctx.lineTo(3, 6)
    ctx.moveTo(3, 6)
    ctx.lineTo(6, 3)
    ctx.moveTo(3, 6)
    ctx.lineTo(6, 9)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }
}
