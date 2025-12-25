import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef, useState } from "react"

export default function Editor({ documentId }) {
  const socketRef = useRef(null)
  const isRemoteUpdate = useRef(false)
  const [doc, setDoc] = useState(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Loading...</p>",
    onUpdate({ editor }) {
      // Prevent echo loop
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false
        return
      }

      const json = editor.getJSON()
      setDoc(json)

      // Send update over WebSocket
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ content: json })
        )
      }
    },
  })

  // Load document from backend (on page load / refresh)
  useEffect(() => {
    if (!editor) return

    fetch(`http://localhost:8000/documents/${documentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          isRemoteUpdate.current = true
          editor.commands.setContent(data.content, false)
        } else {
          editor.commands.setContent("<p>Start typing...</p>", false)
        }
      })
      .catch(err => console.error("Load failed", err))
  }, [editor, documentId])

  // WebSocket connection
  useEffect(() => {
    if (!editor) return

    const socket = new WebSocket(`ws://localhost:8000/ws/${documentId}`)
    socketRef.current = socket

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      isRemoteUpdate.current = true
      editor.commands.setContent(data.content, false)
    }

    socket.onerror = (err) => {
      console.error("WebSocket error", err)
    }

    return () => {
      socket.close()
    }
  }, [editor, documentId])

  // Debounced persistence (REST backup)
  useEffect(() => {
    if (!doc) return

    const timeout = setTimeout(() => {
      fetch(`http://localhost:8000/documents/${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: doc }),
      }).catch(err => console.error("Save failed", err))
    }, 2000) // save every 2s

    return () => clearTimeout(timeout)
  }, [doc, documentId])

  return <EditorContent editor={editor} />
}
