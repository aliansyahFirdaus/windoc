import { ElementType, ListStyle, RowFlex, VerticalAlign } from '../..'
import { ZERO } from '../../dataset/constant/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import {
  IComputePageRowPositionPayload,
  IComputePageRowPositionResult,
  IComputeRowPositionPayload,
  IFloatPosition,
  IGetFloatPositionByXYPayload,
  ISetSurroundPositionPayload
} from '../../interface/Position'
import { IEditorOption } from '../../interface/Editor'
import { IElement, IElementPosition } from '../../interface/Element'
import {
  ICurrentPosition,
  IGetPositionByXYPayload,
  IPositionContext
} from '../../interface/Position'
import { Draw } from '../draw/Draw'
import { EditorMode, EditorZone } from '../../dataset/enum/Editor'
import { deepClone, isRectIntersect } from '../../utils'
import { ImageDisplay } from '../../dataset/enum/Common'
import { DeepRequired } from '../../interface/Common'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { getIsBlockElement } from '../../utils/element'

export class Position {
  private cursorPosition: IElementPosition | null
  private positionContext: IPositionContext
  private positionList: IElementPosition[]
  private floatPositionList: IFloatPosition[]

  private draw: Draw
  private eventBus: EventBus<EventBusMap>
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.positionList = []
    this.floatPositionList = []
    this.cursorPosition = null
    this.positionContext = {
      isTable: false,
      isControl: false
    }

