import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, Code } from "lucide-react";

const careers = [
  {
    icon: TrendingUp,
    title: "Quant Researcher",
    description: "Design alpha signals, backtest strategies, analyze market anomalies. Focus on statistical modeling, factor research, and predictive analytics.",
    skills: ["Statistics & Probability", "Signal Processing", "Factor Models", "Research Methodology"]
  },
  {
    icon: Brain,
    title: "Quant Trader",
    description: "Execute algorithmic strategies, manage risk in real-time, optimize portfolio allocation. Combine quantitative analysis with market intuition.",
    skills: ["Market Microstructure", "Risk Management", "Portfolio Optimization", "Execution Algorithms"]
  },
  {
    icon: Code,
    title: "Quant Developer",
    description: "Build trading systems, implement backtesting frameworks, optimize low-latency infrastructure. Bridge quantitative research and technology.",
    skills: ["System Design", "Performance Optimization", "Data Engineering", "Trading Infrastructure"]
  }
];

export function QuantCareers() {
  return (
    <Section title="Quant Career Paths" description="Explore the three main quantitative finance roles and what makes each unique">
      <div className="grid gap-6 md:grid-cols-3">
        {careers.map((career, i) => {
          const Icon = career.icon;
          return (
            <FadeIn key={career.title} delay={i * 0.1}>
              <Card className="rounded-3xl shadow-xl h-full border-0 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-serif">{career.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{career.description}</p>
                  <div>
                    <div className="text-sm font-medium mb-2">Key Skills:</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {career.skills.map(skill => (
                        <li key={skill}>• {skill}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </Section>
  );
}