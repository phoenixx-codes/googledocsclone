import {Routes,Route,Navigate, useParams} from 'react-router-dom'
import Editor from './editor/editor'

export default function App() {
  return(
    <Routes>
      <Route path="/" element={<Navigate to="/doc/doc-1" />} />
      <Route path="/doc/:documentId" element={<EditorWrapper />}/>
    </Routes>
  )
}

function EditorWrapper(){
  const {documentId}=useParams()
  return <Editor documentId={documentId}/>
}