import { version } from '../../version'
import { Draw } from '../draw/Draw'
import { ICatalog, ICatalogItem } from '../../interface/Catalog'
import { IEditorResult, IEditorData } from '../../interface/Editor'
import { IGetValueOption } from '../../interface/Draw'
import { IElement, IElementPosition } from '../../interface/Element'
import { deepClone } from '../../utils'
import { zipElementList } from '../../utils/element'

// Local enums for worker functions (to avoid import issues)
enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  SEPARATOR = 'separator',
  PAGE_BREAK = 'pageBreak',
  CONTROL = 'control',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  LATEX = 'latex',
  TAB = 'tab',
  DATE = 'date',
  BLOCK = 'block',
  TITLE = 'title',
  AREA = 'area',
  LIST = 'list',
  LABEL = 'label',
  COLUMN_BREAK = 'columnBreak'
}

enum ControlComponent {
  VALUE = 'value'
}

enum TitleLevel {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FOURTH = 'fourth',
  FIFTH = 'fifth',
  SIXTH = 'sixth'
}

const titleOrderNumberMapping: Record<TitleLevel, number> = {
  [TitleLevel.FIRST]: 1,
  [TitleLevel.SECOND]: 2,
  [TitleLevel.THIRD]: 3,
  [TitleLevel.FOURTH]: 4,
  [TitleLevel.FIFTH]: 5,
  [TitleLevel.SIXTH]: 6
}

const TEXTLIKE_ELEMENT_TYPE: ElementType[] = [
  ElementType.TEXT,
  ElementType.HYPERLINK,
  ElementType.SUBSCRIPT,
  ElementType.SUPERSCRIPT,
  ElementType.CONTROL,
  ElementType.DATE,
  ElementType.LABEL
]

const ZERO = '\u200B'
const WRAP = '\n'

// Word count helper functions
function pickText(elementList: IElement[]): string {
  let text = ''
  let e = 0
  while (e < elementList.length) {
    const element = elementList[e]
    if (element.type === ElementType.TABLE) {
      if (element.trList) {
        for (let t = 0; t < element.trList.length; t++) {
          const tr = element.trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            text += pickText(td.value)
          }
        }
      }
    } else if (element.type === ElementType.HYPERLINK) {
      const hyperlinkId = element.hyperlinkId
      const valueList: IElement[] = []
      while (e < elementList.length) {
        const hyperlinkE = elementList[e]
        if (hyperlinkId !== hyperlinkE.hyperlinkId) {
          e--
          break
        }
        delete hyperlinkE.type
        valueList.push(hyperlinkE)
        e++
      }
      text += pickText(valueList)
    } else if (element.controlId) {
      if (!element.control?.hide) {
        const controlId = element.controlId
        const valueList: IElement[] = []
        while (e < elementList.length) {
          const controlE = elementList[e]
          if (controlId !== controlE.controlId) {
            e--
            break
          }
          if (controlE.controlComponent === ControlComponent.VALUE) {
            delete controlE.controlId
            valueList.push(controlE)
          }
          e++
        }
        text += pickText(valueList)
      }
    } else if (
      (!element.type || element.type === ElementType.TEXT) &&
      !element.area?.hide
    ) {
      text += element.value
    }
    e++
  }
  return text
}

function groupText(text: string): string[] {
  const characterList: string[] = []
  const numberReg = /[0-9]/
  const letterReg = /[A-Za-z]/
  const blankReg = /\s/
  let isPreLetter = false
  let isPreNumber = false
  let compositionText = ''
  function pushCompositionText() {
    if (compositionText) {
      characterList.push(compositionText)
      compositionText = ''
    }
  }
  for (const t of text) {
    if (letterReg.test(t)) {
      if (!isPreLetter) {
        pushCompositionText()
      }
      compositionText += t
      isPreLetter = true
      isPreNumber = false
    } else if (numberReg.test(t)) {
      if (!isPreNumber) {
        pushCompositionText()
      }
      compositionText += t
      isPreLetter = false
      isPreNumber = true
    } else {
      pushCompositionText()
      isPreLetter = false
      isPreNumber = false
      if (!blankReg.test(t)) {
        characterList.push(t)
      }
    }
  }
  pushCompositionText()
  return characterList
}

function computeWordCount(elementList: IElement[]): number {
  const originText = pickText(elementList)
  const filterText = originText
    .replace(new RegExp(`^${ZERO}`), '')
    .replace(new RegExp(ZERO, 'g'), WRAP)
  const textGroup = groupText(filterText)
  return textGroup.length
}

// Catalog helper functions
type ICatalogElement = IElement & {
  pageNo: number
}

