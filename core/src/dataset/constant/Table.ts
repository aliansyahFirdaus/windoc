import { ITableOption } from '../../interface/table/Table';

export const defaultTableOption: Readonly<Required<ITableOption>> = {
  tdPadding: [4, 5, 4, 5],
  defaultTrMinHeight: 22,
  defaultColMinWidth: 40,
  defaultBorderColor: '#000000',
  overflow: true
};
