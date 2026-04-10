import { ZERO } from '../../../dataset/constant/Common';
import { ElementType } from '../../../dataset/enum/Element';
import { ICurrentPosition } from '../../../interface/Position';
import { ISplitCellSelection } from '../../../interface/Range';
import { Draw } from '../../draw/Draw';

function isSameSplitCellSelection(
  first?: ISplitCellSelection,
  second?: ISplitCellSelection
) {
  if (!first || !second) return false;
  return (
    first.pagingId === second.pagingId &&
    first.rootTrId === second.rootTrId &&
    first.colIndex === second.colIndex
  );
}

export function getSplitCellPointer(
  draw: Draw,
  position: ICurrentPosition
): {
  splitCellSelection: ISplitCellSelection;
  globalIndex: number;
} | null {
  if (
    !position.isTable ||
    position.index === undefined ||
    position.tdIndex === undefined ||
    position.tdValueIndex === undefined ||
    !position.trId
  ) {
    return null;
  }
  const originalElementList = draw.getOriginalElementList();
  const tableElement = originalElementList[position.index];
  if (
    tableElement?.type !== ElementType.TABLE ||
    !tableElement.pagingId ||
    !tableElement.trList?.length
  ) {
    return null;
  }
  const tr = tableElement.trList.find(row => row.id === position.trId);
  const td = tr?.tdList[position.tdIndex];
  if (!tr || !td || td.colIndex === undefined || !tr.id) {
    return null;
  }
  const splitCellSelection: ISplitCellSelection = {
    pagingId: tableElement.pagingId,
    rootTrId: tr.splitRootId || tr.id,
    colIndex: td.colIndex
  };
  const splitCellContext = draw.getSplitCellSelectionContext(
    originalElementList,
    splitCellSelection
  );
  if (!splitCellContext) {
    return null;
  }
  let globalIndex = 0;
  for (let c = 0; c < splitCellContext.cellContextList.length; c++) {
    const cellContext = splitCellContext.cellContextList[c];
    const currentTd = cellContext.td;
    const skipLeadingZero =
      !!currentTd.splitSyntheticLeadingZero &&
      currentTd.value[0]?.value === ZERO
        ? 1
        : 0;
    if (cellContext.tr.id === tr.id && currentTd.id === td.id) {
      globalIndex += Math.max(position.tdValueIndex - skipLeadingZero, 0);
      return {
        splitCellSelection,
        globalIndex
      };
    }
    globalIndex += Math.max(currentTd.value.length - skipLeadingZero, 0);
  }
  return null;
}

export function isSameSplitCellPointer(
  first?: ISplitCellSelection,
  second?: ISplitCellSelection
) {
  return isSameSplitCellSelection(first, second);
}
