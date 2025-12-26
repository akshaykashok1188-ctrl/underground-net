import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc, setDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'

function App() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [recipient, setRecipient] = useState(null)

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
      await setDoc(doc(db, "users", username), {
        name: username,
        status: "online"
      })
    }
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
    setNewMessage('')
  }

  const filteredMessages = messages.filter(msg => {
    if (recipient === null) {
      return !msg.to
    } else {
      return (msg.user === username && msg.to === recipient) || 
             (msg.user === recipient && msg.to === username)
    }
  })

  // ലോഗിൻ പേജ്
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-500 font-mono">
        <form onSubmit={handleLogin} className="p-10 border-2 border-green-500 rounded-lg text-center shadow-[0_0_20px_rgba(0,255,0,0.3)]">
          <h1 className="text-3xl mb-8 font-bold tracking-widest">IDENTIFY YOURSELF</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Codename..."
            className="bg-black border-b-2 border-green-500 p-2 outline-none text-center w-full text-xl mb-8 placeholder-green-800 focus:border-green-300 transition"
          />
          <button type="submit" className="bg-green-700 text-black px-8 py-2 font-bold hover:bg-green-500 hover:shadow-[0_0_10px_#00ff00] transition duration-300">
            ENTER SYSTEM
          </button>
        </form>
      </div>
    )
  }

  // മെയിൻ ആപ്പ്
  return (
    <div className="flex h-screen bg-black text-green-500 font-mono overflow-hidden">
      
      {/* സൈഡ്‌ബാർ */}
      <div className="w-1/3 border-r border-green-800 flex flex-col">
        <div className="p-4 border-b border-green-800 bg-green-900/10">
          <h2 className="font-bold tracking-widest text-green-300">OPERATIVES</h2>
          <p className="text-xs text-green-600">YOU: {username}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div 
            onClick={() => setRecipient(null)}
            className={"p-4 cursor-pointer hover:bg-green-900/30 transition border-b border-green-900/30 " + (recipient === null ? "bg-green-900/50 border-l-4 border-l-green-500" : "")}
          >
            <span className="font-bold"># GLOBAL_CHAT</span>
          </div>

          {users.filter(u => u.name !== username).map((u) => (
            <div 
              key={u.name}
              onClick={() => setRecipient(u.name)}
              className={"p-4 cursor-pointer hover:bg-green-900/30 transition border-b border-green-900/30 " + (recipient === u.name ? "bg-green-900/50 border-l-4 border-l-green-500" : "")}
            >
              <span className="font-bold text-lg block">{u.name}</span>
              <span className="text-xs text-green-700">● ONLINE</span>
            </div>
          ))}
        </div>
      </div>

      {/* ചാറ്റ് ബോക്സ് */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-green-800 bg-black flex justify-between items-center shadow-lg z-10">
          <h2 className="text-xl font-bold tracking-widest text-green-100">
            {recipient ? ("PRIVATE // " + recipient) : '# GLOBAL_CHANNEL'}
          </h2>
          <div className="text-xs text-green-800 border border-green-900 px-2 py-1 rounded">ENCRYPTED</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 && (
            <div className="text-center text-green-900 mt-10">NO TRANSMISSIONS YET...</div>
          )}
          
          {filteredMessages.map((msg) => {
            const isMe = msg.user === username;
            return (
              <div key={msg.id} className={"flex flex-col " + (isMe ? "items-end" : "items-start")}>
                <span className="text-[10px] text-green-700 mb-1 px-1">{msg.user}</span>
                <div className={"max-w-[80%] px-4 py-2 rounded-lg " + (isMe 
                  ? "bg-green-900 text-green-100 rounded-tr-none shadow-[0_0_10px_rgba(0,255,0,0.1)]" 
                  : "border border-green-800 text-green-400 rounded-tl-none bg-black"
                )}>
                  {msg.text}
                </div>
              </div>
            )
          })}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 p-4 bg-black border-t border-green-900">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-900 border border-green-800 rounded p-3 outline-none focus:border-green-500 focus:bg-black transition text-green-300 placeholder-green-800"
            placeholder={"Message to " + (recipient || 'everyone') + "..."}
          />
          <button type="submit" className="bg-green-800 text-black px-6 rounded font-bold hover:bg-green-500 transition shadow-[0_0_10px_rgba(0,255,0,0.2)]">
            SEND
          </button>
        </form>
      </div>
    </div>
  )
}

export default App