function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type as ElementType)
}

function computeCatalog(elementList: IElement[], positionList: IElementPosition[]): ICatalog | null {
  const titleElementList: ICatalogElement[] = []
  let t = 0
  while (t < elementList.length) {
    const element = elementList[t]
    const getElementInfo = (
      element: IElement,
      list: IElement[],
      position: number
    ) => {
      const titleId = element.titleId
      const level = element.level
      const titleElement: ICatalogElement = {
        type: ElementType.TITLE,
        value: '',
        level,
        titleId,
        pageNo: positionList[t]?.pageNo || 1
      }
      const valueList: IElement[] = []
      while (position < list.length) {
        const titleE = list[position]
        if (titleId !== titleE.titleId) {
          position--
          break
        }
        valueList.push(titleE)
        position++
      }
      titleElement.value = valueList
        .filter(el => isTextLikeElement(el))
        .map(el => el.value)
        .join('')
        .replace(new RegExp(ZERO, 'g'), '')
      return { position, titleElement }
    }
    if (element.titleId) {
      const { position, titleElement } = getElementInfo(element, elementList, t)
      t = position
      titleElementList.push(titleElement)
    }
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      for (let r = 0; r < trList.length; r++) {
        const tr = trList[r]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          const value = td.value
          if (value.length > 1) {
            let index = 1
            while (index < value.length) {
              if (value[index]?.titleId) {
                const { titleElement, position } = getElementInfo(
                  value[index],
                  value,
                  index
                )
                titleElementList.push(titleElement)
                index = position
              }
              index++
            }
          }
        }
      }
    }
    t++
  }
  if (!titleElementList.length) return null
  const recursiveInsert = (
    title: ICatalogElement,
    catalogItem: ICatalogItem
  ) => {
    const subCatalogItem =
      catalogItem.subCatalog[catalogItem.subCatalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[subCatalogItem?.level as TitleLevel]
    const titleLevel = titleOrderNumberMapping[title.level as TitleLevel]
    if (subCatalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, subCatalogItem)
    } else {
      catalogItem.subCatalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  const catalog: ICatalog = []
  for (let e = 0; e < titleElementList.length; e++) {
    const title = titleElementList[e]
    const catalogItem = catalog[catalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[catalogItem?.level as TitleLevel]
    const titleLevel = titleOrderNumberMapping[title.level as TitleLevel]
    if (catalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, catalogItem)
    } else {
      catalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        pageNo: title.pageNo,
        subCatalog: []
      })
    }
  }
  return catalog
}

// Group IDs helper function
function computeGroupIds(elementList: IElement[]): string[] {
  const groupIds: string[] = []
  for (const element of elementList) {
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      for (let r = 0; r < trList.length; r++) {
        const tr = trList[r]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          groupIds.push(...computeGroupIds(td.value))
        }
      }
    }
    if (!element.groupIds) continue
    for (const groupId of element.groupIds) {
      if (!groupIds.includes(groupId)) {
        groupIds.push(groupId)
      }
    }
  }
  return groupIds
}

// Value helper function
function computeValue(data: Required<IEditorData>, options?: IGetValueOption): IEditorData {
  const { extraPickAttrs = [] } = options || {}

  return {
    header: zipElementList(data.header, {
      extraPickAttrs,
      isClone: false
    }),
    main: zipElementList(data.main, {
      extraPickAttrs,
      isClassifyArea: true,
      isClone: false
    }),
    footer: zipElementList(data.footer, {
      extraPickAttrs,
      isClone: false
    })
  }
}

export class WorkerManager {
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  public getWordCount(): Promise<number> {
    return new Promise((resolve) => {
      const elementList = this.draw.getOriginalMainElementList()
      const count = computeWordCount(elementList)
      resolve(count)
    })
  }

  public getCatalog(): Promise<ICatalog | null> {
    return new Promise((resolve) => {
      const elementList = this.draw.getOriginalMainElementList()
      const positionList = this.draw.getPosition().getOriginalMainPositionList()
      const catalog = computeCatalog(elementList, positionList)
      resolve(catalog)
    })
  }

  public getGroupIds(): Promise<string[]> {
    return new Promise((resolve) => {
      const elementList = this.draw.getOriginalMainElementList()
      const groupIds = computeGroupIds(elementList)
      resolve(groupIds)
    })
  }

  public getValue(options?: IGetValueOption): Promise<IEditorResult> {
    return new Promise((resolve) => {
      const data = this.draw.getOriginValue(options) as Required<IEditorData>
      const editorData = computeValue(data, options)
      resolve({
        version,
        data: editorData,
        options: deepClone(this.draw.getOptions())
      })
    })
  }
}
