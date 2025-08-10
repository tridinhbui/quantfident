import { Hero } from "@/components/sections/hero";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { Timeline } from "@/components/sections/timeline";
import { MetricTiles } from "@/components/sections/metric-tiles";
import { Testimonial } from "@/components/sections/testimonial";
import { FAQAccordion } from "@/components/sections/faq-accordion";
import { CTASection } from "@/components/sections/cta-section";
import { ProgramOverview } from "@/components/sections/program-overview";
import { QuantCareers } from "@/components/sections/quant-careers";
import { IndustryInsights } from "@/components/sections/industry-insights";
import { SkillsMatrix } from "@/components/sections/skills-matrix";
import { InterviewPrep } from "@/components/sections/interview-prep";

export default function Home() {
  return (
    <div className="space-y-24">
      <Hero />
      <FeatureGrid />
      <div id="program">
        <ProgramOverview />
      </div>
      <div id="careers">
        <QuantCareers />
      </div>
      <Timeline />
      <IndustryInsights />
      <div id="skills">
        <SkillsMatrix />
      </div>
      <div id="interview">
        <InterviewPrep />
      </div>
      <div id="resources">
        <MetricTiles />
      </div>
      <Testimonial />
      <FAQAccordion />
      <div id="contact">
        <CTASection />
      </div>
    </div>
  );
}
