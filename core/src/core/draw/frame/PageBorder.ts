import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'
import { Footer } from './Footer'
import { Header } from './Header'

export class PageBorder {
  private draw: Draw
  private header: Header
  private footer: Footer
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.header = draw.getHeader()
    this.footer = draw.getFooter()
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const {
      scale,
      pageBorder: { color, lineWidth, padding }
    } = this.options
    ctx.save()
    ctx.translate(0.5, 0.5)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth * scale
    const margins = this.draw.getMargins()
    const x = margins[3] - padding[3] * scale
    const y = margins[0] + this.header.getExtraHeight() - padding[0] * scale
    const width = this.draw.getInnerWidth() + (padding[1] + padding[3]) * scale
    const height =
      this.draw.getHeight() -
      y -
      this.footer.getExtraHeight() -
      margins[2] +
      padding[2] * scale
    ctx.rect(x, y, width, height)
    ctx.stroke()
    ctx.restore()
  }
}
