'use client'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function ChatPage() {
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    const sb = supabaseBrowser()
    sb.from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setMsgs(data ?? []))

    const ch = sb.channel('chat_live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (p) => setMsgs(m => [p.new as any, ...m].slice(0, 50))
      )
      .subscribe()

    return () => { void sb.removeChannel(ch) } // ensure cleanup returns void
  }, [])

  async function send() {
    if (!text.trim()) return
    const sb = supabaseBrowser()
    await sb.from('chat_messages').insert({ username: 'Guest', text, color: '#ccc', is_tip: false })
    setText('')
  }

  return (
    <main className="p-4 space-y-4">
      <div className="space-y-2">
        {msgs.map(m => <div key={m.id}><b>{m.username}</b>: {m.text}</div>)}
      </div>
      <div className="flex gap-2">
        <input className="border px-2 py-1 flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message…" />
        <button className="border px-3" onClick={send}>Send</button>
      </div>
    </main>
  )
}
