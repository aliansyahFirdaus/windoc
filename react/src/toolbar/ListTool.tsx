import { useState, useRef, useEffect } from 'react'
import { List, ListOrdered, Indent, Outdent } from 'lucide-react'
import { useEditor } from '../EditorContext'

interface PresetOption {
  preset: string
  label: string
  preview: string[]
}

const OL_PRESETS: PresetOption[] = [
  { preset: 'olDefault', label: 'Default', preview: ['1.', 'a.', 'i.'] },
  { preset: 'olParen', label: 'Parenthesis', preview: ['1)', 'a)', 'i)'] },
  { preset: 'olOutline', label: 'Outline', preview: ['1.', '1.1.', '1.1.1.'] },
  { preset: 'olUpperA', label: 'Upper Alpha', preview: ['A.', 'a.', 'i.'] },
  { preset: 'olRoman', label: 'Roman', preview: ['I.', 'A.', '1.'] },
  { preset: 'olZeroPad', label: 'Zero Pad', preview: ['01.', 'a.', 'i.'] },
]

const UL_PRESETS: PresetOption[] = [
  { preset: 'ulDefault', label: 'Default', preview: ['●', '○', '■'] },
  { preset: 'ulDiamond', label: 'Diamond', preview: ['◆', '➤', '■'] },
  { preset: 'ulHollowSq', label: 'Hollow Square', preview: ['□', '□', '□'] },
  { preset: 'ulArrow', label: 'Arrow', preview: ['→', '◆', '●'] },
  { preset: 'ulStar', label: 'Star', preview: ['★', '○', '■'] },
  { preset: 'ulCheckArr', label: 'Check Arrow', preview: ['➤', '○', '■'] },
]

function PresetCell({ option, onClick }: { option: PresetOption; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="list-preset-cell"
      title={option.label}
    >
      {option.preview.map((item, i) => (
        <div key={i} className="list-preset-line" style={{ paddingLeft: `${i * 10}px` }}>
          <span className="list-preset-marker">{item}</span>
          <span className="list-preset-text" />
        </div>
      ))}
    </div>
  )
}

export default function ListTool() {
  const { editorRef, isApple, rangeStyle } = useEditor()
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const isActive = !!rangeStyle?.listType

  // Click-outside to close
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

  // Smart positioning: prevent overflow off-screen
  useEffect(() => {
    if (!visible || !optionsRef.current) return
    const el = optionsRef.current
    // Reset position first
    el.style.left = ''
    el.style.right = ''

    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      const overflow = rect.right - window.innerWidth + 8
      el.style.left = `-${overflow}px`
    } else if (rect.left < 0) {
      el.style.left = `${-rect.left + 8}px`
    }
  }, [visible])

  const handleList = (type: string | null, style?: string) => {
    editorRef.current?.command.executeList(type, style)
    setVisible(false)
  }

  const handlePreset = (type: 'ol' | 'ul', preset: string) => {
    const style = type === 'ol' ? 'decimal' : 'disc'
    editorRef.current?.command.executeListWithPreset(type, style, preset)
    setVisible(false)
  }

  const handleIndent = (e: React.MouseEvent) => {
    e.stopPropagation()
    editorRef.current?.command.executeListIndent()
  }

  const handleOutdent = (e: React.MouseEvent) => {
    e.stopPropagation()
    editorRef.current?.command.executeListOutdent()
  }

  return (
    <div ref={containerRef} className={`menu-item__list ${isActive ? 'active' : ''}`} title={`List(${isApple ? '⌘' : 'Ctrl'}+Shift+U)`}>
      <List size={16} onClick={() => setVisible(!visible)} style={{ cursor: 'pointer' }} />
      <div ref={optionsRef} className={`options ${visible ? 'visible' : ''}`} style={{ padding: '8px', width: '320px' }}>
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={() => handleList('ul', 'checkbox')}
            className="list-quick-btn"
          >
            Checkbox
          </button>
          <button onClick={handleIndent} className="list-quick-btn" title="Indent (Tab)">
            <Indent size={14} />
          </button>
          <button onClick={handleOutdent} className="list-quick-btn" title="Outdent (Shift+Tab)">
            <Outdent size={14} />
          </button>
        </div>

        {/* Ordered List Presets */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#667085', marginBottom: '6px', fontWeight: 500 }}>
            <ListOrdered size={12} />
            Ordered List
          </div>
          <div className="list-preset-grid">
            {OL_PRESETS.map(option => (
              <PresetCell
                key={option.preset}
                option={option}
                onClick={() => handlePreset('ol', option.preset)}
              />
            ))}
          </div>
        </div>

        {/* Unordered List Presets */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#667085', marginBottom: '6px', fontWeight: 500 }}>
            <List size={12} />
            Unordered List
          </div>
          <div className="list-preset-grid">
            {UL_PRESETS.map(option => (
              <PresetCell
                key={option.preset}
                option={option}
                onClick={() => handlePreset('ul', option.preset)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
