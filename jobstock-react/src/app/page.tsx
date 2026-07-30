import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import HeroBanner from "@/components/home/HeroBanner";
import FeaturedJobs from "@/components/home/FeaturedJobs";
import Categories from "@/components/home/Categories";
import FeaturesProcess from "@/components/home/FeaturesProcess";
import VideoBanner from "@/components/home/VideoBanner";
import CallToAction from "@/components/home/CallToAction";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroBanner />
      <div className="clearfix"></div>
      <FeaturedJobs />
      <Categories />
      <FeaturesProcess />
      <VideoBanner />
      <CallToAction />
      <LoginModal />
      <Footer />
    </>
  );
}
