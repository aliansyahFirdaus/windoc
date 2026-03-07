import { isFirefox } from '../../../utils/ua'
import { CanvasEvent } from '../CanvasEvent'
import { input, removeComposingInput } from './input'

function compositionstart(host: CanvasEvent) {
  host.isComposing = true
}

function compositionend(host: CanvasEvent, evt: CompositionEvent) {
  host.isComposing = false
  const draw = host.getDraw()
  if (!evt.data) {
    removeComposingInput(host)
    const rangeManager = draw.getRange()
    const { endIndex: curIndex } = rangeManager.getRange()
    draw.render({
      curIndex,
      isSubmitHistory: false
    })
  } else {
    if (isFirefox) {
      setTimeout(() => {
        if (host.compositionInfo) {
          input(evt.data, host)
        }
      }, 1)
    } else {
      if (host.compositionInfo) {
        input(evt.data, host)
      }
    }
  }
  const cursor = draw.getCursor()
  cursor.clearAgentDomValue()
}

export default {
  compositionstart,
  compositionend
}
