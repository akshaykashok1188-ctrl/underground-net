import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [myId, setMyId] = useState("");
  const [logs, setLogs] = useState([]); 
  const scrollRef = useRef(null);
  const logScrollRef = useRef(null);

  // --- SOUNDS ---
  const playPop = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    audio.volume = 0.2;
    audio.play().catch(() => {}); 
  };

  const playType = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2544/2544-preview.mp3"); 
    audio.volume = 0.3;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  // --- SETUP ---
  useEffect(() => {
    const savedId = localStorage.getItem("underground_id") || "PROJECT_MAYHEM_" + Math.floor(100 + Math.random() * 900);
    localStorage.setItem("underground_id", savedId);
    setMyId(savedId);

    // --- PHILOSOPHY / RESISTANCE QUOTES ---
    const resistanceQuotes = [
      { text: "It's only after we've lost everything that we're free to do anything.", author: "TYLER" },
      { text: "The things you own end up owning you.", author: "DURDEN" },
      { text: "I am a cage, in search of a bird.", author: "KAFKA" },
      { text: "To go wrong in one's own way is better than to go right in someone else's.", author: "DOSTOEVSKY" },
      { text: "No need to hurry. No need to sparkle. Just be.", author: "WOOLF" },
      { text: "The individual has always had to struggle to keep from being overwhelmed by the tribe.", author: "NIETZSCHE" },
      { text: "Man is the only creature who refuses to be what he is.", author: "CAMUS" },
      { text: "If you want to save the world, you must save it from the system.", author: "UNKNOWN" },
      { text: "This is your life, and it's ending one minute at a time.", author: "FIGHT CLUB" },
      { text: "Pain is the price of being alive.", author: "PLATH" }
    ];

    const interval = setInterval(() => {
      const randomQ = resistanceQuotes[Math.floor(Math.random() * resistanceQuotes.length)];
      
      // Creating the log line with Quote and Author
      const newLog = "> " + randomQ.text + " [" + randomQ.author + "]";
      
      setLogs(prev => [...prev.slice(-8), newLog]); 
      if (logScrollRef.current) logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  // --- FIREBASE LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      setMessages((prev) => {
        if (prev.length > 0 && data.length > prev.length) {
          const lastMsg = data[data.length - 1];
          if (lastMsg.userId !== myId) playPop();
        }
        return data;
      });
      
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [myId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText; 
    setInputText(""); 

    try {
      await addDoc(collection(db, "chats"), {
        text: textToSend,
        userId: myId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    playType();
  };

  return (
    <div className="min-h-screen bg-black text-[#4ade80] font-mono flex overflow-hidden relative">
      
      {/* GRID BACKGROUND (Subtle) */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />

      {/* --- LEFT SIDE: MAIN TERMINAL --- */}
      <div className="flex-1 flex flex-col p-4 border-r border-[#4ade80]/30 relative z-10">
        
        {/* HEADER: Old School Minimalist */}
        <header className="border-b border-[#4ade80] pb-2 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">UNDERGROUND_NET</h1>
            <div className="text-xs mt-1 opacity-70">USER_SYSTEM: {myId}</div>
          </div>
          <div className="text-xs bg-[#4ade80] text-black px-1 font-bold">CONN: SECURE</div>
        </header>

        {/* CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <div className="text-[10px] opacity-50 mb-1">
                {msg.userId === myId ? ">> ORIGIN: YOU" : ">> PEER: " + msg.userId}
              </div>
              {/* SHARP GREEN TEXT (No Glow) */}
              <p className="text-lg md:text-xl font-bold leading-relaxed break-words text-[#4ade80]">
                {msg.text}
              </p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* INPUT AREA: Flat, No Glow */}
        <div className="mt-4 flex gap-2 border-t border-[#4ade80] pt-4">
          <span className="text-xl animate-pulse">{">"}</span>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="INITIATE PROTOCOL..."
            className="flex-1 bg-transparent text-xl outline-none text-[#4ade80] placeholder:text-[#4ade80]/30 uppercase font-bold"
            autoFocus
          />
          <button
            onClick={sendMessage}
            className="border border-[#4ade80] px-6 hover:bg-[#4ade80] hover:text-black transition-colors font-bold uppercase text-sm"
          >
            ENTER
          </button>
        </div>
      </div>

      {/* --- RIGHT SIDE: RESISTANCE FEED (Visible on Desktop) --- */}
      <div className="hidden md:flex w-1/3 flex-col p-4 bg-black text-xs text-[#4ade80] font-mono border-l border-[#4ade80]/20 z-0">
        <h2 className="border-b border-[#4ade80]/30 mb-2 pb-1 uppercase tracking-widest opacity-50">
          RESISTANCE_LOGS
        </h2>
        
        {/* Quotes will appear here instead of Sync Packets */}
        <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-3" ref={logScrollRef}>
          {logs.map((log, i) => (
            <div key={i} className="opacity-70 border-l border-[#4ade80]/40 pl-2 italic">
              {log}
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-2 border-t border-[#4ade80]/20 text-[10px] text-center opacity-40">
           WE ARE THE ALL SINGING, ALL DANCING CRAP OF THE WORLD.
        </div>
      </div>

    </div>
  );
}