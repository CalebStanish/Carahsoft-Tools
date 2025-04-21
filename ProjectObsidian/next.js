'use client'

import { useState } from 'react'

const PASSWORD = 'obsidian123'

export default function Home() {
  const [input, setInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const handleSubmit = () => {
    if (input === PASSWORD) {
      setAuthenticated(true)
    } else {
      alert('Incorrect password')
    }
  }

  if (authenticated) {
    return (
      <div style={{ padding: 32 }}>
        <h1>🔓 Welcome to Obsidian</h1>
        <p>This content is protected by a simple password.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Enter Password to Access Obsidian</h2>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Password"
        style={{ padding: 8, marginRight: 8 }}
      />
      <button onClick={handleSubmit} style={{ padding: 8 }}>
        Unlock
      </button>
    </div>
  )
}
