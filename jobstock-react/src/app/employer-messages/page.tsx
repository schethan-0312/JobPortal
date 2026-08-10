"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

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
  myLogoUrl: string | null | undefined,
  defaultRoleFallback: string
): string {
  if (isMe && myLogoUrl) {
    return assetUrl(myLogoUrl) || defaultRoleFallback;
  }
  if (!userObj) return defaultRoleFallback;

  if (userObj.employer?.logoUrl) {
    return assetUrl(userObj.employer.logoUrl) || defaultRoleFallback;
  }
  if (userObj.candidateProfile?.profilePhotoUrl) {
    return assetUrl(userObj.candidateProfile.profilePhotoUrl) || defaultRoleFallback;
  }

  if (userObj.role === "CANDIDATE") {
    return "/assets/img/user-5.png";
  }

  return defaultRoleFallback;
}

function getUserDisplayName(userObj?: MessageUser | null): string {
  if (!userObj) return "User";
  if (userObj.candidateProfile?.fullName) return userObj.candidateProfile.fullName;
  if (userObj.employer?.companyName) return userObj.employer.companyName;
  return userObj.email || "User";
}

export default function EmployerMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [selectedCounterpart, setSelectedCounterpart] = useState<MessageUser | null>(null);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [myLogoUrl, setMyLogoUrl] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYER")) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYER") return;

    // Fetch employer logo
    api.get<{ logoUrl?: string | null }>("/employers/me")
      .then((data) => setMyLogoUrl(data.logoUrl ?? null))
      .catch(() => setMyLogoUrl(null));

    (async () => {
      setDataLoading(true);
      try {
        const convs = await api.get<ConversationMessage[]>("/messages/conversations");
        setConversations(convs);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load conversations");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  function counterpartOf(m: ConversationMessage): MessageUser {
    if (m.senderId === user?.userId) {
      return m.receiver || { id: m.receiverId, email: "User" };
    }
    return m.sender || { id: m.senderId, email: "User" };
  }

  async function openConversation(counterpart: MessageUser) {
    setSelectedCounterpart(counterpart);
    setThreadLoading(true);
    setError(null);
    try {
      const msgs = await api.get<ConversationMessage[]>(`/messages/conversations/${counterpart.id}`);
      setThread(msgs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load conversation thread");
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSend() {
    if (!selectedCounterpart || !replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const msg = await api.post<ConversationMessage>("/messages", {
        receiverId: selectedCounterpart.id,
        body: replyText.trim(),
      });
      setThread((prev) => [...prev, msg]);
      setReplyText("");

      // Refresh conversations list
      const convs = await api.get<ConversationMessage[]>("/messages/conversations");
      setConversations(convs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading || !user || user.role !== "EMPLOYER") {
    return null;
  }

  return (
    <>
      <Navbar8 />

      <div className="dashboard-wrap bg-light">
        <EmployerSidebar active="messages" />

        <div className="dashboard-content">
          <div className="dashboard-tlbar d-block mb-4">
            <div className="row">
              <div className="colxl-12 col-lg-12 col-md-12">
                <h1 className="mb-1 fs-3 fw-medium">Employer Messages</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item text-muted"><a href="#">Employer</a></li>
                    <li className="breadcrumb-item text-muted"><a href="#">Dashboard</a></li>
                    <li className="breadcrumb-item"><a href="#" className="text-main">Employer Messages</a></li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Conversation Container */}
            <div className="messages-container margin-top-0">
              <div className="messages-headline d-flex align-items-center justify-content-between px-4 py-3">
                <h4 className="mb-0 fs-6 fw-bold text-dark">
                  {selectedCounterpart ? getUserDisplayName(selectedCounterpart) : "Select a conversation"}
                </h4>
                {selectedCounterpart && (
                  <span className="small text-muted fs-7">{selectedCounterpart.email}</span>
                )}
              </div>

              <div className="messages-container-inner">

                {/* Conversation List */}
                <div className="dash-msg-inbox">
                  {dataLoading && <p className="p-3 text-muted mb-0">Loading conversations...</p>}
                  {!dataLoading && conversations.length === 0 && <p className="p-3 text-muted mb-0">No conversations yet.</p>}
                  <ul className="list-unstyled mb-0">
                    {conversations.map((c) => {
                      const cp = counterpartOf(c);
                      const isSelected = selectedCounterpart?.id === cp.id;
                      return (
                        <li className={isSelected ? "active-message" : undefined} key={c.id}>
                          <a
                            href="JavaScript:Void(0);"
                            onClick={() => openConversation(cp)}
                            className="d-flex align-items-center p-3 text-decoration-none border-bottom"
                            style={{ gap: "14px" }}
                          >
                            <div style={{ width: "45px", height: "45px", flexShrink: 0 }}>
                              <img
                                src={getUserAvatar(cp, false, null, "/assets/img/user-5.png")}
                                alt={getUserDisplayName(cp)}
                                style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", display: "block" }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                <h5 className="mb-0 text-dark fw-semibold text-truncate" style={{ fontSize: "14px", lineHeight: "1.2" }}>
                                  {getUserDisplayName(cp)}
                                </h5>
                                <span className="text-muted flex-shrink-0" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                                  {formatMessageDateTime(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-muted small text-truncate mb-0" style={{ fontSize: "13px", lineHeight: "1.3" }}>
                                {c.body}
                              </p>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Chat Thread Area */}
                <div className="dash-msg-content p-4">
                  {threadLoading && <p className="text-muted">Loading thread...</p>}
                  {!threadLoading && selectedCounterpart && thread.length === 0 && (
                    <p className="text-muted">No messages yet. Say hello!</p>
                  )}
                  {!selectedCounterpart && (
                    <p className="text-muted">Select a conversation on the left to view messages.</p>
                  )}

                  {thread.map((m) => {
                    const isMe = m.senderId === user.userId;
                    const senderObj = isMe ? m.sender : (m.receiver?.id === user.userId ? m.sender : m.receiver);
                    const avatarSrc = getUserAvatar(
                      senderObj,
                      isMe,
                      myLogoUrl,
                      isMe ? "/assets/img/l-1.png" : "/assets/img/user-5.png"
                    );
                    return (
                      <div className={`message-plunch${isMe ? " me" : ""}`} key={m.id}>
                        <div className="dash-msg-avatar">
                          <img
                            src={avatarSrc}
                            alt=""
                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                          />
                        </div>
                        <div className="dash-msg-text">
                          <p className="mb-1">{m.body}</p>
                          <span className="small text-muted d-block text-end opacity-75" style={{ fontSize: "0.7rem" }}>
                            {formatMessageDateTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Reply Area */}
                  <div className="clearfix"></div>
                  {selectedCounterpart && (
                    <div className="message-reply mt-4">
                      <textarea
                        cols={40}
                        rows={3}
                        className="form-control with-light mb-3"
                        placeholder="Your Message"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      ></textarea>
                      <button
                        type="button"
                        className="btn btn-main px-4"
                        disabled={sending || !replyText.trim()}
                        onClick={handleSend}
                      >
                        {sending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center text-muted small">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
