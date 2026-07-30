export default function VideoBanner() {
  return (
    <section
      className="bg-cover"
      style={{ background: "#17ac6a url(/assets/img/video-bg.jpg) no-repeat" }}
      data-overlay="4"
    >
      <div className="ht-200"></div>
      <div className="container">
        <div className="row align-items-center justify-content-center">
          <div className="col-xl-12 col-lg-12">
            <div className="overlio-vedio-box">
              <a href="#" className="play-video-btn text-main">
                <i className="fa-solid fa-play"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="ht-200"></div>
    </section>
  );
}
