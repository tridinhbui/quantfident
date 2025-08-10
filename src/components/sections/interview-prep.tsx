import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Brain, Code2, Users } from "lucide-react";

const interviewTypes = [
  {
    icon: Calculator,
    title: "Mental Math & Sequences",
    description: "Quick calculations, pattern recognition, and numerical estimation under time pressure.",
    examples: ["Sum of 1/n from n=1 to 100", "Fibonacci patterns", "Probability of card draws", "Compound interest calculations"]
  },
  {
    icon: Brain,
    title: "Brainteasers & Logic",
    description: "Analytical reasoning, lateral thinking, and problem decomposition skills.",
    examples: ["Monty Hall problem", "Prisoner's dilemma", "Bridge crossing puzzle", "Coin weighing problems"]
  },
  {
    icon: Code2,
    title: "Technical Coding",
    description: "Algorithm implementation, data structures, and optimization problems.",
    examples: ["Two-sum variations", "Dynamic programming", "Tree traversals", "Time series analysis"]
  },
  {
    icon: Users,
    title: "Market Making & Trading",
    description: "Pricing under uncertainty, risk management, and market intuition.",
    examples: ["Bid-ask spread setting", "Inventory risk", "Adverse selection", "Options pricing"]
  }
];

export function InterviewPrep() {
  return (
    <Section title="Interview Preparation" description="Master the four pillars of quantitative finance interviews">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {interviewTypes.map((type, i) => {
          const Icon = type.icon;
          return (
            <FadeIn key={type.title} delay={i * 0.05}>
              <Card className="rounded-2xl shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-sm leading-tight">{type.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                  <div>
                    <div className="text-xs font-medium mb-1">Examples:</div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {type.examples.slice(0, 3).map(example => (
                        <li key={example}>• {example}</li>
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