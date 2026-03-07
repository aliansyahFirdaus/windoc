import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor } from '../EditorContext'

const COLOR_PALETTE = [
  ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc'],
  ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff'],
  ['#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc'],
]

const FONTS = [
  { family: 'Arial', label: 'Sans Serif' },
  { family: 'Times New Roman', label: 'Serif' },
]

export default function WatermarkFooterTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState<'text' | 'image'>('text')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Text watermark state
  const [text, setText] = useState('WATERMARK')
  const [font, setFont] = useState('Arial')
  const [color, setColor] = useState('#AEB5C0')
  const [opacity, setOpacity] = useState(30)
  const [rotation, setRotation] = useState(-45)
  const [inFront, setInFront] = useState(false)

  // Image watermark state
  const [imageData, setImageData] = useState('')
  const [imgWidth, setImgWidth] = useState(200)
  const [imgHeight, setImgHeight] = useState(200)

  // Click outside to close
  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible])

  // Smart positioning
  useEffect(() => {
    if (!visible || !panelRef.current) return
    const el = panelRef.current
    el.style.right = ''
    el.style.left = ''
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      el.style.left = 'unset'
      el.style.right = '0'
    }
    if (rect.left < 0) {
      el.style.left = `${-rect.left + 4}px`
    }
  }, [visible])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImageData(result)
      const img = new Image()
      img.onload = () => {
        const maxDim = 300
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        setImgWidth(w)
        setImgHeight(h)
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }, [])

  const handleApply = () => {
    if (!editorRef.current) return
    if (tab === 'text') {
      if (!text.trim()) return
      editorRef.current.command.executeAddWatermark({
        data: text,
        type: 'text',
        color,
        opacity: opacity / 100,
        size: 120,
        font,
        rotation,
        inFront,
      })
    } else {
      if (!imageData) return
      editorRef.current.command.executeAddWatermark({
        data: imageData,
        type: 'image',
        opacity: opacity / 100,
        rotation,
        inFront,
        width: imgWidth,
        height: imgHeight,
      })
    }
    setVisible(false)
  }

  const handleDelete = () => {
    editorRef.current?.command.executeDeleteWatermark()
    setVisible(false)
  }

  return (
    <div className="watermark-footer" ref={containerRef} onClick={() => setVisible(!visible)}>
      <i title="Watermark"></i>
      {visible && (
        <div className="watermark-footer-panel" ref={panelRef} onClick={(e) => e.stopPropagation()}>
          {/* Tabs */}
          <div className="wm-panel-tabs">
            <button className={`wm-panel-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
              Text
            </button>
            <button className={`wm-panel-tab ${tab === 'image' ? 'active' : ''}`} onClick={() => setTab('image')}>
              Image
            </button>
          </div>

          <div className="wm-panel-body">
            {tab === 'text' ? (
              <>
                <div className="wm-panel-field">
                  <label>Text</label>
                  <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark text" />
                </div>
                <div className="wm-panel-field">
                  <label>Font</label>
                  <select value={font} onChange={(e) => setFont(e.target.value)}>
                    {FONTS.map((f) => (
                      <option key={f.family} value={f.family}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="wm-panel-field">
                  <label>Color</label>
                  <div className="wm-panel-colors">
                    {COLOR_PALETTE.flat().map((c) => (
                      <div
                        key={c}
                        className={`wm-panel-color ${color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="wm-panel-field">
                  <label>Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="wm-panel-upload" onClick={() => fileInputRef.current?.click()}>Choose File</button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    {imageData && <span style={{ fontSize: '11px', color: '#667085' }}>Loaded</span>}
                  </div>
                </div>
                {imageData && (
                  <div className="wm-panel-field">
                    <div className="wm-panel-preview">
                      <img src={imageData} alt="preview" style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }} />
                    </div>
                  </div>
                )}
                <div className="wm-panel-field-row">
                  <div className="wm-panel-field wm-panel-field-half">
                    <label>W</label>
                    <input type="number" value={imgWidth} min={10} onChange={(e) => setImgWidth(Number(e.target.value))} />
                  </div>
                  <div className="wm-panel-field wm-panel-field-half">
                    <label>H</label>
                    <input type="number" value={imgHeight} min={10} onChange={(e) => setImgHeight(Number(e.target.value))} />
                  </div>
                </div>
              </>
            )}

            {/* Shared */}
            <div className="wm-panel-field">
              <label>Opacity <span className="wm-panel-value">{opacity}%</span></label>
              <input type="range" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="wm-panel-slider" />
            </div>
            <div className="wm-panel-field">
              <label>Rotation <span className="wm-panel-value">{rotation}°</span></label>
              <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="wm-panel-slider" />
            </div>
            <div className="wm-panel-field">
              <label>Position</label>
              <div className="wm-panel-toggle">
                <button className={!inFront ? 'active' : ''} onClick={() => setInFront(false)}>Behind</button>
                <button className={inFront ? 'active' : ''} onClick={() => setInFront(true)}>In Front</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="wm-panel-actions">
            <button className="wm-panel-btn-delete" onClick={handleDelete}>Remove</button>
            <button className="wm-panel-btn-apply" onClick={handleApply}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}
