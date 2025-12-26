import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc } from "firebase/firestore"

function App() {
  const [activeTab, setActiveTab] = useState("wall") // wall അല്ലെങ്കിൽ chat
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [newContent, setNewContent] = useState("")
  const [username, setUsername] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [recipient, setRecipient] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const savedUser = localStorage.getItem("hacker_username")
    if (savedUser) {
      setUsername(savedUser)
      setIsLoggedIn(true)
    }
  }, [])

  // Wall Posts (Facebook Wall) എടുക്കുന്നു
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
  }, [])

  // Private Messages എടുക്കുന്നു
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
      await setDoc(doc(db, "users", username), { name: username })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newContent.trim()) return

    if (activeTab === "wall") {
      // Wall-ൽ പോസ്റ്റ് ചെയ്യുന്നു
      await addDoc(collection(db, "posts"), {
        content: newContent,
        user: username,
        createdAt: serverTimestamp()
      })
    } else {
      // Private Chat അയക്കുന്നു
      await addDoc(collection(db, "messages"), {
        text: newContent,
        user: username,
        to: recipient,
        createdAt: serverTimestamp()
      })
    }
    setNewContent("")
  }

  const filteredMessages = messages.filter(msg => 
    recipient === null ? !msg.to : (msg.user === username && msg.to === recipient) || (msg.user === recipient && msg.to === username)
  )

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 font-mono">
        <form onSubmit={handleLogin} className="p-10 border border-green-500 w-full max-w-md">
          <h1 className="text-2xl mb-8 font-bold text-center tracking-tighter">NETWORK_LOGIN</h1>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="USERNAME..." className="w-full bg-black border-b border-green-500 p-2 outline-none mb-6" />
          <button className="w-full border border-green-500 py-3 hover:bg-green-500 hover:text-black font-bold">ACCESS</button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-1/4 border-r border-green-900 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-green-900 font-bold text-sm truncate">{username}</div>
        <div className="flex flex-col p-2 space-y-2">
          <button onClick={() => setActiveTab("wall")} className={"text-left p-3 text-xs " + (activeTab === "wall" ? "bg-green-900/30 border-l-2 border-green-500" : "opacity-50")}>[THE_WALL]</button>
          <button onClick={() => setActiveTab("chat")} className={"text-left p-3 text-xs " + (activeTab === "chat" ? "bg-green-900/30 border-l-2 border-green-500" : "opacity-50")}>[MESSAGES]</button>
        </div>
        {activeTab === "chat" && (
          <div className="mt-4 border-t border-green-900 p-2 overflow-y-auto">
            <div onClick={() => setRecipient(null)} className={"p-2 text-[10px] cursor-pointer " + (recipient === null ? "text-white" : "opacity-40")}># GLOBAL_CHAT</div>
            {users.filter(u => u.name !== username).map(u => (
              <div key={u.name} onClick={() => setRecipient(u.name)} className={"p-2 text-[10px] cursor-pointer " + (recipient === u.name ? "text-white" : "opacity-40")}>@ {u.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-green-900 bg-black font-bold text-xs uppercase tracking-widest">
          {activeTab === "wall" ? "Public Wall Feed" : (recipient ? "Chat with " + recipient : "Global Chat")}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "wall" ? (
            posts.map(post => (
              <div key={post.id} className="border border-green-900 p-4 bg-green-950/10">
                <div className="text-[10px] text-green-600 mb-2 font-bold uppercase">{post.user} posted:</div>
                <div className="text-sm leading-relaxed text-green-200">{post.content}</div>
              </div>
            ))
          ) : (
            filteredMessages.map(msg => (
              <div key={msg.id} className={"flex flex-col " + (msg.user === username ? "items-end" : "items-start")}>
                <div className="text-[8px] opacity-40 mb-1">{msg.user}</div>
                <div className="bg-green-900/20 border border-green-800 p-2 text-xs max-w-[70%]">{msg.text}</div>
              </div>
            ))
          )}
        </div>

        {/* INPUT BOX */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-green-900 bg-black">
          <div className="flex gap-2">
            <input 
              value={newContent} 
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 bg-black border border-green-800 p-2 outline-none text-sm"
              placeholder={activeTab === "wall" ? "What's on your mind?" : "Type message..."}
            />
            <button className="bg-green-900/50 px-6 border border-green-600 text-xs font-bold">SEND</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App