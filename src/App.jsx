import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'

function App() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim()) {
      setIsLoggedIn(true)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      user: username,
      createdAt: serverTimestamp()
    })
    setNewMessage('')
  }

  // ലോഗിൻ സ്ക്രീൻ
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

  // ചാറ്റ് സ്ക്രീൻ
  return (
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono p-2 sm:p-4">
      
      {/* തലക്കെട്ട് */}
      <div className="border-b border-green-800 pb-4 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-green-400">UNDERGROUND_NET</h1>
          <p className="text-xs text-green-800">SECURE CONNECTION ESTABLISHED</p>
        </div>
        <div className="text-right">
           <span className="text-xs text-green-600 block">OPERATIVE</span>
           <span className="font-bold text-green-300">{username}</span>
        </div>
      </div>

      {/* മെസ്സേജുകൾ കാണിക്കുന്ന സ്ഥലം */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.user === username ? 'flex-end' : 'flex-start'
          }}>
            <span className="text-[10px] text-green-700 mb-1 px-1">{msg.user || 'Unknown'}</span>
            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
              msg.user === username 
                ? 'bg-green-900 text-green-100 rounded-tr-none' 
                : 'border border-green-800 text-green-400 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* മെസ്സേജ് ടൈപ്പ് ചെയ്യുന്ന സ്ഥലം */}
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-green-900 pt-4">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-900 border border-green-800 rounded p-3 outline-none focus:border-green-500 focus:bg-black transition text-green-300 placeholder-green-800"
          placeholder="Type encrypted message..."
        />
        <button type="submit" className="bg-green-800 text-black px-6 rounded font-bold hover:bg-green-500 transition shadow-[0_0_10px_rgba(0,255,0,0.2)]">
          SEND
        </button>
      </form>
    </div>
  )
}

export default App