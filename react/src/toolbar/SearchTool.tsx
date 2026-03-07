import { useState } from 'react'
import { useEditor } from '../EditorContext'

export default function SearchTool() {
  const { editorRef } = useEditor()
  const [visible, setVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [searchResult, setSearchResult] = useState('')

  const handleSearch = () => {
    editorRef.current?.command.executeSearch(searchText || null, {
      isRegEnable: true,
      isIgnoreCase: true
    })
    const result = editorRef.current?.command.getSearchNavigateInfo()
    if (result) {
      setSearchResult(`${result.index}/${result.count}`)
    } else {
      setSearchResult('')
    }
  }

  const handleReplace = () => {
    if (searchText && searchText !== replaceText) {
      editorRef.current?.command.executeReplace(replaceText)
    }
  }

  const handleSearchPre = () => {
    editorRef.current?.command.executeSearchNavigatePre()
    const result = editorRef.current?.command.getSearchNavigateInfo()
    if (result) setSearchResult(`${result.index}/${result.count}`)
  }

  const handleSearchNext = () => {
    editorRef.current?.command.executeSearchNavigateNext()
    const result = editorRef.current?.command.getSearchNavigateInfo()
    if (result) setSearchResult(`${result.index}/${result.count}`)
  }

  const handleClose = () => {
    setVisible(false)
    setSearchText('')
    setReplaceText('')
    editorRef.current?.command.executeSearch(null)
    setSearchResult('')
  }

  return (
    <>
      <div className="menu-item__search" data-menu="search" onClick={() => setVisible(!visible)}>
        <i></i>
      </div>
      <div className="menu-item__search__collapse" style={{ display: visible ? 'block' : 'none' }}>
        <div className="menu-item__search__collapse__search">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <label className="search-result">{searchResult}</label>
          <div className="arrow-left" onClick={handleSearchPre}><i></i></div>
          <div className="arrow-right" onClick={handleSearchNext}><i></i></div>
          <span onClick={handleClose}>×</span>
        </div>
        <div className="menu-item__search__collapse__replace">
          <input type="text" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} />
          <button onClick={handleReplace}>Replace</button>
        </div>
      </div>
    </>
  )
}
