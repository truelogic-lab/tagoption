import React from "react";
import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Welcome from "../components/landing/Welcome";
import Explore from "../components/landing/Explore";
import GettingStarted from "../components/landing/GettingStarted";
import Faq from "../components/landing/Faq";
import FinalCta from "../components/landing/FinalCta";
import Footer from "../components/landing/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Welcome />
        <Explore />
        <GettingStarted />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
