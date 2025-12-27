import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc } from "firebase/firestore"

function App() {
  // --- STATES ---
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false) 

  // New Chat States
  const [chatMode, setChatMode] = useState("GLOBAL") // GLOBAL or PRIVATE
  const [recipient, setRecipient] = useState(null) // For private chat

  // Separate inputs for Wall and Chat
  const [postContent, setPostContent] = useState("")
  const [chatContent, setChatContent] = useState("")

  // --- EFFECTS ---
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

  // --- AUTH FUNCTIONS ---
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
  }

  // --- SUBMIT FUNCTIONS ---
  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!postContent.trim()) return
    await addDoc(collection(db, "posts"), { 
      content: postContent, 
      user: username, 
      createdAt: serverTimestamp() 
    })
    setPostContent("")
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatContent.trim()) return
    
    // Determine target
    const toUser = chatMode === "PRIVATE" ? recipient : null
    
    await addDoc(collection(db, "messages"), { 
      text: chatContent, 
      user: username, 
      to: toUser, // If null, it's global
      createdAt: serverTimestamp() 
    })
    setChatContent("")
  }

  // Filter messages based on mode
  const displayedMessages = messages.filter(msg => {
    if (chatMode === "GLOBAL") {
      return !msg.to // Show only messages with no recipient
    } else {
      // Private mode: Show messages between me and recipient
      if (!recipient) return false
      return (msg.user === username && msg.to === recipient) || (msg.user === recipient && msg.to === username)
    }
  })

  // --- LOGIN SCREEN ---
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
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border-b border-green-500 p-2 outline-none text-lg focus:border-white transition-colors" placeholder="ENTER_ID..." />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest opacity-70">Passcode</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border-b border-green-500 p-2 outline-none text-lg focus:border-white transition-colors" placeholder="**" />
            </div>
            {authError && <div className="text-red-500 text-xs font-bold border border-red-500/50 p-2 bg-red-900/10 text-center">{"ERROR: " + authError}</div>}
            <button className="w-full border border-green-500 py-3 bg-green-900/20 hover:bg-green-500 hover:text-black font-bold tracking-widest transition-all">{isRegistering ? "INITIALIZE_IDENTITY" : "AUTHENTICATE"}</button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }} className="text-xs text-green-600 hover:text-green-400 underline underline-offset-4">{isRegistering ? "[ RETURN TO LOGIN ]" : "[ CREATE NEW IDENTITY ]"}</button>
          </div>
        </div>
      </div>
    )
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="flex h-screen bg-black text-green-400 font-mono overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-1/5 border-r border-green-900/50 flex flex-col bg-zinc-950/50 hidden md:flex">
        <div className="p-6 border-b border-green-900/50">
          <div className="w-12 h-12 bg-green-900/30 rounded-full border border-green-500 flex items-center justify-center text-xl font-bold mb-2">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="font-bold text-lg tracking-wider text-white">{username}</div>
          <div className="text-[10px] text-green-600 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE_SECURE
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Navigation</div>
          <button className="w-full text-left p-2 bg-green-900/20 border-l-2 border-green-500 text-xs font-bold">[ PUBLIC_WALL ]</button>
          <button className="w-full text-left p-2 border-l-2 border-transparent text-xs opacity-50 cursor-not-allowed">[ MY_GROUPS ] (Locked)</button>
          <button className="w-full text-left p-2 border-l-2 border-transparent text-xs opacity-50 cursor-not-allowed">[ SETTINGS ] (Locked)</button>
        </div>

        <button onClick={handleLogout} className="p-4 text-red-500 hover:bg-red-900/10 text-xs font-bold border-t border-green-900/50 text-left">
          [ TERMINATE_SESSION ]
        </button>
      </div>

      {/* 2. CENTER STAGE (The Feed) */}
      <div className="flex-1 flex flex-col border-r border-green-900/50 bg-black relative">
        <div className="p-4 border-b border-green-900/50 bg-zinc-900/30">
          <form onSubmit={handlePostSubmit}>
            <textarea 
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full bg-black border border-green-800 p-3 outline-none text-sm text-green-300 placeholder-green-900 resize-none h-20"
              placeholder="TRANSMIT INTEL TO THE NETWORK..."
            />
            <div className="flex justify-end mt-2">
              <button className="bg-green-900/40 px-6 py-1 border border-green-600 text-[10px] font-bold hover:bg-green-500 hover:text-black transition-colors">BROADCAST</button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="border border-green-900/30 bg-green-950/5 p-4 relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-900 rounded-full flex items-center justify-center text-[10px] border border-green-700">{post.user.charAt(0).toUpperCase()}</div>
                  <span className="text-xs font-bold text-green-500">{post.user}</span>
                </div>
                <span className="text-[8px] text-green-800">ENCRYPTED_ID</span>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed pl-8">{post.content}</div>
              <div className="mt-3 pl-8 flex gap-4 text-[9px] text-green-800 font-bold uppercase">
                <span className="cursor-pointer hover:text-green-500">[ +1 VOUCH ]</span>
                <span className="cursor-pointer hover:text-green-500">[ COMMENT ]</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR (The Comm Link) */}
      <div className="w-1/4 flex flex-col bg-zinc-950/80">
        
        {/* Chat Header / Toggle */}
        <div className="flex border-b border-green-900/50">
          <button 
            onClick={() => setChatMode("GLOBAL")}
            className={"flex-1 p-3 text-[10px] font-bold uppercase " + (chatMode === "GLOBAL" ? "bg-green-900/30 text-white" : "text-green-800 hover:text-green-500")}
          >
            GLOBAL
          </button>
          <button 
            onClick={() => setChatMode("PRIVATE")}
            className={"flex-1 p-3 text-[10px] font-bold uppercase " + (chatMode === "PRIVATE" ? "bg-green-900/30 text-white" : "text-green-800 hover:text-green-500")}
          >
            INBOX
          </button>
        </div>
        
        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {chatMode === "PRIVATE" && !recipient ? (
            // User List for Private Chat
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 mb-2">SELECT AGENT TO MESSAGE:</div>
              {users.filter(u => u.name !== username).map(u => (
                <div 
                  key={u.name} 
                  onClick={() => setRecipient(u.name)} 
                  className="p-2 border border-green-900/30 hover:bg-green-900/20 cursor-pointer flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-400">{u.name}</span>
                </div>
              ))}
            </div>
          ) : (
            // Messages Display
            <>
              {chatMode === "PRIVATE" && recipient && (
                <button onClick={() => setRecipient(null)} className="text-[9px] text-green-600 mb-2 hover:text-white">
                  {"< BACK TO AGENT LIST"}
                </button>
              )}
              {displayedMessages.map(msg => (
                <div key={msg.id} className={"flex flex-col " + (msg.user === username ? "items-end" : "items-start")}>
                  <div className="text-[8px] text-green-700 font-bold mb-1">{msg.user}</div>
                  <div className={"p-2 text-xs max-w-[90%] " + (msg.user === username ? "bg-green-900/20 text-white border border-green-800" : "bg-black border border-green-900/50 text-green-400")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Chat Input */}
        {(chatMode === "GLOBAL" || (chatMode === "PRIVATE" && recipient)) && (
          <form onSubmit={handleChatSubmit} className="p-2 border-t border-green-900/50 bg-black flex gap-1">
            <input 
              value={chatContent}
              onChange={(e) => setChatContent(e.target.value)}
              className="flex-1 bg-zinc-900 border border-green-900 p-2 outline-none text-xs text-green-400 placeholder-green-900"
              placeholder={chatMode === "GLOBAL" ? "GLOBAL_BROADCAST..." : "PRIVATE_MSG..."}
            />
            <button className="bg-green-900 text-black px-3 font-bold text-xs hover:bg-green-500">
              {">"}
            </button>
          </form>
        )}
      </div>

    </div>
  )
}

export default App