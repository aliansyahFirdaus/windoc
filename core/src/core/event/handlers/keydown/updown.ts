import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElementPosition } from '../../../../interface/Element'
import { CanvasEvent } from '../../CanvasEvent'

interface IGetNextPositionIndexPayload {
  positionList: IElementPosition[]
  index: number
  rowNo: number
  isUp: boolean
  cursorX: number
}
function getNextPositionIndex(payload: IGetNextPositionIndexPayload) {
  const { positionList, index, isUp, rowNo, cursorX } = payload
  let nextIndex = -1
  const probablePosition: IElementPosition[] = []
  if (isUp) {
    let p = index - 1
    while (p >= 0) {
      const position = positionList[p]
      p--
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.unshift(position)
    }
  } else {
    let p = index + 1
    while (p < positionList.length) {
      const position = positionList[p]
      p++
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.push(position)
    }
  }
  for (let p = 0; p < probablePosition.length; p++) {
    const nextPosition = probablePosition[p]
    const {
      coordinate: {
        leftTop: [nextLeftX],
        rightTop: [nextRightX]
      }
    } = nextPosition
    if (p === probablePosition.length - 1) {
      nextIndex = nextPosition.index
    }
    if (cursorX < nextLeftX || cursorX > nextRightX) continue
    nextIndex = nextPosition.index
    break
  }
  return nextIndex
}

export function updown(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  let positionList = position.getPositionList()
  const isUp = evt.key === KeyMap.Up
  let anchorStartIndex = -1
  let anchorEndIndex = -1
  const positionContext = position.getPositionContext()
  if (
    !evt.shiftKey &&
    positionContext.isTable &&
    ((isUp && cursorPosition.rowIndex === 0) ||
      (!isUp && cursorPosition.rowIndex === draw.getRowCount() - 1))
  ) {
    const { index, trIndex, tdIndex, tableId } = positionContext
    if (isUp) {
      if (trIndex === 0) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index! - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        let preTrIndex = -1
        let preTdIndex = -1
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[index!].trList!
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              preTrIndex = r
              preTdIndex = d
              break outer
            }
          }
        }
        if (!~preTrIndex || !~preTdIndex) return
        const preTr = trList[preTrIndex]
        const preTd = preTr.tdList[preTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: preTrIndex,
          tdIndex: preTdIndex,
          tdId: preTd.id,
          trId: preTr.id,
          tableId
        })
        anchorStartIndex = preTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    } else {
      const originalElementList = draw.getOriginalElementList()
      const trList = originalElementList[index!].trList!
      if (trIndex === trList.length - 1) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index!
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        let nexTrIndex = -1
        let nextTdIndex = -1
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! + 1; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              nexTrIndex = r
              nextTdIndex = d
              break outer
            }
          }
        }
        if (!~nexTrIndex || !~nextTdIndex) return
        const nextTr = trList[nexTrIndex]
        const nextTd = nextTr.tdList[nextTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: nexTrIndex,
          tdIndex: nextTdIndex,
          tdId: nextTd.id,
          trId: nextTr.id,
          tableId
        })
        anchorStartIndex = nextTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    }
  } else {
    let anchorPosition: IElementPosition = cursorPosition
    if (evt.shiftKey) {
      if (startIndex === cursorPosition.index) {
        anchorPosition = positionList[endIndex]
      } else {
        anchorPosition = positionList[startIndex]
      }
    }
    const {
      index,
      rowNo,
      rowIndex,
      coordinate: {
        rightTop: [curRightX]
      }
    } = anchorPosition
    if (
      (isUp && rowIndex === 0) ||
      (!isUp && rowIndex === draw.getRowCount() - 1)
    ) {
      return
    }
    const nextIndex = getNextPositionIndex({
      positionList,
      index,
      rowNo,
      isUp,
      cursorX: curRightX
    })
    if (nextIndex < 0) return
    anchorStartIndex = nextIndex
    anchorEndIndex = nextIndex
    if (evt.shiftKey) {
      if (startIndex !== endIndex) {
        if (startIndex === cursorPosition.index) {
          anchorStartIndex = startIndex
        } else {
          anchorEndIndex = endIndex
        }
      } else {
        if (isUp) {
          anchorEndIndex = endIndex
        } else {
          anchorStartIndex = startIndex
        }
      }
    }
    const elementList = draw.getElementList()
    const nextElement = elementList[nextIndex]
    if (nextElement.type === ElementType.TABLE) {
      const { scale } = draw.getOptions()
      const margins = draw.getMargins()
      const trList = nextElement.trList!
      let trIndex = -1
      let tdIndex = -1
      let tdPositionIndex = -1
      if (isUp) {
        outer: for (let r = trList.length - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const lastPosition = tdPositionList[tdPositionList.length - 1]
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: lastPosition.index + 1,
                  rowNo: lastPosition.rowNo - 1,
                  isUp,
                  cursorX: curRightX
                }) || lastPosition.index
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      } else {
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: -1,
                  rowNo: -1,
                  isUp,
                  cursorX: curRightX
                }) || 0
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      }
      if (~trIndex && ~tdIndex && ~tdPositionIndex) {
        const nextTr = trList[trIndex]
        const nextTd = nextTr.tdList[tdIndex]
        position.setPositionContext({
          isTable: true,
          index: nextIndex,
          trIndex: trIndex,
          tdIndex: tdIndex,
          tdId: nextTd.id,
          trId: nextTr.id,
          tableId: nextElement.id
        })
        anchorStartIndex = tdPositionIndex
        anchorEndIndex = anchorStartIndex
        positionList = position.getPositionList()
        draw.getTableTool().render()
      }
    }
  }
  if (!~anchorStartIndex || !~anchorEndIndex) return
  if (anchorStartIndex > anchorEndIndex) {
    // prettier-ignore
    [anchorStartIndex, anchorEndIndex] = [anchorEndIndex, anchorStartIndex]
  }
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  if (!isCollapsed) {
    draw.getCursor().moveCursorToVisible({
      cursorPosition: positionList[isUp ? anchorStartIndex : anchorEndIndex],
      direction: isUp ? MoveDirection.UP : MoveDirection.DOWN
    })
  }
}
