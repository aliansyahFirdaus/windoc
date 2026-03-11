import { ICursorOption } from '../../interface/Cursor';

export const CURSOR_AGENT_OFFSET_HEIGHT = 12;

export const defaultCursorOption: Readonly<Required<ICursorOption>> = {
  width: 2,
  color: '#000000',
  dragWidth: 2,
  dragColor: '#0000FF',
  dragFloatImageDisabled: false
};
