import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc } from "firebase/firestore"

function App() {
  const [activeTab, setActiveTab] = useState("wall")
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false) 

  const [newContent, setNewContent] = useState("")
  const [recipient, setRecipient] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("hacker_username")
    if (savedUser) {
      setUsername(savedUser)
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
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

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError("")
    
    if (!username.trim() || !password.trim()) {
      setAuthError("CREDENTIALS_REQUIRED")
      return
    }

    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)

    if (isRegistering) {
      if (userSnap.exists()) {
        setAuthError("CODENAME_ALREADY_TAKEN")
      } else {
        await setDoc(userRef, { 
          name: username, 
          password: password, 
          joinedAt: serverTimestamp() 
        })
        completeLogin()
      }
    } else {
      if (userSnap.exists()) {
        if (userSnap.data().password === password) {
          completeLogin()
        } else {
          setAuthError("ACCESS_DENIED: WRONG PASSWORD")
        }
      } else {
        setAuthError("USER_NOT_FOUND. SWITCH TO REGISTER?")
      }
    }
  }

  const completeLogin = () => {
    localStorage.setItem("hacker_username", username)
    setIsLoggedIn(true)
    setAuthError("")
  }

  const handleLogout = () => {
    localStorage.removeItem("hacker_username")
    setIsLoggedIn(false)
    setUsername("")
    setPassword("")
    setRecipient(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newContent.trim()) return
    if (activeTab === "wall") {
      await addDoc(collection(db, "posts"), { content: newContent, user: username, createdAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, "messages"), { text: newContent, user: username, to: recipient, createdAt: serverTimestamp() })
    }
    setNewContent("")
  }

  const filteredMessages = messages.filter(msg => recipient === null ? !msg.to : (msg.user === username && msg.to === recipient) || (msg.user === recipient && msg.to === username))

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 font-mono">
        <div className="w-full max-w-md p-8 border border-green-500/50 bg-green-900/10 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
          <h1 className="text-3xl mb-6 font-bold text-center tracking-widest text-green-500">
            {isRegistering ? "NEW_AGENT_REGISTRATION" : "SECURE_NET_ACCESS"}
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-widest opacity-70">Codename</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-black border-b border-green-500 p-2 outline-none text-lg focus:border-white transition-colors"
                placeholder="ENTER_ID..." 
              />
            </div>
            
            <div>
              <label className="text-xs uppercase tracking-widest opacity-70">Passcode</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-black border-b border-green-500 p-2 outline-none text-lg focus:border-white transition-colors"
                placeholder="**" 
              />
            </div>

            {authError && (
              <div className="text-red-500 text-xs font-bold border border-red-500/50 p-2 bg-red-900/10 text-center">
                {"ERROR: " + authError}
              </div>
            )}

            <button className="w-full border border-green-500 py-3 bg-green-900/20 hover:bg-green-500 hover:text-black font-bold tracking-widest transition-all">
              {isRegistering ? "INITIALIZE_IDENTITY" : "AUTHENTICATE"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} 
              className="text-xs text-green-600 hover:text-green-400 underline underline-offset-4"
            >
              {isRegistering ? "[ RETURN TO LOGIN ]" : "[ CREATE NEW IDENTITY ]"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-green-400 font-mono overflow-hidden">
      <div className="w-1/4 border-r border-green-900 flex flex-col bg-zinc-950 justify-between">
        <div>
          <div className="p-4 border-b border-green-900 font-bold text-xs truncate text-green-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {"AGENT: " + username}
          </div>
          <div className="flex flex-col p-2 space-y-2">
            <button onClick={() => setActiveTab("wall")} className={"text-left p-3 text-[10px] " + (activeTab === "wall" ? "bg-green-900/30 border-l-2 border-green-500" : "opacity-40")}>[PUBLIC_WALL]</button>
            <button onClick={() => setActiveTab("chat")} className={"text-left p-3 text-[10px] " + (activeTab === "chat" ? "bg-green-900/30 border-l-2 border-green-500" : "opacity-40")}>[SECURE_CHAT]</button>
          </div>
          {activeTab === "chat" && (
            <div className="mt-4 border-t border-green-900 p-2 overflow-y-auto max-h-80">
              <div onClick={() => setRecipient(null)} className={"p-2 text-[10px] cursor-pointer " + (recipient === null ? "text-white" : "opacity-40")}># GLOBAL_CHAT</div>
              {users.filter(u => u.name !== username).map(u => (
                <div key={u.name} onClick={() => setRecipient(u.name)} className={"p-2 text-[10px] cursor-pointer " + (recipient === u.name ? "text-white" : "opacity-40")}>{"@ " + u.name}</div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={handleLogout} className="p-4 border-t border-green-900 text-red-500 hover:bg-red-900/20 text-[10px] font-bold text-left transition-colors">
          [ ABORT_SESSION ]
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-green-900 bg-black font-bold text-[10px] uppercase tracking-widest text-green-600">
          {activeTab === "wall" ? "Data Stream // The Wall" : (recipient ? "Encrypted Conn // " + recipient : "Global Network")}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "wall" ? (
            posts.map(post => (
              <div key={post.id} className="border border-green-900/50 p-4 bg-green-950/5">
                <div className="text-[9px] text-green-700 mb-2 font-bold uppercase tracking-tighter">{"Source: " + post.user + " // Broadcasted"}</div>
                <div className="text-sm leading-relaxed text-green-300">{post.content}</div>
              </div>
            ))
          ) : (
            filteredMessages.map(msg => (
              <div key={msg.id} className={"flex flex-col " + (msg.user === username ? "items-end" : "items-start")}>
                <div className="text-[8px] opacity-30 mb-1">{msg.user}</div>
                <div className="bg-green-900/10 border border-green-900/30 p-2 text-xs max-w-[70%]">{msg.text}</div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t border-green-900 bg-black">
          <div className="flex gap-2">
            <input 
              value={newContent} 
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 bg-black border border-green-800 p-2 outline-none text-xs text-green-400"
              placeholder={activeTab === "wall" ? "WHISPER TO THE NETWORK..." : "ENCRYPT_MESSAGE..."}
            />
            <button className="bg-green-900/40 px-6 border border-green-600 text-[10px] font-bold">SEND</button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default App