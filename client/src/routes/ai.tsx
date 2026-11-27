import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/contexts/I18nContext'
import { api } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  message: string
  at?: number
}

const EMERGENCY = [
  ['Police', '112'],
  ['Ambulance', '108'],
  ['Fire', '101'],
  ['Women in danger', '1091'],
  ['Cyber fraud', '1930'],
]

const SUGGESTIONS_HI = ['साइबर अपराध रिपोर्ट', 'महिला हेल्पलाइन 1091', 'नज़दीकी पुलिस', 'आज का PPE']
const SUGGESTIONS_EN = ["Report Cyber Crime", "Women's Helpline 1091", 'Nearest Police', 'PPE today?']

export default function AiPage() {
  const { lang } = useI18n()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('Built-in assistant')
  const [statusMode, setStatusMode] = useState<'ai' | 'fallback'>('fallback')
  const [speakOn, setSpeakOn] = useState(() => {
    try {
      const raw = localStorage.getItem('ss_prefs')
      return raw ? (JSON.parse(raw).speakReplies !== false) : false
    } catch {
      return false
    }
  })
  const [chips, setChips] = useState<string[]>(lang === 'hi' ? SUGGESTIONS_HI : SUGGESTIONS_EN)
  const [voiceStatus, setVoiceStatus] = useState('Tap the mic and speak, or type below')
  const [voiceLive, setVoiceLive] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isHi = lang === 'hi'
  const greeting = isHi
    ? 'नमस्ते! मैं आपका सुरक्षा साथी हूँ। कचरे से जुड़े जोखिम, PPE, गर्मी, e-SHRAM या PM-JAY — कुछ भी पूछें। हिंदी और अंग्रेज़ी दोनों में मदद मिलेगी।'
    : "Namaste! I'm your safety co-pilot. Send a waste photo question, or ask about PPE, heat, e-SHRAM, PM-JAY. Hindi bhi chalega."

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/chat/history')) as { messages: Message[] }
        setMessages(data.messages || [])
      } catch {
        /* ignore */
      }
      try {
        const info = (await api('/ai/status')) as { mode: string; configured: Record<string, boolean> }
        const configured = Object.values(info.configured || {}).some(Boolean)
        setStatus(info.mode === 'ai' ? 'AI connected' : configured ? 'AI fallback' : 'Built-in assistant')
        setStatusMode(info.mode === 'ai' ? 'ai' : 'fallback')
      } catch {
        setStatus('Built-in assistant')
        setStatusMode('fallback')
      }
    })()
  }, [])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  async function send(text: string) {
    const message = text.trim()
    if (!message) return
    const userMsg: Message = { id: 'u-' + Date.now(), role: 'user', message }
    setMessages((m) => [...m, userMsg])
    setInput('')
    const thinking: Message = { id: 't-' + Date.now(), role: 'assistant', message: '…' }
    setMessages((m) => [...m, thinking])
    setSending(true)
    try {
      const result = (await api('/ai/chat', {
        method: 'POST',
        body: { message, lang },
      })) as { reply: string; provider?: string; suggestions?: string[] }
      setMessages((m) =>
        m.map((msg) => (msg.id === thinking.id ? { ...msg, message: result.reply } : msg)),
      )
      const provider = result.provider || 'local'
      setStatus(provider === 'local' ? 'Built-in assistant' : 'AI connected')
      setStatusMode(provider === 'local' ? 'fallback' : 'ai')
      if (result.suggestions && result.suggestions.length) setChips(result.suggestions)
      if (speakOn && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(result.reply)
        u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
        window.speechSynthesis.speak(u)
      }
    } catch (err: any) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === thinking.id ? { ...msg, message: 'I could not reach the server. ' + (err?.message || '') } : msg,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setVoiceStatus('Voice input is not supported in this browser. Please type instead.')
      return
    }
    const rec = new SR()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.onstart = () => {
      setVoiceLive(true)
      setVoiceStatus('Listening…')
    }
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript || ''
      setInput(transcript)
      setVoiceStatus('Tap the mic and speak, or type below')
      setVoiceLive(false)
      if (transcript) void send(transcript)
    }
    rec.onerror = () => {
      setVoiceStatus('Could not hear you. Please try again or type your question.')
      setVoiceLive(false)
    }
    rec.onend = () => {
      setVoiceLive(false)
    }
    try {
      rec.start()
    } catch {
      setVoiceStatus('Could not start voice input.')
    }
  }

  function toggleSpeak() {
    const next = !speakOn
    setSpeakOn(next)
    try {
      const raw = localStorage.getItem('ss_prefs')
      const prefs = raw ? JSON.parse(raw) : {}
      prefs.speakReplies = next
      localStorage.setItem('ss_prefs', JSON.stringify(prefs))
    } catch {
      /* ignore */
    }
  }

  async function clearChat() {
    if (!confirm('Clear this conversation from your device view?')) return
    setMessages([{ id: 'g-' + Date.now(), role: 'assistant', message: 'Conversation cleared. What would you like to know?' }])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">AI Saathi</div>
        <h1 className="text-2xl font-bold tracking-tight">AI Saathi</h1>
        <p className="text-sm text-muted-foreground">Ask anything about safety, IDs and schemes</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Chat screen */}
        <div className="flex flex-col overflow-hidden rounded-2xl border bg-[#0a1210] text-[#e6f4ec] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#1b2a22] bg-[#0c1613] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl">🤖</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <b>SurakshaSetu</b>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    statusMode === 'ai' ? 'bg-emerald-900 text-emerald-300' : 'bg-blue-900 text-blue-300'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xs text-[#8fb3a0]">Voice + text safety assistant · {lang === 'hi' ? 'हिन्दी' : 'English'}</div>
            </div>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-lg border border-[#223a2c] bg-[#111d17] px-3 py-1.5 text-xs text-[#cfe6d8] hover:border-[#34d17a]"
            >
              ✕
            </button>
          </div>

          <div ref={msgsRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 320, maxHeight: 480 }}>
            <div className="max-w-[85%] rounded-2xl bg-[#12241b] px-4 py-2 text-sm text-[#e6f4ec]">{greeting}</div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-[#12241b] text-[#e6f4ec]'
                }`}
              >
                {m.message}
                {m.role === 'assistant' && m.message !== '…' && (
                  <button
                    type="button"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const u = new SpeechSynthesisUtterance(m.message)
                        u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
                        window.speechSynthesis.speak(u)
                      }
                    }}
                    className="ml-2 inline text-xs opacity-60 hover:opacity-100"
                  >
                    🔊
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[#1b2a22] bg-[#0c1613] p-3">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void send(chip)}
                className="whitespace-nowrap rounded-full border border-[#223a2c] bg-[#111d17] px-3 py-1 text-xs text-[#cfe6d8] hover:border-[#34d17a]"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="border-t border-[#1b2a22] bg-[#0c1613] px-4 py-2">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                voiceLive ? 'bg-emerald-900/40 text-emerald-300' : 'text-[#8fb3a0]'
              }`}
            >
              <span className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`inline-block h-3 w-0.5 rounded-full ${voiceLive ? 'bg-emerald-400' : 'bg-[#223a2c]'}`}
                  />
                ))}
              </span>
              {voiceStatus}
            </div>
          </div>

          <div className="px-4 py-1 text-center text-[10px] text-[#8fb3a0]">
            Replying in {lang === 'hi' ? 'हिन्दी' : 'English'}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
            className="flex items-center gap-2 border-t border-[#1b2a22] bg-[#0c1613] p-3"
          >
            <button
              type="button"
              onClick={startVoice}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#223a2c] bg-[#111d17] text-emerald-400"
              title="Speak your question"
            >
              🎤
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isHi ? 'अपना सवाल लिखें या बोलें…' : 'Type your question, or tap the mic…'}
              className="flex-1 rounded-full border border-[#223a2c] bg-[#111d17] px-4 py-2 text-sm text-[#e6f4ec] placeholder:text-[#8fb3a0]"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-[#052e16]"
              title="Send"
            >
              ➤
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Emergency numbers</h3>
            <div className="space-y-1 text-sm">
              {EMERGENCY.map(([label, num]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <b>{num}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Assistant settings</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={toggleSpeak}>
                🔊 Read replies aloud: {speakOn ? 'On' : 'Off'}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={clearChat}>
                🗑 Clear conversation
              </Button>
              <a href="/help" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  ❓ Open help centre
                </Button>
              </a>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Good questions to ask</h3>
            <p className="text-xs text-muted-foreground">"Syringe mila, kya karun?"</p>
            <p className="text-xs text-muted-foreground">"Garmi lag rahi hai, kya karoon?"</p>
            <p className="text-xs text-muted-foreground">"PM-JAY ke liye kaise apply karun?"</p>
            <p className="text-xs text-muted-foreground">"Mujhe raat me safest kaise ghar jaana hai?"</p>
          </div>
        </div>
      </div>
    </div>
  )
}
