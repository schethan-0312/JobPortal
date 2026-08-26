"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";

interface MessageUser {
  id: string;
  email: string;
  role?: string;
  candidateProfile?: { fullName?: string; profilePhotoUrl?: string | null } | null;
  employer?: { companyName?: string; logoUrl?: string | null } | null;
}

interface ConversationMessage {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
  deletedForEveryone?: boolean;
  createdAt: string;
  sender?: MessageUser;
  receiver?: MessageUser;
}

function formatMessageDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dateFormatted = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateFormatted} ${timeStr}`;
}

function getUserAvatar(userObj: MessageUser | null | undefined, isMe: boolean, myProfilePhoto: string | null | undefined, defaultRoleFallback: string): string {
  if (isMe && myProfilePhoto) return assetUrl(myProfilePhoto) || defaultRoleFallback;
  if (!userObj) return defaultRoleFallback;
  if (userObj.candidateProfile?.profilePhotoUrl) return assetUrl(userObj.candidateProfile.profilePhotoUrl) || defaultRoleFallback;
  if (userObj.employer?.logoUrl) return assetUrl(userObj.employer.logoUrl) || defaultRoleFallback;
  return defaultRoleFallback;
}

function getUserDisplayName(userObj?: MessageUser | null): string {
  if (!userObj) return "User";
  if (userObj.employer?.companyName) return userObj.employer.companyName;
  if (userObj.candidateProfile?.fullName) return userObj.candidateProfile.fullName;
  return userObj.email || "User";
}

export default function CandidateMessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CandidateMessagesContent />
    </Suspense>
  );
}

function CandidateMessagesContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [selectedCounterpart, setSelectedCounterpart] = useState<MessageUser | null>(null);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [myProfilePhoto, setMyProfilePhoto] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [deleteMenuOpenId, setDeleteMenuOpenId] = useState<string | null>(null);
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

  const isAtBottomRef = useRef(true);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (shouldScrollRef.current || isAtBottomRef.current) {
      if (threadContainerRef.current) {
        threadContainerRef.current.scrollTop = threadContainerRef.current.scrollHeight;
      }
      shouldScrollRef.current = false;
    }
  }, [thread]);

  function handleScroll() {
    if (threadContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = threadContainerRef.current;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  }

  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    api.get<{ profilePhotoUrl?: string | null }>("/candidates/me").then((data) => setMyProfilePhoto(data.profilePhotoUrl ?? null)).catch(() => setMyProfilePhoto(null));
    (async () => {
      setDataLoading(true);
      setError(null);
      try {
        const convs = await api.get<ConversationMessage[]>("/messages/conversations");
        setConversations(convs);
        const newChatId = searchParams.get("newChat");
        if (newChatId) {
          const newChatConv = convs.find(c => c.senderId === newChatId || c.receiverId === newChatId);
          if (newChatConv) {
            const counterpart = newChatConv.senderId === user.userId ? newChatConv.receiver : newChatConv.sender;
            if (counterpart) handleSelectConversation(counterpart);
          } else {
            const tempMsgs = await api.get<ConversationMessage[]>(`/messages/conversations/${newChatId}`);
            if (tempMsgs.length > 0) {
              const cp = tempMsgs[0].senderId === user.userId ? tempMsgs[0].receiver : tempMsgs[0].sender;
              if (cp) handleSelectConversation(cp);
            } else {
              try {
                const employerData = await api.get<any>(`/employers/${newChatId}`);
                const dummyCp: MessageUser = {
                  id: newChatId,
                  email: employerData.user?.email || "Employer",
                  role: "EMPLOYER",
                  employer: { companyName: employerData.companyName, logoUrl: employerData.logoUrl }
                };
                handleSelectConversation(dummyCp);
              } catch {
                setError("Could not load the requested employer chat.");
              }
            }
          }
        } else if (convs.length > 0) {
          const first = convs[0];
          const cp = first.senderId === user.userId ? first.receiver : first.sender;
          if (cp) handleSelectConversation(cp);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load messages");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user, searchParams]);

  useEffect(() => {
    if (!selectedCounterpart) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${selectedCounterpart.id}`);
        setThread(msgs);
        const convs = await api.get<ConversationMessage[]>("/messages/conversations");
        setConversations(convs);

        const typeRes = await api.get<{ isTyping: boolean }>(`/messages/typing/${selectedCounterpart.id}`);
        setIsCounterpartTyping(typeRes.isTyping);
      } catch (err) {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedCounterpart]);

  async function handleSelectConversation(counterpart: MessageUser) {
    setSelectedCounterpart(counterpart);
    shouldScrollRef.current = true;
    setThreadLoading(true);
    setError(null);
    try {
      const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${counterpart.id}`);
      setThread(msgs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedCounterpart) return;
    setSending(true);
    setError(null);
    shouldScrollRef.current = true;
    try {
      const newMsg = await api.post<ConversationMessage>("/messages", { receiverId: selectedCounterpart.id, body: replyText.trim() });
      setThread((prev) => [...prev, newMsg]);
      setReplyText("");
      const convs = await api.get<ConversationMessage[]>("/messages/conversations");
      setConversations(convs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleTyping(text: string) {
    setReplyText(text);
    if (!selectedCounterpart) return;
    if (typingTimeoutRef.current) return;
    
    api.post("/messages/typing", { receiverId: selectedCounterpart.id }).catch(() => {});
    
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }

  async function uploadAndSend(file: File, forcedMediaType?: string) {
    if (!selectedCounterpart) return;
    setUploadingMedia(true);
    setError(null);
    shouldScrollRef.current = true;
    try {
      const { url, mediaType: detectedType, originalName } = await uploadFile<{ url: string; mediaType: string; originalName: string }>("/messages/upload", file);
      const msg = await api.post<ConversationMessage>("/messages", {
        receiverId: selectedCounterpart.id,
        body: originalName ?? "",
        mediaUrl: url,
        mediaType: forcedMediaType ?? detectedType,
      });
      setThread((prev) => [...prev, msg]);
      const convs = await api.get<ConversationMessage[]>("/messages/conversations");
      setConversations(convs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload file");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleVoiceToggle() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          uploadAndSend(new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" }), "audio");
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch {
        setError("Microphone access denied");
      }
    }
  }

  async function openCamera() {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera access denied or unavailable.");
      setShowCameraModal(false);
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  }

  function takePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          uploadAndSend(new File([blob], `photo-${Date.now()}.png`, { type: "image/png" }), "image");
        }
        closeCamera();
      }, "image/png");
    }
  }

  async function deleteMessage(messageId: string, type: 'me' | 'everyone') {
    try {
      await api.delete(`/messages/${messageId}?type=${type}`);
      setThread((prev) => prev.map(m => {
        if (m.id === messageId) {
          if (type === 'everyone') {
            return { ...m, deletedForEveryone: true, body: '🚫 This message was deleted', mediaUrl: null, mediaType: null };
          }
          return { ...m, _hide: true } as any;
        }
        return m;
      }).filter(m => !(m as any)._hide));
      setDeleteMenuOpenId(null);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading || !user || user.role !== "CANDIDATE") return null;

  return (
    <>
      <Navbar7 />
      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="messages" />
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Message Inbox</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Candidate</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Chat & Messages</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
          <div className="dashboard-widg-bar d-block">
            <div className="row">
              <div className="col-xl-11 col-lg-12 col-md-12">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="d-flex bg-white rounded-3 overflow-hidden shadow-sm border mx-auto" style={{ height: "calc(100vh - 280px)", minHeight: "450px", maxWidth: "1050px" }}>
                  {/* Sidebar */}
                  <div className="border-end d-flex flex-column" style={{ width: "320px", flexShrink: 0 }}>
                    <div className="p-3 border-bottom bg-light">
                      <h6 className="m-0 fw-semibold">Recent Chats</h6>
                    </div>
                    <div className="overflow-auto" style={{ flex: 1 }}>
                      {dataLoading ? (
                        <div className="p-3 text-muted text-center">Loading...</div>
                      ) : conversations.length === 0 ? (
                        <div className="p-3 text-muted text-center small">No conversations yet.</div>
                      ) : (
                        conversations.map((c) => {
                          const cp = c.senderId === user.userId ? c.receiver : c.sender;
                          const cpName = getUserDisplayName(cp);
                          const isSelected = selectedCounterpart?.id === cp?.id;
                          const cpAvatar = getUserAvatar(cp, false, null, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                          return (
                            <div key={c.id} className={`d-flex align-items-center p-3 border-bottom ${isSelected ? 'bg-primary bg-opacity-10' : ''}`} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => cp && handleSelectConversation(cp)}>
                              <img src={cpAvatar} alt="" style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }} className="me-3" />
                              <div className="flex-grow-1 overflow-hidden">
                                <h6 className="m-0 text-truncate fw-semibold">{cpName}</h6>
                                <p className="m-0 text-truncate small text-muted">{c.body || (c.mediaType ? `[${c.mediaType}]` : "")}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {/* Chat Area */}
                  <div className="d-flex flex-column bg-light" style={{ flex: 1, minWidth: 0 }}>
                    {selectedCounterpart ? (
                      <>
                        <div className="p-3 bg-white border-bottom d-flex align-items-center shadow-sm" style={{ flexShrink: 0, zIndex: 10 }}>
                          <img src={getUserAvatar(selectedCounterpart, false, null, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")} alt="" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} className="me-3" />
                          <h5 className="m-0 fw-semibold">{getUserDisplayName(selectedCounterpart)}</h5>
                        </div>
                        <div className="p-4 overflow-auto d-flex flex-column gap-3" ref={threadContainerRef} onScroll={handleScroll} style={{ flex: 1 }}>
                          {threadLoading ? (
                            <div className="text-center text-muted my-auto">Loading messages...</div>
                          ) : thread.length === 0 ? (
                            <div className="text-center text-muted my-auto">No messages yet. Say hi!</div>
                          ) : (
                            thread.map((m) => {
                              const isMe = m.senderId === user.userId;
                              const senderObj = isMe ? m.sender : (m.receiver?.id === user.userId ? m.sender : m.receiver);
                              const avatarSrc = getUserAvatar(senderObj, isMe, myProfilePhoto, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
                              const mediaFullUrl = m.mediaUrl ? assetUrl(m.mediaUrl) : null;
                              return (
                                <div className={`message-plunch${isMe ? " me" : ""}`} key={m.id} style={{ position: 'relative' }}>
                                  <div className="dash-msg-avatar">
                                    <img src={avatarSrc} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                                  </div>
                                  <div className="dash-msg-text" style={{ position: 'relative', overflow: 'visible', minWidth: '120px' }}>
                                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', paddingRight: '25px' }}>
                                        {m.mediaType === "image" && mediaFullUrl && (
                                          <a href={mediaFullUrl} target="_blank" rel="noreferrer"><img src={mediaFullUrl} alt="image" style={{ maxWidth: "200px", borderRadius: "8px", marginBottom: "6px", display: "block" }} /></a>
                                        )}
                                        {m.mediaType === "audio" && mediaFullUrl && (
                                          <audio controls src={mediaFullUrl} style={{ width: "200px", height: "45px", marginBottom: "6px" }} />
                                        )}
                                        {m.mediaType === "file" && mediaFullUrl && (
                                          <a href={mediaFullUrl} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 mb-1 flex-wrap" style={{ color: "inherit" }}><i className="fa-solid fa-file" style={{ fontSize: "1.2rem" }}></i><span className="small text-truncate" style={{ maxWidth: "180px" }}>{m.body || "File"}</span></a>
                                        )}
                                        {(!m.mediaType || m.mediaType === "file" ? false : !!m.body) && (<p className="mb-1" style={{ fontStyle: m.deletedForEveryone ? 'italic' : 'normal', color: m.deletedForEveryone ? '#888' : 'inherit' }}>{m.body}</p>)}
                                        {!m.mediaType && m.body && <p className="mb-1" style={{ fontStyle: m.deletedForEveryone ? 'italic' : 'normal', color: m.deletedForEveryone ? '#888' : 'inherit' }}>{m.body}</p>}
                                        <span className="small text-muted d-block opacity-75" style={{ fontSize: "0.7rem", textAlign: isMe ? "right" : "left" }}>{formatMessageDateTime(m.createdAt)}</span>
                                      </div>
                                      <div className="msg-options" style={{ position: 'relative', flexShrink: 0 }}>
                                        <button type="button" className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }} onClick={() => setDeleteMenuOpenId(deleteMenuOpenId === m.id ? null : m.id)}><i className="fa-solid fa-ellipsis-vertical" style={{ color: '#888', fontSize: '12px' }}></i></button>
                                        {deleteMenuOpenId === m.id && (
                                          <div className="dropdown-menu show p-1 shadow border text-start" style={{ position: 'absolute', right: 0, top: '26px', zIndex: 10, minWidth: '160px' }}>
                                            <button className="dropdown-item text-danger small py-1" onClick={() => deleteMessage(m.id, 'me')}>Delete for me</button>
                                            {isMe && !m.deletedForEveryone && (<button className="dropdown-item text-danger small py-1" onClick={() => deleteMessage(m.id, 'everyone')}>Delete for everyone</button>)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                        {isCounterpartTyping && (
                          <div className="px-4 py-1 text-muted small" style={{ fontStyle: 'italic', flexShrink: 0, backgroundColor: '#f8f9fa' }}>
                            {getUserDisplayName(selectedCounterpart)} is typing...
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSend(f); e.target.value = ""; }} />
                        <div className="p-3 bg-white border-top d-flex align-items-end gap-2 flex-wrap" style={{ flexShrink: 0 }}>
                          <div className="d-flex gap-1 flex-wrap" style={{ flexShrink: 0, paddingBottom: "4px" }}>
                            <button type="button" title="Take Photo" className="btn btn-light btn-sm rounded-circle" style={{ width: "36px", height: "36px", padding: 0 }} onClick={openCamera} disabled={uploadingMedia}><i className="fa-solid fa-camera" style={{ fontSize: "14px" }}></i></button>
                            <button type="button" title="Attach File" className="btn btn-light btn-sm rounded-circle" style={{ width: "36px", height: "36px", padding: 0 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}><i className="fa-solid fa-paperclip" style={{ fontSize: "14px" }}></i></button>
                            <button type="button" title={isRecording ? "Stop Recording" : "Voice Note"} className={`btn btn-sm rounded-circle ${isRecording ? "btn-danger" : "btn-light"}`} style={{ width: "36px", height: "36px", padding: 0 }} onClick={handleVoiceToggle} disabled={uploadingMedia}><i className={`fa-solid ${isRecording ? "fa-stop" : "fa-microphone"}`} style={{ fontSize: "14px" }}></i></button>
                          </div>
                          <textarea cols={40} rows={2} className="form-control bg-light" placeholder={isRecording ? "🔴 Recording... tap stop to send" : uploadingMedia ? "Uploading..." : "Type a message..."} value={replyText} onChange={(e) => handleTyping(e.target.value)} disabled={isRecording || uploadingMedia} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} style={{ resize: "none", border: 'none' }}></textarea>
                          <button type="button" className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style={{ flexShrink: 0, width: '48px', height: '48px' }} disabled={sending || uploadingMedia || isRecording || !replyText.trim()} onClick={handleSend}><i className="fa-solid fa-paper-plane"></i></button>
                        </div>
                      </>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                        <i className="fa-regular fa-comments mb-3" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                        <h5>Select a conversation</h5>
                        <p className="small">Choose a chat from the sidebar to start messaging.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted small">&copy; {new Date().getFullYear()} JobStock. All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>
      <UploadResumeModal />
      {showCameraModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Take Photo</h5>
                <button type="button" className="btn-close" onClick={closeCamera}></button>
              </div>
              <div className="modal-body text-center">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="bg-dark rounded overflow-hidden" style={{ width: "100%", aspectRatio: "4/3" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                </div>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button type="button" className="btn btn-secondary" onClick={closeCamera}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={takePhoto}><i className="fa-solid fa-camera me-2"></i> Capture & Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
