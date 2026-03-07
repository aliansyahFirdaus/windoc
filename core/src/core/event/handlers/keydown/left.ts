import { EditorMode } from '../../../..'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { getNonHideElementIndex } from '../../../../utils/element'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'

export function left(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const positionContext = position.getPositionContext()
  const { index } = cursorPosition
  if (index <= 0 && !positionContext.isTable) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  const control = draw.getControl()
  if (
    draw.getMode() === EditorMode.FORM &&
    control.getActiveControl() &&
    (elementList[index]?.controlComponent === ControlComponent.PREFIX ||
      elementList[index]?.controlComponent === ControlComponent.PRE_TEXT)
  ) {
    control.initNextControl({
      direction: MoveDirection.UP
    })
    return
  }
  let moveCount = 1
  if (isMod(evt)) {
    const LETTER_REG = draw.getLetterReg()
    const moveStartIndex =
      evt.shiftKey && !isCollapsed && startIndex === cursorPosition?.index
        ? endIndex
        : startIndex
    if (LETTER_REG.test(elementList[moveStartIndex]?.value)) {
      let i = moveStartIndex - 1
      while (i > 0) {
        const element = elementList[i]
        if (!LETTER_REG.test(element.value)) {
          break
        }
        moveCount++
        i--
      }
    }
  }
  const curIndex = startIndex - moveCount
  let anchorStartIndex = curIndex
  let anchorEndIndex = curIndex
  if (evt.shiftKey && cursorPosition) {
    if (startIndex !== endIndex) {
      if (startIndex === cursorPosition.index) {
        anchorStartIndex = startIndex
        anchorEndIndex = endIndex - moveCount
      } else {
        anchorStartIndex = curIndex
        anchorEndIndex = endIndex
      }
    } else {
      anchorEndIndex = endIndex
    }
  }
  if (!evt.shiftKey) {
    const element = elementList[startIndex]
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      const lastTrIndex = trList.length - 1
      const lastTr = trList[lastTrIndex]
      const lastTdIndex = lastTr.tdList.length - 1
      const lastTd = lastTr.tdList[lastTdIndex]
      position.setPositionContext({
        isTable: true,
        index: startIndex,
        trIndex: lastTrIndex,
        tdIndex: lastTdIndex,
        tdId: lastTd.id,
        trId: lastTr.id,
        tableId: element.id
      })
      anchorStartIndex = lastTd.value.length - 1
      anchorEndIndex = anchorStartIndex
      draw.getTableTool().render()
    } else if (element.tableId) {
      if (startIndex === 0) {
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[positionContext.index!].trList!
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          if (tr.id !== element.trId) continue
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (td.id !== element.tdId) continue
            if (r === 0 && d === 0) {
              position.setPositionContext({
                isTable: false
              })
              anchorStartIndex = positionContext.index! - 1
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().dispose()
            } else {
              let preTrIndex = r
              let preTdIndex = d - 1
              if (preTdIndex < 0) {
                preTrIndex = r - 1
                preTdIndex = trList[preTrIndex].tdList.length - 1
              }
              const preTr = trList[preTrIndex]
              const preTd = preTr.tdList[preTdIndex]
              position.setPositionContext({
                isTable: true,
                index: positionContext.index,
                trIndex: preTrIndex,
                tdIndex: preTdIndex,
                tdId: preTd.id,
                trId: preTr.id,
                tableId: element.tableId
              })
              anchorStartIndex = preTd.value.length - 1
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().render()
            }
            break outer
          }
        }
      }
    }
  }
  if (!~anchorStartIndex || !~anchorEndIndex) return
  const newElementList = draw.getElementList()
  anchorStartIndex = getNonHideElementIndex(newElementList, anchorStartIndex)
  anchorEndIndex = getNonHideElementIndex(newElementList, anchorEndIndex)
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isAnchorCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isAnchorCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isAnchorCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  evt.preventDefault()
}
