import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import { CalculatorButtonType } from '../../../../dataset/enum/Control'
import { Control } from '../Control'

interface CalculatorOptions {
  control: Control
  onCalculate: (result: number) => void
}

export class Calculator {
  private control: Control
  private calculatorDom: HTMLDivElement | null
  private onCalculate: (result: number) => void
  private currentExpression: string

  constructor(options: CalculatorOptions) {
    this.control = options.control
    this.onCalculate = options.onCalculate
    this.calculatorDom = null
    this.currentExpression = ''
  }

  public createPopup() {
    const position = this.control.getPosition()
    if (!position) return

    const calculatorPopupContainer = document.createElement('div')
    calculatorPopupContainer.classList.add(`${EDITOR_PREFIX}-calculator`)
    calculatorPopupContainer.setAttribute(
      EDITOR_COMPONENT,
      EditorComponent.POPUP
    )

    const display = document.createElement('div')
    display.classList.add(`${EDITOR_PREFIX}-calculator-display`)
    display.textContent = '0'

    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add(`${EDITOR_PREFIX}-calculator-buttons`)

    const buttons = [
      [
        { text: 'C', type: CalculatorButtonType.UTILITY },
        { text: '←', type: CalculatorButtonType.UTILITY },
        { text: '%', type: CalculatorButtonType.OPERATOR },
        { text: '/', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '7', type: CalculatorButtonType.NUMBER },
        { text: '8', type: CalculatorButtonType.NUMBER },
        { text: '9', type: CalculatorButtonType.NUMBER },
        { text: '*', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '4', type: CalculatorButtonType.NUMBER },
        { text: '5', type: CalculatorButtonType.NUMBER },
        { text: '6', type: CalculatorButtonType.NUMBER },
        { text: '-', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '1', type: CalculatorButtonType.NUMBER },
        { text: '2', type: CalculatorButtonType.NUMBER },
        { text: '3', type: CalculatorButtonType.NUMBER },
        { text: '+', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '0', type: CalculatorButtonType.NUMBER },
        { text: '.', type: CalculatorButtonType.NUMBER },
        { text: '=', type: CalculatorButtonType.EQUAL, span: 2 }
      ]
    ]

    buttons.forEach(row => {
      row.forEach(buttonInfo => {
        const button = document.createElement('button')
        button.classList.add(`${EDITOR_PREFIX}-calculator-button`)

        if (buttonInfo.type === CalculatorButtonType.OPERATOR) {
          button.classList.add('operator')
        } else if (buttonInfo.type === CalculatorButtonType.EQUAL) {
          button.classList.add('equal')
        } else if (buttonInfo.type === CalculatorButtonType.UTILITY) {
          button.classList.add('utility')
        }

        button.textContent = buttonInfo.text

        button.onclick = () => {
          const buttonText = buttonInfo.text
          if (buttonText === 'C') {
            this.currentExpression = ''
            display.textContent = '0'
          } else if (buttonText === '←') {
            this.currentExpression = this.currentExpression.slice(0, -1)
            display.textContent = this.currentExpression || '0'
          } else if (buttonText === '=') {
            const result = this.calculate(this.currentExpression)
            if (Number.isFinite(result)) {
              display.textContent = result.toString()
              this.currentExpression = result.toString()

              this.onCalculate(result)
            } else {
              display.textContent = 'Error'
              this.currentExpression = ''
            }
          } else {
            this.currentExpression += buttonText
            display.textContent = this.currentExpression
          }
        }

        if (buttonInfo.span) {
          button.style.gridColumn = `span ${buttonInfo.span}`
        }

        buttonContainer.appendChild(button)
      })
    })

    calculatorPopupContainer.appendChild(display)
    calculatorPopupContainer.appendChild(buttonContainer)

    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const preY = this.control.getPreY()
    calculatorPopupContainer.style.left = `${left}px`
    calculatorPopupContainer.style.top = `${top + preY + lineHeight}px`

    const container = this.control.getContainer()
    container.appendChild(calculatorPopupContainer)

    this.calculatorDom = calculatorPopupContainer
  }

  public destroy() {
    if (this.calculatorDom) {
      this.calculatorDom.remove()
      this.calculatorDom = null
    }
  }

  private calculate(expression: string): number {
    const result = Function('return ' + expression)()

    if (!Number.isFinite(result)) {
      return result
    }

    if (Number.isInteger(result)) {
      return result
    }

    return parseFloat(result.toFixed(10))
  }
}
