const CELEBRITIES = [
  {
    name: "Shah Rukh Khan",
    emoji: "🎬",
    category: "Bollywood",
    color: "#f6c90e",
    bio: "King of Bollywood with 30+ years of iconic films. Known for romantic roles, witty humor, and motivational philosophy.",
    questions: ["What's your best romantic dialogue?", "How did you become King Khan?", "Tell me about Dilwale Dulhania Le Jayenge"]
  },
  {
    name: "Elon Musk",
    emoji: "🚀",
    category: "Tech Billionaire",
    color: "#00b4d8",
    bio: "CEO of Tesla & SpaceX. Visionary entrepreneur who wants to colonize Mars and revolutionize human transportation.",
    questions: ["What's your plan for Mars?", "Tell me about Tesla's future", "Why did you buy Twitter?"]
  },
  {
    name: "Virat Kohli",
    emoji: "🏏",
    category: "Cricket",
    color: "#22c55e",
    bio: "India's greatest modern batsman. Known for aggressive style, fitness obsession, and passionate on-field presence.",
    questions: ["What drives your passion for cricket?", "Tell me about your fitness routine", "What was your best innings?"]
  },
  {
    name: "Taylor Swift",
    emoji: "🎵",
    category: "Music",
    color: "#c084fc",
    bio: "Global pop icon and songwriter. Known for confessional lyrics, iconic Eras, and fiercely loyal Swiftie fanbase.",
    questions: ["Which era is your favorite?", "How do you write songs?", "Tell me about the Eras Tour"]
  },
  {
    name: "Narendra Modi",
    emoji: "🇮🇳",
    category: "Politics",
    color: "#f97316",
    bio: "Prime Minister of India. Known for 'Mann Ki Baat', digital India vision, and transforming India's global image.",
    questions: ["What is your vision for India?", "Tell me about Digital India", "How do you stay connected with people?"]
  },
  {
    name: "Cristiano Ronaldo",
    emoji: "⚽",
    category: "Football",
    color: "#ef4444",
    bio: "Greatest footballer of his generation. Five Ballon d'Or winner, famous for his SIUUU celebration.",
    questions: ["How do you stay at the top?", "Tell me about SIUUU!", "What motivates you every day?"]
  },
  {
    name: "Priyanka Chopra",
    emoji: "✨",
    category: "Global Star",
    color: "#f472b6",
    bio: "Miss World 2000 turned global actress and entrepreneur. Conquered Bollywood, Hollywood, and international business.",
    questions: ["How did you conquer Hollywood?", "What's your best advice for women?", "Tell me about your Miss World journey"]
  },
  {
    name: "Leonardo DiCaprio",
    emoji: "🎭",
    category: "Hollywood",
    color: "#fbbf24",
    bio: "Oscar-winning actor and environmental activist. Known for intense method acting and blockbuster films.",
    questions: ["Tell me about your Oscar journey", "Which role was most challenging?", "Why are you passionate about climate?"]
  }
];

const HISTORY_KEY = "celeb_chat_history";

async function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Storage save failed:", e);
  }
}

async function clearAllHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error("Storage clear failed:", e);
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}