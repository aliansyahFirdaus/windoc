import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../../dataset/constant/Element'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElement } from '../../../../interface/Element'
import { pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function tab(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (activeControl && control.getIsRangeWithinControl()) {
    control.initNextControl({
      direction: evt.shiftKey ? MoveDirection.UP : MoveDirection.DOWN
    })
  } else {
    const rangeManager = draw.getRange()
    const elementList = draw.getElementList()
    const { startIndex, endIndex } = rangeManager.getRange()
    // Check if cursor is within a list — handle indent/outdent
    const curElement = elementList[endIndex]
    if (curElement?.listId) {
      if (evt.shiftKey) {
        draw.getListParticle().outdent()
      } else {
        draw.getListParticle().indent()
      }
      return
    }
    const anchorStyle = rangeManager.getRangeAnchorStyle(elementList, endIndex)
    const copyStyle = anchorStyle
      ? pickObject(anchorStyle, EDITOR_ELEMENT_STYLE_ATTR)
      : null
    const tabElement: IElement = {
      ...copyStyle,
      type: ElementType.TAB,
      value: ''
    }
    formatElementContext(elementList, [tabElement], startIndex, {
      editorOptions: draw.getOptions()
    })
    draw.insertElementList([tabElement])
  }
}
