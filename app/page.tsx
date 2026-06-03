import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import AgencyPilotCapabilities from "@/components/sections/AgencyPilotCapabilities";
import WhoWeHelp from "@/components/sections/WhoWeHelp";
import HowItWorks from "@/components/sections/HowItWorks";
import ApplicantSection from "@/components/sections/ApplicantSection";
import NoticeSection from "@/components/sections/NoticeSection";
import ChecklistSection from "@/components/sections/ChecklistSection";
import RecertSection from "@/components/sections/RecertSection";
import AgencySection from "@/components/sections/AgencySection";
import IntegritySection from "@/components/sections/IntegritySection";
import HITLSection from "@/components/sections/HITLSection";
import SecuritySection from "@/components/sections/SecuritySection";
import PilotSection from "@/components/sections/PilotSection";
import MetricsSection from "@/components/sections/MetricsSection";
import FAQ from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <AgencyPilotCapabilities />
        <WhoWeHelp />
        <HowItWorks />
        <ApplicantSection />
        <NoticeSection />
        <ChecklistSection />
        <RecertSection />
        <AgencySection />
        <IntegritySection />
        <HITLSection />
        <SecuritySection />
        <PilotSection />
        <MetricsSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
