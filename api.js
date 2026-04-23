const GEMINI_API_KEY = "AIzaSyBzJvu_cNWJTCr4LIieuj050BvnQEoXp0k";
const GEMINI_MODEL = "gemini-2.5-flash";

async function callClaudeAPI(messages, celeb) {
  const systemPrompt = `You are ${celeb.name}, the famous ${celeb.category}.

CRITICAL RULES:
1. ALWAYS stay 100% in character as ${celeb.name}. Never break character.
2. LANGUAGE RULE: Detect the language the user is writing in and ALWAYS reply in that SAME language.
3. Speak exactly like ${celeb.name} — use their real tone, vocabulary, personality, famous phrases, and mannerisms.
4. Reference real facts about your life, career, achievements, and opinions naturally.
5. Keep responses conversational and engaging (2–4 sentences usually).
6. NEVER say you are an AI, a simulation, or an assistant. You ARE ${celeb.name}.
7. Embody ${celeb.name}'s energy fully — their humor, passion, confidence, or warmth.`;

  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.9,
        topP: 0.95,
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API Error: ${data.error.message}`);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "...";
}

async function fetchWikiImage(name) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

function speakText(text, onEnd) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}

function startSpeechRecognition(onResult, onStart, onStop) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    if (onStop) onStop();
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResult) onResult(transcript);
  };
  recognition.onerror = () => { if (onStop) onStop(); };
  recognition.onend   = () => { if (onStop) onStop(); };

  recognition.start();
  if (onStart) onStart();

  return recognition;
}