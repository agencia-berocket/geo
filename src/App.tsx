/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Portfolio from './components/Portfolio';
import Services from './components/Services';
import GoogleSearchMode from './components/GoogleSearchMode';
import GeoScience2026 from './components/GeoScience2026';
import Stats from './components/Stats';
import Process from './components/Process';
import BentoExpertise from './components/BentoExpertise';
import CTA from './components/CTA';
import Pricing from './components/Pricing';
import Team from './components/Team';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import MeetingScheduler from './components/MeetingScheduler';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-zinc-950 selection:bg-zinc-950 selection:text-white relative font-sans antialiased">
      {/* Sticky navigation */}
      <Navbar />

      <main className="relative z-10">
        {/* Parallax Hero section */}
        <Hero />

        {/* Selected Portfolio Showcase */}
        <Portfolio />

        {/* Dynamic interactive Services selector */}
        <Services />

        {/* Educational Google Search Mode Toggle Section */}
        <GoogleSearchMode />

        {/* Deep 2026 Scientific GEO & RAG Insights Section */}
        <GeoScience2026 />

        {/* Stat counters and Cinematic Showreel banner */}
        <Stats />

        {/* Stepper workflow Process maps */}
        <Process />

        {/* Interactive Bento grid details */}
        <BentoExpertise />

        {/* Beautiful CTA panel designed by the user */}
        <CTA />

        {/* Retainer Pricing plans */}
        <Pricing />

        {/* Team details & office panorama */}
        <Team />

        {/* Expandable Accordion FAQs */}
        <FAQ />
      </main>

      {/* Pristine marquee Footer & Newsletter subscription */}
      <Footer />

      {/* Global Google Calendar Meeting Booking Dialog */}
      <MeetingScheduler />
    </div>
  );
}

