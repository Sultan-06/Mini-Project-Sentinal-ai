import { useRef, useState } from 'react'
import './App.css'
import {
  MESSAGE_EXAMPLES,
  LINK_EXAMPLES,
  buildMessageHeuristicResult,
  buildLinkHeuristicResult,
  buildPhotoResult,
  generateSamplePhotoCanvas,
} from './clearCheckLogic'

const tabConfig = {
  message: { label: 'Check a Message', icon: 'message' },
  link: { label: 'Check a Link', icon: 'link' },
  photo: { label: 'Check a Photo', icon: 'photo' },
}

function Icon({ name, className = 'w-5 h-5' }) {
  const paths = {
    shield: <><path d="M12 3.25l7 3v5.15c0 4.65-2.95 8.75-7 9.85-4.05-1.1-7-5.2-7-9.85V6.25l7-3z" /><path d="M9.25 12.25l1.9 1.9 3.7-3.9" /></>,
    lock: <><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></>,
    message: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />,
    link: <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
    photo: <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    upload: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
    search: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    back: <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />,
    close: <path d="M6 18L18 6M6 6l12 12" />,
    check: <path d="M5 13l4 4L19 7" />,
    warning: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    danger: <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    info: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  }
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [activeTab, setActiveTab] = useState('message')
  const [messageText, setMessageText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState({ dataUrl: null, fileName: '', sampleType: null, rawFile: null })
  const [view, setView] = useState('input')
  const [loadingTitle, setLoadingTitle] = useState('')
  const [result, setResult] = useState(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [dragging, setDragging] = useState(false)
  const [recentChecks, setRecentChecks] = useState(() => [
    { id: 'seed-1', type: 'message', snippet: MESSAGE_EXAMPLES.delivery, result: buildMessageHeuristicResult(MESSAGE_EXAMPLES.delivery) },
    { id: 'seed-2', type: 'link', snippet: LINK_EXAMPLES.bank, result: buildLinkHeuristicResult(LINK_EXAMPLES.bank) },
  ])
  const fileInputRef = useRef(null)
  const checkerRef = useRef(null)

  const showToast = (message) => {
    const id = Date.now()
    setToasts((items) => [...items, { id, message }])
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3000)
  }

  const saveRecent = (type, snippet, newResult) => {
    setRecentChecks((items) => [{ id: `chk-${Date.now()}`, type, snippet, result: newResult }, ...items].slice(0, 8))
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    setView('input')
  }

  const resetToInput = () => setView('input')
  const resetToHome = (event) => {
    event?.preventDefault?.()
    resetToInput()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const runMessageCheck = async (text = messageText) => {
    const clean = text.trim()
    if (!clean) return showToast('Please paste a message or try one of the examples first.')
    setMessageText(clean)
    setLoadingTitle('Reading the message for common scam tricks...')
    setView('loading')
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    const newResult = buildMessageHeuristicResult(clean)
    saveRecent('message', clean, newResult)
    setResult(newResult)
    setView('result')
  }

  const runLinkCheck = async (url = linkUrl) => {
    const clean = url.trim()
    if (!clean) return showToast('Please paste a website link or try an example first.')
    setLinkUrl(clean)
    setLoadingTitle('Checking where this link actually goes...')
    setView('loading')
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    try {
      const newResult = buildLinkHeuristicResult(clean)
      saveRecent('link', clean, newResult)
      setResult(newResult)
      setView('result')
    } catch (error) {
      setView('input')
      showToast(error.message)
    }
  }

  const runPhotoCheck = async (photo = selectedPhoto) => {
    if (!photo.dataUrl) return showToast('Please choose a photo or try one of the sample photos first.')
    setLoadingTitle('Looking closely at lighting and fine details...')
    setView('loading')
    await new Promise((resolve) => window.setTimeout(resolve, 1150))
    const newResult = buildPhotoResult(photo)
    saveRecent('photo', photo.fileName, newResult)
    setResult(newResult)
    setView('result')
  }

  const trySamplePhoto = (type) => {
    const dataUrl = generateSamplePhotoCanvas(type)
    const fileName = type === 'ai' ? 'Sample — AI Portrait.png' : 'Sample — Mountain Sunrise.jpg'
    const photo = { dataUrl, fileName, sampleType: type, rawFile: null }
    setSelectedPhoto(photo)
    runPhotoCheck(photo)
  }

  const loadPhotoFile = (file) => {
    if (!file?.type.startsWith('image/')) return showToast('Please pick a photo file (PNG, JPG, or WEBP).')
    const reader = new FileReader()
    reader.onload = (event) => setSelectedPhoto({ dataUrl: event.target.result, fileName: file.name, sampleType: null, rawFile: file })
    reader.readAsDataURL(file)
  }

  const restoreRecent = (item) => {
    setActiveTab(item.type)
    setResult(item.result)
    setView('result')
    checkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const palette = result ? {
    safe: { banner: 'bg-safe-bg border-safe-border text-safe-text', icon: 'bg-white text-safe-text border border-safe-border', bar: 'bg-safe-text', advice: 'bg-safe-bg/60 border-safe-border', iconName: 'check' },
    caution: { banner: 'bg-caution-bg border-caution-border text-caution-text', icon: 'bg-white text-caution-text border border-caution-border', bar: 'bg-caution-text', advice: 'bg-caution-bg/70 border-caution-border', iconName: 'warning' },
    danger: { banner: 'bg-danger-bg border-danger-border text-danger-text', icon: 'bg-white text-danger-text border border-danger-border', bar: 'bg-danger-text', advice: 'bg-danger-bg/70 border-danger-border', iconName: 'danger' },
  }[result.status] : null

  const renderMessageSpecific = () => {
    if (!result) return null
    const unique = [...new Set(result.matchedPhrases)].sort((a, b) => b.length - a.length)
    let text = result.originalText
    const parts = []
    let remaining = text
    unique.forEach((phrase) => {
      const index = remaining.toLowerCase().indexOf(phrase)
      if (index >= 0) {
        parts.push(remaining.slice(0, index))
        parts.push(<span key={phrase} className={result.status === 'danger' ? 'highlight-danger' : 'highlight-caution'}>{remaining.slice(index, index + phrase.length)}</span>)
        remaining = remaining.slice(index + phrase.length)
      }
    })
    parts.push(remaining)
    return (
      <div className="rounded-2xl bg-white border border-hairline p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-ink">Message you checked</h3>
          <span className="text-xs text-muted">{result.matchedPhrases.length ? 'Highlighted words show what stood out as a warning sign.' : 'No suspicious words were flagged in this message.'}</span>
        </div>
        <p className="text-sm sm:text-base text-ink leading-relaxed bg-[#FAF9F7] p-4 rounded-xl border border-hairline break-words">{parts}</p>
      </div>
    )
  }

  const renderLinkSpecific = () => (
    <div className="rounded-2xl bg-white border border-hairline p-5 space-y-4">
      <div className="rounded-xl bg-[#FAF9F7] border border-hairline p-4">
        <div className="text-xs font-medium text-muted mb-1">Where this link actually goes</div>
        <div className="font-display text-base sm:text-lg font-bold text-ink break-all">{result.realDomain}</div>
        <div className="text-xs text-muted mt-1 break-all">{result.originalUrl}</div>
      </div>
      <div className="px-1">
        {result.checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0 border-hairline">
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${check.status === 'safe' ? 'bg-safe-bg text-safe-text' : check.status === 'caution' ? 'bg-caution-bg text-caution-text' : 'bg-danger-bg text-danger-text'}`}>
                <Icon name={check.status === 'safe' ? 'check' : check.status === 'caution' ? 'info' : 'close'} className="w-3.5 h-3.5" />
              </span>
              <div><div className="text-sm font-semibold text-ink">{check.label}</div><div className="text-xs text-muted">{check.text}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPhotoSpecific = () => (
    <div className="rounded-2xl bg-white border border-hairline p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
      <div className="sm:col-span-5 flex flex-col items-center">
        <img src={result.imageUrl} alt="Checked photo preview" className="w-full max-h-52 object-cover rounded-xl border border-hairline shadow-subtle bg-[#FAF9F7]" />
        <span className="text-xs text-muted mt-2 truncate max-w-full">{result.fileName}</span>
      </div>
      <div className="sm:col-span-7 space-y-2.5">
        {result.pills.map((pill) => (
          <div key={pill.label} className="rounded-xl border border-hairline bg-[#FAF9F7] p-3.5 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ink">{pill.label}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${pill.state === 'safe' ? 'bg-safe-bg text-safe-text border-safe-border' : pill.state === 'caution' ? 'bg-caution-bg text-caution-text border-caution-border' : 'bg-danger-bg text-danger-text border-danger-border'}`}>{pill.note}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => <div key={toast.id} className="pointer-events-auto bg-ink text-white text-sm px-4 py-3 rounded-2xl shadow-soft animate-gentle-in">{toast.message}</div>)}
      </div>

      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 backdrop-blur-md border-b border-hairline/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button type="button" onClick={resetToHome} className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-brand-soft border border-blue-100 flex items-center justify-center text-brand transition group-hover:scale-105"><Icon name="shield" className="w-5 h-5" /></div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">ClearCheck</span>
          </button>
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="#how-it-works" className="text-sm font-medium text-muted hover:text-ink transition py-2">How it works</a>
            <button type="button" onClick={() => setPrivacyOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white hover:bg-slate-50 text-ink border border-hairline shadow-subtle transition cursor-pointer">
              <Icon name="lock" className="w-3.5 h-3.5 text-safe-text" /><span>Privacy First</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-20">
        <section className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">Not sure if it's real? Let's check together.</h1>
          <p className="mt-3.5 text-base sm:text-lg text-muted leading-relaxed">Paste a suspicious message, a link, or upload a photo. We'll explain if it's safe in plain English.</p>
        </section>

        <section ref={checkerRef} id="checker-card" className="max-w-[780px] mx-auto bg-white rounded-3xl border border-hairline shadow-soft p-5 sm:p-8 transition-all">
          <div className="bg-[#F3F4F6] p-1.5 rounded-2xl grid grid-cols-3 gap-1.5 mb-7" role="tablist" aria-label="Choose what to check">
            {Object.entries(tabConfig).map(([tab, config]) => (
              <button key={tab} type="button" onClick={() => switchTab(tab)} role="tab" aria-selected={activeTab === tab} className={`tab-pill flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${activeTab === tab ? 'font-semibold bg-white text-ink shadow-subtle' : 'font-medium text-muted hover:text-ink'}`}>
                <Icon name={config.icon} className={`w-4 h-4 shrink-0 ${activeTab === tab ? 'text-brand' : 'text-muted'}`} /><span>{config.label}</span>
              </button>
            ))}
          </div>

          {view === 'input' && (
            <div className="animate-gentle-in">
              {activeTab === 'message' && (
                <div className="space-y-4">
                  <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows="5" placeholder="Paste the text message, WhatsApp message, or email here..." className="w-full rounded-2xl bg-[#FAF9F7] border border-hairline focus:bg-white focus:border-brand focus:ring-4 focus:ring-blue-500/10 outline-none p-4 sm:p-5 text-base text-ink placeholder-gray-400 leading-relaxed transition resize-y" />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-medium text-muted mr-1">Try an example:</span>
                    {[['otp','Urgent Bank OTP'],['prize','Fake Prize Message'],['delivery','Normal Delivery Update']].map(([key,label]) => <button key={key} type="button" onClick={() => runMessageCheck(MESSAGE_EXAMPLES[key])} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF9F7] hover:bg-blue-50 text-ink hover:text-brand border border-hairline hover:border-blue-200 transition cursor-pointer">{label}</button>)}
                  </div>
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-muted">We'll look for sneaky wording, fake urgency, or hidden traps.</p>
                    <button type="button" onClick={() => runMessageCheck()} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-brand hover:bg-brand-hover active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition cursor-pointer">Check Message</button>
                  </div>
                </div>
              )}

              {activeTab === 'link' && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Icon name="link" className="w-5 h-5" /></div>
                    <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runLinkCheck()} type="text" placeholder="Paste a website link (e.g., https://example.com)..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#FAF9F7] border border-hairline focus:bg-white focus:border-brand focus:ring-4 focus:ring-blue-500/10 outline-none text-base text-ink placeholder-gray-400 transition" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-medium text-muted mr-1">Try an example:</span>
                    {[['bank','Fake Bank Login'],['short','Suspicious Short Link'],['wiki','Official Wikipedia']].map(([key,label]) => <button key={key} type="button" onClick={() => runLinkCheck(LINK_EXAMPLES[key])} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FAF9F7] hover:bg-blue-50 text-ink hover:text-brand border border-hairline hover:border-blue-200 transition cursor-pointer">{label}</button>)}
                  </div>
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-muted">Safe to paste — we check links without ever opening them on your device.</p>
                    <button type="button" onClick={() => runLinkCheck()} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-brand hover:bg-brand-hover active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition cursor-pointer">Check Link</button>
                  </div>
                </div>
              )}

              {activeTab === 'photo' && (
                <div className="space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => { event.preventDefault(); setDragging(false); loadPhotoFile(event.dataTransfer.files?.[0]) }}
                    className={`group relative rounded-2xl border-2 border-dashed ${dragging ? 'border-brand bg-blue-50/40' : 'border-[#D8DCE3]'} hover:border-brand bg-[#FAF9F7] hover:bg-blue-50/30 p-7 sm:p-9 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[210px]`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => loadPhotoFile(event.target.files?.[0])} />
                    {!selectedPhoto.dataUrl ? (
                      <div className="space-y-3 pointer-events-none">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-hairline shadow-subtle flex items-center justify-center text-brand group-hover:scale-105 transition"><Icon name="upload" className="w-6 h-6" /></div>
                        <div><p className="text-sm sm:text-base font-medium text-ink">Drop a photo here, or click to browse from your device</p><p className="text-xs text-muted mt-1">Works with PNG, JPG, and WEBP photos</p></div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-3">
                        <img src={selectedPhoto.dataUrl} alt="Selected photo preview" className="max-h-48 w-auto rounded-xl object-contain border border-hairline shadow-subtle bg-white" />
                        <div className="flex items-center gap-2 text-xs text-muted"><span className="font-medium text-ink truncate max-w-[240px]">{selectedPhoto.fileName}</span><span>&bull;</span><span className="text-brand underline underline-offset-2">Click to choose another</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted mr-1">Or test with a sample photo:</span>
                    <button type="button" onClick={() => trySamplePhoto('ai')} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FAF9F7] hover:bg-blue-50 text-ink hover:text-brand border border-hairline hover:border-blue-200 transition cursor-pointer">Try AI-Generated Sample</button>
                    <button type="button" onClick={() => trySamplePhoto('real')} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FAF9F7] hover:bg-blue-50 text-ink hover:text-brand border border-hairline hover:border-blue-200 transition cursor-pointer">Try Real Photo Sample</button>
                  </div>
                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-muted">We check lighting, fine textures, and digital editing clues.</p>
                    <button type="button" onClick={() => runPhotoCheck()} className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-brand hover:bg-brand-hover active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-sm transition cursor-pointer">Check Photo</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'loading' && (
            <div className="py-12 sm:py-16 text-center space-y-5 animate-gentle-in">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-calm-pulse"></div>
                <div className="relative w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center text-brand shadow-subtle"><Icon name="search" className="w-5 h-5" /></div>
              </div>
              <div className="space-y-1.5"><p className="font-display text-lg font-semibold text-ink">{loadingTitle}</p><p className="text-sm text-muted">Just a moment — putting everything into plain English for you.</p></div>
              <div className="max-w-xs mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-brand/70 rounded-full animate-gentle-progress"></div></div>
            </div>
          )}

          {view === 'result' && result && palette && (
            <div className="space-y-6 animate-gentle-in">
              <div className={`rounded-2xl p-5 sm:p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${palette.banner}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${palette.icon}`}><Icon name={palette.iconName} className="w-6 h-6" /></div>
                  <div><span className="text-xs font-medium uppercase tracking-wide opacity-80">{({ message: 'Message Check', link: 'Link Check', photo: 'Photo Check' })[result.type]}</span><h2 className="font-display text-xl sm:text-2xl font-bold leading-snug mt-0.5">{result.title}</h2><p className="text-sm mt-1 leading-relaxed opacity-90">{result.subtitle}</p></div>
                </div>
                <div className="sm:w-44 shrink-0 bg-white/80 rounded-xl p-3 border border-black/5">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5"><span className="text-muted">Confidence</span><span className="text-ink">{result.confidence}% confident</span></div>
                  <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${palette.bar}`} style={{ width: `${result.confidence}%` }} /></div>
                </div>
              </div>
              <div className="space-y-4">{result.type === 'message' ? renderMessageSpecific() : result.type === 'link' ? renderLinkSpecific() : renderPhotoSpecific()}</div>
              <div className="rounded-2xl bg-[#FAF9F7] border border-hairline p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-ink">Why we think this</h3>
                <ul className="space-y-2.5 text-sm text-ink/90 leading-relaxed">{result.reasons.map((reason) => <li key={reason} className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0"></span><span>{reason}</span></li>)}</ul>
              </div>
              <div className={`rounded-2xl p-5 border flex items-start gap-3.5 ${palette.advice}`}>
                <Icon name="info" className="w-5 h-5 mt-0.5 shrink-0" /><div><h3 className="font-display text-sm font-bold text-ink">What you should do</h3><p className="text-sm text-ink/85 mt-1 leading-relaxed">{result.advice}</p></div>
              </div>
              <div className="pt-2 flex justify-center sm:justify-start"><button type="button" onClick={resetToInput} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-ink bg-[#FAF9F7] hover:bg-gray-100 border border-hairline transition cursor-pointer"><Icon name="back" className="w-4 h-4 text-muted" /><span>Check something else</span></button></div>
            </div>
          )}
        </section>

        <section className="max-w-[780px] mx-auto mt-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-display text-sm font-semibold text-muted uppercase tracking-wider">Recent Checks</h2>
            {recentChecks.length > 0 && <button type="button" onClick={() => { setRecentChecks([]); showToast('Recent checks cleared.') }} className="text-xs font-medium text-muted hover:text-ink transition cursor-pointer">Clear</button>}
          </div>
          <div className="bg-white rounded-2xl border border-hairline shadow-subtle divide-y divide-hairline overflow-hidden">
            {recentChecks.length === 0 ? <div className="p-6 text-center text-sm text-muted">Your recent checks from this visit will appear right here.</div> : recentChecks.map((item) => (
              <button key={item.id} type="button" onClick={() => restoreRecent(item)} className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-[#FAF9F7] transition flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-xl bg-[#FAF9F7] border border-hairline flex items-center justify-center shrink-0"><Icon name={item.type} className="w-4 h-4 text-muted" /></div><span className="text-sm text-ink truncate">{item.snippet}</span></div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${item.result.status === 'safe' ? 'bg-safe-bg text-safe-text border-safe-border' : item.result.status === 'caution' ? 'bg-caution-bg text-caution-text border-caution-border' : 'bg-danger-bg text-danger-text border-danger-border'}`}>{item.result.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="max-w-[780px] mx-auto mt-16 sm:mt-20 pt-10 border-t border-hairline">
          <div className="text-center mb-8"><h2 className="font-display text-xl sm:text-2xl font-bold text-ink">How ClearCheck works</h2><p className="text-sm text-muted mt-1.5">Simple, calm protection in three quick steps.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              ['1. Share what you got', "Paste a text, drop in a link, or pick a photo you're unsure about. No sign-up required.", 'message'],
              ['2. Smart AI review', 'Our AI gently looks for common scam tricks, fake lookalike websites, and AI photo clues.', 'search'],
              ['3. Clear, calm advice', 'Get a straightforward answer in everyday language, plus helpful tips on what to do next.', 'check'],
            ].map(([title, copy, icon]) => (
              <div key={title} className="text-center sm:text-left space-y-2.5"><div className="w-10 h-10 mx-auto sm:mx-0 rounded-xl bg-white border border-hairline shadow-subtle flex items-center justify-center text-brand"><Icon name={icon} className="w-5 h-5" /></div><h3 className="font-display text-base font-semibold text-ink">{title}</h3><p className="text-sm text-muted leading-relaxed">{copy}</p></div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline bg-white/60 py-7">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted"><p><span className="font-semibold text-ink">ClearCheck</span> — Designed for everyday digital safety.</p><p>Always verify urgent financial requests using official phone numbers.</p></div>
      </footer>

      {privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/35 backdrop-blur-[2px]" onClick={(event) => event.target === event.currentTarget && setPrivacyOpen(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-hairline shadow-soft space-y-4 animate-gentle-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-safe-bg border border-safe-border flex items-center justify-center text-safe-text"><Icon name="lock" className="w-5 h-5" /></div><div><h3 className="font-display text-lg font-bold text-ink">Your privacy comes first</h3><p className="text-xs text-muted">Simple, private, and stress-free</p></div></div>
              <button type="button" onClick={() => setPrivacyOpen(false)} className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-gray-100 transition cursor-pointer" aria-label="Close"><Icon name="close" className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>Checking a suspicious text, link, or photo shouldn't feel risky. Everything you test in ClearCheck stays private to your session.</p>
              <ul className="space-y-2 text-ink/90">{['No account, phone number, or email is needed to use ClearCheck.','Links are inspected safely without opening them on your phone or computer.','Your recent checks list stays only in this browser tab and clears whenever you want.'].map((copy) => <li key={copy} className="flex items-start gap-2.5"><span className="text-safe-text font-bold mt-0.5">&#10003;</span><span>{copy}</span></li>)}</ul>
            </div>
            <div className="pt-2"><button type="button" onClick={() => setPrivacyOpen(false)} className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition cursor-pointer">Sounds good</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
