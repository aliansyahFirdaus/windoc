const nextTick = (fn: () => void) => Promise.resolve().then(fn);
import { EDITOR_PREFIX } from '../../dataset/constant/Editor';
import { ElementType } from '../../dataset/enum/Element';
import { DeepRequired } from '../../interface/Common';
import { ICursorOption } from '../../interface/Cursor';
import { IEditorOption } from '../../interface/Editor';
import { IElementMetrics, IElementPosition } from '../../interface/Element';
import { findScrollContainer } from '../../utils';
import { isMobile } from '../../utils/ua';
import { Draw } from '../draw/Draw';
import { CanvasEvent } from '../event/CanvasEvent';
import { Position } from '../position/Position';
import { CursorAgent } from './CursorAgent';

export type IDrawCursorOption = ICursorOption & {
  isShow?: boolean;
  isBlink?: boolean;
  isFocus?: boolean;
  hitLineStartIndex?: number;
};

export interface IMoveCursorToVisibleOption {
  cursorPosition: IElementPosition;
}

export class Cursor {
  private readonly ANIMATION_CLASS = `${EDITOR_PREFIX}-cursor--animation`;

  private draw: Draw;
  private container: HTMLDivElement;
  private options: DeepRequired<IEditorOption>;
  private position: Position;
  private cursorDom: HTMLDivElement;
  private cursorAgent: CursorAgent;
  private blinkTimeout: number | null;
  private hitLineStartIndex: number | undefined;

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw;
    this.container = draw.getContainer();
    this.position = draw.getPosition();
    this.options = draw.getOptions();

