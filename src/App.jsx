import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, setDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"

function App() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [recipient, setRecipient] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("hacker_username")
    if (savedUser) {
      setUsername(savedUser)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()))
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (username.trim()) {
      setIsLoggedIn(true)
      localStorage.setItem("hacker_username", username)
      await setDoc(doc(db, "users", username), {
        name: username,
        status: "online"
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("hacker_username")
    setIsLoggedIn(false)
    setUsername("")
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      user: username,
      to: recipient,
      createdAt: serverTimestamp()
    })
    setNewMessage("")
  }

  const filteredMessages = messages.filter(msg => {
    if (recipient === null) {
      return !msg.to
    } else {
      return (msg.user === username && msg.to === recipient) || 
             (msg.user === recipient && msg.to === username)
    }
  })

  const glowStyle = { textShadow: "0 0 10px rgba(74, 222, 128, 0.7)" }
  const borderGlow = { boxShadow: "0 0 15px rgba(74, 222, 128, 0.2), inset 0 0 10px rgba(74, 222, 128, 0.1)" }
  
  const scanlineLayer = (
    <div className="pointer-events-none fixed inset-0 z-50 opacity-20" 
         style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }}>
    </div>
  )

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 font-mono relative overflow-hidden">
        {scanlineLayer}
        <form onSubmit={handleLogin} className="p-10 border border-green-500 rounded-none bg-black/90 z-10 max-w-md w-full" style={borderGlow}>
          <h1 className="text-4xl mb-8 font-bold tracking-widest text-center animate-pulse" style={glowStyle}>SYSTEM ACCESS</h1>
          <div className="space-y-6">
            <div>
              <label className="text-xs tracking-widest text-green-600 block mb-2">IDENTIFICATION</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER CODENAME..."
                className="w-full bg-black border-b border-green-500 p-2 outline-none text-xl placeholder-green-900 focus:text-green-300 transition"
                style={{ ...glowStyle, caretColor: "#4ade80" }}
              />
            </div>
            <button type="submit" className="w-full bg-green-900/20 border border-green-500 text-green-400 py-3 font-bold hover:bg-green-500 hover:text-black transition duration-300 tracking-widest uppercase text-sm">
              Initialize Uplink
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-green-400 font-mono overflow-hidden relative">
      {scanlineLayer}
      
      <div className="w-1/3 border-r border-green-800 flex flex-col bg-black/50 z-10 backdrop-blur-sm">
        <div className="p-4 border-b border-green-800 bg-green-900/10 flex justify-between items-center">
          <div>
            <h2 className="font-bold tracking-[0.2em] text-xs text-green-600 mb-1">CURRENT USER</h2>
            <div className="text-xl font-bold truncate" style={glowStyle}>{username}</div>
          </div>
          <button onClick={handleLogout} className="text-[10px] border border-red-500 text-red-500 px-2 py-1 hover:bg-red-500 hover:text-black transition">
            EXIT
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] text-green-700 tracking-widest mt-4 mb-2">CHANNELS</div>
          
          <div 
            onClick={() => setRecipient(null)}
            className={"px-4 py-3 cursor-pointer hover:bg-green-900/20 transition flex items-center gap-3 " + (recipient === null ? "bg-green-900/30 border-r-2 border-green-500" : "opacity-70")}
          >
            <span className="text-lg">#</span>
            <span className="font-bold tracking-wider">GLOBAL_NET</span>
          </div>

          <div className="px-4 py-2 text-[10px] text-green-700 tracking-widest mt-6 mb-2">OPERATIVES_ONLINE</div>
          {users.filter(u => u.name !== username).map((u) => (
            <div 
              key={u.name}
              onClick={() => setRecipient(u.name)}
              className={"px-4 py-3 cursor-pointer hover:bg-green-900/20 transition flex items-center gap-3 " + (recipient === u.name ? "bg-green-900/30 border-r-2 border-green-500" : "opacity-70")}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
              <span className="font-bold tracking-wider">{u.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
        <div className="p-4 border-b border-green-800 bg-black/90 flex justify-between items-center shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
          <div>
            <div className="text-[10px] text-green-700 tracking-widest mb-1">TARGET_CONNECTION</div>
            <h2 className="text-2xl font-bold tracking-widest" style={glowStyle}>
              {recipient ? recipient.toUpperCase() : "GLOBAL_NET"}
            </h2>
          </div>
          <div className="text-[10px] border border-green-800 px-3 py-1 text-green-600 animate-pulse">ENCRYPTED_V2</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {filteredMessages.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 text-sm tracking-widest">
              AWAITING DATA TRANSMISSION...
            </div>
          )}
          
          {filteredMessages.map((msg) => {
            const isMe = msg.user === username;
            return (
              <div key={msg.id} className={"flex flex-col " + (isMe ? "items-end" : "items-start")}>
                <span className="text-[9px] text-green-800 mb-1 tracking-widest uppercase px-1">{msg.user}</span>
                <div 
                  className={"max-w-[80%] px-5 py-3 text-sm relative group transition-all duration-300 " + (isMe ? "bg-green-900/20 border border-green-600 text-green-300 rounded-sm" : "bg-gray-900/50 border border-gray-700 text-gray-400 rounded-sm")} 
                  style={isMe ? { boxShadow: "0 0 10px rgba(34, 197, 94, 0.1)" } : {}}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-black border-t border-green-900">
          <div className="flex gap-0 border border-green-700 bg-black relative" style={borderGlow}>
            <span className="px-3 py-3 text-green-700 select-none font-bold">{">"}</span>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-900"
              placeholder="Inject payload..."
              autoFocus
            />
            <button type="submit" className="px-6 bg-green-900/30 hover:bg-green-500 hover:text-black transition text-xs font-bold tracking-widest border-l border-green-700">
              SEND
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App