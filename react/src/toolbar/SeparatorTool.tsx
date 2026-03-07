import { useState } from 'react'
import { Minus } from 'lucide-react'
import { useEditor } from '../EditorContext'

const DASH_STYLES: { label: string; dashArray: number[] }[] = [
  { label: 'Solid', dashArray: [] },
  { label: 'Dotted', dashArray: [1, 1] },
  { label: 'Dashed', dashArray: [3, 1] },
  { label: 'Long Dash', dashArray: [4, 4] },
]

const LINE_WIDTHS: { label: string; value: number }[] = [
  { label: 'Thin', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Thick', value: 4 },
]

export default function SeparatorTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)
  const [selectedWidth, setSelectedWidth] = useState(1)

  const lineColor = '#344054'

  const handleSeparator = (dashArray: number[]) => {
    editorRef.current?.command.executeSeparator(dashArray, { lineWidth: selectedWidth })
    setVisible(false)
  }

  return (
    <div className="menu-item__separator" title="Separator">
      <Minus size={16} onClick={() => setVisible(!visible)} style={{ cursor: 'pointer' }} />
      <div className={`options ${visible ? 'visible' : ''}`} style={{ padding: '8px 10px 10px', width: '200px' }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {DASH_STYLES.map(({ label, dashArray }) => (
            <li
              key={label}
              onClick={() => handleSeparator(dashArray)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 6px', cursor: 'pointer', borderRadius: '4px' }}
            >
              <svg style={{ flex: 1, minWidth: 0, overflow: 'hidden' }} height="8">
                <line
                  x1="0" y1="4" x2="100%" y2="4"
                  stroke={lineColor}
                  strokeWidth={selectedWidth}
                  strokeDasharray={dashArray.length ? dashArray.join(',') : 'none'}
                />
              </svg>
              <span style={{ fontSize: '11px', color: '#475467', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
            </li>
          ))}
        </ul>

        <div style={{ borderTop: '1px solid #e4e7ec', marginTop: '8px', paddingTop: '8px' }}>
          <div style={{ fontSize: '11px', color: '#667085', marginBottom: '6px', fontWeight: 500 }}>Line Width</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {LINE_WIDTHS.map(({ label, value }) => (
              <button
                key={value}
                onClick={(e) => { e.stopPropagation(); setSelectedWidth(value) }}
                style={{
                  flex: 1,
                  padding: '3px 6px',
                  fontSize: '11px',
                  border: `1px solid ${selectedWidth === value ? '#3b82f6' : '#d0d5dd'}`,
                  borderRadius: '4px',
                  background: selectedWidth === value ? '#eff6ff' : '#fff',
                  color: selectedWidth === value ? '#3b82f6' : '#475467',
                  cursor: 'pointer',
                  fontWeight: selectedWidth === value ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
