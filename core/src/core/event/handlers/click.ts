import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { NUMBER_LIKE_REG } from '../../../dataset/constant/Regular'
import { ElementType } from '../../../dataset/enum/Element'
import { IRange } from '../../../interface/Range'
import { CanvasEvent } from '../CanvasEvent'

export function getWordRangeBySegmenter(host: CanvasEvent): IRange | null {
  if (!Intl.Segmenter) return null
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const rangeManager = draw.getRange()
  const paragraphInfo = rangeManager.getRangeParagraphInfo()
  if (!paragraphInfo) return null
  const paragraphText =
    paragraphInfo?.elementList
      ?.map(e =>
        !e.type ||
        (e.type !== ElementType.CONTROL &&
          TEXTLIKE_ELEMENT_TYPE.includes(e.type))
          ? e.value
          : ZERO
      )
      .join('') || ''
  if (!paragraphText) return null
  const cursorStartIndex =
    cursorPosition.isFirstLetter || draw.getCursor().getHitLineStartIndex()
      ? cursorPosition.index + 1
      : cursorPosition.index
  const offset = paragraphInfo.startIndex
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  const segments = segmenter.segment(paragraphText)
  let startIndex = -1
  let endIndex = -1
  for (const { segment, index, isWordLike } of segments) {
    const realSegmentStartIndex = index + offset
    if (
      isWordLike &&
      cursorStartIndex >= realSegmentStartIndex &&
      cursorStartIndex < realSegmentStartIndex + segment.length
    ) {
      startIndex = realSegmentStartIndex - 1
      endIndex = startIndex + segment.length
      break
    }
  }
  return ~startIndex && ~endIndex ? { startIndex, endIndex } : null
}

export function getWordRangeByCursor(host: CanvasEvent): IRange | null {
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const { value, index } = cursorPosition
  const LETTER_REG = draw.getLetterReg()
  let upCount = 0
  let downCount = 0
  const isNumber = NUMBER_LIKE_REG.test(value)
  if (isNumber || LETTER_REG.test(value)) {
    const elementList = draw.getElementList()
    let upStartIndex = index - 1
    while (upStartIndex > 0) {
      const value = elementList[upStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        upCount++
        upStartIndex--
      } else {
        break
      }
    }
    let downStartIndex = index + 1
    while (downStartIndex < elementList.length) {
      const value = elementList[downStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        downCount++
        downStartIndex++
      } else {
        break
      }
    }
  }
  const startIndex = index - upCount - 1
  if (startIndex < 0) return null
  return {
    startIndex,
    endIndex: index + downCount
  }
}

function dblclick(host: CanvasEvent, evt: MouseEvent) {
  const draw = host.getDraw()
  const position = draw.getPosition()
  const positionContext = position.getPositionByXY({
    x: evt.offsetX,
    y: evt.offsetY
  })
  if (positionContext.isImage && positionContext.isDirectHit) {
    const elementList = draw.getElementList()
    const eventBus = draw.getEventBus()
    const curElement = elementList[positionContext.index]
    if (eventBus.isSubscribe('imageDblclick')) {
      eventBus.emit('imageDblclick', {
        evt,
        element: curElement
      })
    }
    if (curElement.imgPreviewDisabled) return
    draw.getPreviewer().render()
    return
  }
  if (draw.getIsPagingMode()) {
    if (!~positionContext.index && positionContext.zone) {
      draw.getZone().setZone(positionContext.zone)
      draw.clearSideEffect()
      position.setPositionContext({
        isTable: false
      })
      return
    }
  }
  if (
    (positionContext.isCheckbox || positionContext.isRadio) &&
    positionContext.isDirectHit
  ) {
    return
  }
  const rangeManager = draw.getRange()
  const segmenterRange =
    getWordRangeBySegmenter(host) || getWordRangeByCursor(host)
  if (!segmenterRange) return
  rangeManager.setRange(segmenterRange.startIndex, segmenterRange.endIndex)
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
  rangeManager.setRangeStyle()
}

function threeClick(host: CanvasEvent) {
  const draw = host.getDraw()
  const control = draw.getControl()
  if (control.getActiveControl() && control.selectValue()) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { index } = cursorPosition
  const elementList = draw.getElementList()
  let upCount = 0
  let downCount = 0
  let upStartIndex = index - 1
  while (upStartIndex > 0) {
    const element = elementList[upStartIndex]
    const preElement = elementList[upStartIndex - 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== preElement?.listId ||
      element.titleId !== preElement?.titleId
    ) {
      break
    }
    upCount++
    upStartIndex--
  }
  let downStartIndex = index + 1
  while (downStartIndex < elementList.length) {
    const element = elementList[downStartIndex]
    const nextElement = elementList[downStartIndex + 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== nextElement?.listId ||
      element.titleId !== nextElement?.titleId
    ) {
      break
    }
    downCount++
    downStartIndex++
  }
  const rangeManager = draw.getRange()
  let newStartIndex = index - upCount - 1
  if (elementList[newStartIndex]?.value !== ZERO) {
    newStartIndex -= 1
  }
  if (newStartIndex < 0) return
  let newEndIndex = index + downCount + 1
  if (
    elementList[newEndIndex]?.value === ZERO ||
    newEndIndex > elementList.length - 1
  ) {
    newEndIndex -= 1
  }
  rangeManager.setRange(newStartIndex, newEndIndex)
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
}

export default {
  dblclick,
  threeClick
}
