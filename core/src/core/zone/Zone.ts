import { cmToPx, pxToCm } from '../../utils/unit'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorZone } from '../../dataset/enum/Editor'
import { IEditorOption } from '../../interface/Editor'
import { nextTick } from '../../utils'
import { Dialog } from '../../components/dialog/Dialog'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { ZoneTip } from './ZoneTip'

export class Zone {
  private readonly INDICATOR_PADDING = 2
  private readonly INDICATOR_TITLE_TRANSLATE = [20, 5]

  private draw: Draw
  private options: Required<IEditorOption>
  private i18n: I18n
  private container: HTMLDivElement

  private currentZone: EditorZone
  private indicatorContainer: HTMLDivElement | null
  private dropdownContainer: HTMLDivElement | null
  private dropdownClickHandler: ((e: MouseEvent) => void) | null

  constructor(draw: Draw) {
    this.draw = draw
    this.i18n = draw.getI18n()
    this.options = draw.getOptions()
    this.container = draw.getContainer()
    this.currentZone = EditorZone.MAIN
    this.indicatorContainer = null
    this.dropdownContainer = null
    this.dropdownClickHandler = null
    if (!this.options.zone.tipDisabled) {
      new ZoneTip(draw, this)
    }
  }

  public isHeaderActive(): boolean {
    return this.getZone() === EditorZone.HEADER
  }

  public isMainActive(): boolean {
    return this.getZone() === EditorZone.MAIN
  }

  public isFooterActive(): boolean {
    return this.getZone() === EditorZone.FOOTER
  }

  public getZone(): EditorZone {
    return this.currentZone
  }