    this.draw = draw
    this.eventBus = draw.getEventBus()
    this.options = draw.getOptions()
  }

  public getFloatPositionList(): IFloatPosition[] {
    return this.floatPositionList
  }

  public getTablePositionList(
    sourceElementList: IElement[]
  ): IElementPosition[] {
    const { index, trIndex, tdIndex } = this.positionContext
    return (
      sourceElementList[index!].trList![trIndex!].tdList[tdIndex!]
        .positionList || []
    )
  }

  public getPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalElementList())
      : this.getOriginalPositionList()
  }

  public getMainPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalMainElementList())
      : this.positionList
  }

  public getOriginalPositionList(): IElementPosition[] {
    const zoneManager = this.draw.getZone()
    if (zoneManager.isHeaderActive()) {
      const header = this.draw.getHeader()
      return header.getPositionList()
    }
    if (zoneManager.isFooterActive()) {
      const footer = this.draw.getFooter()
      return footer.getPositionList()
    }
    return this.positionList
  }

  public getOriginalMainPositionList(): IElementPosition[] {
    return this.positionList
  }

  public getSelectionPositionList(): IElementPosition[] | null {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (startIndex === endIndex) return null
    const positionList = this.getPositionList()
    return positionList.slice(startIndex + 1, endIndex + 1)
  }

  public setPositionList(payload: IElementPosition[]) {
    this.positionList = payload
  }

  public setFloatPositionList(payload: IFloatPosition[]) {
    this.floatPositionList = payload
  }

  public computePageRowPosition(
    payload: IComputePageRowPositionPayload
  ): IComputePageRowPositionResult {
    const {
      positionList,
      rowList,
      pageNo,
      startX,
      startY,
      startRowIndex,
      startIndex,
      innerWidth,
      rowNoOffset,
      columnNo: payloadColumnNo,
      zone
    } = payload
    const {
      scale,
      table: { tdPadding }
    } = this.options
    let x = startX
    let y = startY
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      if (!curRow.isSurround) {
        const curRowWidth = curRow.width + (curRow.offsetX || 0)
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (innerWidth - curRowWidth) / 2
        } else if (curRow.rowFlex === RowFlex.RIGHT) {
          x += innerWidth - curRowWidth
        }
      }
      x += curRow.offsetX || 0
      y += curRow.offsetY || 0
      const tablePreX = x
      const tablePreY = y
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        const offsetY =
          !element.hide &&
          ((element.imgDisplay !== ImageDisplay.INLINE &&
            element.type === ElementType.IMAGE) ||
            element.type === ElementType.LATEX)
            ? curRow.ascent - metrics.height
            : curRow.ascent
        if (element.left) {
          x += element.left
        }
        if (element.translateX) {
          x += element.translateX * scale
        }
        const positionItem: IElementPosition = {
          pageNo,
          index,
          value: element.value,
          rowIndex: startRowIndex + i,
          rowNo: (rowNoOffset ?? 0) + i,
          columnNo: payloadColumnNo ?? 0,
          metrics,
          left: element.left || 0,
          ascent: offsetY,
          lineHeight: curRow.height,
          isFirstLetter: j === 0,
          isLastLetter: j === curRow.elementList.length - 1,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          const prePosition = positionList[positionList.length - 1]
          if (prePosition) {
            positionItem.metrics = prePosition.metrics
            positionItem.coordinate = prePosition.coordinate
          }
          if (!element.imgFloatPosition) {
            element.imgFloatPosition = {
              x,
              y,
              pageNo
            }
          }
          this.floatPositionList.push({
            pageNo,
            element,
            position: positionItem,
            isTable: payload.isTable,
            index: payload.index,
            tdIndex: payload.tdIndex,
            trIndex: payload.trIndex,
            tdValueIndex: index,
            zone
          })
        }
        positionList.push(positionItem)
        index++
        x += metrics.width
        if (element.type === ElementType.TABLE && !element.hide) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          const tdPaddingHeight = tdPadding[0] + tdPadding[2]
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              td.positionList = []
              const rowList = td.rowList!
              const drawRowResult = this.computePageRowPosition({
                positionList: td.positionList,
                rowList,
                pageNo,
                startRowIndex: 0,
                startIndex: 0,
                startX:
                  (td.x! + tdPadding[3]) * scale +
                  tablePreX +
                  (element.translateX || 0) * scale,
                startY: (td.y! + tdPadding[0]) * scale + tablePreY,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                isTable: true,
                index: index - 1,
                tdIndex: d,
                trIndex: t,
                zone
              })
              if (
                td.verticalAlign === VerticalAlign.MIDDLE ||
                td.verticalAlign === VerticalAlign.BOTTOM
              ) {
                const rowsHeight = rowList.reduce(
                  (pre, cur) => pre + cur.height,
                  0
                )
                const blankHeight =
                  (td.height! - tdPaddingHeight) * scale - rowsHeight
                const offsetHeight =
                  td.verticalAlign === VerticalAlign.MIDDLE
                    ? blankHeight / 2
                    : blankHeight
                if (Math.floor(offsetHeight) > 0) {
                  td.positionList.forEach(tdPosition => {
                    const {
                      coordinate: { leftTop, leftBottom, rightBottom, rightTop }
                    } = tdPosition
                    leftTop[1] += offsetHeight
                    leftBottom[1] += offsetHeight
                    rightBottom[1] += offsetHeight
                    rightTop[1] += offsetHeight
                  })
                }
              }
              x = drawRowResult.x
              y = drawRowResult.y
            }
          }
          x = tablePreX
          y = tablePreY
        }
      }
      x = startX
      y += curRow.height
    }
    return { x, y, index }
  }

  public computePositionList() {
    this.positionList = []
    const columnWidth = this.draw.getColumnWidth()
    const columnCount = this.draw.getColumnCount()
    const pageRowList = this.draw.getPageRowList()
    const margins = this.draw.getMargins()
    const baseStartX = margins[3]
    const header = this.draw.getHeader()
    const extraHeight = header.getExtraHeight()
    const startY = margins[0] + extraHeight
    let startRowIndex = 0
    if (columnCount <= 1) {
      for (let i = 0; i < pageRowList.length; i++) {
        const rowList = pageRowList[i]
        if (!rowList?.length) continue
        const startIndex = rowList[0].startIndex
        this.computePageRowPosition({
          positionList: this.positionList,
          rowList,
          pageNo: i,
          startRowIndex,
          startIndex,
          startX: baseStartX,
          startY,
          innerWidth: columnWidth
        })
        startRowIndex += rowList.length
      }
    } else {
      const { column: { gap }, scale } = this.options
      for (let i = 0; i < pageRowList.length; i++) {
        const rowList = pageRowList[i]
        if (!rowList?.length) continue
        const columnGroups: Map<number, typeof rowList> = new Map()
        for (const row of rowList) {
          const colNo = row.columnNo ?? 0
          if (!columnGroups.has(colNo)) {
            columnGroups.set(colNo, [])
          }
          columnGroups.get(colNo)!.push(row)
        }
        const sortedColNos = Array.from(columnGroups.keys()).sort(
          (a, b) => a - b
        )
        let pageRowNoOffset = 0
        for (const colNo of sortedColNos) {
          const colRows = columnGroups.get(colNo)!
          const colStartX =
            baseStartX + colNo * (columnWidth + gap * scale)
          const startIndex = colRows[0].startIndex
          this.computePageRowPosition({
            positionList: this.positionList,
            rowList: colRows,
            pageNo: i,
            startRowIndex,
            startIndex,
            startX: colStartX,
            startY,
            innerWidth: columnWidth,
            rowNoOffset: pageRowNoOffset,
            columnNo: colNo
          })
          startRowIndex += colRows.length
          pageRowNoOffset += colRows.length
        }
      }
    }
  }

  public computeRowPosition(
    payload: IComputeRowPositionPayload
  ): IElementPosition[] {
    const { row, innerWidth } = payload
    const positionList: IElementPosition[] = []
    this.computePageRowPosition({
      positionList,
      innerWidth,
      rowList: [deepClone(row)],
      pageNo: 0,
      startX: 0,
      startY: 0,
      startIndex: 0,
      startRowIndex: 0
    })
    return positionList
  }

  public setCursorPosition(position: IElementPosition | null) {
    this.cursorPosition = position
  }

  public getCursorPosition(): IElementPosition | null {
    return this.cursorPosition
  }

  public getPositionContext(): IPositionContext {
    return this.positionContext
  }

  public setPositionContext(payload: IPositionContext) {
    this.eventBus.emit('positionContextChange', {
      value: payload,
      oldValue: this.positionContext
    })
    this.positionContext = payload
  }

  public getPositionByXY(payload: IGetPositionByXYPayload): ICurrentPosition {
    const { x, y, isTable } = payload
    let { elementList, positionList } = payload
    if (!elementList) {
      elementList = this.draw.getOriginalElementList()
    }
    if (!positionList) {
      positionList = this.getOriginalPositionList()
    }
    const zoneManager = this.draw.getZone()
    const curPageNo = payload.pageNo ?? this.draw.getPageNo()
    const isMainActive = zoneManager.isMainActive()
    const positionNo = isMainActive ? curPageNo : 0
    if (!isTable) {
      const floatTopPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
      })
      if (floatTopPosition) return floatTopPosition
    }
    for (let j = 0; j < positionList.length; j++) {
      const {
        index,
        pageNo,
        left,
        isFirstLetter,
        coordinate: { leftTop, rightTop, leftBottom }
      } = positionList[j]
      if (positionNo !== pageNo) continue
      if (pageNo > positionNo) break
      if (
        leftTop[0] - left <= x &&
        rightTop[0] >= x &&
        leftTop[1] <= y &&
        leftBottom[1] >= y
      ) {
        let curPositionIndex = j
        const element = elementList[j]
        if (element.type === ElementType.TABLE) {
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              const tablePosition = this.getPositionByXY({
                x,
                y,
                td,
                pageNo: curPageNo,
                tablePosition: positionList[j],
                isTable: true,
                elementList: td.value,
                positionList: td.positionList
              })
              if (~tablePosition.index) {
                const { index: tdValueIndex, hitLineStartIndex } = tablePosition
                const tdValueElement = td.value[tdValueIndex]
                return {
                  index,
                  isCheckbox:
                    tablePosition.isCheckbox ||
                    tdValueElement.type === ElementType.CHECKBOX ||
                    tdValueElement.controlComponent ===
                      ControlComponent.CHECKBOX,
                  isRadio:
                    tdValueElement.type === ElementType.RADIO ||
                    tdValueElement.controlComponent === ControlComponent.RADIO,
                  isControl: !!tdValueElement.controlId,
                  isImage: tablePosition.isImage,
                  isDirectHit: tablePosition.isDirectHit,
                  isTable: true,
                  tdIndex: d,
                  trIndex: t,
                  tdValueIndex,
                  tdId: td.id,
                  trId: tr.id,
                  tableId: element.id,
                  hitLineStartIndex
                }
              }
            }
          }
        }
        if (
          element.type === ElementType.IMAGE ||
          element.type === ElementType.LATEX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isImage: true
          }
        }
        if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        if (element.type === ElementType.LABEL) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isLabel: true
          }
        }
        if (
          element.type === ElementType.TAB &&
          element.listStyle === ListStyle.CHECKBOX
        ) {
          let index = curPositionIndex - 1
          while (index > 0) {
            const element = elementList[index]
            if (
              element.value === ZERO &&
              element.listStyle === ListStyle.CHECKBOX
            ) {
              break
            }
            index--
          }
          return {
            index,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isRadio: true
          }
        }
        let hitLineStartIndex: number | undefined
        if (elementList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPositionIndex = j - 1
            if (isFirstLetter) {
              hitLineStartIndex = j
            }
          }
        }
        return {
          isDirectHit: true,
          hitLineStartIndex,
          index: curPositionIndex,
          isControl: !!element.controlId
        }
      }
    }
    if (!isTable) {
      const floatBottomPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
      })
      if (floatBottomPosition) return floatBottomPosition
    }
    let isLastArea = false
    let curPositionIndex = -1
    let hitLineStartIndex: number | undefined
    if (isTable) {
      const { scale } = this.options
      const { td, tablePosition } = payload
      if (td && tablePosition) {
        const { leftTop } = tablePosition.coordinate
        const tdX = td.x! * scale + leftTop[0]
        const tdY = td.y! * scale + leftTop[1]
        const tdWidth = td.width! * scale
        const tdHeight = td.height! * scale
        if (!(tdX < x && x < tdX + tdWidth && tdY < y && y < tdY + tdHeight)) {
          return {
            index: curPositionIndex
          }
        }
      }
    }
    const lastLetterList = positionList.filter(
      p => p.isLastLetter && p.pageNo === positionNo
    )
    const columnCount = this.draw.getColumnCount()
    const columnWidth = this.draw.getColumnWidth()
    // Determine which column the click x belongs to
    let clickColNo = 0
    if (columnCount > 1) {
      const margins = this.draw.getMargins()
      const {
        column: { gap },
        scale
      } = this.options
      const colStep = columnWidth + gap * scale
      const relX = x - margins[3]
      clickColNo = Math.max(
        0,
        Math.min(
          Math.floor((relX + gap * scale / 2) / colStep),
          columnCount - 1
        )
      )
    }
    for (let j = 0; j < lastLetterList.length; j++) {
      const {
        index,
        rowNo,
        columnNo: lastLetterColNo,
        coordinate: { leftTop, leftBottom }
      } = lastLetterList[j]
      if (y > leftTop[1] && y <= leftBottom[1]) {
        // When multi-column, skip rows from a different column
        if (columnCount > 1 && lastLetterColNo !== clickColNo) {
          continue
        }
        const headIndex = positionList.findIndex(
          p => p.pageNo === positionNo && p.rowNo === rowNo
        )
        const headElement = elementList[headIndex]
        const headPosition = positionList[headIndex]
        const headStartX =
          headElement.listStyle === ListStyle.CHECKBOX
            ? this.draw.getMargins()[3]
            : headPosition.coordinate.leftTop[0]
        if (x < headStartX) {
          if (~headIndex) {
            if (headPosition.value === ZERO) {
              curPositionIndex = headIndex
            } else {
              curPositionIndex = headIndex - 1
              hitLineStartIndex = headIndex
            }
          } else {
            curPositionIndex = index
          }
        } else {
          if (headElement.listStyle === ListStyle.CHECKBOX && x < leftTop[0]) {
            return {
              index: headIndex,
              isDirectHit: true,
              isCheckbox: true
            }
          }
          curPositionIndex = index
        }
        isLastArea = true
        break
      }
    }
    if (!isLastArea) {
      if (this.draw.getIsPagingMode()) {
        const header = this.draw.getHeader()
        const headerBottomY = header.getEffectiveBottomY()
        const footer = this.draw.getFooter()
        const footerTopY = footer.getEffectiveTopY()
        if (isMainActive) {
          if (y < headerBottomY) {
            return {
              index: -1,
              zone: EditorZone.HEADER
            }
          }
          if (y > footerTopY) {
            return {
              index: -1,
              zone: EditorZone.FOOTER
            }
          }
        } else {
          if (y <= footerTopY && y >= headerBottomY) {
            return {
              index: -1,
              zone: EditorZone.MAIN
            }
          }
        }
      }
      const margins = this.draw.getMargins()
      if (y <= margins[0]) {
        // Find the first row in the clicked column
        const firstRowNo = columnCount > 1
          ? lastLetterList.find(ll => ll.columnNo === clickColNo)?.rowNo
          : 0
        const targetFirstRowNo = firstRowNo ?? 0
        for (let p = 0; p < positionList.length; p++) {
          const position = positionList[p]
          if (
            position.pageNo !== positionNo ||
            position.rowNo !== targetFirstRowNo
          ) {
            continue
          }
          const { leftTop, rightTop } = position.coordinate
          if (
            (clickColNo === 0 && x <= margins[3]) ||
            (x >= leftTop[0] && x <= rightTop[0]) ||
            positionList[p + 1]?.rowNo !== targetFirstRowNo
          ) {
            return {
              index: position.index
            }
          }
        }
      } else {
        // Find the last row in the clicked column
        let targetLastLetter = lastLetterList[lastLetterList.length - 1]
        if (columnCount > 1) {
          for (let k = lastLetterList.length - 1; k >= 0; k--) {
            if (lastLetterList[k].columnNo === clickColNo) {
              targetLastLetter = lastLetterList[k]
              break
            }
          }
        }
        if (targetLastLetter) {
          const lastRowNo = targetLastLetter.rowNo
          for (let p = 0; p < positionList.length; p++) {
            const position = positionList[p]
            if (
              position.pageNo !== positionNo ||
              position.rowNo !== lastRowNo
            ) {
              continue
            }
            const { leftTop, rightTop } = position.coordinate
            if (
              (clickColNo === 0 && x <= margins[3]) ||
              (x >= leftTop[0] && x <= rightTop[0]) ||
              positionList[p + 1]?.rowNo !== lastRowNo
            ) {
              return {
                index: position.index
              }
            }
          }
        }
      }
      return {
        index:
          lastLetterList[lastLetterList.length - 1]?.index ||
          positionList.length - 1
      }
    }
    return {
      hitLineStartIndex,
      index: curPositionIndex,
      isControl: !!elementList[curPositionIndex]?.controlId
    }
  }

  public getFloatPositionByXY(
    payload: IGetFloatPositionByXYPayload
  ): ICurrentPosition | void {
    const { x, y } = payload
    const currentPageNo = payload.pageNo ?? this.draw.getPageNo()
    const currentZone = this.draw.getZone().getZone()
    const { scale } = this.options
    for (let f = 0; f < this.floatPositionList.length; f++) {
      const {
        position,
        element,
        isTable,
        index,
        trIndex,
        tdIndex,
        tdValueIndex,
        zone: floatElementZone,
        pageNo
      } = this.floatPositionList[f]
      if (
        currentPageNo === pageNo &&
        element.type === ElementType.IMAGE &&
        element.imgDisplay &&
        payload.imgDisplays.includes(element.imgDisplay) &&
        (!floatElementZone || floatElementZone === currentZone)
      ) {
        const imgFloatPosition = element.imgFloatPosition!
        const imgFloatPositionX = imgFloatPosition.x * scale
        const imgFloatPositionY = imgFloatPosition.y * scale
        const elementWidth = element.width! * scale
        const elementHeight = element.height! * scale
        if (
          x >= imgFloatPositionX &&
          x <= imgFloatPositionX + elementWidth &&
          y >= imgFloatPositionY &&
          y <= imgFloatPositionY + elementHeight
        ) {
          if (isTable) {
            return {
              index: index!,
              isDirectHit: true,
              isImage: true,
              isTable,
              trIndex,
              tdIndex,
              tdValueIndex,
              tdId: element.tdId,
              trId: element.trId,
              tableId: element.tableId
            }
          }
          return {
            index: position.index,
            isDirectHit: true,
            isImage: true
          }
        }
      }
    }
  }

  public adjustPositionContext(
    payload: IGetPositionByXYPayload
  ): ICurrentPosition | null {
    const positionResult = this.getPositionByXY(payload)
    if (!~positionResult.index) return null
    if (
      positionResult.isControl &&
      this.draw.getMode() !== EditorMode.READONLY
    ) {
      const { index, isTable, trIndex, tdIndex, tdValueIndex } = positionResult
      const control = this.draw.getControl()
      const { newIndex } = control.moveCursor({
        index,
        isTable,
        trIndex,
        tdIndex,
        tdValueIndex
      })
      if (isTable) {
        positionResult.tdValueIndex = newIndex
      } else {
        positionResult.index = newIndex
      }
    }
    const {
      index,
      isCheckbox,
      isRadio,
      isControl,
      isImage,
      isLabel,
      isDirectHit,
      isTable,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    } = positionResult
    this.setPositionContext({
      isTable: isTable || false,
      isCheckbox: isCheckbox || false,
      isRadio: isRadio || false,
      isControl: isControl || false,
      isImage: isImage || false,
      isLabel: isLabel || false,
      isDirectHit: isDirectHit || false,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    })
    return positionResult
  }

  public setSurroundPosition(payload: ISetSurroundPositionPayload) {
    const { scale } = this.options
    const {
      pageNo,
      row,
      rowElement,
      rowElementRect,
      surroundElementList,
      availableWidth
    } = payload
    let x = rowElementRect.x
    let rowIncreaseWidth = 0
    if (
      surroundElementList.length &&
      !getIsBlockElement(rowElement) &&
      !rowElement.control?.minWidth
    ) {
      for (let s = 0; s < surroundElementList.length; s++) {
        const surroundElement = surroundElementList[s]
        const floatPosition = surroundElement.imgFloatPosition!
        if (floatPosition.pageNo !== pageNo) continue
        const surroundRect = {
          ...floatPosition,
          x: floatPosition.x * scale,
          y: floatPosition.y * scale,
          width: surroundElement.width! * scale,
          height: surroundElement.height! * scale
        }
        if (isRectIntersect(rowElementRect, surroundRect)) {
          row.isSurround = true
          const translateX =
            surroundRect.width + surroundRect.x - rowElementRect.x
          rowElement.left = translateX
          row.width += translateX
          rowIncreaseWidth += translateX
          x = surroundRect.x + surroundRect.width
          if (row.width + rowElement.metrics.width > availableWidth) {
            rowElement.left = 0
            row.width -= rowIncreaseWidth
            break
          }
        }
      }
    }
    return { x, rowIncreaseWidth }
  }
}
