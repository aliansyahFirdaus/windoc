import { EDITOR_PREFIX } from '../../dataset/constant/Editor';
import { EditorZone } from '../../dataset/enum/Editor';
import { throttle } from '../../utils';
import { Draw } from '../draw/Draw';
import { I18n } from '../i18n/I18n';
import { Zone } from './Zone';

export class ZoneTip {
  private draw: Draw;
  private zone: Zone;
  private i18n: I18n;
  private container: HTMLDivElement;
  private pageContainer: HTMLDivElement;

  private isDisableMouseMove: boolean;
  private tipContainer: HTMLDivElement;
  private tipContent: HTMLSpanElement;
  private currentMoveZone: EditorZone | undefined;

  constructor(draw: Draw, zone: Zone) {
    this.draw = draw;
    this.zone = zone;
    this.i18n = draw.getI18n();
    this.container = draw.getContainer();
    this.pageContainer = draw.getPageContainer();

    const { tipContainer, tipContent } = this._drawZoneTip();
    this.tipContainer = tipContainer;
    this.tipContent = tipContent;
    this.isDisableMouseMove = true;
    this.currentMoveZone = EditorZone.MAIN;
    // Always watch both zones so tooltip works even after toggle
    const watchZones: EditorZone[] = [EditorZone.HEADER, EditorZone.FOOTER];
    this._watchMouseMoveZoneChange(watchZones);
  }

  private _watchMouseMoveZoneChange(watchZones: EditorZone[]) {
    this.pageContainer.addEventListener(
      'mousemove',
      throttle((evt: MouseEvent) => {
        if (this.isDisableMouseMove || !this.draw.getIsPagingMode()) return;
        if (!evt.offsetY) return;
        if (evt.target instanceof HTMLCanvasElement) {
          const mousemoveZone = this.zone.getZoneByY(evt.offsetY);
          if (!watchZones.includes(mousemoveZone)) {
            this._updateZoneTip(false);
            return;
          }
          this.currentMoveZone = mousemoveZone;
          this._updateZoneTip(
            this.zone.getZone() === EditorZone.MAIN &&
              (mousemoveZone === EditorZone.HEADER ||
                mousemoveZone === EditorZone.FOOTER),
            evt.x,
            evt.y
          );
        } else {
          this._updateZoneTip(false);
        }
      }, 250)
    );
    this.pageContainer.addEventListener('mouseenter', () => {
      this.isDisableMouseMove = false;
    });
    this.pageContainer.addEventListener('mouseleave', () => {
      this.isDisableMouseMove = true;
      this._updateZoneTip(false);
    });
  }

  private _drawZoneTip() {
    const tipContainer = document.createElement('div');
    tipContainer.classList.add(`${EDITOR_PREFIX}-zone-tip`);
    const tipContent = document.createElement('span');
    tipContainer.append(tipContent);
    this.container.append(tipContainer);
    return {
      tipContainer,
      tipContent
    };
  }

  private _updateZoneTip(visible: boolean, left?: number, top?: number) {
    if (visible) {
      this.tipContainer.classList.add('show');
      this.tipContainer.style.left = `${left}px`;
      this.tipContainer.style.top = `${top}px`;
      const options = this.draw.getOptions();
      const isHeader = this.currentMoveZone === EditorZone.HEADER;
      const isDisabled = isHeader
        ? options.header.disabled
        : options.footer.disabled;
      if (isDisabled) {
        this.tipContent.innerText = `Double click to add ${
          isHeader ? 'header' : 'footer'
        }`;
      } else {
        this.tipContent.innerText = this.i18n.t(
          `zone.${isHeader ? 'headerTip' : 'footerTip'}`
        );
      }
    } else {
      this.tipContainer.classList.remove('show');
    }
  }
}
