import Navbar5 from "@/components/Navbar5";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import HeroBanner from "@/components/home/HeroBanner";
import FeaturedJobs from "@/components/home/FeaturedJobs";
import Categories from "@/components/home/Categories";
import FeaturesProcess from "@/components/home/FeaturesProcess";
import VideoBanner from "@/components/home/VideoBanner";
import CallToAction from "@/components/home/CallToAction";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Navbar5 />
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
