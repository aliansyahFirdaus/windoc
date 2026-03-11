import CatalogToggleTool from './footer/CatalogToggleTool';
import PageModeTool from './footer/PageModeTool';
import FooterStatus from './footer/FooterStatus';
import EditorModeTool from './footer/EditorModeTool';
import PageScaleMinusTool from './footer/PageScaleMinusTool';
import PageScalePercentageTool from './footer/PageScalePercentageTool';
import PageScaleAddTool from './footer/PageScaleAddTool';
import PaperSizeTool from './footer/PaperSizeTool';
import PaperDirectionTool from './footer/PaperDirectionTool';
import PaperMarginTool from './footer/PaperMarginTool';
import FullscreenTool from './footer/FullscreenTool';
import EditorOptionTool from './footer/EditorOptionTool';
import WatermarkFooterTool from './footer/WatermarkFooterTool';

export default function EditorFooter() {
  return (
    <div className="footer" editor-component="footer">
      <div>
        <CatalogToggleTool />
        <PageModeTool />
        <FooterStatus />
      </div>
      <EditorModeTool />
      <div>
        <PageScaleMinusTool />
        <PageScalePercentageTool />
        <PageScaleAddTool />
        <PaperSizeTool />
        <PaperDirectionTool />
        <PaperMarginTool />
        <WatermarkFooterTool />
        <FullscreenTool />
        <EditorOptionTool />
      </div>
    </div>
  );
}