    this.cursorDom = document.createElement('div');
    this.cursorDom.classList.add(`${EDITOR_PREFIX}-cursor`);
    this.container.append(this.cursorDom);
    this.cursorAgent = new CursorAgent(draw, canvasEvent);
    this.blinkTimeout = null;
  }

  public getCursorDom(): HTMLDivElement {
    return this.cursorDom;
  }

  public getAgentDom(): HTMLTextAreaElement {
    return this.cursorAgent.getAgentCursorDom();
  }

  public getAgentIsActive(): boolean {
    return this.getAgentDom() === document.activeElement;
  }

  public getAgentDomValue(): string {
    return this.getAgentDom().value;
  }

  public clearAgentDomValue() {
    this.getAgentDom().value = '';
  }

  public getHitLineStartIndex() {
    return this.hitLineStartIndex;
  }

  private _blinkStart() {
    this.cursorDom.classList.add(this.ANIMATION_CLASS);
  }

  private _blinkStop() {
    this.cursorDom.classList.remove(this.ANIMATION_CLASS);
  }

  private _setBlinkTimeout() {
    this._clearBlinkTimeout();
    this.blinkTimeout = window.setTimeout(() => {
      this._blinkStart();
    }, 500);
  }

  private _clearBlinkTimeout() {
    if (this.blinkTimeout) {
      this._blinkStop();
      window.clearTimeout(this.blinkTimeout);
      this.blinkTimeout = null;
    }
  }

  public focus() {
    if (isMobile && this.draw.isReadonly()) return;
    const agentCursorDom = this.cursorAgent.getAgentCursorDom();
    if (document.activeElement !== agentCursorDom) {
      agentCursorDom.focus({ preventScroll: true });
      // setSelectionRange dapat memicu browser-native scroll ke posisi textarea,
      // simpan dan restore scroll position supaya tidak mengganggu moveCursorToVisible
      const scrollContainer = findScrollContainer(this.container);
      const { scrollLeft, scrollTop } = scrollContainer;
      agentCursorDom.setSelectionRange(0, 0);
      scrollContainer.scroll(scrollLeft, scrollTop);
    }
  }

  public drawCursor(payload?: IDrawCursorOption) {
    let cursorPosition = this.position.getCursorPosition();
    if (!cursorPosition) return;
    const { scale, cursor } = this.options;
    const {
      color,
      width,
      isShow = true,
      isBlink = true,
      isFocus = true,
      hitLineStartIndex
    } = { ...cursor, ...payload };
    const height = this.draw.getHeight();
    const pageGap = this.draw.getPageGap();
    this.hitLineStartIndex = hitLineStartIndex;
    if (hitLineStartIndex) {
      const positionList = this.position.getPositionList();
      cursorPosition = positionList[hitLineStartIndex];
    }
    const {
      metrics,
      coordinate: { leftTop, rightTop },
      ascent,
      pageNo
    } = cursorPosition;
    const zoneManager = this.draw.getZone();
    const curPageNo = zoneManager.isMainActive()
      ? pageNo
      : this.draw.getPageNo();
    const preY = curPageNo * (height + pageGap);
    const agentCursorDom = this.cursorAgent.getAgentCursorDom();
    if (isFocus) {
      setTimeout(() => {
        this.focus();
      });
    }
    // If cursor is adjacent to an image, use default text metrics for height
    let effectiveMetrics: IElementMetrics = metrics;
    const elementList = this.draw.getElementList();
    const curIndex = cursorPosition.index;
    const curElement = elementList[curIndex];
    const nextElement = elementList[curIndex + 1];
    const isNearImage =
      (curElement && curElement.type === ElementType.IMAGE) ||
      (nextElement && nextElement.type === ElementType.IMAGE);
    const isNearSeparator = curElement?.type === ElementType.SEPARATOR;
    const isNearTab = curElement?.type === ElementType.TAB;
    if (isNearImage || isNearSeparator || isNearTab) {
      const { defaultSize, defaultFont } = this.options;
      const ctx = this.draw.getCtx();
      ctx.save();
      ctx.font = `${defaultSize * (96 / 72) * scale}px ${defaultFont}`;
      const textMetrics = ctx.measureText('M');
      ctx.restore();
      const textHeight =
        textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
      effectiveMetrics = {
        width: metrics.width,
        height: textHeight,
        boundingBoxAscent: textMetrics.fontBoundingBoxAscent,
        boundingBoxDescent: textMetrics.fontBoundingBoxDescent
      };
    }
    const cursorPadding = 2 * scale;
    const cursorHeight =
      effectiveMetrics.boundingBoxAscent +
      effectiveMetrics.boundingBoxDescent +
      cursorPadding;
    // For image: bottom of cursor aligns with bottom of image
    const cursorTop = isNearImage
      ? leftTop[1] + cursorPosition.lineHeight - cursorHeight + preY
      : isNearSeparator
        ? leftTop[1] +
          ascent -
          (effectiveMetrics.boundingBoxAscent +
            effectiveMetrics.boundingBoxDescent +
            cursorPadding) /
            2 +
          preY
        : leftTop[1] +
          ascent -
          effectiveMetrics.boundingBoxAscent -
          cursorPadding / 2 +
          preY;
    const cursorLeft = hitLineStartIndex ? leftTop[0] : rightTop[0];
    agentCursorDom.style.left = `${cursorLeft}px`;
    agentCursorDom.style.top = `${cursorTop}px`;
    if (!isShow) {
      this.recoveryCursor();
      return;
    }
    const isReadonly = this.draw.isReadonly();
    this.cursorDom.style.width = `${width * scale}px`;
    this.cursorDom.style.backgroundColor = color;
    this.cursorDom.style.left = `${cursorLeft}px`;
    this.cursorDom.style.top = `${cursorTop}px`;
    this.cursorDom.style.display = isReadonly ? 'none' : 'block';
    this.cursorDom.style.height = `${cursorHeight}px`;
    if (isBlink) {
      this._setBlinkTimeout();
    } else {
      this._clearBlinkTimeout();
    }
    nextTick(() => {
      this.moveCursorToVisible({ cursorPosition: cursorPosition! });
    });
  }

  public recoveryCursor() {
    this.cursorDom.style.display = 'none';
    this._clearBlinkTimeout();
  }

  public moveCursorToVisible(payload: IMoveCursorToVisibleOption) {
    const { cursorPosition } = payload;
    if (!cursorPosition) return;
    const {
      pageNo,
      coordinate: { leftTop },
      ascent,
      metrics: { boundingBoxAscent, boundingBoxDescent }
    } = cursorPosition;
    const containerRect = this.container.getBoundingClientRect();
    const pageOffset = pageNo * (this.draw.getHeight() + this.draw.getPageGap());
    // Cursor top and bottom in viewport coordinates
    const cursorTopViewport =
      containerRect.top + pageOffset + leftTop[1] + ascent - boundingBoxAscent;
    const cursorBottomViewport = cursorTopViewport + boundingBoxAscent + boundingBoxDescent;
    const scrollContainer = findScrollContainer(this.container);
    let visibleTop: number;
    let visibleBottom: number;
    if (scrollContainer === document.documentElement) {
      visibleTop = 0;
      visibleBottom = window.innerHeight;
    } else {
      const scrollRect = scrollContainer.getBoundingClientRect();
      visibleTop = scrollRect.top;
      visibleBottom = scrollRect.bottom;
    }
    // Cursor already visible — do not scroll
    if (cursorTopViewport >= visibleTop && cursorBottomViewport <= visibleBottom) {
      return;
    }
    // Extra breathing room so cursor doesn't land flush against the edge,
    // same value for top and bottom (one line of context)
    const scrollPadding =
      (boundingBoxAscent + boundingBoxDescent) * this.options.scrollPaddingLines;
    const { scrollLeft, scrollTop } = scrollContainer;
    if (cursorTopViewport < visibleTop) {
      // Cursor above viewport — scroll up, land with padding below top edge
      scrollContainer.scroll(
        scrollLeft,
        scrollTop - (visibleTop - cursorTopViewport) - scrollPadding
      );
    } else {
      // Cursor below viewport — scroll down, land with padding above bottom edge
      scrollContainer.scroll(
        scrollLeft,
        scrollTop + (cursorBottomViewport - visibleBottom) + scrollPadding
      );
    }
  }
}
