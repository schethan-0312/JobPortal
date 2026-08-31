"use client";

import { useState, useRef, useEffect } from "react";

export default function VideoBanner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        playerRef.current = new (window as any).YT.Player("yt-square-player", {
          height: "100%",
          width: "100%",
          videoId: "LXb3EKWsInQ",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => setIsReady(true),
            onStateChange: (e: any) => {
              if (e.data === 1) setIsPlaying(true);
              else if (e.data === 2 || e.data === 0) setIsPlaying(false);
            },
          },
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  const togglePlay = () => {
    if (playerRef.current && isReady) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const skipForward = () => {
    if (playerRef.current && isReady) {
      const cur = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(cur + 10, true);
    }
  };

  const skipBackward = () => {
    if (playerRef.current && isReady) {
      const cur = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, cur - 10), true);
    }
  };

  const toggleMute = () => {
    if (playerRef.current && isReady) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  return (
    <section className="py-5 position-relative" style={{ backgroundColor: "#f4f7f9" }}>
      <div className="container py-4">
        <div className="row align-items-center justify-content-between gy-4">
          {/* Left Side: Text Content */}
          <div className="col-lg-6 col-md-12">
            <div className="pe-lg-4">
              <span
                className="badge px-3 py-2 mb-3 rounded-pill fw-semibold text-uppercase"
                style={{
                  backgroundColor: "#e6f4f4",
                  color: "#145758",
                  border: "1px solid rgba(20, 87, 88, 0.2)",
                  fontSize: "0.8rem",
                  letterSpacing: "1px",
                }}
              >
                <i className="fa-solid fa-circle-play me-2"></i>Platform Overview
              </span>

              <h2 className="video-title fw-bold text-dark mb-3" style={{ lineHeight: 1.25 }}>
                See How JobStock Accelerates Hiring &amp; Career Growth
              </h2>

              <p className="fs-6 text-muted mb-4" style={{ lineHeight: 1.6 }}>
                Watch our platform overview video to discover how JobStock connects job seekers with verified employers, featuring automated matching, 1-click applications, and real-time candidate updates.
              </p>

              <div className="row g-3 mb-2">
                <div className="col-sm-6">
                  <div
                    className="p-3 rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm"
                    style={{ border: "1px solid #e2e8f0" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "44px", height: "44px", backgroundColor: "#145758", color: "#ffffff" }}
                    >
                      <i className="fa-solid fa-bolt fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Fast Matching</h6>
                      <small className="text-muted">Instant candidate alerts</small>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div
                    className="p-3 rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm"
                    style={{ border: "1px solid #e2e8f0" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "44px", height: "44px", backgroundColor: "#145758", color: "#ffffff" }}
                    >
                      <i className="fa-solid fa-shield-halved fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Verified Jobs</h6>
                      <small className="text-muted">Direct company listings</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Square Video Player Container */}
          <div className="col-lg-6 col-md-12 d-flex justify-content-center justify-content-lg-end">
            <div
              className="position-relative overflow-hidden rounded-4 w-100 shadow-lg"
              style={{
                maxWidth: "460px",
                aspectRatio: "1 / 1",
                backgroundColor: "#000000",
                border: "4px solid #ffffff",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
              }}
            >
              {/* YouTube Container */}
              <div id="yt-square-player" className="w-100 h-100"></div>

              {/* Custom Control Overlay Bar at Bottom */}
              <div
                className="position-absolute bottom-0 start-0 w-100 p-3 d-flex align-items-center justify-content-between"
                style={{
                  background: "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%)",
                  zIndex: 10,
                }}
              >
                {/* Left Controls: Rewind 10s, Play/Pause (On/Off), Forward 10s */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={skipBackward}
                    className="btn btn-sm btn-dark text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", opacity: 0.9 }}
                    title="Rewind 10 seconds"
                  >
                    <i className="fa-solid fa-rotate-left fs-6"></i>
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#145758",
                      color: "#ffffff",
                    }}
                    title={isPlaying ? "Pause (Off)" : "Play (On)"}
                  >
                    <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play ms-1"} fs-6`}></i>
                  </button>

                  <button
                    type="button"
                    onClick={skipForward}
                    className="btn btn-sm btn-dark text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", opacity: 0.9 }}
                    title="Forward 10 seconds"
                  >
                    <i className="fa-solid fa-rotate-right fs-6"></i>
                  </button>
                </div>

                {/* Right Control: Mute/Unmute */}
                <div>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="btn btn-sm btn-dark text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", opacity: 0.9 }}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    <i className={`fa-solid ${isMuted ? "fa-volume-xmark" : "fa-volume-high"} fs-6`}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-title {
          font-size: clamp(1.4rem, 3.5vw, 2.2rem);
        }
      `}</style>
    </section>
  );
}
