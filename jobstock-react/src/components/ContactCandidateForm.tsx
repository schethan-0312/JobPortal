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
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to send a message.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }
    
    setSending(true);
    try {
      await api.post("/messages", {
        receiverId: candidateUserId,
        body: message.trim(),
      });
      
      toast.success("Message sent successfully!");
      setMessage("");
      
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group mb-3">
        <textarea 
          className="form-control" 
          placeholder={`Type your message to ${candidateName}...`} 
          required 
          minLength={2} 
          rows={5}
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>
      <div className="form-group m-0">
        <button type="submit" className="btn btn-main fw-medium full-width d-block text-center text-white" disabled={sending}>
          {sending ? (
            <><i className="fa-solid fa-spinner fa-spin me-2"></i> Sending...</>
          ) : (
            <><i className="fa-regular fa-paper-plane me-2"></i> Send Message</>
          )}
        </button>
      </div>
    </form>
  );
}
