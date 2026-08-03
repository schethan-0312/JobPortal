"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar8 from "@/components/Navbar8";
import EmployerSidebar from "@/components/employer-dashboard/EmployerSidebar";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, assetUrl } from "@/lib/api";

interface CounterpartUser {
  id: string;
  email: string;
  role?: string;
  employer?: { companyName: string; logoUrl: string | null } | null;
  candidateProfile?: { fullName: string; profilePhotoUrl: string | null } | null;
}

interface ConversationMessage {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  sender: CounterpartUser;
  receiver: CounterpartUser;
}

function displayName(u: CounterpartUser) {
  return u.employer?.companyName || u.candidateProfile?.fullName || u.email;
}

function avatarUrl(u: CounterpartUser) {
  return assetUrl(u.employer?.logoUrl || u.candidateProfile?.profilePhotoUrl) || "/assets/img/avatar.jpg";
}

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={null}>
      <EmployerMessagesPageInner />
    </Suspense>
  );
}

function EmployerMessagesPageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [selectedCounterpart, setSelectedCounterpart] = useState<CounterpartUser | null>(null);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [replyText, setReplyText] = useState("");
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
    (async () => {
      setDataLoading(true);
      try {
        const convs = await api.get<ConversationMessage[]>("/messages/conversations");
        setConversations(convs);

        const candidateId = searchParams.get("candidateId");
        if (candidateId) {
          const existing = convs.find((c) => (c.senderId === user.userId ? c.receiver : c.sender).id === candidateId);
          if (existing) {
            openConversation(existing.senderId === user.userId ? existing.receiver : existing.sender);
          } else {
            openConversation({
              id: candidateId,
              email: searchParams.get("name") || "Candidate",
              candidateProfile: {
                fullName: searchParams.get("name") || "Candidate",
                profilePhotoUrl: searchParams.get("photo") || null,
              },
            });
          }
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load conversations");
      } finally {
        setDataLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function counterpartOf(m: ConversationMessage) {
    return m.senderId === user?.userId ? m.receiver : m.sender;
  }

  async function openConversation(counterpart: CounterpartUser) {
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
      const msg = await api.post<ConversationMessage>("/messages", { receiverId: selectedCounterpart.id, body: replyText.trim() });
      setThread((prev) => [...prev, msg]);
      setReplyText("");
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
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Employer</a>
                    </li>
                    <li className="breadcrumb-item text-muted">
                      <a href="#">Dashboard</a>
                    </li>
                    <li className="breadcrumb-item">
                      <a href="#" className="text-main">
                        Employer Messages
                      </a>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="dashboard-widg-bar d-block">

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Convershion */}
            <div className="messages-container margin-top-0">
              <div className="messages-headline">
                <h4>{selectedCounterpart ? displayName(selectedCounterpart) : "Select a conversation"}</h4>
              </div>

              <div className="messages-container-inner">
                {/* Messages */}
                <div className="dash-msg-inbox">
                  {dataLoading && <p className="p-3 text-muted">Loading conversations...</p>}
                  {!dataLoading && conversations.length === 0 && <p className="p-3 text-muted">No conversations yet.</p>}
                  <ul>
                    {conversations.map((c) => {
                      const cp = counterpartOf(c);
                      return (
                        <li className={selectedCounterpart?.id === cp.id ? "active-message" : undefined} key={c.id}>
                          <a href="JavaScript:Void(0);" onClick={() => openConversation(cp)}>
                            <div className="dash-msg-avatar">
                              <img src={avatarUrl(cp)} alt="" />
                            </div>

                            <div className="message-by">
                              <div className="message-by-headline">
                                <h5>{displayName(cp)}</h5>
                                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p>{c.body}</p>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {/* Messages / End */}

                {/* Message Content */}
                <div className="dash-msg-content">
                  {threadLoading && <p className="text-muted">Loading thread...</p>}
                  {!threadLoading && selectedCounterpart && thread.length === 0 && <p className="text-muted">No messages yet. Say hello!</p>}
                  {!selectedCounterpart && <p className="text-muted">Select a conversation on the left to view messages.</p>}
                  {thread.map((m) => (
                    <div className={`message-plunch${m.senderId === user.userId ? " me" : ""}`} key={m.id}>
                      <div className="dash-msg-avatar">
                        <img src={m.senderId === user.userId ? "/assets/img/avatar.jpg" : avatarUrl(selectedCounterpart!)} alt="" />
                      </div>
                      <div className="dash-msg-text">
                        <p>{m.body}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply Area */}
                  <div className="clearfix"></div>
                  {selectedCounterpart && (
                    <div className="message-reply">
                      <textarea
                        cols={40}
                        rows={3}
                        className="form-control with-light"
                        placeholder="Your Message"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      ></textarea>
                      <button type="button" className="btn btn-main" disabled={sending || !replyText.trim()} onClick={handleSend}>
                        {sending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  )}
                </div>
                {/* Message Content */}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="row">
            <div className="col-md-12">
              <div className="py-3 text-center">
                &copy; {new Date().getFullYear()} JobStock. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
