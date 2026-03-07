import { useState } from 'react'

export default function ControlTool() {
  const [visible, setVisible] = useState(false)

  return (
    <div className="menu-item__control" onClick={() => setVisible(!visible)}>
      <i title="Control"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
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
