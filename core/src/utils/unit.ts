const DPI = 96
const CM_PER_INCH = 2.54
const PX_PER_CM = DPI / CM_PER_INCH // ≈ 37.795

export function cmToPx(cm: number): number {
  return Math.round(cm * PX_PER_CM)
}

export function pxToCm(px: number): number {
  return Math.round((px / PX_PER_CM) * 100) / 100
}
