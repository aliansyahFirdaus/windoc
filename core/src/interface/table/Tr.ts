import { ITd } from './Td';

export interface ITr {
  id?: string;
  extension?: unknown;
  externalId?: string;
  height: number;
  tdList: ITd[];
  minHeight?: number;
  pagingRepeat?: boolean;
  splitParentId?: string;
  splitRootId?: string;
  splitLevel?: number;
  splitBoundaryTop?: boolean;
  splitBoundaryBottom?: boolean;
}
