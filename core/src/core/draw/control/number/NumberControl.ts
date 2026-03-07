import { NON_NUMBER_STR_REG } from '../../../../dataset/constant/Regular'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import {
  IControlContext,
  IControlRuleOption
} from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { deepClone, omitObject, pickObject } from '../../../../utils'
import { getElementListText, isTextElement } from '../../../../utils/element'
import { TextControl } from '../text/TextControl'
import { Calculator } from './Calculator'
import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../../dataset/constant/Element'

export class NumberControl extends TextControl {
  private isPopup: boolean
  private calculator: Calculator | null

  constructor(element: IElement, control: any) {
    super(element, control)
    this.isPopup = false
    this.calculator = null
  }

  public getIsPopup(): boolean {
    return this.isPopup
  }

  public setValue(
    data: IElement[],
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    if (
      data.some(el => !isTextElement(el) || NON_NUMBER_STR_REG.test(el.value))
    ) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    this.control.shrinkBoundary(context)
    const controlElementList = deepClone(data)
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    if (
      this.control.getIsExistValueByElementListIndex(elementList, startIndex)
    ) {
      let preIndex = startIndex
      while (preIndex > 0) {
        const preElement = elementList[preIndex]
        if (
          preElement.controlId !== startElement.controlId ||
          preElement.controlComponent === ControlComponent.PREFIX ||
          preElement.controlComponent === ControlComponent.PRE_TEXT
        ) {
          break
        }
        controlElementList.unshift(preElement)
        preIndex--
      }
      let nextIndex = endIndex + 1
      while (nextIndex < elementList.length) {
        const nextElement = elementList[nextIndex]
        if (
          nextElement.controlId !== startElement.controlId ||
          nextElement.controlComponent === ControlComponent.POSTFIX ||
          nextElement.controlComponent === ControlComponent.POST_TEXT
        ) {
          break
        }
        controlElementList.push(nextElement)
        nextIndex++
      }
    }
    const text = getElementListText(controlElementList)
    if (Number.isNaN(Number(text)) || !Number.isFinite(Number(text))) {
      return -1
    }
    return super.setValue(data, context, options)
  }

  private _setCalculatedValue(value: number) {
    const prefixIndex = super.clearValue(
      {},
      {
        isAddPlaceholder: false,
        isIgnoreDeletedRule: true
      }
    )
    if (!~prefixIndex) return

    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    const valueElement = this.getValue()[0]
    const styleElement = valueElement
      ? pickObject(valueElement, EDITOR_ELEMENT_STYLE_ATTR)
      : pickObject(elementList[range.startIndex], CONTROL_STYLE_ATTR)

    const propertyElement = omitObject(
      elementList[prefixIndex],
      EDITOR_ELEMENT_STYLE_ATTR
    )

    const valueStr = value.toString()
    const data: IElement[] = []

    for (let i = 0; i < valueStr.length; i++) {
      const newElement: IElement = {
        ...styleElement,
        ...propertyElement,
        type: ElementType.TEXT,
        value: valueStr[i],
        controlComponent: ControlComponent.VALUE
      }
      data.push(newElement)
    }

    this.setValue(data)

    this.control.repaintControl({
      curIndex: prefixIndex + data.length
    })

    this.control.emitControlContentChange()

    this.destroy()
  }

  public awake() {
    const isCalculatorEnabled =
      this.element.control?.numberExclusiveOptions?.calculatorDisabled === false
    if (
      this.isPopup ||
      !isCalculatorEnabled ||
      this.control.getIsDisabledControl() ||
      !this.control.getIsRangeWithinControl()
    ) {
      return
    }
    const { startIndex } = this.control.getRange()
    const elementList = this.control.getElementList()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }

    this.calculator = new Calculator({
      control: this.control,
      onCalculate: result => {
        this._setCalculatedValue(result)
      }
    })

    this.calculator.createPopup()
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.calculator?.destroy()
    this.calculator = null
    this.isPopup = false
  }
}
