const { useState, useRef, useEffect } = React;

function Avatar({ celeb, size = 44, ring = true }) {
  const [imgError, setImgError] = useState(false);
  const showImg = celeb.image && !imgError;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, border: ring ? `2.5px solid ${celeb.color}99` : "none", boxShadow: ring ? `0 0 14px ${celeb.color}55` : "none", background: showImg ? "#000" : `linear-gradient(135deg, ${celeb.color}cc, ${celeb.color}44)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {showImg
        ? <img src={celeb.image} alt={celeb.name} onError={() => setImgError(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        : <span style={{ fontSize: size * 0.42 }}>{celeb.emoji}</span>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="typing-dots">
      {[0, 1, 2].map(i => (
        <div key={i} className="spinner-dot" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

function Message({ msg, celeb, onCopy, onRegenerate, onSpeak, speaking }) {
  const isUser = msg.role === "user";
  return (
    <div className={`message-row ${isUser ? "user" : "bot"}`}>
      {!isUser && <Avatar celeb={celeb} size={36} ring />}
      {isUser && <div className="user-avatar">You</div>}
      <div className={`message-content ${isUser ? "user" : "bot"}`}>
        {!isUser && <span className="message-sender-name" style={{ color: celeb.color }}>{celeb.name}</span>}
        <div className={`message-bubble ${isUser ? "user" : "bot"}`} style={isUser ? { background: `linear-gradient(135deg, ${celeb.color}cc, ${celeb.color}88)` } : {}}>
          {msg.content}
        </div>
        {!isUser && (
          <div className="message-actions">
            <button className="action-btn" onClick={() => onSpeak(msg.content)} title="Listen" style={{ background: speaking ? celeb.color : "rgba(255,255,255,0.3)" }}>{speaking ? "🔊" : "🔈"}</button>
            <button className="action-btn" onClick={() => onCopy(msg.content)} title="Copy" style={{ background: "rgba(255,255,255,0.3)" }}>📋</button>
            {onRegenerate && <button className="action-btn" onClick={onRegenerate} title="Regenerate" style={{ background: "rgba(255,255,255,0.3)" }}>🔄</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onResume, onDelete, onClose, onClearAll }) {
  return (
    <div className="history-overlay">
      <div className="history-backdrop" onClick={onClose} />
      <div className="history-panel">
        <div className="history-panel-header">
          <div>
            <div className="history-panel-title">📋 Chat History</div>
            <div className="history-panel-count">{history.length} conversation{history.length !== 1 ? "s" : ""} saved</div>
          </div>
          <div className="history-panel-actions">
            {history.length > 0 && <button className="clear-all-btn" onClick={onClearAll}>Clear All</button>}
            <button className="history-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">💬</div>
              No conversations yet.<br />Start chatting with a celebrity!
            </div>
          ) : (
            [...history].reverse().map(session => {
              const lastMsg = session.messages[session.messages.length - 1];
              const preview = lastMsg?.content?.slice(0, 60) + (lastMsg?.content?.length > 60 ? "..." : "");
              return (
                <div key={session.id} className="history-session-card" style={{ border: `1px solid ${session.celeb.color}33` }}>
                  <div className="history-session-header">
                    <Avatar celeb={session.celeb} size={38} ring />
                    <div className="history-session-info">
                      <div className="history-session-name">{session.celeb.name}</div>
                      <div className="history-session-meta">{session.messages.length} messages • {timeAgo(session.updatedAt)}</div>
                    </div>
                    <button className="history-delete-btn" onClick={() => onDelete(session.id)}>🗑️</button>
                  </div>
                  <div className="history-preview">"{preview}"</div>
                  <button className="history-resume-btn" onClick={() => onResume(session)} style={{ background: `${session.celeb.color}22`, borderTop: `1px solid ${session.celeb.color}22`, color: session.celeb.color }}>
                    ▶ Resume Conversation
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function CelebCard({ celeb, onClick, hasHistory }) {
  return (
    <button className="celeb-card" onClick={onClick} style={{ border: `1px solid ${celeb.color}33` }}>
      {hasHistory && <div className="celeb-history-dot" />}
      <div className="celeb-card-row">
        <Avatar celeb={celeb} size={48} ring />
        <div>
          <div className="celeb-card-name">{celeb.name}</div>
          <div className="celeb-card-category" style={{ color: celeb.color }}>{celeb.category}</div>
        </div>
      </div>
    </button>
  );
}

function App() {
  const [stage, setStage]             = useState("select");
  const [customName, setCustomName]   = useState("");
  const [celeb, setCeleb]             = useState(null);
  const [celebrities, setCelebrities] = useState(CELEBRITIES);
  const [messages, setMessages]       = useState([]);
  const [sessionId, setSessionId]     = useState(null);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [imgLoading, setImgLoading]   = useState(false);
  const [speaking, setSpeaking]       = useState(false);
  const [listening, setListening]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [showBio, setShowBio]         = useState(true);
  const [ttsEnabled, setTtsEnabled]   = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadHistory().then(h => { setHistory(h); setHistoryLoaded(true); });
    CELEBRITIES.forEach(async (c, i) => {
      const img = await fetchWikiImage(c.name);
      if (img) setCelebrities(prev => prev.map((p, pi) => pi === i ? { ...p, image: img } : p));
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!sessionId || !celeb || messages.length < 2) return;
    setHistory(prev => {
      const existingIdx = prev.findIndex(s => s.id === sessionId);
      const session = { id: sessionId, celeb: { name: celeb.name, emoji: celeb.emoji, category: celeb.category, color: celeb.color, image: celeb.image }, messages, updatedAt: Date.now() };
      const updated = existingIdx >= 0 ? prev.map(s => s.id === sessionId ? session : s) : [...prev, session];
      saveHistory(updated);
      return updated;
    });
  }, [messages]);

  async function startChat(c, existingSession = null) {
    window.speechSynthesis.cancel();
    let finalCeleb = { ...c };
    if (!finalCeleb.image) {
      setImgLoading(true);
      const img = await fetchWikiImage(finalCeleb.name);
      if (img) finalCeleb.image = img;
      setImgLoading(false);
    }
    setCeleb(finalCeleb);
    if (existingSession) {
      setMessages(existingSession.messages);
      setSessionId(existingSession.id);
      setShowBio(false);
    } else {
      const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setSessionId(newId);
      setMessages([{ role: "assistant", content: `Hey! I'm ${finalCeleb.name}. Great to meet you! Feel free to ask me anything — in any language you're comfortable with. I'll respond the same way! 😊` }]);
      setShowBio(true);
    }
    setStage("chat");
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  async function handleCustomSearch() {
    if (!customName.trim()) return;
    const name = customName.trim();
    setCustomName("");
    await startChat({ name, emoji: "⭐", category: "Celebrity", color: "#a78bfa", bio: `AI-simulated persona of ${name}.`, questions: ["Tell me about yourself", "What are you most proud of?", "What's your philosophy in life?"] });
  }

  async function sendMessage(overrideInput) {
    const text = (overrideInput || input).trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await callClaudeAPI(newMessages, celeb);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (ttsEnabled) { setSpeaking(true); speakText(reply, () => setSpeaking(false)); }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function regenerate() {
    const lastUserIdx = [...messages].map((m, i) => m.role === "user" ? i : -1).filter(i => i !== -1).at(-1);
    if (lastUserIdx === -1 || loading) return;
    const msgsUpToUser = messages.slice(0, lastUserIdx + 1);
    setMessages(msgsUpToUser);
    setLoading(true);
    try {
      const reply = await callClaudeAPI(msgsUpToUser, celeb);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (ttsEnabled) { setSpeaking(true); speakText(reply, () => setSpeaking(false)); }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally { setLoading(false); }
  }

  function startListening() {
    recognitionRef.current = startSpeechRecognition(
      (transcript) => setInput(transcript),
      () => setListening(true),
      () => setListening(false)
    );
  }

  function stopListening() { recognitionRef.current?.stop(); setListening(false); }
  function copyText(text) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function handleSpeak(text) { setSpeaking(true); speakText(text, () => setSpeaking(false)); }
  function handleStopSpeaking() { stopSpeaking(); setSpeaking(false); }
  function toggleTts() { if (ttsEnabled) stopSpeaking(); setTtsEnabled(prev => !prev); }
  async function deleteSession(id) { const updated = history.filter(s => s.id !== id); setHistory(updated); await saveHistory(updated); }
  async function clearAll() { setHistory([]); await clearAllHistory(); }

  if (stage === "select") {
    const historyCelebNames = new Set(history.map(s => s.celeb.name));
    return (
      <div className="select-screen">
        <div className="select-hero">
          <button className="history-btn" onClick={() => setShowHistory(true)}>
            📋 History
            {history.length > 0 && <span className="history-badge">{history.length}</span>}
          </button>
          <div style={{ fontSize: "52px", marginBottom: "10px", filter: "drop-shadow(0 0 20px rgba(246,196,0,0.5))" }}>🎭</div>
          <h1>Celebrity AI Simulator</h1>
          <p>Chat with any celebrity — powered by AI.<br />They respond in <em>your language</em>, with their real personality.</p>
        </div>

        <div className="search-box">
          <div className="search-box-inner">
            <p className="search-label">🔍 Search any celebrity worldwide</p>
            <div className="search-row">
              <input className="search-input" value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustomSearch()} placeholder="e.g. Amitabh Bachchan, Steve Jobs, Messi..." />
              <button className="search-btn" onClick={handleCustomSearch} disabled={imgLoading}>
                {imgLoading ? <span className="loading-spinner" /> : "Chat →"}
              </button>
            </div>
          </div>
        </div>

        {historyLoaded && history.length > 0 && (
          <div className="recent-section">
            <div className="recent-header">
              <p className="recent-label">🕐 Recent Conversations</p>
              <button className="view-all-btn" onClick={() => setShowHistory(true)}>View All →</button>
            </div>
            <div className="recent-strip">
              {[...history].reverse().slice(0, 4).map(session => (
                <button key={session.id} className="recent-card" style={{ border: `1px solid ${session.celeb.color}33` }} onClick={() => startChat(session.celeb, session)}>
                  <Avatar celeb={session.celeb} size={32} ring />
                  <div className="recent-card-name">{session.celeb.name}</div>
                  <div className="recent-card-time">{timeAgo(session.updatedAt)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="celeb-grid-section">
          <p className="celeb-grid-label">— Or pick a popular celebrity —</p>
          <div className="celeb-grid">
            {celebrities.map(c => <CelebCard key={c.name} celeb={c} onClick={() => startChat(c)} hasHistory={historyCelebNames.has(c.name)} />)}
          </div>
        </div>

        <p className="footer-note">AI-generated personas for entertainment only</p>

        {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} onResume={s => { setShowHistory(false); startChat(s.celeb, s); }} onDelete={deleteSession} onClearAll={clearAll} />}
      </div>
    );
  }

  const lastAssistantIdx = [...messages].map((m, i) => m.role === "assistant" ? i : -1).filter(i => i !== -1).at(-1);

  return (
    <div className="chat-screen">
      <style>{`.input-box:focus { border-color: ${celeb.color}88 !important; box-shadow: 0 0 0 3px ${celeb.color}22 !important; }`}</style>

      <div className="chat-header" style={{ borderBottom: `1px solid ${celeb.color}22` }}>
        <button className="chat-header-back" onClick={() => { setStage("select"); window.speechSynthesis.cancel(); }}>←</button>
        <Avatar celeb={celeb} size={44} ring />
        <div className="chat-header-info">
          <div className="chat-header-name">{celeb.name}</div>
          <div className="chat-header-sub" style={{ color: celeb.color }}>{celeb.category} • AI Persona</div>
        </div>
        <button className="chat-header-btn" onClick={toggleTts} style={{ background: ttsEnabled ? `${celeb.color}33` : "rgba(255,255,255,0.08)", border: `1px solid ${ttsEnabled ? celeb.color + "44" : "transparent"}` }}>{ttsEnabled ? "🔊" : "🔇"}</button>
        <button className="chat-header-btn" onClick={() => setShowHistory(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none" }}>📋</button>
        <button className="chat-header-btn" onClick={() => setShowBio(p => !p)} style={{ background: "rgba(255,255,255,0.08)", border: "none" }}>ℹ️</button>
        <div className="online-dot" />
      </div>

      {showBio && (
        <div className="bio-card" style={{ background: `linear-gradient(135deg, ${celeb.color}18, ${celeb.color}08)`, border: `1px solid ${celeb.color}33` }}>
          <div className="bio-card-inner">
            <Avatar celeb={celeb} size={72} ring />
            <div className="bio-card-content">
              <div className="bio-card-header">
                <div>
                  <div className="bio-card-name">{celeb.name}</div>
                  <div className="bio-card-category" style={{ color: celeb.color }}>{celeb.category}</div>
                  <p className="bio-card-bio">{celeb.bio}</p>
                </div>
                <button className="bio-card-close" onClick={() => setShowBio(false)}>✕</button>
              </div>
            </div>
          </div>
          {celeb.questions && (
            <div className="bio-questions">
              {celeb.questions.map(q => (
                <button key={q} className="bio-question-btn" onClick={() => { setShowBio(false); sendMessage(q); }} style={{ background: `${celeb.color}22`, border: `1px solid ${celeb.color}44` }}>{q}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={i} className="msg-in">
            <Message msg={msg} celeb={celeb} onCopy={copyText} onRegenerate={i === lastAssistantIdx ? regenerate : null} onSpeak={handleSpeak} speaking={speaking && i === lastAssistantIdx} />
          </div>
        ))}
        {loading && (
          <div className="typing-row">
            <Avatar celeb={celeb} size={36} ring />
            <div className="typing-bubble"><Spinner /></div>
          </div>
        )}
        {copied && <div className="copied-toast">✓ Copied!</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-area" style={{ borderTop: `1px solid ${celeb.color}22` }}>
        {speaking && (
          <div className="stop-speaking-bar">
            <button className="stop-speaking-btn" onClick={handleStopSpeaking}>⏹ Stop Speaking</button>
          </div>
        )}
        <div className="input-row">
          <button className="mic-btn" onClick={listening ? stopListening : startListening} style={{ background: listening ? `${celeb.color}44` : "rgba(255,255,255,0.08)", border: `1px solid ${listening ? celeb.color : "rgba(255,255,255,0.1)"}` }}>
            {listening ? "⏹" : "🎤"}
          </button>
          <input ref={inputRef} className="input-box" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder={listening ? "Listening..." : `Ask ${celeb.name} anything...`} disabled={loading} />
          <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ background: (loading || !input.trim()) ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${celeb.color}, ${celeb.color}aa)`, color: (loading || !input.trim()) ? "rgba(255,255,255,0.3)" : "#000" }}>➤</button>
        </div>
        <p className="input-footer-note">Speak or type in any language • AI-generated persona for entertainment only</p>
      </div>

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} onResume={s => { setShowHistory(false); startChat(s.celeb, s); }} onDelete={deleteSession} onClearAll={clearAll} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));