  public setZone(payload: EditorZone) {
    const { header, footer } = this.options
    if (
      (!header.editable && payload === EditorZone.HEADER) ||
      (!footer.editable && payload === EditorZone.FOOTER)
    ) {
      return
    }
    // Auto-enable header/footer when disabled
    let needsCompute = false
    if (payload === EditorZone.HEADER && header.disabled) {
      header.disabled = false
      needsCompute = true
    }
    if (payload === EditorZone.FOOTER && footer.disabled) {
      footer.disabled = false
      needsCompute = true
    }
    if (this.currentZone === payload && !needsCompute) return
    this.currentZone = payload
    this.draw.getRange().clearRange()
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isCompute: needsCompute
    })
    this.drawZoneIndicator()
    nextTick(() => {
      const listener = this.draw.getListener()
      if (listener.zoneChange) {
        listener.zoneChange(payload)
      }
      const eventBus = this.draw.getEventBus()
      if (eventBus.isSubscribe('zoneChange')) {
        eventBus.emit('zoneChange', payload)
      }
    })
  }

  public getZoneByY(y: number): EditorZone {
    const header = this.draw.getHeader()
    const headerBottomY = header.getEffectiveBottomY()
    const footer = this.draw.getFooter()
    const footerTopY = footer.getEffectiveTopY()
    if (y < headerBottomY) {
      return EditorZone.HEADER
    }
    if (y > footerTopY) {
      return EditorZone.FOOTER
    }
    return EditorZone.MAIN
  }

  public drawZoneIndicator() {
    this._clearZoneIndicator()
    if (!this.isHeaderActive() && !this.isFooterActive()) return
    const { scale } = this.options
    const isHeaderActive = this.isHeaderActive()
    const pageList = this.draw.getPageList()
    const margins = this.draw.getMargins()
    const innerWidth = this.draw.getInnerWidth()
    const pageWidth = this.draw.getWidth()
    const pageHeight = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const preY = pageHeight + pageGap
    this.indicatorContainer = document.createElement('div')
    this.indicatorContainer.classList.add(`${EDITOR_PREFIX}-zone-indicator`)
    const header = this.draw.getHeader()
    const footer = this.draw.getFooter()
    const indicatorHeight = isHeaderActive
      ? header.getEffectiveBottomY()
      : pageHeight - footer.getEffectiveTopY()
    const indicatorTop = isHeaderActive
      ? 0
      : footer.getEffectiveTopY()
    for (let p = 0; p < pageList.length; p++) {
      const startY = preY * p + indicatorTop
      const indicatorLeftX = margins[3]
      const indicatorRightX = margins[3] + innerWidth
      const indicatorTopY = isHeaderActive
        ? startY
        : startY + indicatorHeight
      const indicatorBottomY = isHeaderActive
        ? startY + indicatorHeight
        : startY

      // Full-width bar (Google Docs style)
      const BAR_HEIGHT = 28
      const bar = document.createElement('div')
      bar.classList.add(`${EDITOR_PREFIX}-zone-indicator-bar`)
      const barTop = isHeaderActive
        ? indicatorBottomY
        : indicatorBottomY - BAR_HEIGHT
      bar.style.top = `${barTop}px`
      bar.style.left = '0px'
      bar.style.width = `${pageWidth}px`
      // Prevent focus loss and event propagation to canvas
      bar.onmousedown = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }

      const label = document.createElement('span')
      label.classList.add(`${EDITOR_PREFIX}-zone-indicator-bar__label`)
      label.textContent = this.i18n.t(
        `frame.${isHeaderActive ? 'header' : 'footer'}`
      )
      bar.append(label)

      const optionsBtn = document.createElement('span')
      optionsBtn.classList.add(`${EDITOR_PREFIX}-zone-indicator-bar__options`)
      optionsBtn.textContent = 'Options \u25BE'
      optionsBtn.onclick = (e: MouseEvent) => {
        e.stopPropagation()
        this._toggleDropdown(optionsBtn, isHeaderActive)
      }
      bar.append(optionsBtn)

      this.indicatorContainer.append(bar)

      // Only draw border lines when header/footer is not disabled
      const isZoneDisabled = isHeaderActive
        ? this.options.header.disabled
        : this.options.footer.disabled
      if (!isZoneDisabled) {
        const lineTop = document.createElement('span')
        lineTop.classList.add(`${EDITOR_PREFIX}-zone-indicator-border__top`)
        lineTop.style.top = `${indicatorTopY}px`
        lineTop.style.width = `${innerWidth}px`
        lineTop.style.marginLeft = `${margins[3]}px`
        this.indicatorContainer.append(lineTop)

        const lineLeft = document.createElement('span')
        lineLeft.classList.add(`${EDITOR_PREFIX}-zone-indicator-border__left`)
        lineLeft.style.top = `${startY}px`
        lineLeft.style.height = `${indicatorHeight}px`
        lineLeft.style.left = `${indicatorLeftX}px`
        this.indicatorContainer.append(lineLeft)

        const lineBottom = document.createElement('span')
        lineBottom.classList.add(
          `${EDITOR_PREFIX}-zone-indicator-border__bottom`
        )
        lineBottom.style.top = `${indicatorBottomY}px`
        this.indicatorContainer.append(lineBottom)

        const lineRight = document.createElement('span')
        lineRight.classList.add(
          `${EDITOR_PREFIX}-zone-indicator-border__right`
        )
        lineRight.style.top = `${startY}px`
        lineRight.style.height = `${indicatorHeight}px`
        lineRight.style.left = `${indicatorRightX}px`
        this.indicatorContainer.append(lineRight)
      }
    }
    this.container.append(this.indicatorContainer)
  }

  private _toggleDropdown(anchor: HTMLElement, isHeaderActive: boolean) {
    this._closeDropdown()

    const dropdown = document.createElement('div')
    dropdown.classList.add(`${EDITOR_PREFIX}-zone-indicator-dropdown`)

    const { header, footer } = this.options
    const isDisabled = isHeaderActive ? header.disabled : footer.disabled

    if (isDisabled) {
      // Show "Add Header/Footer" when disabled
      const addItem = document.createElement('div')
      addItem.classList.add(`${EDITOR_PREFIX}-zone-indicator-dropdown__item`)
      addItem.textContent = isHeaderActive ? 'Add Header' : 'Add Footer'
      addItem.onclick = (e: MouseEvent) => {
        e.stopPropagation()
        this._closeDropdown()
        if (isHeaderActive) {
          this.options.header.disabled = false
        } else {
          this.options.footer.disabled = false
        }
        this.draw.render({
          isSubmitHistory: false,
          isSetCursor: false
        })
        this.drawZoneIndicator()
      }
      dropdown.append(addItem)
    } else {
      // Show "Format" + "Remove" when enabled
      const formatItem = document.createElement('div')
      formatItem.classList.add(`${EDITOR_PREFIX}-zone-indicator-dropdown__item`)
      formatItem.textContent = isHeaderActive ? 'Header Format' : 'Footer Format'
      formatItem.onclick = (e: MouseEvent) => {
        e.stopPropagation()
        this._closeDropdown()
        this._openFormatDialog()
      }
      dropdown.append(formatItem)

      const separator = document.createElement('div')
      separator.classList.add(
        `${EDITOR_PREFIX}-zone-indicator-dropdown__separator`
      )
      dropdown.append(separator)

      const removeItem = document.createElement('div')
      removeItem.classList.add(`${EDITOR_PREFIX}-zone-indicator-dropdown__item`)
      removeItem.textContent = isHeaderActive
        ? 'Remove Header'
        : 'Remove Footer'
      removeItem.onclick = (e: MouseEvent) => {
        e.stopPropagation()
        this._closeDropdown()
        if (isHeaderActive) {
          this.options.header.disabled = true
        } else {
          this.options.footer.disabled = true
        }
        this.currentZone = EditorZone.MAIN
        this._clearZoneIndicator()
        this.draw.render({
          isSubmitHistory: false,
          isSetCursor: false
        })
        nextTick(() => {
          const listener = this.draw.getListener()
          if (listener.zoneChange) {
            listener.zoneChange(EditorZone.MAIN)
          }
          const eventBus = this.draw.getEventBus()
          if (eventBus.isSubscribe('zoneChange')) {
            eventBus.emit('zoneChange', EditorZone.MAIN)
          }
        })
      }
      dropdown.append(removeItem)
    }

    document.body.append(dropdown)
    this.dropdownContainer = dropdown

    // Position dropdown below the anchor button
    const rect = anchor.getBoundingClientRect()
    const dropdownWidth = dropdown.getBoundingClientRect().width
    let left = rect.right - dropdownWidth
    if (left < 0) left = rect.left
    dropdown.style.left = `${left}px`
    dropdown.style.top = `${rect.bottom + 2}px`

    // Close on outside click
    this.dropdownClickHandler = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node)) {
        this._closeDropdown()
      }
    }
    setTimeout(() => {
      document.addEventListener('click', this.dropdownClickHandler!)
    }, 0)
  }

  private _closeDropdown() {
    if (this.dropdownContainer) {
      this.dropdownContainer.remove()
      this.dropdownContainer = null
    }
    if (this.dropdownClickHandler) {
      document.removeEventListener('click', this.dropdownClickHandler)
      this.dropdownClickHandler = null
    }
  }

  private _openFormatDialog() {
    const options = this.draw.getOptions()
    new Dialog({
      title: 'Header & Footer',
      data: [
        {
          type: 'number',
          label: 'Header (cm from top)',
          name: 'headerTop',
          value: String(pxToCm(options.header.top)),
          step: '0.01'
        },
        {
          type: 'number',
          label: 'Footer (cm from bottom)',
          name: 'footerBottom',
          value: String(pxToCm(options.footer.bottom)),
          step: '0.01'
        },
        {
          type: 'color',
          label: 'Footer Background Color',
          name: 'footerBgColor',
          value: options.footer.backgroundColor || '#ffffff'
        }
      ],
      onConfirm: (payload) => {
        const headerTop = payload.find(p => p.name === 'headerTop')
        const footerBottom = payload.find(p => p.name === 'footerBottom')
        const footerBgColor = payload.find(p => p.name === 'footerBgColor')
        const newHeaderTop = cmToPx(Number(headerTop?.value ?? 0))
        const newFooterBottom = cmToPx(Number(footerBottom?.value ?? 0))
        options.header.top = Math.max(0, newHeaderTop)
        options.footer.bottom = Math.max(0, newFooterBottom)
        options.footer.backgroundColor = footerBgColor?.value || ''
        this.draw.render({
          isSubmitHistory: false,
          isSetCursor: false
        })
        this.drawZoneIndicator()
      }
    })
  }

  private _clearZoneIndicator() {
    this._closeDropdown()
    this.indicatorContainer?.remove()
    this.indicatorContainer = null
  }
}
