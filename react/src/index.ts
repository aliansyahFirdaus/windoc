// Main component
export { Editor } from './Editor'

// Contexts & hooks
export { EditorProvider, useEditor } from './EditorContext'
export { FooterProvider, useFooter } from './FooterContext'

// Prebuilt composable components
export { default as EditorToolbar } from './EditorToolbar'
export { default as EditorFooter } from './EditorFooter'

// Individual toolbar tools
export { default as UndoTool } from './toolbar/UndoTool'
export { default as RedoTool } from './toolbar/RedoTool'
export { default as BoldTool } from './toolbar/BoldTool'
export { default as ItalicTool } from './toolbar/ItalicTool'
export { default as UnderlineTool } from './toolbar/UnderlineTool'
export { default as StrikeoutTool } from './toolbar/StrikeoutTool'
export { default as ColorTool } from './toolbar/ColorTool'
export { default as HighlightTool } from './toolbar/HighlightTool'
export { default as FontTool } from './toolbar/FontTool'
export { default as FontSizeTool } from './toolbar/FontSizeTool'
export { default as TitleTool } from './toolbar/TitleTool'
export { default as LineHeightTool } from './toolbar/LineHeightTool'
export { default as LeftAlignTool } from './toolbar/LeftAlignTool'
export { default as CenterAlignTool } from './toolbar/CenterAlignTool'
export { default as RightAlignTool } from './toolbar/RightAlignTool'
export { default as JustifyTool } from './toolbar/JustifyTool'
export { default as ListTool } from './toolbar/ListTool'
export { default as TableTool } from './toolbar/TableTool'
export { default as ImageTool } from './toolbar/ImageTool'
export { default as ColumnTool } from './toolbar/ColumnTool'
export { default as SeparatorTool } from './toolbar/SeparatorTool'
export { default as PageBreakTool } from './toolbar/PageBreakTool'
export { default as WatermarkTool } from './toolbar/WatermarkTool'

// Individual footer tools
export { default as CatalogToggleTool } from './footer/CatalogToggleTool'
export { default as PageModeTool } from './footer/PageModeTool'
export { default as FooterStatus } from './footer/FooterStatus'
export { default as EditorModeTool } from './footer/EditorModeTool'
export { default as PageScaleMinusTool } from './footer/PageScaleMinusTool'
export { default as PageScalePercentageTool } from './footer/PageScalePercentageTool'
export { default as PageScaleAddTool } from './footer/PageScaleAddTool'
export { default as PaperSizeTool } from './footer/PaperSizeTool'
export { default as PaperDirectionTool } from './footer/PaperDirectionTool'
export { default as PaperMarginTool } from './footer/PaperMarginTool'
export { default as FullscreenTool } from './footer/FullscreenTool'
export { default as EditorOptionTool } from './footer/EditorOptionTool'
export { default as WatermarkFooterTool } from './footer/WatermarkFooterTool'

// Types
export type { EditorInstance, RangeStylePayload, ICatalogItem, IComment } from './types'
