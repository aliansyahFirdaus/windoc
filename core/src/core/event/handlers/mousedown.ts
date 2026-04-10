import { ImageDisplay } from '../../../dataset/enum/Common';
import { EditorMode } from '../../../dataset/enum/Editor';
import { ElementType } from '../../../dataset/enum/Element';
import { MouseEventButton } from '../../../dataset/enum/Event';
import { ControlComponent } from '../../../dataset/enum/Control';
import { ControlType } from '../../../dataset/enum/Control';
import { IPreviewerDrawOption } from '../../../interface/Previewer';
import { deepClone } from '../../../utils';
import { isMod } from '../../../utils/hotkey';
import { CheckboxControl } from '../../draw/control/checkbox/CheckboxControl';
import { RadioControl } from '../../draw/control/radio/RadioControl';
import { CanvasEvent } from '../CanvasEvent';
import { IElement } from '../../../interface/Element';
import { Draw } from '../../draw/Draw';
import { getSplitCellPointer } from './splitCell';

export function setRangeCache(host: CanvasEvent) {
  const draw = host.getDraw();
  const position = draw.getPosition();
  const rangeManager = draw.getRange();
  host.isAllowDrag = true;
  host.cacheRange = deepClone(rangeManager.getRange());
  host.cacheElementList = draw.getElementList();
  host.cachePositionList = position.getPositionList();
  host.cachePositionContext = position.getPositionContext();
}

export function hitCheckbox(element: IElement, draw: Draw) {
  const { checkbox, control } = element;
  if (!control) {
    draw.getCheckboxParticle().setSelect(element);
  } else {
    const codes = control?.code ? control.code.split(',') : [];
    if (checkbox?.value) {
      const codeIndex = codes.findIndex(c => c === checkbox.code);
      codes.splice(codeIndex, 1);
    } else {
      if (checkbox?.code) {
        codes.push(checkbox.code);
      }
    }
    const activeControl = draw.getControl().getActiveControl();
    if (activeControl instanceof CheckboxControl) {
      activeControl.setSelect(codes);
    }
  }
}

export function hitRadio(element: IElement, draw: Draw) {
  const { radio, control } = element;
  if (!control) {
    draw.getRadioParticle().setSelect(element);
  } else {
    const codes = radio?.code ? [radio.code] : [];
    const activeControl = draw.getControl().getActiveControl();
    if (activeControl instanceof RadioControl) {
      activeControl.setSelect(codes);
    }
  }
}

