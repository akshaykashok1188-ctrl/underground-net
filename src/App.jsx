import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"

function App() {
  // --- STATES ---
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([]) // Store all comments
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false) 

  // Navigation
  const [activeTab, setActiveTab] = useState("wall")
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupAccessInput, setGroupAccessInput] = useState("")
  const [groupError, setGroupError] = useState("")

  // Interaction States
  const [expandedComments, setExpandedComments] = useState({}) // Which posts have comments open
  const [commentInputs, setCommentInputs] = useState({}) // Text input for each post

  // Create Group State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupPass, setNewGroupPass] = useState("")

  const [chatMode, setChatMode] = useState("GLOBAL") 
  const [recipient, setRecipient] = useState(null) 

  const [postContent, setPostContent] = useState("")
  const [chatContent, setChatContent] = useState("")
  const [groupMsgContent, setGroupMsgContent] = useState("")

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
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
  }, [])

  // New: Listen for Comments
  useEffect(() => {
    const q = query(collection(db, "comments"), orderBy("createdAt", "asc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()))
    })
    return () => unsubscribe()
  }, [])

  // --- AUTH ACTIONS ---
  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError("")
    if (!username.trim() || !password.trim()) { setAuthError("CREDENTIALS_REQUIRED"); return }
    const userRef = doc(db, "users", username)
    const userSnap = await getDoc(userRef)

    if (isRegistering) {
      if (userSnap.exists()) { setAuthError("CODENAME_TAKEN"); } 
      else {
        await setDoc(userRef, { name: username, password: password, joinedAt: serverTimestamp() })
        completeLogin()
      }
    } else {
      if (userSnap.exists() && userSnap.data().password === password) { completeLogin() }
      else { setAuthError("ACCESS_DENIED"); }
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

  // --- GROUP ACTIONS ---
  const createGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim() || !newGroupPass.trim()) return
    await addDoc(collection(db, "groups"), { name: newGroupName, password: newGroupPass, createdBy: username, createdAt: serverTimestamp() })
    setIsCreatingGroup(false); setNewGroupName(""); setNewGroupPass("")
  }

  const selectGroup = (group) => {
    setSelectedGroup(group)
    setActiveTab("group_locked")
    setGroupAccessInput("")
    setGroupError("")
  }

  const unlockGroup = (e) => {
    e.preventDefault()
    if (groupAccessInput === selectedGroup.password) { setActiveTab("group_active") } 
    else { setGroupError("INVALID_PASSCODE") }
  }

  // --- INTERACTION ACTIONS (NEW) ---
  const handleVouch = async (post) => {
    const postRef = doc(db, "posts", post.id)
    const isVouched = post.vouchedBy && post.vouchedBy.includes(username)
    
    if (isVouched) {
      await updateDoc(postRef, { vouchedBy: arrayRemove(username) })
    } else {
      await updateDoc(postRef, { vouchedBy: arrayUnion(username) })
    }
  }

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault()
    const text = commentInputs[postId]
    if (!text || !text.trim()) return

    await addDoc(collection(db, "comments"), {
      postId: postId,
      text: text,
      user: username,
      createdAt: serverTimestamp()
    })
    
    setCommentInputs(prev => ({ ...prev, [postId]: "" }))
  }

  // --- SUBMIT MESSAGES ---
  const handlePostSubmit = async (e) => {
    e.preventDefault()
    if (!postContent.trim()) return
    await addDoc(collection(db, "posts"), { content: postContent, user: username, vouchedBy: [], createdAt: serverTimestamp() })
    setPostContent("")
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatContent.trim()) return
    const toUser = chatMode === "PRIVATE" ? recipient : null
    await addDoc(collection(db, "messages"), { text: chatContent, user: username, to: toUser, createdAt: serverTimestamp() })
    setChatContent("")
  }

  const handleGroupMsgSubmit = async (e) => {
    e.preventDefault()
    if (!groupMsgContent.trim()) return
    await addDoc(collection(db, "messages"), { text: groupMsgContent, user: username, groupId: selectedGroup.id, createdAt: serverTimestamp() })
    setGroupMsgContent("")
  }

  // Filter Logic
  const globalMessages = messages.filter(msg => !msg.to && !msg.groupId)
  const privateMessages = messages.filter(msg => {
    if (!recipient) return false
    return (msg.user === username && msg.to === recipient) || (msg.user === recipient && msg.to === username)
  })
  const currentGroupMessages = messages.filter(msg => selectedGroup && msg.groupId === selectedGroup.id)

  // --- LOGIN UI ---
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 font-mono">
        <div className="w-full max-w-md p-8 border border-green-500/50 bg-green-900/10">
          <h1 className="text-2xl mb-6 font-bold text-center tracking-widest text-green-500">{isRegistering ? "REGISTER_AGENT" : "SECURE_ACCESS"}</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border-b border-green-500 p-2 outline-none" placeholder="CODENAME..." />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border-b border-green-500 p-2 outline-none" placeholder="PASSCODE..." />
            {authError && <div className="text-red-500 text-xs text-center">{"ERROR: " + authError}</div>}
            <button className="w-full border border-green-500 py-3 bg-green-900/20 hover:bg-green-500 hover:text-black font-bold">AUTHENTICATE</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-xs text-green-600 underline text-center">{isRegistering ? "[ LOGIN ]" : "[ CREATE IDENTITY ]"}</button>
        </div>
      </div>
    )
  }

  // --- MAIN UI ---
  return (
    <div className="flex h-screen bg-black text-green-400 font-mono overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <div className="w-1/5 border-r border-green-900/50 flex flex-col bg-zinc-950/50 hidden md:flex">
        <div className="p-4 border-b border-green-900/50">
          <div className="font-bold text-lg text-white">{username}</div>
          <div className="text-[10px] text-green-600 animate-pulse">● ONLINE_SECURE</div>
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <button onClick={() => setActiveTab("wall")} className={"w-full text-left p-3 mb-2 text-xs font-bold border-l-2 " + (activeTab === "wall" ? "bg-green-900/20 border-green-500" : "border-transparent opacity-60")}>[ PUBLIC_WALL ]</button>
          <div className="mt-4 mb-2 text-[10px] text-gray-500 uppercase tracking-widest px-2">DETECTED_FREQUENCIES</div>
          {groups.map(grp => (
            <div key={grp.id} onClick={() => selectGroup(grp)} className={"cursor-pointer p-2 mb-1 text-xs border border-green-900/30 hover:bg-green-900/20 flex items-center justify-between " + (selectedGroup?.id === grp.id ? "bg-green-900/30 text-white" : "text-green-600")}>
              <span>{"# " + grp.name}</span><span className="text-[10px]">🔒</span>
            </div>
          ))}
          {isCreatingGroup ? (
            <form onSubmit={createGroup} className="mt-4 p-2 border border-green-500 bg-black">
              <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} className="w-full bg-zinc-900 text-xs p-1 mb-1 outline-none text-white" placeholder="NAME..." />
              <input value={newGroupPass} onChange={e=>setNewGroupPass(e.target.value)} className="w-full bg-zinc-900 text-xs p-1 mb-1 outline-none text-white" placeholder="PASSWORD..." />
              <div className="flex gap-1"><button className="flex-1 bg-green-600 text-black text-[10px] font-bold">CREATE</button><button type="button" onClick={()=>setIsCreatingGroup(false)} className="flex-1 bg-red-900 text-white text-[10px]">CANCEL</button></div>
            </form>
          ) : (
             <button onClick={() => setIsCreatingGroup(true)} className="w-full text-center mt-4 p-2 border border-dashed border-green-700 text-[10px] hover:bg-green-900/20 opacity-50 hover:opacity-100">[ + CREATE NEW NODE ]</button>
          )}
        </div>
        <button onClick={handleLogout} className="p-3 text-red-500 text-xs font-bold border-t border-green-900/50">[ TERMINATE ]</button>
      </div>

      {/* 2. CENTER STAGE */}
      <div className="flex-1 flex flex-col border-r border-green-900/50 bg-black relative">
        <div className="p-3 border-b border-green-900/50 bg-zinc-900/30 flex justify-between items-center">
           <span className="text-xs font-bold tracking-widest text-green-500 uppercase">{activeTab === "wall" ? "DATA_STREAM // PUBLIC" : "SECURE_NODE // " + selectedGroup?.name}</span>
           {activeTab === "group_active" && <span className="text-[10px] bg-red-900/50 px-2 py-1 rounded text-red-300">ENCRYPTED</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "wall" && (
             <>
               <div className="border-b border-green-900/50 pb-4 mb-4">
                 <form onSubmit={handlePostSubmit}>
                   <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="w-full bg-black border border-green-800 p-3 outline-none text-sm text-green-300 h-20 resize-none" placeholder="BROADCAST TO WALL..." />
                   <button className="mt-2 bg-green-900/40 px-4 py-1 border border-green-600 text-[10px] float-right hover:bg-green-500 hover:text-black">POST</button>
                 </form>
               </div>
               
               {posts.map(post => {
                 const vouchCount = post.vouchedBy ? post.vouchedBy.length : 0
                 const hasVouched = post.vouchedBy && post.vouchedBy.includes(username)
                 const postComments = comments.filter(c => c.postId === post.id)

                 return (
                   <div key={post.id} className="border border-green-900/30 bg-green-950/5 p-4">
                     <div className="text-[10px] text-green-500 font-bold mb-2 flex justify-between">
                        <span>{post.user}</span><span className="opacity-50">ID: {post.id.slice(0,4)}</span>
                     </div>
                     <div className="text-sm text-gray-300 leading-relaxed mb-4">{post.content}</div>
                     
                     {/* ACTIONS */}
                     <div className="flex gap-4 border-t border-green-900/30 pt-2">
                       <button onClick={() => handleVouch(post)} className={"text-[10px] font-bold uppercase flex items-center gap-1 " + (hasVouched ? "text-green-400" : "text-gray-600 hover:text-green-500")}>
                         [ {hasVouched ? "-1 UNVOUCH" : "+1 VOUCH"} ] <span className="bg-green-900/50 px-1 text-white">{vouchCount}</span>
                       </button>
                       <button onClick={() => toggleComments(post.id)} className="text-[10px] font-bold uppercase text-gray-600 hover:text-green-500">
                         [ COMMENTS ({postComments.length}) ]
                       </button>
                     </div>

                     {/* COMMENTS SECTION */}
                     {expandedComments[post.id] && (
                       <div className="mt-3 bg-black/50 p-2 border-l-2 border-green-900/50">
                         {postComments.map(c => (
                           <div key={c.id} className="mb-2 text-xs">
                             <span className="text-green-600 font-bold">{c.user}: </span>
                             <span className="text-gray-400">{c.text}</span>
                           </div>
                         ))}
                         <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 mt-2">
                           <input 
                             value={commentInputs[post.id] || ""} 
                             onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                             className="flex-1 bg-zinc-900 border border-green-900/50 p-1 text-xs text-green-300 outline-none"
                             placeholder="REPLY..."
                           />
                           <button className="text-[9px] bg-green-900 px-2 text-white">SEND</button>
                         </form>
                       </div>
                     )}
                   </div>
                 )
               })}
             </>
          )}

          {activeTab === "group_locked" && (
            <div className="flex flex-col items-center justify-center h-full opacity-80">
              <div className="text-4xl mb-4">🔒</div>
              <div className="text-lg font-bold text-red-500 tracking-widest mb-4">ACCESS RESTRICTED</div>
              <form onSubmit={unlockGroup} className="flex flex-col gap-2 w-64">
                <input type="password" value={groupAccessInput} onChange={(e)=>setGroupAccessInput(e.target.value)} className="bg-black border border-red-900 p-2 text-center text-red-500 outline-none" placeholder="ENTER KEY..." />
                <button className="bg-red-900/20 border border-red-500 py-2 text-red-500 font-bold hover:bg-red-500 hover:text-black">UNLOCK NODE</button>
              </form>
              {groupError && <div className="mt-4 text-red-500 font-bold animate-pulse">{groupError}</div>}
            </div>
          )}

          {activeTab === "group_active" && (
            <>
               <div className="flex-1 space-y-3 mb-4">
                 {currentGroupMessages.length === 0 && <div className="text-center text-gray-600 text-xs mt-10">CHANNEL SILENT.</div>}
                 {currentGroupMessages.map(msg => (
                   <div key={msg.id} className={"flex flex-col " + (msg.user === username ? "items-end" : "items-start")}>
                     <div className="text-[9px] text-green-700 mb-1">{msg.user}</div>
                     <div className="bg-green-900/10 border border-green-900/50 p-2 text-sm text-green-300 max-w-[80%]">{msg.text}</div>
                   </div>
                 ))}
               </div>
               <form onSubmit={handleGroupMsgSubmit} className="border-t border-green-900/50 pt-3 flex gap-2">
                 <input value={groupMsgContent} onChange={(e) => setGroupMsgContent(e.target.value)} className="flex-1 bg-black border border-green-800 p-2 outline-none text-xs text-green-400" placeholder={"MESSAGE #" + selectedGroup.name + "..."} />
                 <button className="px-4 border border-green-600 bg-green-900/30 text-green-400 font-bold">{">"}</button>
               </form>
            </>
          )}
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR */}
      <div className="w-1/4 flex flex-col bg-zinc-950/80 border-l border-green-900/50 hidden md:flex">
        <div className="flex border-b border-green-900/50">
          <button onClick={() => setChatMode("GLOBAL")} className={"flex-1 p-3 text-[10px] font-bold " + (chatMode === "GLOBAL" ? "bg-green-900/30 text-white" : "text-green-800")}>GLOBAL</button>
          <button onClick={() => setChatMode("PRIVATE")} className={"flex-1 p-3 text-[10px] font-bold " + (chatMode === "PRIVATE" ? "bg-green-900/30 text-white" : "text-green-800")}>INBOX</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {chatMode === "PRIVATE" && !recipient ? (
            <div className="space-y-1">
              {users.filter(u => u.name !== username).map(u => (
                <div key={u.name} onClick={() => setRecipient(u.name)} className="p-2 border border-green-900/30 hover:bg-green-900/20 cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-xs">{u.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {chatMode === "PRIVATE" && <button onClick={()=>setRecipient(null)} className="text-[9px] text-green-500 mb-2">{"< BACK"}</button>}
              {(chatMode === "GLOBAL" ? globalMessages : privateMessages).map(msg => (
                <div key={msg.id} className="mb-2">
                  <span className="text-[9px] text-green-600 font-bold">{msg.user}: </span><span className="text-xs text-green-400 break-words">{msg.text}</span>
                </div>
              ))}
            </>
          )}
        </div>
        {(chatMode === "GLOBAL" || recipient) && (
          <form onSubmit={handleChatSubmit} className="p-2 border-t border-green-900/50 flex gap-1">
            <input value={chatContent} onChange={(e) => setChatContent(e.target.value)} className="flex-1 bg-zinc-900 border border-green-900 p-2 outline-none text-xs text-green-400" placeholder="..." />
            <button className="text-green-500 font-bold px-2">{">"}</button>
          </form>
        )}
      </div>

    </div>
  )
}

export default App