import { useState } from 'react'

export default function ControlTool() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="menu-item__control" onClick={() => setIsOpen(!isOpen)}>
      <i title="Control"></i>
      <div className={'options' + (isOpen ? ' visible' : '')}>
        <ul>
          <li>Text</li>
          <li>Number</li>
          <li>Select</li>
          <li>Date</li>
          <li>Checkbox</li>
          <li>Radio</li>
        </ul>
      </div>
    </div>
  )
}
