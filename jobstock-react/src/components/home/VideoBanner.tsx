"use client";

import { useState } from "react";

export default function VideoBanner() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      className="bg-cover position-relative overflow-hidden"
      style={{
        background: "#17ac6a url(/assets/img/video-bg.jpg) no-repeat center center/cover",
        minHeight: "480px",
      }}
      data-overlay="4"
    >
      {!isPlaying ? (
        <>
          <div className="ht-200"></div>
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-xl-12 col-lg-12">
                <div className="overlio-vedio-box">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="play-video-btn text-main border-0 bg-transparent"
                    style={{ cursor: "pointer" }}
                    aria-label="Play video"
                  >
                    <i className="fa-solid fa-play"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="ht-200"></div>
        </>
      ) : (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black">
          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="btn btn-sm btn-dark text-white position-absolute top-0 end-0 m-3 rounded-pill px-3 shadow"
            style={{ zIndex: 20 }}
            aria-label="Close video"
          >
            <i className="fa-solid fa-xmark me-1"></i> Close
          </button>
          <iframe
            src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&rel=0"
            title="JobStock Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-100 h-100 border-0"
            style={{ minHeight: "480px" }}
          ></iframe>
        </div>
      )}
    </section>
  );
}



