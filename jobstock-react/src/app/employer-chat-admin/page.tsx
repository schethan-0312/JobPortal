"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import UploadResumeModal from "@/components/candidate-dashboard/UploadResumeModal";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl, uploadFile } from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";

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

function getUserAvatar(userObj: MessageUser | null | undefined, isMe: boolean, myLogoUrl: string | null | undefined, defaultRoleFallback: string): string {
  if (isMe && myLogoUrl) return assetUrl(myLogoUrl) || defaultRoleFallback;
  if (!userObj) return defaultRoleFallback;
  if (userObj.role === "ADMIN") return "/assets/img/l-1.png";
  if (userObj.candidateProfile?.profilePhotoUrl) return assetUrl(userObj.candidateProfile.profilePhotoUrl) || defaultRoleFallback;
  if (userObj.employer?.logoUrl) return assetUrl(userObj.employer.logoUrl) || defaultRoleFallback;
  return defaultRoleFallback;
}

function getUserDisplayName(userObj?: MessageUser | null): string {
  if (!userObj) return "Admin Support";
  if (userObj.role === "ADMIN") return "Support Admin";
  if (userObj.employer?.companyName) return userObj.employer.companyName;
  if (userObj.candidateProfile?.fullName) return userObj.candidateProfile.fullName;
  return userObj.email || "Support Admin";
}

export default function EmployerChatAdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployerChatAdminContent />
    </Suspense>
  );
}

function EmployerChatAdminContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<MessageUser | null>(null);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [myLogoUrl, setMyLogoUrl] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [deleteMenuOpenId, setDeleteMenuOpenId] = useState<string | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
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
    if (!user || user.role !== "EMPLOYER") return;
    api.get<{ logoUrl?: string | null }>("/employers/me").then((data) => setMyLogoUrl(data.logoUrl ?? null)).catch(() => setMyLogoUrl(null));

    (async () => {
      setDataLoading(true);
      try {
        const supportAdmin = await api.get<{ id: string; email: string }>("/messages/support-admin");
        const adminObj: MessageUser = {
          id: supportAdmin.id,
          email: supportAdmin.email,
          role: "ADMIN",
        };
        setAdminUser(adminObj);

        setThreadLoading(true);
        const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${supportAdmin.id}`);
        setThread(msgs);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to connect to Support Admin");
      } finally {
        setDataLoading(false);
        setThreadLoading(false);
      }
    })();
  }, [user]);

  // Polling messages & typing status
  useEffect(() => {
    if (!adminUser) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${adminUser.id}`);
        setThread(msgs);

        const typeRes = await api.get<{ isTyping: boolean }>(`/messages/typing/${adminUser.id}`);
        setIsAdminTyping(typeRes.isTyping);
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [adminUser]);

  async function handleSend() {
    if (!replyText.trim() || !adminUser) return;
    setSending(true);
    shouldScrollRef.current = true;
    try {
      const newMsg = await api.post<ConversationMessage>("/messages", { receiverId: adminUser.id, body: replyText.trim() });
      setThread((prev) => [...prev, newMsg]);
      setReplyText("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleTyping(text: string) {
    setReplyText(text);
    if (!adminUser) return;
    if (typingTimeoutRef.current) return;

    api.post("/messages/typing", { receiverId: adminUser.id }).catch(() => {});

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }

  async function uploadAndSend(file: File, forcedMediaType?: string) {
    if (!adminUser) return;
    setUploadingMedia(true);
    shouldScrollRef.current = true;
    try {
      const { url, mediaType: detectedType, originalName } = await uploadFile<{ url: string; mediaType: string; originalName: string }>("/messages/upload", file);
      const msg = await api.post<ConversationMessage>("/messages", {
        receiverId: adminUser.id,
        body: originalName ?? "",
        mediaUrl: url,
        mediaType: forcedMediaType ?? detectedType,
      });
      setThread((prev) => [...prev, msg]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload file");
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
        toast.error("Microphone access denied");
      }
    }
  }

  async function openCamera() {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error("Camera access denied or unavailable.");
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

  if (loading || !user || user.role !== "EMPLOYER") return null;

  return (
    <>
      <Navbar8 />
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '100px',
        }}
        toastOptions={{
          style: {
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '500',
            maxWidth: '600px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
        }}
      />
      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="chat-admin" />
        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Chat with Admin</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Chat with Admin</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
          <div className="dashboard-widg-bar d-block">
            <div className="row justify-content-center">
              <div className="col-xl-11 col-lg-12 col-md-12">
                <div className="d-flex bg-white rounded-3 overflow-hidden shadow-sm border mx-auto" style={{ height: "calc(100vh - 200px)", minHeight: "550px", maxWidth: "1150px" }}>
                  {/* Chat Area */}
                  <div className="d-flex flex-column bg-light w-100" style={{ flex: 1, minWidth: 0 }}>
                    {dataLoading ? (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                        <div className="spinner-border text-primary mb-3" role="status"></div>
                        <p>Connecting to Support Admin...</p>
                      </div>
                    ) : adminUser ? (
                      <>
                        <div className="p-3 bg-white border-bottom d-flex align-items-center shadow-sm" style={{ flexShrink: 0, zIndex: 10 }}>
                          <img src="/assets/img/l-1.png" alt="Admin" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} className="me-3" />
                          <div>
                            <h5 className="m-0 fw-semibold">Support Admin</h5>
                            <span className="small text-muted">{adminUser.email}</span>
                          </div>
                        </div>
                        <div className="p-4 overflow-auto d-flex flex-column gap-3" ref={threadContainerRef} onScroll={handleScroll} style={{ flex: 1 }}>
                          {threadLoading ? (
                            <div className="text-center text-muted my-auto">Loading messages...</div>
                          ) : thread.length === 0 ? (
                            <div className="text-center text-muted my-auto">
                              <i className="fa-solid fa-headset mb-3 text-muted" style={{ fontSize: "2.5rem", opacity: 0.6 }}></i>
                              <p className="mb-0">No messages yet. Send a message to get in touch with Admin Support!</p>
                            </div>
                          ) : (
                            thread.map((m) => {
                              const isMe = m.senderId === user.userId;
                              const senderObj = isMe ? m.sender : adminUser;
                              const avatarSrc = getUserAvatar(senderObj, isMe, myLogoUrl, "/assets/img/l-1.png");
                              const mediaFullUrl = m.mediaUrl ? assetUrl(m.mediaUrl) : null;
                              return (
                                <div className={`message-plunch${isMe ? " me" : ""}`} key={m.id} style={{ position: 'relative' }}>
                                  <div className="dash-msg-avatar">
                                    <img src={avatarSrc} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                                  </div>
                                  <div className="dash-msg-text" style={{ position: 'relative', overflow: 'visible', minWidth: '120px' }}>
                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', paddingRight: '25px' }}>
                                        {m.mediaType === "image" && mediaFullUrl && (
                                          <a href={mediaFullUrl} target="_blank" rel="noreferrer"><img src={mediaFullUrl} alt="image" style={{ maxWidth: "200px", borderRadius: "8px", marginBottom: "6px", display: "block" }} /></a>
                                        )}
                                        {m.mediaType === "audio" && mediaFullUrl && (
                                          <audio controls src={mediaFullUrl} style={{ width: "200px", height: "45px", marginBottom: "6px" }} />
                                        )}
                                        {m.mediaType === "file" && mediaFullUrl && (
                                          <a href={mediaFullUrl} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 mb-1" style={{ color: "inherit" }}><i className="fa-solid fa-file" style={{ fontSize: "1.2rem" }}></i><span className="small text-truncate" style={{ maxWidth: "180px" }}>{m.body || "File"}</span></a>
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
                        {isAdminTyping && (
                          <div className="px-4 py-1 text-muted small" style={{ fontStyle: 'italic', flexShrink: 0, backgroundColor: '#f8f9fa' }}>
                            Support Admin is typing...
                          </div>
                        )}
                        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSend(f); e.target.value = ""; }} />
                        <div className="p-2 bg-white border-top d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                          <div className="d-flex gap-1" style={{ flexShrink: 0 }}>
                            <button type="button" title="Take Photo" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: "40px", height: "40px", padding: 0 }} onClick={openCamera} disabled={uploadingMedia}><i className="fa-solid fa-camera" style={{ fontSize: "16px" }}></i></button>
                            <button type="button" title="Attach File" className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: "40px", height: "40px", padding: 0 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}><i className="fa-solid fa-paperclip" style={{ fontSize: "16px" }}></i></button>
                            <button type="button" title={isRecording ? "Stop Recording" : "Voice Note"} className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center ${isRecording ? "btn-danger text-white" : "btn-light text-muted"}`} style={{ width: "40px", height: "40px", padding: 0 }} onClick={handleVoiceToggle} disabled={uploadingMedia}><i className={`fa-solid ${isRecording ? "fa-stop" : "fa-microphone"}`} style={{ fontSize: "16px" }}></i></button>
                          </div>
                          <input type="text" className="form-control bg-light px-4 mx-1" placeholder={isRecording ? "🔴 Recording... tap stop to send" : uploadingMedia ? "Uploading..." : "Type a message to admin..."} value={replyText} onChange={(e) => handleTyping(e.target.value)} disabled={isRecording || uploadingMedia} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }} style={{ height: "48px", borderRadius: "24px", border: 'none', flex: 1, minWidth: 0, boxShadow: 'none' }} />
                          <button type="button" className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ flexShrink: 0, width: '48px', height: '48px' }} disabled={sending || uploadingMedia || isRecording || !replyText.trim()} onClick={handleSend}><i className="fa-solid fa-paper-plane" style={{ fontSize: "18px" }}></i></button>
                        </div>
                      </>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                        <i className="fa-solid fa-triangle-exclamation mb-3 text-warning" style={{ fontSize: "3rem" }}></i>
                        <h5>Unable to connect to Admin</h5>
                        <p className="small">No active Admin support account was found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
