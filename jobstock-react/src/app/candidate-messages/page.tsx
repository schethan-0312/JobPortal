"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar7 from "@/components/Navbar7";
import CandidateSidebar from "@/components/candidate-dashboard/CandidateSidebar";
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

function getUserAvatar(
  userObj: MessageUser | null | undefined,
  isMe: boolean,
  myProfilePhoto: string | null | undefined,
  defaultRoleFallback: string
): string {
  if (isMe && myProfilePhoto) return assetUrl(myProfilePhoto) || defaultRoleFallback;
  if (!userObj) return defaultRoleFallback;
  if (userObj.candidateProfile?.profilePhotoUrl)
    return assetUrl(userObj.candidateProfile.profilePhotoUrl) || defaultRoleFallback;
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
    <Suspense
      fallback={
        <div className="text-center py-5">
          <div className="spinner-border text-main" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
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
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [deleteMenuOpenId, setDeleteMenuOpenId] = useState<string | null>(null);
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection lock state for candidate-to-candidate chatting
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isPending: boolean;
    following: boolean;
    isIncomingPending: boolean;
  } | null>(null);
  const [requestingConnection, setRequestingConnection] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MessageUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isAtBottomRef = useRef(true);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "CANDIDATE")) {
      router.push("/");
    }
  }, [loading, user, router]);

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

  // Load conversations and handle URL param
  useEffect(() => {
    if (!user || user.role !== "CANDIDATE") return;
    api
      .get<{ profilePhotoUrl?: string | null }>("/candidates/me")
      .then((data) => setMyProfilePhoto(data.profilePhotoUrl ?? null))
      .catch(() => setMyProfilePhoto(null));

    (async () => {
      setDataLoading(true);
      try {
        const convs = await api.get<ConversationMessage[]>("/messages/conversations");
        setConversations(convs);

        const newChatId = searchParams.get("newChat") || searchParams.get("userId") || searchParams.get("id");
        if (newChatId) {
          const newChatConv = convs.find(
            (c) =>
              c.senderId === newChatId ||
              c.receiverId === newChatId ||
              c.sender?.candidateProfile?.fullName?.toLowerCase() === newChatId.toLowerCase() ||
              c.receiver?.candidateProfile?.fullName?.toLowerCase() === newChatId.toLowerCase()
          );

          if (newChatConv) {
            const counterpart = newChatConv.senderId === user.userId ? newChatConv.receiver : newChatConv.sender;
            if (counterpart) handleSelectConversation(counterpart);
          } else {
            const tempMsgs = await api.get<ConversationMessage[]>(`/messages/conversations/${newChatId}`).catch(() => []);
            if (tempMsgs && tempMsgs.length > 0) {
              const cp = tempMsgs[0].senderId === user.userId ? tempMsgs[0].receiver : tempMsgs[0].sender;
              if (cp) handleSelectConversation(cp);
            } else {
              let dummyCp: MessageUser | null = null;
              try {
                const candData = await api.get<any>(`/candidates/${newChatId}`);
                if (candData) {
                  const resolvedId = candData.userId || candData.id || newChatId;
                  const matchedConv = convs.find((c) => c.senderId === resolvedId || c.receiverId === resolvedId);
                  if (matchedConv) {
                    dummyCp = matchedConv.senderId === user.userId ? matchedConv.receiver! : matchedConv.sender!;
                  } else {
                    dummyCp = {
                      id: resolvedId,
                      email: candData.user?.email || candData.fullName,
                      role: "CANDIDATE",
                      candidateProfile: {
                        fullName: candData.fullName,
                        profilePhotoUrl: candData.profilePhotoUrl,
                      },
                    };
                  }
                }
              } catch {
                // Not candidate
              }

              if (!dummyCp) {
                try {
                  const employerData = await api.get<any>(`/employers/${newChatId}`);
                  if (employerData) {
                    const resolvedId = employerData.userId || employerData.id || newChatId;
                    const matchedConv = convs.find((c) => c.senderId === resolvedId || c.receiverId === resolvedId);
                    if (matchedConv) {
                      dummyCp = matchedConv.senderId === user.userId ? matchedConv.receiver! : matchedConv.sender!;
                    } else {
                      dummyCp = {
                        id: resolvedId,
                        email: employerData.user?.email || employerData.companyName,
                        role: "EMPLOYER",
                        employer: {
                          companyName: employerData.companyName,
                          logoUrl: employerData.logoUrl,
                        },
                      };
                    }
                  }
                } catch {
                  // Not employer
                }
              }

              if (dummyCp) {
                handleSelectConversation(dummyCp);
              } else {
                handleSelectConversation({
                  id: newChatId,
                  email: "User",
                  candidateProfile: { fullName: "User" },
                });
              }
            }
          }
        } else if (convs.length > 0) {
          const first = convs[0];
          const cp = first.senderId === user.userId ? first.receiver : first.sender;
          if (cp) handleSelectConversation(cp);
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load messages");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user, searchParams]);

  // Check connection status with selected counterpart
  useEffect(() => {
    if (!selectedCounterpart) {
      setConnectionStatus(null);
      return;
    }

    const isCompany = selectedCounterpart.role === "EMPLOYER" || Boolean(selectedCounterpart.employer);
    if (isCompany) {
      setConnectionStatus({ isConnected: true, isPending: false, following: true, isIncomingPending: false });
      return;
    }

    api
      .get<{ isConnected: boolean; isPending: boolean; following: boolean; isIncomingPending: boolean }>(
        `/follow/status/${selectedCounterpart.id}`
      )
      .then((st) => setConnectionStatus(st))
      .catch(() =>
        setConnectionStatus({ isConnected: true, isPending: false, following: false, isIncomingPending: false })
      );
  }, [selectedCounterpart]);

  async function handleSendConnectionRequest() {
    if (!selectedCounterpart) return;
    setRequestingConnection(true);
    try {
      const res = await api.post<{ isPending?: boolean }>(`/follow/${selectedCounterpart.id}`, {});
      toast.success(res?.isPending ? "Connection request sent!" : "Connected successfully!");
      setConnectionStatus((prev) => (prev ? { ...prev, isPending: true } : null));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send connection request");
    } finally {
      setRequestingConnection(false);
    }
  }

  // Search users across platform
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const query = searchTerm.trim();
        const candRes = await api.get<{ items: any[] }>(`/candidates?search=${encodeURIComponent(query)}&pageSize=5`).catch(() => ({ items: [] }));
        const empRes = await api.get<{ items: any[] }>(`/employers?search=${encodeURIComponent(query)}&pageSize=5`).catch(() => ({ items: [] }));

        const usersFound: MessageUser[] = [];

        if (candRes.items) {
          for (const cand of candRes.items) {
            const uId = cand.userId || cand.id;
            if (uId !== user?.userId) {
              usersFound.push({
                id: uId,
                email: cand.email || cand.fullName,
                role: "CANDIDATE",
                candidateProfile: { fullName: cand.fullName, profilePhotoUrl: cand.profilePhotoUrl },
              });
            }
          }
        }

        if (empRes.items) {
          for (const emp of empRes.items) {
            const uId = emp.userId || emp.id;
            if (uId !== user?.userId) {
              usersFound.push({
                id: uId,
                email: emp.email || emp.companyName,
                role: "EMPLOYER",
                employer: { companyName: emp.companyName, logoUrl: emp.logoUrl },
              });
            }
          }
        }

        setSearchResults(usersFound);
      } catch {
        // Ignore search errors
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  // Polling for active thread updates
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
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedCounterpart]);

  async function handleSelectConversation(counterpart: MessageUser) {
    setSelectedCounterpart(counterpart);
    shouldScrollRef.current = true;
    setThreadLoading(true);
    try {
      const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${counterpart.id}`);
      setThread(msgs);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load thread");
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedCounterpart) return;
    setSending(true);
    shouldScrollRef.current = true;
    try {
      const newMsg = await api.post<ConversationMessage>("/messages", {
        receiverId: selectedCounterpart.id,
        body: replyText.trim(),
      });
      setThread((prev) => [...prev, newMsg]);
      setReplyText("");

      if (newMsg.receiver && newMsg.receiver.id !== user?.userId) {
        setSelectedCounterpart(newMsg.receiver);
      }

      const convs = await api.get<ConversationMessage[]>("/messages/conversations");
      setConversations(convs);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
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
    shouldScrollRef.current = true;
    try {
      const { url, mediaType: detectedType, originalName } = await uploadFile<{
        url: string;
        mediaType: string;
        originalName: string;
      }>("/messages/upload", file);
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
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
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
      setError("Camera access denied or unavailable.");
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setError(null);
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
      });
    }
  }

  async function deleteMessage(msgId: string, type: "me" | "everyone") {
    setDeleteMenuOpenId(null);
    try {
      if (type === "everyone") {
        await api.delete(`/messages/${msgId}/everyone`);
      } else {
        await api.delete(`/messages/${msgId}`);
      }
      setThread((prev) =>
        prev
          .map((m) => {
            if (m.id === msgId) {
              if (type === "everyone") return { ...m, deletedForEveryone: true, body: "" };
              return null;
            }
            return m;
          })
          .filter((m): m is ConversationMessage => Boolean(m))
      );
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete message");
    }
  }

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const isMeSender = c.senderId === user?.userId;
      const otherUser = isMeSender ? c.receiver : c.sender;
      const name = getUserDisplayName(otherUser).toLowerCase();
      const body = (c.body || "").toLowerCase();
      return name.includes(term) || body.includes(term);
    });
  }, [conversations, searchTerm, user]);

  const isSelectedInConversations = useMemo(() => {
    if (!selectedCounterpart) return true;
    return conversations.some((c) => {
      const isMeSender = c.senderId === user?.userId;
      const otherUser = isMeSender ? c.receiver : c.sender;
      return (
        otherUser?.id === selectedCounterpart.id ||
        c.senderId === selectedCounterpart.id ||
        c.receiverId === selectedCounterpart.id ||
        (otherUser?.candidateProfile?.fullName &&
          otherUser.candidateProfile.fullName === selectedCounterpart.candidateProfile?.fullName) ||
        (otherUser?.employer?.companyName &&
          otherUser.employer.companyName === selectedCounterpart.employer?.companyName)
      );
    });
  }, [conversations, selectedCounterpart, user]);

  if (loading || !user || user.role !== "CANDIDATE") return null;

  const isCandidateCounterpart = selectedCounterpart && selectedCounterpart.role !== "EMPLOYER" && !selectedCounterpart.employer;
  const isChatLocked = isCandidateCounterpart && connectionStatus && !connectionStatus.isConnected;

  return (
    <>
      <Navbar7 />
      <Toaster position="top-center" />

      <div className="dashboard-wrap bg-light">
        <CandidateSidebar active="messages" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="col-xl-12 col-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Message Inbox</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Candidate</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <span className="text-main">Messages</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
              <div className="dash-msg-wrapper" style={{ minHeight: "600px", height: "70vh", display: "flex" }}>
                {/* Left Conversations Sidebar */}
                <div
                  className="dash-msg-conversations border-end d-flex flex-column"
                  style={{ width: "320px", flexShrink: 0, overflowY: "hidden" }}
                >
                  {/* Search Bar */}
                  <div className="p-3 border-bottom bg-light">
                    <div className="position-relative">
                      <i
                        className="fa-solid fa-magnifying-glass position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                        style={{ fontSize: "13px" }}
                      ></i>
                      <input
                        type="text"
                        className="form-control form-control-sm ps-5 bg-white rounded-pill"
                        placeholder="Search chats or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ height: "36px" }}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 p-0 px-2 text-muted"
                          onClick={() => setSearchTerm("")}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conversations List with Scroll */}
                  <div className="flex-grow-1 overflow-auto">
                    {/* Search Platform Users Results */}
                    {searchTerm.trim() && (
                      <div className="border-bottom bg-light-subtle">
                        <div className="px-3 py-2 text-muted small fw-semibold text-uppercase" style={{ fontSize: "11px" }}>
                          {searchingUsers ? "Searching users..." : `New Chat Results (${searchResults.length})`}
                        </div>
                        {searchResults.map((usr) => (
                          <div
                            key={usr.id}
                            className="dash-msg-item p-3 border-bottom"
                            style={{ cursor: "pointer", transition: "background 0.2s" }}
                            onClick={() => {
                              handleSelectConversation(usr);
                              setSearchTerm("");
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={getUserAvatar(usr, false, null, "/assets/img/avatar.jpg")}
                                alt=""
                                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h6 className="mb-0 text-truncate" style={{ fontSize: "0.9rem" }}>
                                  {getUserDisplayName(usr)}
                                </h6>
                                <span className="small text-main d-block">
                                  <i className="fa-regular fa-comment-dots me-1"></i>Start conversation
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {dataLoading && (
                      <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                      </div>
                    )}

                    {/* Temporary conversation item: ONLY show if not already present in conversations */}
                    {selectedCounterpart && !isSelectedInConversations && (
                      <div
                        className="dash-msg-item p-3 border-bottom active"
                        style={{ cursor: "pointer", backgroundColor: "#eef2f6" }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="position-relative">
                            <img
                              src={getUserAvatar(selectedCounterpart, false, null, "/assets/img/avatar.jpg")}
                              alt=""
                              style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "10px",
                                height: "10px",
                                backgroundColor: "#28a745",
                                borderRadius: "50%",
                                border: "2px solid #fff",
                              }}
                            ></span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 text-truncate" style={{ fontSize: "0.9rem" }}>
                                {getUserDisplayName(selectedCounterpart)}
                              </h6>
                            </div>
                            <span className="small text-muted d-block text-truncate">New conversation...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!dataLoading && filteredConversations.length === 0 && !selectedCounterpart && searchResults.length === 0 && (
                      <div className="text-center py-5 text-muted small p-3">
                        {searchTerm ? "No matching chats found." : "No conversations yet."}
                      </div>
                    )}

                    {filteredConversations.map((c) => {
                      const isMeSender = c.senderId === user.userId;
                      const otherUser = isMeSender ? c.receiver : c.sender;
                      const isSelected =
                        selectedCounterpart?.id === otherUser?.id ||
                        (selectedCounterpart?.candidateProfile?.fullName &&
                          selectedCounterpart.candidateProfile.fullName === otherUser?.candidateProfile?.fullName) ||
                        (selectedCounterpart?.employer?.companyName &&
                          selectedCounterpart.employer.companyName === otherUser?.employer?.companyName);

                      const displayName = getUserDisplayName(otherUser);
                      const avatarSrc = getUserAvatar(otherUser, false, null, "/assets/img/avatar.jpg");

                      return (
                        <div
                          key={c.id}
                          className={`dash-msg-item p-3 border-bottom ${isSelected ? "active" : ""}`}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#eef2f6" : "transparent",
                            transition: "background 0.2s",
                          }}
                          onClick={() => otherUser && handleSelectConversation(otherUser)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="position-relative">
                              <img
                                src={avatarSrc}
                                alt=""
                                style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 text-truncate" style={{ fontSize: "0.9rem" }}>
                                  {displayName}
                                </h6>
                                <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                                  {formatMessageDateTime(c.createdAt)}
                                </span>
                              </div>
                              <span className="small text-muted d-block text-truncate">
                                {c.deletedForEveryone ? "This message was deleted" : c.body || "Attachment"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Chat Area */}
                <div className="dash-msg-content d-flex flex-column" style={{ flex: 1, minWidth: 0, height: "100%" }}>
                  {selectedCounterpart ? (
                    <>
                      {/* Chat Header */}
                      <div
                        className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white"
                        style={{ flexShrink: 0 }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={getUserAvatar(selectedCounterpart, false, null, "/assets/img/avatar.jpg")}
                            alt=""
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div>
                            <h6 className="mb-0">{getUserDisplayName(selectedCounterpart)}</h6>
                            <span className="small text-success">
                              <i className="fa-solid fa-circle me-1" style={{ fontSize: "8px" }}></i>
                              {isChatLocked ? "Not Connected" : "Active Now"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chat Thread Messages */}
                      <div
                        ref={threadContainerRef}
                        onScroll={handleScroll}
                        className="p-4 d-flex flex-column gap-3"
                        style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8f9fa" }}
                      >
                        {threadLoading ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                          </div>
                        ) : thread.length === 0 ? (
                          <div className="text-center py-5 text-muted">
                            <i className="fa-regular fa-paper-plane mb-2" style={{ fontSize: "2rem" }}></i>
                            <p>No messages yet. Send a message to start chatting!</p>
                          </div>
                        ) : (
                          thread.map((m) => {
                            const isMe = m.senderId === user.userId;
                            const isEmployer = m.sender?.role === "EMPLOYER";
                            const defaultAvatar = isEmployer ? "/assets/img/c-1.png" : "/assets/img/avatar.jpg";
                            const avatarSrc = getUserAvatar(m.sender, isMe, myProfilePhoto, defaultAvatar);
                            const mediaFullUrl = m.mediaUrl ? assetUrl(m.mediaUrl) : null;

                            return (
                              <div
                                key={m.id}
                                className={`dash-msg-item-inner d-flex gap-2 ${
                                  isMe ? "flex-row-reverse" : "flex-row"
                                } align-items-start`}
                              >
                                <div className="dash-msg-avatar" style={{ flexShrink: 0 }}>
                                  <img
                                    src={avatarSrc}
                                    alt=""
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                                <div
                                  className="dash-msg-text"
                                  style={{
                                    position: "relative",
                                    overflow: "visible",
                                    minWidth: "120px",
                                    maxWidth: "75%",
                                    backgroundColor: isMe ? "#126746" : "#ffffff",
                                    color: isMe ? "#ffffff" : "#333333",
                                    borderRadius: "12px",
                                    padding: "12px 16px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                    <div
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                        wordBreak: "break-word",
                                        paddingRight: "25px",
                                      }}
                                    >
                                      {m.mediaType === "image" && mediaFullUrl && (
                                        <a href={mediaFullUrl} target="_blank" rel="noreferrer">
                                          <img
                                            src={mediaFullUrl}
                                            alt="image"
                                            style={{
                                              maxWidth: "200px",
                                              borderRadius: "8px",
                                              marginBottom: "6px",
                                              display: "block",
                                            }}
                                          />
                                        </a>
                                      )}
                                      {m.mediaType === "audio" && mediaFullUrl && (
                                        <audio
                                          controls
                                          src={mediaFullUrl}
                                          style={{ width: "200px", height: "45px", marginBottom: "6px" }}
                                        />
                                      )}
                                      {m.mediaType === "file" && mediaFullUrl && (
                                        <a
                                          href={mediaFullUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="d-flex align-items-center gap-2 mb-1 flex-wrap"
                                          style={{ color: "inherit" }}
                                        >
                                          <i className="fa-solid fa-file" style={{ fontSize: "1.2rem" }}></i>
                                          <span className="small text-truncate" style={{ maxWidth: "180px" }}>
                                            {m.body || "File"}
                                          </span>
                                        </a>
                                      )}
                                      {(!m.mediaType || m.mediaType === "file" ? false : Boolean(m.body)) && (
                                        <p
                                          className="mb-1"
                                          style={{
                                            fontStyle: m.deletedForEveryone ? "italic" : "normal",
                                            color: m.deletedForEveryone ? "#888" : "inherit",
                                          }}
                                        >
                                          {m.body}
                                        </p>
                                      )}
                                      {!m.mediaType && m.body && (
                                        <p
                                          className="mb-1"
                                          style={{
                                            fontStyle: m.deletedForEveryone ? "italic" : "normal",
                                            color: m.deletedForEveryone ? "#888" : "inherit",
                                          }}
                                        >
                                          {m.body}
                                        </p>
                                      )}
                                      <span
                                        className="small text-muted d-block opacity-75"
                                        style={{
                                          fontSize: "0.7rem",
                                          textAlign: isMe ? "right" : "left",
                                          color: isMe ? "#e0e0e0" : "#6c757d",
                                        }}
                                      >
                                        {formatMessageDateTime(m.createdAt)}
                                      </span>
                                    </div>
                                    <div className="msg-options" style={{ position: "relative", flexShrink: 0 }}>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{ width: "24px", height: "24px" }}
                                        onClick={() =>
                                          setDeleteMenuOpenId(deleteMenuOpenId === m.id ? null : m.id)
                                        }
                                      >
                                        <i
                                          className="fa-solid fa-ellipsis-vertical"
                                          style={{ color: "#888", fontSize: "12px" }}
                                        ></i>
                                      </button>
                                      {deleteMenuOpenId === m.id && (
                                        <div
                                          className="dropdown-menu show p-1 shadow border text-start"
                                          style={{
                                            position: "absolute",
                                            right: 0,
                                            top: "26px",
                                            zIndex: 10,
                                            minWidth: "160px",
                                          }}
                                        >
                                          <button
                                            className="dropdown-item text-danger small py-1"
                                            onClick={() => deleteMessage(m.id, "me")}
                                          >
                                            Delete for me
                                          </button>
                                          {isMe && !m.deletedForEveryone && (
                                            <button
                                              className="dropdown-item text-danger small py-1"
                                              onClick={() => deleteMessage(m.id, "everyone")}
                                            >
                                              Delete for everyone
                                            </button>
                                          )}
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

                      {/* Typing indicator */}
                      {isCounterpartTyping && (
                        <div
                          className="px-4 py-1 text-muted small"
                          style={{ fontStyle: "italic", flexShrink: 0, backgroundColor: "#f8f9fa" }}
                        >
                          {getUserDisplayName(selectedCounterpart)} is typing...
                        </div>
                      )}

                      {/* Connection Lock Notice or Normal Input Bar */}
                      {isChatLocked ? (
                        <div className="p-4 bg-white border-top text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                            <i className="fa-solid fa-user-lock text-warning fs-5"></i>
                            <h6 className="mb-0 fw-bold text-dark">Connection Required</h6>
                          </div>
                          <p className="small text-muted mb-3 mx-auto" style={{ maxWidth: "450px" }}>
                            You can only message candidates who have accepted your connection request.
                          </p>
                          {connectionStatus?.isPending ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary px-4 py-2 rounded-pill fw-medium"
                              disabled
                            >
                              <i className="fa-solid fa-clock me-1 text-warning"></i>Connection Request Pending
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-main px-4 py-2 rounded-pill fw-medium"
                              onClick={handleSendConnectionRequest}
                              disabled={requestingConnection}
                            >
                              {requestingConnection ? (
                                "Sending..."
                              ) : (
                                <>
                                  <i className="fa-solid fa-user-plus me-1"></i>Send Connection Request
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Bottom Input Area in ONE Neat Horizontal Line */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadAndSend(f);
                              e.target.value = "";
                            }}
                          />
                          <div
                            className="p-3 bg-white border-top d-flex align-items-center gap-2"
                            style={{ flexShrink: 0 }}
                          >
                            {/* 3 Action Buttons on Left */}
                            <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                              <button
                                type="button"
                                title="Take Photo"
                                className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border"
                                style={{ width: "38px", height: "38px", padding: 0 }}
                                onClick={openCamera}
                                disabled={uploadingMedia}
                              >
                                <i className="fa-solid fa-camera" style={{ fontSize: "14px", color: "#555" }}></i>
                              </button>
                              <button
                                type="button"
                                title="Attach File"
                                className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center border"
                                style={{ width: "38px", height: "38px", padding: 0 }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingMedia}
                              >
                                <i className="fa-solid fa-paperclip" style={{ fontSize: "14px", color: "#555" }}></i>
                              </button>
                              <button
                                type="button"
                                title={isRecording ? "Stop Recording" : "Voice Note"}
                                className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center border ${
                                  isRecording ? "btn-danger" : "btn-light"
                                }`}
                                style={{ width: "38px", height: "38px", padding: 0 }}
                                onClick={handleVoiceToggle}
                                disabled={uploadingMedia}
                              >
                                <i
                                  className={`fa-solid ${isRecording ? "fa-stop text-white" : "fa-microphone"}`}
                                  style={{ fontSize: "14px", color: isRecording ? "#fff" : "#555" }}
                                ></i>
                              </button>
                            </div>

                            {/* Middle Text Message Input */}
                            <input
                              type="text"
                              className="form-control bg-light px-3"
                              placeholder={
                                isRecording
                                  ? "🔴 Recording... tap stop to send"
                                  : uploadingMedia
                                  ? "Uploading..."
                                  : "Type a message..."
                              }
                              value={replyText}
                              onChange={(e) => handleTyping(e.target.value)}
                              disabled={isRecording || uploadingMedia}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSend();
                                }
                              }}
                              style={{
                                height: "42px",
                                borderRadius: "21px",
                                border: "1px solid #e2e8f0",
                                flex: 1,
                                minWidth: 0,
                                boxShadow: "none",
                              }}
                            />

                            {/* Right Send Button */}
                            <button
                              type="button"
                              className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                              style={{
                                flexShrink: 0,
                                width: "42px",
                                height: "42px",
                                padding: 0,
                                backgroundColor: "#126746",
                                borderColor: "#126746",
                              }}
                              disabled={sending || uploadingMedia || isRecording || !replyText.trim()}
                              onClick={handleSend}
                              title="Send message"
                            >
                              {sending ? (
                                <span
                                  className="spinner-border spinner-border-sm text-white"
                                  style={{ width: "16px", height: "16px" }}
                                ></span>
                              ) : (
                                <i className="fa-solid fa-paper-plane text-white" style={{ fontSize: "15px" }}></i>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <i className="fa-regular fa-comments mb-3" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                      <h5>Select a conversation</h5>
                      <p className="small">Choose a chat from the sidebar or search a user to start messaging.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted small">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadResumeModal />

      {showCameraModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Take Photo</h5>
                <button type="button" className="btn-close" onClick={closeCamera}></button>
              </div>
              <div className="modal-body text-center">
                {error && <div className="alert alert-danger">{error}</div>}
                <div
                  className="bg-dark rounded overflow-hidden"
                  style={{ width: "100%", aspectRatio: "4/3" }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  ></video>
                </div>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button type="button" className="btn btn-secondary" onClick={closeCamera}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={takePhoto}>
                  <i className="fa-solid fa-camera me-2"></i> Capture &amp; Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
