import { ZERO } from '../../../dataset/constant/Common';
import {
  ulStyleMapping,
  olPresetCycles,
  ulPresetCycles,
  INDENT_PER_LEVEL,
  MAX_LIST_LEVEL
} from '../../../dataset/constant/List';
import { ElementType } from '../../../dataset/enum/Element';
import { KeyMap } from '../../../dataset/enum/KeyMap';
import {
  ListStyle,
  ListType,
  OlPreset,
  UlPreset,
  UlStyle
} from '../../../dataset/enum/List';
import { DeepRequired } from '../../../interface/Common';
import { IEditorOption } from '../../../interface/Editor';
import { IElement, IElementPosition } from '../../../interface/Element';
import { IRow, IRowElement } from '../../../interface/Row';
import { getUUID } from '../../../utils';
import { RangeManager } from '../../range/RangeManager';
import { Draw } from '../Draw';

function toAlpha(n: number, upper: boolean): string {
  let result = '';
  let num = n + 1;
  while (num > 0) {
    num--;
    result = String.fromCharCode((upper ? 65 : 97) + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

function toRoman(n: number, upper: boolean): string {
  const num = n + 1;
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = [
    'M',
    'CM',
    'D',
    'CD',
    'C',
    'XC',
    'L',
    'XL',
    'X',
    'IX',
    'V',
    'IV',
    'I'
  ];
  let result = '';
  let remaining = num;
  for (let i = 0; i < vals.length; i++) {
    while (remaining >= vals[i]) {
      result += syms[i];
      remaining -= vals[i];
    }
  }
  return upper ? result : result.toLowerCase();
}

function formatOlNumber(
  index: number,
  style: string,
  _outlinePrefix?: string
): string {
  switch (style) {
    case 'decimal':
      return `${index + 1}.`;
    case 'decimalParen':
      return `${index + 1})`;
    case 'decimalZero':
      return `${String(index + 1).padStart(2, '0')}.`;
    case 'lowerAlpha':
      return `${toAlpha(index, false)}.`;
    case 'lowerAlphaParen':
      return `${toAlpha(index, false)})`;
    case 'upperAlpha':
      return `${toAlpha(index, true)}.`;
    case 'lowerRoman':
      return `${toRoman(index, false)}.`;
    case 'lowerRomanParen':
      return `${toRoman(index, false)})`;
    case 'upperRoman':
      return `${toRoman(index, true)}.`;
    case 'outline':
      return _outlinePrefix ? `${_outlinePrefix}.` : `${index + 1}.`;
    default:
      return `${index + 1}.`;
  }
}

export class ListParticle {
  private draw: Draw;
  private range: RangeManager;
  private options: DeepRequired<IEditorOption>;

  private readonly UN_COUNT_STYLE_WIDTH = 20;
  private readonly MEASURE_BASE_TEXT = '0';
  private readonly LIST_GAP = 10;

  constructor(draw: Draw) {
    this.draw = draw;
    this.range = draw.getRange();
    this.options = draw.getOptions();
  }

  public setList(listType: ListType | null, listStyle?: ListStyle) {
    const isReadonly = this.draw.isReadonly();
    if (isReadonly) return;
    const { startIndex, endIndex } = this.range.getRange();
    if (!~startIndex && !~endIndex) return;
    const changeElementList = this.range.getRangeParagraphElementList();
    if (!changeElementList || !changeElementList.length) return;
    const isUnsetList = changeElementList.find(
      el => el.listType === listType && el.listStyle === listStyle
    );
    if (isUnsetList || !listType) {
      this.unsetList();
      return;
    }
    const listId = getUUID();
    changeElementList.forEach(el => {
      el.listId = listId;
      el.listType = listType;
      el.listStyle = listStyle;
      if (el.listLevel === undefined) {
        el.listLevel = 0;
      }
    });
    const isSetCursor = startIndex === endIndex;
    const curIndex = isSetCursor ? endIndex : startIndex;
    this.draw.render({ curIndex, isSetCursor });
  }

  public setListWithPreset(
    listType: ListType,
    listStyle: ListStyle,
    preset: string
  ) {
    const isReadonly = this.draw.isReadonly();
    if (isReadonly) return;
    const { startIndex, endIndex } = this.range.getRange();
    if (!~startIndex && !~endIndex) return;
    const changeElementList = this.range.getRangeParagraphElementList();
    if (!changeElementList || !changeElementList.length) return;
    const isUnsetList = changeElementList.find(
      el =>
        el.listType === listType &&
        el.listStyle === listStyle &&
        el.listPreset === preset
    );
    if (isUnsetList) {
      this.unsetList();
      return;
    }
    const listId = getUUID();
    changeElementList.forEach(el => {
      el.listId = listId;
      el.listType = listType;
      el.listStyle = listStyle;
      el.listPreset = preset;
      if (el.listLevel === undefined) {
        el.listLevel = 0;
      }
    });
    const isSetCursor = startIndex === endIndex;
    const curIndex = isSetCursor ? endIndex : startIndex;
    this.draw.render({ curIndex, isSetCursor });
  }

  public indent() {
    const isReadonly = this.draw.isReadonly();
    if (isReadonly) return;
    const { startIndex, endIndex } = this.range.getRange();
    if (!~startIndex && !~endIndex) return;
    const elementList = this.draw.getElementList();
    const curElement = elementList[endIndex];
    if (!curElement?.listId) return;
    const changeElementList = this.range.getRangeParagraphElementList();
    if (!changeElementList || !changeElementList.length) return;
    const currentLevel = changeElementList[0].listLevel ?? 0;
    if (currentLevel >= MAX_LIST_LEVEL) return;
    changeElementList.forEach(el => {
      el.listLevel = (el.listLevel ?? 0) + 1;
    });
    const isSetCursor = startIndex === endIndex;
    const curIndex = isSetCursor ? endIndex : startIndex;
    this.draw.render({ curIndex, isSetCursor });
  }

  public outdent() {
    const isReadonly = this.draw.isReadonly();
    if (isReadonly) return;
    const { startIndex, endIndex } = this.range.getRange();
    if (!~startIndex && !~endIndex) return;
    const elementList = this.draw.getElementList();
    const curElement = elementList[endIndex];
    if (!curElement?.listId) return;
    const changeElementList = this.range.getRangeParagraphElementList();
    if (!changeElementList || !changeElementList.length) return;
    const currentLevel = changeElementList[0].listLevel ?? 0;
    if (currentLevel <= 0) return;
    changeElementList.forEach(el => {
      el.listLevel = (el.listLevel ?? 0) - 1;
    });
    const isSetCursor = startIndex === endIndex;
    const curIndex = isSetCursor ? endIndex : startIndex;
    this.draw.render({ curIndex, isSetCursor });
  }

  public unsetList() {
    const isReadonly = this.draw.isReadonly();
    if (isReadonly) return;
    const { startIndex, endIndex } = this.range.getRange();
    if (!~startIndex && !~endIndex) return;
    const changeElementList = this.range
      .getRangeParagraphElementList()
      ?.filter(el => el.listId);
    if (!changeElementList || !changeElementList.length) return;
    const elementList = this.draw.getElementList();
    const endElement = elementList[endIndex];
    if (endElement.listId) {
      let start = endIndex + 1;
      while (start < elementList.length) {
        const element = elementList[start];
        if (element.value === ZERO && !element.listWrap) break;
        if (element.listId !== endElement.listId) {
          this.draw.spliceElementList(elementList, start, 0, [
            {
              value: ZERO
            }
          ]);
          break;
        }
        start++;
      }
    }
    changeElementList.forEach(el => {
      delete el.listId;
      delete el.listType;
      delete el.listStyle;
      delete el.listWrap;
      delete el.listLevel;
      delete el.listPreset;
    });
    const isSetCursor = startIndex === endIndex;
    const curIndex = isSetCursor ? endIndex : startIndex;
    this.draw.render({ curIndex, isSetCursor });
  }

  public getListIndentWidth(element: IElement): number {
    const { scale } = this.options;
    const level = element.listLevel ?? 0;
    return level * INDENT_PER_LEVEL * scale;
  }

  public computeListStyle(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[]
  ): Map<string, number> {
    const listStyleMap = new Map<string, number>();
    let start = 0;
    let curListId = elementList[start].listId;
    let curElementList: IElement[] = [];
    const elementLength = elementList.length;
    while (start < elementLength) {
      const curElement = elementList[start];
      if (curListId && curListId === curElement.listId) {
        curElementList.push(curElement);
      } else {
        if (curElement.listId && curElement.listId !== curListId) {
          if (curElementList.length) {
            const width = this.getListStyleWidth(ctx, curElementList);
            listStyleMap.set(curListId!, width);
          }
          curListId = curElement.listId;
          curElementList = curListId ? [curElement] : [];
        }
      }
      start++;
    }
    if (curElementList.length) {
      const width = this.getListStyleWidth(ctx, curElementList);
      listStyleMap.set(curListId!, width);
    }
    return listStyleMap;
  }

  public getListStyleWidth(
    ctx: CanvasRenderingContext2D,
    listElementList: IElement[]
  ): number {
    const { scale, checkbox } = this.options;
    const startElement = listElementList[0];
    if (
      startElement.listStyle &&
      startElement.listStyle !== ListStyle.DECIMAL
    ) {
      if (startElement.listStyle === ListStyle.CHECKBOX) {
        return (checkbox.width + this.LIST_GAP) * scale;
      }
      return this.UN_COUNT_STYLE_WIDTH * scale;
    }
    const count = listElementList.reduce((pre, cur) => {
      if (cur.value === ZERO) {
        pre += 1;
      }
      return pre;
    }, 0);
    if (!count) return 0;
    const text = `${this.MEASURE_BASE_TEXT.repeat(String(count).length)}${
      KeyMap.PERIOD
    }`;
    const textMetrics = ctx.measureText(text);
    return Math.ceil((textMetrics.width + this.LIST_GAP) * scale);
  }

  private _getOlStyleForLevel(element: IElement): string {
    const preset = element.listPreset || OlPreset.DEFAULT;
    const level = element.listLevel ?? 0;
    const cycle = olPresetCycles[preset];
    if (!cycle) return 'decimal';
    return cycle[level % cycle.length];
  }

  private _getUlBulletForLevel(element: IElement): string {
    const preset = element.listPreset || UlPreset.DEFAULT;
    const level = element.listLevel ?? 0;
    const cycle = ulPresetCycles[preset];
    if (!cycle) return '●';
    return cycle[level % cycle.length];
  }

  public drawListStyle(
    ctx: CanvasRenderingContext2D,
    row: IRow,
    position: IElementPosition
  ) {
    const { elementList, offsetX, listIndex, ascent } = row;
    const startElement = elementList[0];
    if (startElement.value !== ZERO || startElement.listWrap) return;
    // tab width
    let tabWidth = 0;
    const { defaultTabWidth, scale, defaultFont, defaultSize } = this.options;
    for (let i = 1; i < elementList.length; i++) {
      const element = elementList[i];
      if (element?.type !== ElementType.TAB) break;
      tabWidth += defaultTabWidth * scale;
    }
    const {
      coordinate: {
        leftTop: [startX, startY]
      }
    } = position;
    // Add indent for nested lists
    const indentWidth = this.getListIndentWidth(startElement);
    const x = startX - offsetX! + tabWidth + indentWidth;
    const y = startY + ascent;
    if (startElement.listStyle === ListStyle.CHECKBOX) {
      const { width, height, gap } = this.options.checkbox;
      const checkboxRowElement: IRowElement = {
        ...startElement,
        checkbox: {
          value: !!startElement.checkbox?.value
        },
        metrics: {
          ...startElement.metrics,
          width: (width + gap * 2) * scale,
          height: height * scale
        }
      };
      this.draw.getCheckboxParticle().render({
        ctx,
        x: x - gap * scale,
        y,
        index: 0,
        row: {
          ...row,
          elementList: [checkboxRowElement, ...row.elementList]
        }
      });
    } else {
      let text = '';
      if (startElement.listType === ListType.UL) {
        // Use preset cycling for UL if available
        if (startElement.listPreset) {
          text = this._getUlBulletForLevel(startElement);
        } else {
          text =
            ulStyleMapping[<UlStyle>(<unknown>startElement.listStyle)] ||
            ulStyleMapping[UlStyle.DISC];
        }
      } else {
        // OL: use preset cycling if available
        if (startElement.listPreset) {
          const olStyle = this._getOlStyleForLevel(startElement);
          text = formatOlNumber(listIndex!, olStyle);
        } else {
          text = `${listIndex! + 1}${KeyMap.PERIOD}`;
        }
      }
      if (!text) return;
      ctx.save();
      ctx.font = `${defaultSize * (96 / 72) * scale}px ${defaultFont}`;
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }
}
