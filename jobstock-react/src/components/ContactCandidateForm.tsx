"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

interface Props {
  candidateUserId: string;
  candidateName: string;
}

export default function ContactCandidateForm({ candidateUserId, candidateName }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to send a message.");
      return;
    }
    
    setSending(true);
    try {
      const fullMessage = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\n\n${message}`;
      
      await api.post("/messages", {
        receiverId: candidateUserId,
        body: fullMessage,
      });
      
      toast.success("Message sent successfully!");
      
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      
      router.push(`/employer-messages?newChat=${candidateUserId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <input type="text" className="form-control" placeholder="Your Name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <input type="email" className="form-control" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <input type="text" className="form-control" placeholder="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <input type="text" className="form-control" placeholder="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="form-group">
        <textarea className="form-control" placeholder="Your Message" required minLength={10} value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
      </div>
      <div className="form-group m-0">
        <button type="submit" className="btn btn-main fw-medium full-width d-block text-center text-white" disabled={sending}>
          {sending ? (
            <><i className="fa-solid fa-spinner fa-spin me-2"></i> Sending...</>
          ) : (
            <><i className="fa-regular fa-comment-dots me-2"></i> Message {candidateName}</>
          )}
        </button>
      </div>
    </form>
  );
}
