import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

const insights = [
  {
    title: "Market Making & HFT",
    description: "High-frequency trading firms like Citadel, Jump Trading, and Optiver focus on market microstructure, latency optimization, and statistical arbitrage.",
    topics: ["Order book dynamics", "Latency arbitrage", "Market impact models", "Co-location strategies"]
  },
  {
    title: "Asset Management",
    description: "Traditional asset managers like BlackRock, AQR, and Two Sigma use quantitative methods for portfolio construction and risk management.",
    topics: ["Factor investing", "Risk parity", "Alternative data", "ESG integration"]
  },
  {
    title: "Hedge Funds",
    description: "Quantitative hedge funds like Renaissance, DE Shaw, and Millennium employ sophisticated mathematical models for alpha generation.",
    topics: ["Alpha research", "Multi-manager platforms", "Alternative datasets", "Machine learning applications"]
  },
  {
    title: "Investment Banks",
    description: "Banks like Goldman Sachs, Morgan Stanley, and JP Morgan use quants for derivatives pricing, risk management, and electronic trading.",
    topics: ["Derivatives pricing", "Credit risk models", "Regulatory capital", "Electronic market making"]
  }
];

export function IndustryInsights() {
  return (
    <Section title="Industry Landscape" description="Understanding different sectors and their quantitative approaches">
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight, i) => (
          <FadeIn key={insight.title} delay={i * 0.05}>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium text-lg mb-2">{insight.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
              <div className="flex flex-wrap gap-2">
                {insight.topics.map(topic => (
                  <span key={topic} className="px-2 py-1 text-xs bg-muted rounded-md">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}