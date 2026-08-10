import Link from "next/link";
import Navbar2 from "@/components/Navbar2";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

export default function NotFound() {
  return (
    <>
      <Navbar2 />

      {/* Page Title Start */}
      <section
        className="bg-cover bg-second"
        style={{ background: "url(/assets/img/bg2.png)no-repeat" }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12">
              <h2 className="ipt-title text-light">Page Not Found</h2>
              <span className="ipn-subtitle text-light opacity-75">The page you&apos;re looking for doesn&apos;t exist.</span>
            </div>
          </div>
        </div>
      </section>
      {/* Page Title End */}

      <section className="error-wrap">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-10">
              <div className="text-center">
                <img src="/assets/img/404.png" className="img-fluid" alt="" />
                <p className="fs-6">
                  Maecenas quis consequat libero, a feugiat eros. Nunc ut lacinia tortor morbi ultricies laoreet ullamcorper phasellus semper
                </p>
                <Link className="btn btn-main px-5" href="/">
                  Back To Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LoginModal />
      <Footer />
    </>
  );
}
