import { IRowElement } from '../../../../../interface/Row'

export class IFrameBlock {
  public static readonly sandbox = ['allow-scripts', 'allow-same-origin']
  public static readonly allow = ['fullscreen']

  private element: IRowElement

  constructor(element: IRowElement) {
    this.element = element
  }

  private _defineIframeProperties(iframeWindow: Window) {
    Object.defineProperties(iframeWindow, {
      parent: {
        get: () => null
      },
      __POWERED_BY_CANVAS_EDITOR__: {
        get: () => true
      }
    })
  }

  public render(blockItemContainer: HTMLDivElement) {
    const { iframeBlock } = this.element.block || {}
    const iframe = document.createElement('iframe')
    iframe.setAttribute('data-id', this.element.id!)
    iframe.sandbox.add(...(iframeBlock?.sandbox || IFrameBlock.sandbox))
    iframe.setAttribute(
      'allow',
      [iframeBlock?.allow || IFrameBlock.allow].join(' ')
    )
    iframe.style.border = 'none'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    if (iframeBlock?.src) {
      iframe.src = iframeBlock.src
    } else if (iframeBlock?.srcdoc) {
      iframe.srcdoc = iframeBlock.srcdoc
    }
    blockItemContainer.append(iframe)
    this._defineIframeProperties(iframe.contentWindow!)
  }
}
