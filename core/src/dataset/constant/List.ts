import { ListStyle, ListType, OlPreset, UlPreset, UlStyle } from '../enum/List';

export const ulStyleMapping: Record<UlStyle, string> = {
  [UlStyle.DISC]: '•',
  [UlStyle.CIRCLE]: '◦',
  [UlStyle.SQUARE]: '▫︎',
  [UlStyle.CHECKBOX]: '☑️'
};

export const listTypeElementMapping: Record<ListType, string> = {
  [ListType.OL]: 'ol',
  [ListType.UL]: 'ul'
};

export const listStyleCSSMapping: Record<ListStyle, string> = {
  [ListStyle.DISC]: 'disc',
  [ListStyle.CIRCLE]: 'circle',
  [ListStyle.SQUARE]: 'square',
  [ListStyle.DECIMAL]: 'decimal',
  [ListStyle.CHECKBOX]: 'checkbox'
};

// OL preset cycling: level % 3 → style key
export const olPresetCycles: Record<string, string[]> = {
  [OlPreset.DEFAULT]: ['decimal', 'lowerAlpha', 'lowerRoman'],
  [OlPreset.PARENTHESIS]: [
    'decimalParen',
    'lowerAlphaParen',
    'lowerRomanParen'
  ],
  [OlPreset.OUTLINE]: ['outline', 'outline', 'outline'],
  [OlPreset.UPPER_ALPHA]: ['upperAlpha', 'lowerAlpha', 'lowerRoman'],
  [OlPreset.ROMAN]: ['upperRoman', 'upperAlpha', 'decimal'],
  [OlPreset.ZERO_PAD]: ['decimalZero', 'lowerAlpha', 'lowerRoman']
};

// UL preset cycling: level % 3 → bullet character
export const ulPresetCycles: Record<string, string[]> = {
  [UlPreset.DEFAULT]: ['●', '○', '■'],
  [UlPreset.DIAMOND]: ['◆', '➤', '■'],
  [UlPreset.HOLLOW_SQ]: ['□', '□', '□'],
  [UlPreset.ARROW]: ['→', '◆', '●'],
  [UlPreset.STAR]: ['★', '○', '■'],
  [UlPreset.CHECK_ARROW]: ['➤', '○', '■']
};

export const INDENT_PER_LEVEL = 20;
export const MAX_LIST_LEVEL = 8;
