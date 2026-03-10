const DPI = 96
const CM_PER_INCH = 2.54
const PX_PER_CM = DPI / CM_PER_INCH // ≈ 37.795

export function cmToPx(value: number): number {
  return Math.round(value * PX_PER_CM)
}

export function pxToCm(px: number): number {
  return Math.round((px / PX_PER_CM) * 100) / 100
}

/** Shorthand: convert cm to px */
export const cm = cmToPx

/** Convert mm to px */
export function mm(value: number): number {
  return Math.round(value * PX_PER_CM / 10)
}

/** Convert inches to px */
export function inch(value: number): number {
  return Math.round(value * DPI)
}
