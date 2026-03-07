import { EDITOR_CLIPBOARD } from '../dataset/constant/Editor'
import { DeepRequired } from '../interface/Common'
import { IEditorOption } from '../interface/Editor'
import { IElement } from '../interface/Element'
import { createDomFromElementList, zipElementList } from './element'

export interface IClipboardData {
  text: string
  elementList: IElement[]
}

export function setClipboardData(data: IClipboardData) {
  localStorage.setItem(
    EDITOR_CLIPBOARD,
    JSON.stringify({
      text: data.text,
      elementList: data.elementList
    })
  )
}

export function getClipboardData(): IClipboardData | null {
  const clipboardText = localStorage.getItem(EDITOR_CLIPBOARD)
  return clipboardText ? JSON.parse(clipboardText) : null
}

export function removeClipboardData() {
  localStorage.removeItem(EDITOR_CLIPBOARD)
}

export async function writeClipboardItem(
  text: string,
  html: string,
  elementList: IElement[]
) {
  if (!text && !html && !elementList.length) return
  const plainText = new Blob([text], { type: 'text/plain' })
  const htmlText = new Blob([html], { type: 'text/html' })
  if (window.ClipboardItem) {
    // @ts-ignore
    const item = new ClipboardItem({
      [plainText.type]: plainText,
      [htmlText.type]: htmlText
    })
    await window.navigator.clipboard.write([item])
  } else {
    const fakeElement = document.createElement('div')
    fakeElement.setAttribute('contenteditable', 'true')
    fakeElement.innerHTML = html
    document.body.append(fakeElement)
    // add new range
    const selection = window.getSelection()
    const range = document.createRange()
    const br = document.createElement('span')
    br.innerText = '\n'
    fakeElement.append(br)
    range.selectNodeContents(fakeElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    document.execCommand('copy')
    fakeElement.remove()
  }
  setClipboardData({ text, elementList })
}

export async function writeElementList(
  elementList: IElement[],
  options: DeepRequired<IEditorOption>
) {
  const clipboardDom = createDomFromElementList(elementList, options)
  document.body.append(clipboardDom)
  const text = clipboardDom.innerText
  clipboardDom.remove()
  const html = clipboardDom.innerHTML
  if (!text && !html && !elementList.length) return
  await writeClipboardItem(text, html, zipElementList(elementList))
}

export function getIsClipboardContainFile(clipboardData: DataTransfer) {
  let isFile = false
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i]
    if (item.kind === 'file') {
      isFile = true
      break
    }
  }
  return isFile
}
