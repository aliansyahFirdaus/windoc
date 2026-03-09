import { useState } from 'react'

export default function DateTool() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="menu-item__date" onClick={() => setIsOpen(!isOpen)}>
      <i title="Date"></i>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          <li data-format="yyyy-MM-dd" suppressHydrationWarning>{new Date().toISOString().split('T')[0]}</li>
          <li data-format="yyyy-MM-dd hh:mm:ss" suppressHydrationWarning>{new Date().toISOString().replace('T', ' ').slice(0, 19)}</li>
        </ul>
      </div>
    </div>
  )
}
