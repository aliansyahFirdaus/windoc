import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IRowElement } from '../../../interface/Row'
import { Draw } from '../Draw'

export class LabelParticle {
  private options: DeepRequired<IEditorOption>

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
      label: {
        defaultBackgroundColor,
        defaultColor,
        defaultBorderRadius,
        defaultPadding
      }
    } = this.options

    const backgroundColor =
      element.label?.backgroundColor || defaultBackgroundColor
    const color = element.label?.color || defaultColor
    const borderRadius = element.label?.borderRadius || defaultBorderRadius
    const padding = element.label?.padding || defaultPadding

    ctx.save()
    ctx.font = element.style
    const { width, boundingBoxAscent, boundingBoxDescent } = element.metrics

    const borderColor = element.label?.borderColor
    const rectHeight = boundingBoxAscent + boundingBoxDescent

    ctx.fillStyle = backgroundColor
    this._drawRoundedRect(
      ctx,
      x,
      y - boundingBoxAscent,
      width,
      rectHeight,
      borderRadius * scale
    )
    ctx.fill()

    if (borderColor) {
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1 * scale
      ctx.stroke()
    }

    ctx.fillStyle = color
    const textX = x + padding[3] * scale
    const ICON_CHAR = '\u2297'
    const ICON_PREFIX = ICON_CHAR + ' '
    if (element.value.startsWith(ICON_PREFIX)) {
      const baseStyle = element.style
      // Icon: bold + 2px lebih besar dari font badge
      const boldBase = /\bbold\b/.test(baseStyle)
        ? baseStyle
        : baseStyle.replace(/^(italic\s+)?/, '$1bold ')
      const iconStyle = boldBase.replace(
        /(\d+(?:\.\d+)?)px/,
        (_, n) => `${parseFloat(n) + 2 * scale}px`
      )

      // Ukur icon metrics untuk centering
      ctx.font = iconStyle
      const iconMetrics = ctx.measureText(ICON_CHAR)
      const iconWidth = iconMetrics.width

      // Pusat vertikal badge rect (relatif dari baseline y)
      const badgeCenterY = y + (boundingBoxDescent - boundingBoxAscent) / 2
      // Posisi baseline icon agar visual center-nya sejajar pusat badge
      const iconBaselineY =
        badgeCenterY +
        (iconMetrics.actualBoundingBoxAscent - iconMetrics.actualBoundingBoxDescent) / 2

      ctx.fillText(ICON_CHAR, textX, iconBaselineY)

      // Teks nama: font normal di baseline teks
      ctx.font = baseStyle
      const gapWidth = ctx.measureText(' ').width
      ctx.fillText(
        element.value.slice(ICON_PREFIX.length),
        textX + iconWidth + gapWidth,
        y
      )
    } else {
      ctx.fillText(element.value, textX, y)
    }
    ctx.restore()
  }

  private _drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    // Clamp radius seperti CSS border-radius: tidak boleh melebihi setengah sisi terkecil
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}
