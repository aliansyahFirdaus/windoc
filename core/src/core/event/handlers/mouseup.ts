import {
  CONTROL_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../dataset/constant/Element'
import { ImageDisplay } from '../../../dataset/enum/Common'
import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { deepClone, getUUID, omitObject } from '../../../utils'
import { formatElementContext, formatElementList } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

type IDragElement = IElement & { dragId: string }

function createDragId(element: IElement): string {
  const dragId = getUUID()
  Reflect.set(element, 'dragId', dragId)
  return dragId
}

function getElementIndexByDragId(dragId: string, elementList: IElement[]) {
  return (<IDragElement[]>elementList).findIndex(el => el.dragId === dragId)
}

function moveImgPosition(
  element: IElement,
  evt: MouseEvent,
  host: CanvasEvent
) {
  const draw = host.getDraw()
  if (
    element.imgDisplay === ImageDisplay.SURROUND ||
    element.imgDisplay === ImageDisplay.FLOAT_TOP ||
    element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
  ) {
    const moveX = evt.offsetX - host.mouseDownStartPosition!.x!
    const moveY = evt.offsetY - host.mouseDownStartPosition!.y!
    const imgFloatPosition = element.imgFloatPosition!
    element.imgFloatPosition = {
      x: imgFloatPosition.x + moveX,
      y: imgFloatPosition.y + moveY,
      pageNo: draw.getPageNo()
    }
  }
  draw.getImageParticle().destroyFloatImage()
}

export function mouseup(evt: MouseEvent, host: CanvasEvent) {
  if (host.isAllowDrop) {
    const draw = host.getDraw()
    if (draw.isReadonly() || draw.isDisabled()) {
      host.mousedown(evt)
      return
    }
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    const positionContext = position.getPositionContext()
    const rangeManager = draw.getRange()
    const cacheRange = host.cacheRange!
    const cacheElementList = host.cacheElementList!
    const cachePositionList = host.cachePositionList!
    const cachePositionContext = host.cachePositionContext
    const range = rangeManager.getRange()
    const isCacheRangeCollapsed = cacheRange.startIndex === cacheRange.endIndex
    const cacheStartIndex = isCacheRangeCollapsed
      ? cacheRange.startIndex - 1
      : cacheRange.startIndex
    const cacheEndIndex = cacheRange.endIndex
    if (
      range.startIndex >= cacheStartIndex &&
      range.endIndex <= cacheEndIndex &&
      host.cachePositionContext?.tdId === positionContext.tdId
    ) {
      draw.clearSideEffect()
      let isSubmitHistory = false
      let isCompute = false
      if (isCacheRangeCollapsed) {
        const dragElement = cacheElementList[cacheEndIndex]
        if (
          dragElement.type === ElementType.IMAGE ||
          dragElement.type === ElementType.LATEX
        ) {
          moveImgPosition(dragElement, evt, host)
          if (
            dragElement.imgDisplay === ImageDisplay.SURROUND ||
            dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
            dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
          ) {
            draw.getPreviewer().drawResizer(dragElement)
            isSubmitHistory = true
          } else {
            const cachePosition = cachePositionList[cacheEndIndex]
            draw.getPreviewer().drawResizer(dragElement, cachePosition)
          }
          isCompute = dragElement.imgDisplay === ImageDisplay.SURROUND
        }
      }
      rangeManager.replaceRange({
        ...cacheRange
      })
      draw.render({
        isCompute,
        isSubmitHistory,
        isSetCursor: false
      })
      return
    }
    const dragElementList = cacheElementList.slice(
      cacheStartIndex + 1,
      cacheEndIndex + 1
    )
    const isContainControl = dragElementList.find(element => element.controlId)
    if (isContainControl) {
      const cacheStartElement = cacheElementList[cacheStartIndex + 1]
      const cacheEndElement = cacheElementList[cacheEndIndex]
      const isAllowDragControl =
        ((!cacheStartElement.controlId ||
          cacheStartElement.controlComponent === ControlComponent.PREFIX) &&
          (!cacheEndElement.controlId ||
            cacheEndElement.controlComponent === ControlComponent.POSTFIX)) ||
        (cacheStartElement.controlId === cacheEndElement.controlId &&
          cacheStartElement.controlComponent === ControlComponent.PREFIX &&
          cacheEndElement.controlComponent === ControlComponent.POSTFIX) ||
        (cacheStartElement.control?.type === ControlType.TEXT &&
          cacheStartElement.controlComponent === ControlComponent.VALUE &&
          cacheEndElement.control?.type === ControlType.TEXT &&
          cacheEndElement.controlComponent === ControlComponent.VALUE)
      if (!isAllowDragControl) {
        draw.render({
          curIndex: range.startIndex,
          isCompute: false,
          isSubmitHistory: false
        })
        return
      }
    }
    const control = draw.getControl()
    const elementList = draw.getElementList()
    const isOmitControlAttr =
      !isContainControl ||
      !!elementList[range.startIndex].controlId ||
      !control.getIsElementListContainFullControl(dragElementList)
    const editorOptions = draw.getOptions()
    const replaceElementList = dragElementList.map(el => {
      if (!el.type || el.type === ElementType.TEXT) {
        const newElement: IElement = {
          value: el.value
        }
        const copyAttr = EDITOR_ELEMENT_STYLE_ATTR
        if (!isOmitControlAttr) {
          copyAttr.push(...CONTROL_CONTEXT_ATTR)
        }
        copyAttr.forEach(attr => {
          const value = el[attr] as never
          if (value !== undefined) {
            newElement[attr] = value
          }
        })
        return newElement
      } else {
        let newElement = deepClone(el)
        if (isOmitControlAttr) {
          newElement = omitObject(newElement, CONTROL_CONTEXT_ATTR)
        }
        formatElementList([newElement], {
          isHandleFirstElement: false,
          editorOptions
        })
        return newElement
      }
    })
    formatElementContext(elementList, replaceElementList, range.startIndex, {
      editorOptions: draw.getOptions()
    })
    const cacheStartElement = cacheElementList[cacheStartIndex]
    const cacheStartPosition = cachePositionList[cacheStartIndex]
    const cacheRangeStartId = createDragId(cacheElementList[cacheStartIndex])
    const cacheRangeEndId = createDragId(cacheElementList[cacheEndIndex])
    const replaceLength = replaceElementList.length
    let rangeStart = range.startIndex
    let rangeEnd = rangeStart + replaceLength
    const activeControl = control.getActiveControl()
    if (
      activeControl &&
      cacheElementList[rangeStart].controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeEnd = activeControl.setValue(replaceElementList)
      rangeStart = rangeEnd - replaceLength
    } else {
      draw.spliceElementList(elementList, rangeStart + 1, 0, replaceElementList)
    }
    if (!~rangeEnd) {
      draw.render({
        isSetCursor: false
      })
      return
    }
    const rangeStartId = createDragId(elementList[rangeStart])
    const rangeEndId = createDragId(elementList[rangeEnd])
    const cacheRangeStartIndex = getElementIndexByDragId(
      cacheRangeStartId,
      cacheElementList
    )
    const cacheRangeEndIndex = getElementIndexByDragId(
      cacheRangeEndId,
      cacheElementList
    )
    const cacheEndElement = cacheElementList[cacheRangeEndIndex]
    if (
      cacheEndElement.controlId &&
      cacheEndElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeManager.replaceRange({
        ...cacheRange,
        startIndex: cacheRangeStartIndex,
        endIndex: cacheRangeEndIndex
      })
      control.getActiveControl()?.cut()
    } else {
      let isTdElementDeletable = true
      if (cachePositionContext?.isTable) {
        const { tableId, trIndex, tdIndex } = cachePositionContext
        const originElementList = draw.getOriginalElementList()
        isTdElementDeletable = !originElementList.some(
          el =>
            el.id === tableId &&
            el?.trList?.[trIndex!]?.tdList?.[tdIndex!]?.deletable === false
        )
      }
      if (isTdElementDeletable) {
        draw.spliceElementList(
          cacheElementList,
          cacheRangeStartIndex + 1,
          cacheRangeEndIndex - cacheRangeStartIndex
        )
      }
    }
    const startElement = elementList[range.startIndex]
    const startPosition = positionList[range.startIndex]
    let positionContextIndex = positionContext.index
    if (positionContextIndex) {
      if (startElement.tableId && !cacheStartElement.tableId) {
        if (cacheStartPosition.index < positionContextIndex) {
          positionContextIndex -= replaceLength
        }
      } else if (!startElement.tableId && cacheStartElement.tableId) {
        if (startPosition.index < positionContextIndex) {
          positionContextIndex += replaceLength
        }
      }
      position.setPositionContext({
        ...positionContext,
        index: positionContextIndex
      })
    }
    const rangeStartIndex = getElementIndexByDragId(rangeStartId, elementList)
    const rangeEndIndex = getElementIndexByDragId(rangeEndId, elementList)
    rangeManager.setRange(
      isCacheRangeCollapsed ? rangeEndIndex : rangeStartIndex,
      rangeEndIndex,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
    draw.clearSideEffect()
    let imgElement: IElement | null = null
    if (isCacheRangeCollapsed) {
      const elementList = draw.getElementList()
      const dragElement = elementList[rangeEndIndex]
      if (
        dragElement.type === ElementType.IMAGE ||
        dragElement.type === ElementType.LATEX
      ) {
        moveImgPosition(dragElement, evt, host)
        imgElement = dragElement
      }
    }
    draw.render({
      isSetCursor: false
    })
    if (activeControl) {
      control.emitControlContentChange()
    } else if (cacheStartElement.controlId) {
      control.emitControlContentChange({
        context: {
          range: cacheRange,
          elementList: cacheElementList
        },
        controlElement: cacheStartElement
      })
    }
    if (imgElement) {
      if (
        imgElement.imgDisplay === ImageDisplay.SURROUND ||
        imgElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
        imgElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
      ) {
        draw.getPreviewer().drawResizer(imgElement)
      } else {
        const dragPositionList = position.getPositionList()
        const dragPosition = dragPositionList[rangeEndIndex]
        draw.getPreviewer().drawResizer(imgElement, dragPosition)
      }
    }
  } else if (host.isAllowDrag) {
    if (host.cacheRange?.startIndex !== host.cacheRange?.endIndex) {
      host.mousedown(evt)
    }
  }
}
