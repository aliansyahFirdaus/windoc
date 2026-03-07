export enum ListType {
  UL = 'ul',
  OL = 'ol'
}

export enum UlStyle {
  DISC = 'disc',
  CIRCLE = 'circle',
  SQUARE = 'square',
  CHECKBOX = 'checkbox'
}

export enum OlStyle {
  DECIMAL = 'decimal',
  LOWER_ALPHA = 'lowerAlpha',
  UPPER_ALPHA = 'upperAlpha',
  LOWER_ROMAN = 'lowerRoman',
  UPPER_ROMAN = 'upperRoman',
  DECIMAL_PAREN = 'decimalParen'
}

export enum ListStyle {
  DISC = UlStyle.DISC,
  CIRCLE = UlStyle.CIRCLE,
  SQUARE = UlStyle.SQUARE,
  DECIMAL = OlStyle.DECIMAL,
  CHECKBOX = UlStyle.CHECKBOX
}

export enum OlPreset {
  DEFAULT = 'olDefault',
  PARENTHESIS = 'olParen',
  OUTLINE = 'olOutline',
  UPPER_ALPHA = 'olUpperA',
  ROMAN = 'olRoman',
  ZERO_PAD = 'olZeroPad'
}

export enum UlPreset {
  DEFAULT = 'ulDefault',
  DIAMOND = 'ulDiamond',
  HOLLOW_SQ = 'ulHollowSq',
  ARROW = 'ulArrow',
  STAR = 'ulStar',
  CHECK_ARROW = 'ulCheckArr'
}
