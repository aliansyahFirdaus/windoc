import { EDITOR_PREFIX } from '../../../../../dataset/constant/Editor'
import { BlockType } from '../../../../../dataset/enum/Block'
import { IEditorOption } from '../../../../../interface/Editor'
import { IRowElement } from '../../../../../interface/Row'
import { Draw } from '../../../Draw'
import { BlockParticle } from '../BlockParticle'
import { IFrameBlock } from './IFrameBlock'
import { VideoBlock } from './VideoBlock'

export class BaseBlock {
  private draw: Draw
  private options: Required<IEditorOption>
  private element: IRowElement
  private block: IFrameBlock | VideoBlock | null
  private blockContainer: HTMLDivElement
  private blockItem: HTMLDivElement
  protected blockCache: Map<string, IFrameBlock | VideoBlock>
  private resizerMask: HTMLDivElement
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]
  private width: number
  private height: number
  private mousedownX: number
  private mousedownY: number
  private curHandleIndex: number
  private isAllowResize: boolean

  constructor(blockParticle: BlockParticle, element: IRowElement) {
    this.draw = blockParticle.getDraw()
    this.options = this.draw.getOptions()
    this.blockContainer = blockParticle.getBlockContainer()
    this.element = element
    this.block = null
    const { blockItem, resizerMask, resizerSelection, resizerHandleList } =
      this._createBlockItem()
    this.blockItem = blockItem
    this.blockContainer.append(this.blockItem)
    this.blockCache = new Map()
    this.resizerMask = resizerMask
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
    this.width = 0
    this.height = 0
    this.mousedownX = 0
    this.mousedownY = 0
    this.curHandleIndex = 0
    this.isAllowResize = false
  }

  public getBlockElement(): IRowElement {
    return this.element
  }

  public getBlockWidth(): number {
    return this.element.width || this.element.metrics.width
  }

  private _createBlockItem() {
    const { scale, resizerColor } = this.options
    const blockItem = document.createElement('div')
    blockItem.classList.add(`${EDITOR_PREFIX}-block-item`)
    const resizerSelection = document.createElement('div')
    resizerSelection.style.display = 'none'
    resizerSelection.classList.add(`${EDITOR_PREFIX}-resizer-selection`)
    resizerSelection.style.borderColor = resizerColor
    resizerSelection.style.borderWidth = `${scale}px`
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = resizerColor
      handleDom.classList.add(`resizer-handle`)
      handleDom.classList.add(`handle-${i}`)
      handleDom.setAttribute('data-index', String(i))
      handleDom.onmousedown = this._mousedown.bind(this)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    const resizerMask = document.createElement('div')
    resizerMask.classList.add(`${EDITOR_PREFIX}-resizer-mask`)
    resizerMask.style.display = 'none'
    blockItem.append(resizerMask)
    blockItem.onmouseenter = () => {
      const isReadonly = this.draw.isReadonly()
      if (isReadonly) return
      const { width, height } = this.element.metrics
      this._updateResizerRect(width, height)
      resizerSelection.style.display = 'block'
    }
    blockItem.onmouseleave = () => {
      if (this.isAllowResize) return
      resizerSelection.style.display = 'none'
    }
    blockItem.append(resizerSelection)
    return {
      blockItem,
      resizerMask,
      resizerSelection,
      resizerHandleList
    }
  }

  private _updateResizerRect(width: number, height: number) {
    const { resizerSize: handleSize, scale } = this.options
    this.resizerSelection.style.width = `${width}px`
    this.resizerSelection.style.height = `${height}px`
    for (let i = 0; i < 8; i++) {
      const left =
        i === 0 || i === 6 || i === 7
          ? -handleSize
          : i === 1 || i === 5
          ? width / 2
          : width - handleSize
      const top =
        i === 0 || i === 1 || i === 2
          ? -handleSize
          : i === 3 || i === 7
          ? height / 2 - handleSize
          : height - handleSize
      this.resizerHandleList[i].style.transform = `scale(${scale})`
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
    }
  }

  private _mousedown(evt: MouseEvent) {
    const canvas = this.draw.getPage()
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    this.isAllowResize = true
    const target = evt.target as HTMLDivElement
    this.curHandleIndex = Number(target.dataset.index)
    this.resizerMask.style.display = 'block'
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    canvas.style.cursor = cursor
    const mousemoveFn = this._mousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        this.element.width = Math.min(this.width, this.draw.getInnerWidth())
        this.element.height = this.height
        this.isAllowResize = false
        this.resizerSelection.style.display = 'none'
        this.resizerMask.style.display = 'none'
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        canvas.style.cursor = 'text'
        this.draw.render()
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _mousemove(evt: MouseEvent) {
    if (!this.isAllowResize) return
    const { scale } = this.options
    let dx = 0
    let dy = 0
    switch (this.curHandleIndex) {
      case 0:
        {
          const offsetX = this.mousedownX - evt.x
          const offsetY = this.mousedownY - evt.y
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.element.height! * dx) / this.getBlockWidth()
        }
        break
      case 1:
        dy = this.mousedownY - evt.y
        break
      case 2:
        {
          const offsetX = evt.x - this.mousedownX
          const offsetY = this.mousedownY - evt.y
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.element.height! * dx) / this.getBlockWidth()
        }
        break
      case 4:
        {
          const offsetX = evt.x - this.mousedownX
          const offsetY = evt.y - this.mousedownY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.element.height! * dx) / this.getBlockWidth()
        }
        break
      case 3:
        dx = evt.x - this.mousedownX
        break
      case 5:
        dy = evt.y - this.mousedownY
        break
      case 6:
        {
          const offsetX = this.mousedownX - evt.x
          const offsetY = evt.y - this.mousedownY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.element.height! * dx) / this.getBlockWidth()
        }
        break
      case 7:
        dx = this.mousedownX - evt.x
        break
    }
    const dw = this.getBlockWidth() + dx / scale
    const dh = this.element.height! + dy / scale
    if (dw <= 0 || dh <= 0) return
    this.width = dw
    this.height = dh
    const elementWidth = dw * scale
    const elementHeight = dh * scale
    this._updateResizerRect(elementWidth, elementHeight)
    this.blockItem.style.width = `${elementWidth}px`
    this.blockItem.style.height = `${elementHeight}px`
    evt.preventDefault()
  }

  public snapshot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const block = this.element.block!
    if (block.type === BlockType.VIDEO) {
      this.blockItem.style.display = 'none'
      if (this.blockCache.has(this.element.id!)) {
        const videoBlock = <VideoBlock>this.blockCache.get(this.element.id!)
        videoBlock.snapshot(ctx, x, y)
      } else {
        this.block = new VideoBlock(this.element)
        const promise = this.block.snapshot(ctx, x, y)
        this.draw.getImageObserver().add(promise)
        this.blockCache.set(this.element.id!, this.block)
      }
    }
  }

  public render() {
    const block = this.element.block!
    if (block.type === BlockType.IFRAME) {
      this.block = new IFrameBlock(this.element)
      this.block.render(this.blockItem)
    } else if (block.type === BlockType.VIDEO) {
      this.block = new VideoBlock(this.element)
      this.block.render(this.blockItem)
    }
  }

  public setClientRects(pageNo: number, x: number, y: number) {
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageNo * (height + pageGap)
    const { metrics } = this.element
    this.blockItem.style.display = 'block'
    this.blockItem.style.width = `${metrics.width}px`
    this.blockItem.style.height = `${metrics.height}px`
    this.blockItem.style.left = `${x}px`
    this.blockItem.style.top = `${preY + y}px`
  }

  public remove() {
    this.blockItem.remove()
  }
}
