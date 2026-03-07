import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IGraffitiData, IGraffitiStroke } from '../../../interface/Graffiti'
import { Draw } from '../Draw'

export class Graffiti {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private data: IGraffitiData[]
  private pageContainer: HTMLDivElement
  private isDrawing = false
  private startStroke: IGraffitiStroke | null = null

  constructor(draw: Draw, data?: IGraffitiData[]) {
    this.draw = draw
    this.options = draw.getOptions()
    this.data = data || []
    this.pageContainer = draw.getPageContainer()
    this.register()
  }

  private register() {
    this.pageContainer.addEventListener('mousedown', this.start.bind(this))
    this.pageContainer.addEventListener('mouseup', this.stop.bind(this))
    this.pageContainer.addEventListener('mouseleave', this.stop.bind(this))
    this.pageContainer.addEventListener('mousemove', this.drawing.bind(this))
  }

  private start(evt: MouseEvent) {
    if (!this.draw.isGraffitiMode()) return
    this.isDrawing = true
    const { scale } = this.options
    this.startStroke = {
      lineColor: this.options.graffiti.defaultLineColor,
      lineWidth: this.options.graffiti.defaultLineWidth,
      points: [evt.offsetX / scale, evt.offsetY / scale]
    }
  }

  private stop() {
    this.isDrawing = false
  }

  private drawing(evt: MouseEvent) {
    if (!this.isDrawing || !this.draw.isGraffitiMode()) return
    const { offsetX, offsetY } = evt
    const DISTANCE = 2
    if (
      this.startStroke &&
      Math.abs(this.startStroke.points[0] - offsetX) < DISTANCE &&
      Math.abs(this.startStroke.points[1] - offsetY) < DISTANCE
    ) {
      return
    }
    const pageNo = this.draw.getPageNo()
    let currentValue = this.data.find(item => item.pageNo === pageNo)
    if (this.startStroke) {
      if (!currentValue) {
        currentValue = {
          pageNo,
          strokes: []
        }
        this.data.push(currentValue)
      }
      currentValue.strokes.push(this.startStroke)
      this.startStroke = null
    }
    if (!currentValue?.strokes?.length) return
    const { scale } = this.options
    const lastPoints =
      currentValue.strokes[currentValue.strokes.length - 1].points
    lastPoints.push(offsetX / scale, offsetY / scale)
    this.draw.render({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public getValue(): IGraffitiData[] {
    return this.data
  }

  public compute() {
    const pageSize = this.draw.getPageRowList().length
    for (let d = this.data.length - 1; d >= 0; d--) {
      const pageNo = this.data[d].pageNo
      if (pageNo > pageSize - 1) {
        this.data.splice(d, 1)
      }
    }
  }

  public clear() {
    this.data = []
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const strokes = this.data.find(item => item.pageNo === pageNo)?.strokes
    if (!strokes?.length) return
    const {
      graffiti: { defaultLineColor, defaultLineWidth },
      scale
    } = this.options
    ctx.save()
    for (let s = 0; s < strokes.length; s++) {
      const stroke = strokes[s]
      ctx.beginPath()
      ctx.strokeStyle = stroke.lineColor || defaultLineColor
      ctx.lineWidth = (stroke.lineWidth || defaultLineWidth) * scale
      ctx.moveTo(stroke.points[0] * scale, stroke.points[1] * scale)
      for (let p = 2; p < stroke.points.length; p += 2) {
        ctx.lineTo(stroke.points[p] * scale, stroke.points[p + 1] * scale)
      }
      ctx.stroke()
    }
    ctx.restore()
  }
}
