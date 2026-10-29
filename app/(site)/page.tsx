import { HomeHero } from "@/components/home-hero";
import { HomeIndustries } from "@/components/home-industries";
import { HomeLanes } from "@/components/home-lanes";
import { HomePartners } from "@/components/home-partners";
import { HomeServices } from "@/components/home-services";
import { JourneyShowcase } from "@/components/sections/journey-showcase";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <JourneyShowcase />
      <HomeLanes />
      <HomeServices />
      <HomeIndustries />
      <HomePartners />
    </>
  );
}
