"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";

interface ChannelStatus {
  phoneNumber: string | null;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
  smsAvailable: boolean;
  pushAvailable: boolean;
}

export default function NotificationChannelsCard() {
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<ChannelStatus>("/notifications/channels").then((s) => {
      setStatus(s);
      setPhoneNumber(s.phoneNumber ?? "");
      setSmsOptIn(s.smsOptIn);
      setWhatsappOptIn(s.whatsappOptIn);
    });
    isPushSubscribed().then(setPushOn);
  }, []);

  async function togglePush() {
    setBusy(true);
    setMessage(null);
    try {
      if (pushOn) {
        await unsubscribeFromPush();
        setPushOn(false);
      } else {
        const ok = await subscribeToPush();
        setPushOn(ok);
        if (!ok) setMessage("Browser notifications were blocked or unsupported.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs() {
    setBusy(true);
    setMessage(null);
    try {
      await api.patch("/notifications/channels", { phoneNumber: phoneNumber || undefined, smsOptIn, whatsappOptIn });
      setMessage("Notification preferences saved.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not save preferences");
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h4>Notification Channels</h4>
        <p className="text-muted mb-0 mt-1">Choose how JobStock reaches you beyond the in-app bell.</p>
      </div>
      <div className="card-body">
        {message && <div className="alert alert-info py-2">{message}</div>}

        <div className="d-flex align-items-center justify-content-between border rounded p-3 mb-3">
          <div>
            <div className="fw-medium">Browser push notifications</div>
            <div className="small text-muted">Instant alerts even when JobStock isn&apos;t open in a tab.</div>
          </div>
          <button type="button" className={`btn btn-sm ${pushOn ? "btn-outline-danger" : "btn-main"}`} disabled={busy} onClick={togglePush}>
            {pushOn ? "Turn off" : "Turn on"}
          </button>
        </div>

        <div>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small text-muted">Phone number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 555 000 1234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="smsOptIn"
                  checked={smsOptIn}
                  disabled={!status.smsAvailable}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="smsOptIn">
                  SMS alerts
                </label>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="whatsappOptIn"
                  checked={whatsappOptIn}
                  disabled={!status.smsAvailable}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="whatsappOptIn">
                  WhatsApp alerts
                </label>
              </div>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-sm btn-outline-main w-100" disabled={busy} onClick={savePrefs}>
                Save
              </button>
            </div>
          </div>
          {!status.smsAvailable && (
            <p className="small text-muted mt-2 mb-0">
              SMS/WhatsApp delivery isn&apos;t configured on this deployment yet — the toggles above will activate automatically once it is.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
