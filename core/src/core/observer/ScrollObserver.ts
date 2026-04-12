import { IEditorOption } from '../../interface/Editor';
import { debounce } from '../../utils';
import { Draw } from '../draw/Draw';

export interface IElementVisibleInfo {
  intersectionHeight: number;
}

export interface IPageVisibleInfo {
  intersectionPageNo: number;
  visiblePageNoList: number[];
}

export class ScrollObserver {
  private draw: Draw;
  private options: Required<IEditorOption>;
  private scrollContainer: Element | Document;

  constructor(draw: Draw) {
    this.draw = draw;
    this.options = draw.getOptions();
    this.scrollContainer = this.getScrollContainer();
    setTimeout(() => {
      if (!window.scrollY) {
        this._observer();
      }
    });
    this._addEvent();
  }

  public getScrollContainer(): Element | Document {
    return this.options.scrollContainerSelector
      ? document.querySelector(this.options.scrollContainerSelector) || document
      : document;
  }

  private _addEvent() {
    this.scrollContainer.addEventListener('scroll', this._observer);
  }

  public removeEvent() {
    this.scrollContainer.removeEventListener('scroll', this._observer);
  }

  public getElementVisibleInfo(element: Element): IElementVisibleInfo {
    const rect = element.getBoundingClientRect();
    let topBound: number;
    let bottomBound: number;
    if (this.scrollContainer === document) {
      topBound = 0;
      bottomBound = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight
      );
    } else {
      const containerRect = (<Element>(
        this.scrollContainer
      )).getBoundingClientRect();
      topBound = containerRect.top;
      bottomBound = containerRect.bottom;
    }
    const visibleHeight =
      Math.min(rect.bottom, bottomBound) - Math.max(rect.top, topBound);
    return {
      intersectionHeight: visibleHeight > 0 ? visibleHeight : 0
    };
  }

  public getPageVisibleInfo(): IPageVisibleInfo {
    const pageList = this.draw.getPageList();
    const visiblePageNoList: number[] = [];
    let intersectionPageNo = 0;
    let intersectionMaxHeight = 0;
    for (let i = 0; i < pageList.length; i++) {
      const curPage = pageList[i];
      const { intersectionHeight } = this.getElementVisibleInfo(curPage);
      if (intersectionMaxHeight && !intersectionHeight) break;
      if (intersectionHeight) {
        visiblePageNoList.push(i);
      }
      if (intersectionHeight > intersectionMaxHeight) {
        intersectionMaxHeight = intersectionHeight;
        intersectionPageNo = i;
      }
    }
    return {
      intersectionPageNo,
      visiblePageNoList
    };
  }

  private _observer = debounce(() => {
    const { intersectionPageNo, visiblePageNoList } = this.getPageVisibleInfo();
    this.draw.setIntersectionPageNo(intersectionPageNo);
    this.draw.setVisiblePageNoList(visiblePageNoList);
    this.draw.renderVisiblePages(visiblePageNoList);
  }, 150);
}
