import { useEffect, useRef } from 'react';
import { useEditor } from './EditorContext';
import UndoTool from './toolbar/UndoTool';
import RedoTool from './toolbar/RedoTool';
import TableCellBgColorTool from './toolbar/TableCellBgColorTool';
import TableCellBorderColorTool from './toolbar/TableCellBorderColorTool';
// import PainterTool from "./toolbar/PainterTool";
// import ClearFormatTool from "./toolbar/ClearFormatTool";
import ColumnTool from './toolbar/ColumnTool';
import TableTool from './toolbar/TableTool';
import TitleTool from './toolbar/TitleTool';
import FontTool from './toolbar/FontTool';
import FontSizeTool from './toolbar/FontSizeTool';
import LineHeightTool from './toolbar/LineHeightTool';
// import SizeAddTool from "./toolbar/SizeAddTool";
// import SizeMinusTool from "./toolbar/SizeMinusTool";
import ColorTool from './toolbar/ColorTool';
import HighlightTool from './toolbar/HighlightTool';
import BoldTool from './toolbar/BoldTool';
import ItalicTool from './toolbar/ItalicTool';
import UnderlineTool from './toolbar/UnderlineTool';
import StrikeoutTool from './toolbar/StrikeoutTool';
// import SuperscriptTool from "./toolbar/SuperscriptTool";
// import SubscriptTool from "./toolbar/SubscriptTool";
import LeftAlignTool from './toolbar/LeftAlignTool';
import CenterAlignTool from './toolbar/CenterAlignTool';
import RightAlignTool from './toolbar/RightAlignTool';
import JustifyTool from './toolbar/JustifyTool';
// import AlignmentTool from "./toolbar/AlignmentTool";
// import RowMarginTool from "./toolbar/RowMarginTool";
import ListTool from './toolbar/ListTool';
import ImageTool from './toolbar/ImageTool';
import ExportDocxTool from './toolbar/ExportDocxTool';
// import HyperlinkTool from "./toolbar/HyperlinkTool";
import SeparatorTool from './toolbar/SeparatorTool';
import InsertElementTool from './toolbar/WatermarkTool';
// import CodeBlockTool from "./toolbar/CodeBlockTool";
import PageBreakTool from './toolbar/PageBreakTool';
// import ControlTool from "./toolbar/ControlTool";
// import CheckboxTool from "./toolbar/CheckboxTool";
// import RadioTool from "./toolbar/RadioTool";
// import LaTeXTool from "./toolbar/LaTeXTool";
// import DateTool from "./toolbar/DateTool";
// import BlockTool from "./toolbar/BlockTool";
// import SearchTool from "./toolbar/SearchTool";
// import PrintTool from "./toolbar/PrintTool";

export default function EditorToolbar() {
  const { isInTable } = useEditor();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        const target = mutation.target as HTMLElement;
        if (!target.classList.contains('options')) return;
        if (!target.classList.contains('visible')) {
          target.style.left = '';
          target.style.right = '';
          return;
        }
        target.style.left = '0';
        target.style.right = '';
        const rect = target.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          target.style.left = 'auto';
          target.style.right = '0';
        }
      });
    });
    observer.observe(menu, { subtree: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="menu" editor-component="menu" ref={menuRef}>
      {/* Undo/Redo */}
      <div className="menu-item">
        <UndoTool />
        <RedoTool />
      </div>
      <div className="menu-divider"></div>

      {/* Column Layout */}
      <div className="menu-item">
        <ColumnTool />
      </div>
      <div className="menu-divider"></div>

      {/* Break */}
      <div className="menu-item">
        <PageBreakTool />
        <SeparatorTool />
      </div>
      <div className="menu-divider"></div>

      {/* Table */}
      <div className="menu-item">
        <TableTool />
      </div>
      <div className="menu-divider"></div>

      {/* Table cell tools — only visible when cursor is inside a table */}
      {isInTable && (
        <>
          <div className="menu-item">
            <TableCellBgColorTool />
            <TableCellBorderColorTool />
          </div>
          <div className="menu-divider"></div>
        </>
      )}

      {/* Typography */}
      <div className="menu-item">
        <TitleTool />
        <FontTool />
        <FontSizeTool />
        <LineHeightTool />
      </div>
      <div className="menu-divider"></div>

      {/* Text Formatting */}
      <div className="menu-item">
        <ColorTool />
        <HighlightTool />
        <BoldTool />
        <ItalicTool />
        <UnderlineTool />
        <StrikeoutTool />
      </div>
      <div className="menu-divider"></div>

      {/* Text Alignment */}
      <div className="menu-item">
        <LeftAlignTool />
        <CenterAlignTool />
        <RightAlignTool />
        <JustifyTool />
      </div>
      <div className="menu-divider"></div>

      {/* Lists */}
      <div className="menu-item">
        <ListTool />
      </div>
      <div className="menu-divider"></div>

      {/* Media */}
      <div className="menu-item">
        <ImageTool />
        <ExportDocxTool />
      </div>
      <div className="menu-item">
        <InsertElementTool />
      </div>
    </div>
  );
}
