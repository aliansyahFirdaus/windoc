import { ZERO } from '../../../../dataset/constant/Common';
import { ElementType } from '../../../../dataset/enum/Element';
import { CanvasEvent } from '../../CanvasEvent';

export function moveEmptySplitTdCursorToParent(
  host: CanvasEvent
): number | null {
  const draw = host.getDraw();
  const position = draw.getPosition();
  const positionContext = position.getPositionContext();
  const cursorPosition = position.getCursorPosition();
  if (!positionContext.isTable || !cursorPosition || cursorPosition.index !== 0) {
    return null;
  }
  const elementList = draw.getOriginalElementList();
  const resolved = draw.resolveTableCellContext(elementList, positionContext);
  if (!resolved) return null;
  const currentTr = resolved.element.trList?.[resolved.trIndex];
  const currentTd = resolved.td;
  if (
    !currentTr?.splitParentId ||
    currentTd.value.length !== 1 ||
    currentTd.value[0]?.value !== ZERO
  ) {
    return null;
  }
  const pagingId = resolved.element.pagingId;
  if (!pagingId) return null;
  let parentTarget:
    | {
        tableId?: string;
        tableIndex: number;
        trIndex: number;
        tdIndex: number;
      }
    | undefined;
  for (let i = resolved.index; i >= 0; i--) {
    const tableElement = elementList[i];
    if (tableElement.type !== ElementType.TABLE) continue;
    if (tableElement.pagingId !== pagingId) {
      if (i < resolved.index) break;
      continue;
    }
    const parentTrIndex =
      tableElement.trList?.findIndex(tr => tr.id === currentTr.splitParentId) ??
      -1;
    if (parentTrIndex < 0) continue;
    const parentTr = tableElement.trList![parentTrIndex];
    const parentTdIndex = parentTr.tdList.findIndex(
      td => td.colIndex === currentTd.colIndex
    );
    if (parentTdIndex < 0) return null;
    parentTarget = {
      tableId: tableElement.id,
      tableIndex: i,
      trIndex: parentTrIndex,
      tdIndex: parentTdIndex
    };
    break;
  }
  if (!parentTarget) return null;
  const parentElement = elementList[parentTarget.tableIndex];
  const parentTr = parentElement.trList![parentTarget.trIndex];
  const parentTd = parentTr.tdList[parentTarget.tdIndex];
  if (!currentTd.splitSyntheticLeadingZero) {
    currentTd.value.splice(0, 1);
    currentTd.rowList = undefined;
    currentTd.positionList = undefined;
  }
  const curIndex = Math.max(parentTd.value.length - 1, 0);
  position.setPositionContext({
    isTable: true,
    index: parentTarget.tableIndex,
    trIndex: parentTarget.trIndex,
    tdIndex: parentTarget.tdIndex,
    tdId: parentTd.id,
    trId: parentTr.id,
    tableId: parentTarget.tableId
  });
  draw.getRange().setRange(curIndex, curIndex);
  return curIndex;
}