export function mousedown(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw();
  let isReadonly = draw.isReadonly();
  const rangeManager = draw.getRange();
  const position = draw.getPosition();
  const range = rangeManager.getRange();
  if (
    evt.button === MouseEventButton.RIGHT &&
    (range.isCrossRowCol || !rangeManager.getIsCollapsed())
  ) {
    return;
  }
  if (!host.isAllowDrag) {
    if (!isReadonly && range.startIndex !== range.endIndex) {
      const isPointInRange = rangeManager.getIsPointInRange(
        evt.offsetX,
        evt.offsetY
      );
      if (isPointInRange) {
        setRangeCache(host);
        return;
      }
    }
  }
  const target = evt.target as HTMLDivElement;
  const pageIndex = target.dataset.index;
  if (pageIndex) {
    draw.setPageNo(Number(pageIndex));
  }
  host.isAllowSelection = true;
  const oldPositionContext = deepClone(position.getPositionContext());
  const positionResult = position.adjustPositionContext({
    x: evt.offsetX,
    y: evt.offsetY
  });
  if (!positionResult) return;
  const {
    index,
    isDirectHit,
    isCheckbox,
    isRadio,
    isImage,
    isLabel,
    isTable,
    tdValueIndex,
    hitLineStartIndex
  } = positionResult;
  const splitCellPointer = getSplitCellPointer(draw, positionResult);
  host.mouseDownStartPosition = {
    ...positionResult,
    index: splitCellPointer
      ? splitCellPointer.globalIndex
      : isTable
        ? tdValueIndex!
        : index,
    splitCellSelection: splitCellPointer?.splitCellSelection,
    x: evt.offsetX,
    y: evt.offsetY
  };
  const elementList = draw.getElementList();
  const positionList = position.getPositionList();
  const curIndex = isTable ? tdValueIndex! : index;
  const curElement = elementList[curIndex];
  const isDirectHitImage = !!(isDirectHit && isImage);
  const isDirectHitCheckbox = !!(isDirectHit && isCheckbox);
  const isDirectHitRadio = !!(isDirectHit && isRadio);
  const isDirectHitLabel = !!(isDirectHit && isLabel);
  if (~index) {
    let startIndex = curIndex;
    let endIndex = curIndex;
    if (evt.shiftKey) {
      const { startIndex: oldStartIndex } = rangeManager.getRange();
      if (~oldStartIndex) {
        const newPositionContext = position.getPositionContext();
        if (newPositionContext.tdId === oldPositionContext.tdId) {
          if (curIndex > oldStartIndex) {
            startIndex = oldStartIndex;
          } else {
            endIndex = oldStartIndex;
          }
        }
      }
    }
    rangeManager.setRange(startIndex, endIndex);
    position.setCursorPosition(positionList[curIndex]);
    isReadonly = draw.isReadonly();
    if (isDirectHitCheckbox && !isReadonly) {
      hitCheckbox(curElement, draw);
    } else if (isDirectHitRadio && !isReadonly) {
      hitRadio(curElement, draw);
    } else if (
      curElement.controlComponent === ControlComponent.VALUE &&
      (curElement.control?.type === ControlType.CHECKBOX ||
        curElement.control?.type === ControlType.RADIO)
    ) {
      let preIndex = curIndex;
      while (preIndex > 0) {
        const preElement = elementList[preIndex];
        if (preElement.controlComponent === ControlComponent.CHECKBOX) {
          hitCheckbox(preElement, draw);
          break;
        } else if (preElement.controlComponent === ControlComponent.RADIO) {
          hitRadio(preElement, draw);
          break;
        }
        preIndex--;
      }
    } else {
      draw.render({
        curIndex,
        isCompute: false,
        isSubmitHistory: false,
        isSetCursor:
          !isDirectHitImage && !isDirectHitCheckbox && !isDirectHitRadio
      });
    }
    if (hitLineStartIndex) {
      host.getDraw().getCursor().drawCursor({
        hitLineStartIndex
      });
    }
  }
  const eventBus = draw.getEventBus();
  if (isDirectHitLabel && eventBus.isSubscribe('labelMousedown')) {
    eventBus.emit('labelMousedown', {
      evt,
      element: curElement,
      position: positionList[curIndex],
      scale: draw.getOptions().scale
    });
  }
  const previewer = draw.getPreviewer();
  previewer.clearResizer();
  if (isDirectHitImage) {
    const previewerDrawOption: IPreviewerDrawOption = {
      dragDisable:
        isReadonly ||
        (!curElement.controlId && draw.getMode() === EditorMode.FORM)
    };
    if (curElement.type === ElementType.LATEX) {
      previewerDrawOption.mime = 'svg';
      previewerDrawOption.srcKey = 'laTexSVG';
    }
    previewer.drawResizer(
      curElement,
      positionList[curIndex],
      previewerDrawOption
    );
    draw.getCursor().drawCursor({
      isShow: false
    });
    setRangeCache(host);
    if (
      curElement.imgDisplay === ImageDisplay.SURROUND ||
      curElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
      curElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
    ) {
      draw.getImageParticle().createFloatImage(curElement);
    }
    if (eventBus.isSubscribe('imageMousedown')) {
      eventBus.emit('imageMousedown', {
        evt,
        element: curElement
      });
    }
  }
  const tableTool = draw.getTableTool();
  tableTool.dispose();
  if (isTable && !isReadonly && draw.getMode() !== EditorMode.FORM) {
    tableTool.render();
  }
  const hyperlinkParticle = draw.getHyperlinkParticle();
  hyperlinkParticle.clearHyperlinkPopup();
  if (curElement.type === ElementType.HYPERLINK) {
    if (isMod(evt)) {
      hyperlinkParticle.openHyperlink(curElement);
    } else {
      hyperlinkParticle.drawHyperlinkPopup(curElement, positionList[curIndex]);
    }
  }
  const dateParticle = draw.getDateParticle();
  dateParticle.clearDatePicker();
  if (curElement.type === ElementType.DATE && !isReadonly) {
    dateParticle.renderDatePicker(curElement, positionList[curIndex]);
  }
}
