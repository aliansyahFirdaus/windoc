

<div align="center">
  <img src="https://raw.githubusercontent.com/aliansyahFirdaus/windoc/main/docs/static/img/og.png" alt="Windoc — Editor de documentos basado en Canvas para la web" width="720">

  <br />

  [![npm](https://img.shields.io/npm/v/@windoc/core?label=%40windoc%2Fcore&color=0D746B)](https://www.npmjs.com/package/@windoc/core)
  [![npm](https://img.shields.io/npm/v/@windoc/react?label=%40windoc%2Freact&color=0D746B)](https://www.npmjs.com/package/@windoc/react)
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
  [![CI](https://github.com/aliansyahFirdaus/windoc/actions/workflows/ci.yml/badge.svg)](https://github.com/aliansyahFirdaus/windoc/actions/workflows/ci.yml)
</div>

Editor de documentos basado en Canvas para la web. Renderizado de alto rendimiento mediante HTML5 Canvas con paginación precisa a nivel de píxel, formato de texto enriquecido, tablas, imágenes y soporte de impresión.

## Paquetes

| Paquete | Descripción | Versión |
|---------|-------------|---------|
| [@windoc/core](./core) | Motor del editor en Canvas | 0.3.26 |
| [@windoc/react](./react) | Integraciones con React y UI composable | 0.3.26 |

## Primeros Pasos

```bash
npm install @windoc/core @windoc/react
```

```tsx
import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

function App() {
  return (
    <Editor
      defaultValue={{ main: [{ value: 'Hello, Windoc!' }] }}
      options={{
        margins: [40, 40, 40, 40],
        placeholder: { data: 'Start typing...' },
      }}
      onReady={(editor) => console.log('Ready!', editor)}
    />
  )
}
```

## Características

- **Renderizado en Canvas** — Renderizado de documentos preciso a nivel de píxel mediante HTML5 Canvas
- **Paginación** — Saltos de página automáticos con tamaños configurables (A4, Carta, etc.)
- **Texto Enriquecido** — Negrita, cursiva, subrayado, tachado, color, resaltado, tipografías
- **Tablas** — Unir/dividir celdas, bordes, operaciones de filas/columnas
- **Imágenes** — Imágenes en línea con cambio de tamaño, rotación y alineación
- **Encabezados y Pie de Página** — Encabezados, pies de página y números de página por página
- **Filigranas** — Filigranas de texto configurables
- **Listas** — Listas ordenadas y desordenadas
- **Impresión** — Impresión nativa con paginación precisa
- **UI Composable** — Combina componentes de barra de herramientas/pie o crea los tuyos propios
- **Extensible** — Plugins, atajos personalizados, menús contextuales personalizados

## Desarrollo

```bash
yarn install
yarn build
```

Para ejecutar el playground localmente con recarga en vivo:

```bash
# Terminal 1 — modo watch para core y react
yarn dev

# Terminal 2 — iniciar playground
cd playground && yarn dev
```

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, lee la [Guía de Contribución](./CONTRIBUTING.md) antes de abrir un pull request.

## Licencia

MIT
