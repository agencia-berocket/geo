/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import Disclaimer from './components/Disclaimer';

type Route = 'home' | 'privacy' | 'terms' | 'disclaimer';

function getRoute(): Route {
  const hash = window.location.hash;
  if (hash === '#/privacidade') return 'privacy';
  if (hash === '#/termos') return 'terms';
  if (hash === '#/isencao') return 'disclaimer';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRoute();
      setRoute(newRoute);
      if (newRoute !== 'home') {
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Legal pages
  if (route === 'privacy') return <PrivacyPolicy />;
  if (route === 'terms') return <TermsOfUse />;
  if (route === 'disclaimer') return <Disclaimer />;

  // Home / Landing Page
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
