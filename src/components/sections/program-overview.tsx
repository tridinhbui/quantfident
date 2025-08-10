import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ProgramOverview() {
  return (
    <Section title="QuantFident Mentorship Program" description="Think Smart. Be QuantFident">
      <div className="grid gap-8 md:grid-cols-2">
        <FadeIn>
          <h3 className="font-medium">Introduction</h3>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Top tier quant roles - whether as a Quant Researcher, Trader, or Quant Developer - demand a rare combination of deep technical mastery, practical modeling experience, and interview ready confidence.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Quant recruiting is not a contest of who is “good enough” - it is about being among the very best in both technical skills and presentation. Even the brightest candidates fail if they: make small mistakes under time pressure; lack a real, resume ready project; struggle to communicate their process clearly.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            QuantFident was created to eliminate these gaps - giving you a structured pathway from core theory to real alpha research, backed by exclusive insights from current practicing quants.
          </p>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h3 className="font-medium">Program Objectives</h3>
          <ul className="list-disc pl-6 text-sm md:text-base text-muted-foreground mt-2 space-y-2">
            <li>Master the theory and problem types in A Practical Guide to Quantitative Finance Interviews (Ch2-7).</li>
            <li>Build and backtest 2-3 alpha models on WorldQuant BRAIN.</li>
            <li>Understand and apply evaluation metrics: returns, Sharpe, turnover, drawdown, correlation, robustness.</li>
            <li>Present competitively with refined resume, documented projects, and interview confidence.</li>
            <li>Gain awareness of competitions, challenges, and industry opportunities.</li>
          </ul>
          <Button asChild className="mt-4">
            <Link href="/program">Explore the full program</Link>
          </Button>
        </FadeIn>
      </div>
    </Section>
  );
}

