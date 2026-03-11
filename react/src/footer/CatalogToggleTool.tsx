import { useFooter } from '../FooterContext';

export default function CatalogToggleTool() {
  const { handleToggleCatalogAction } = useFooter();
  return (
    <div
      className="catalog-mode"
      title="Catalog"
      onClick={handleToggleCatalogAction}
    >
      <i></i>
    </div>
  );
}
