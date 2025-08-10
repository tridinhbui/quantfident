import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";
import { Progress } from "@/components/ui/progress";

const skillCategories = [
  {
    category: "Mathematical Foundation",
    skills: [
      { name: "Probability & Statistics", importance: 95 },
      { name: "Linear Algebra", importance: 85 },
      { name: "Stochastic Calculus", importance: 80 },
      { name: "Optimization Theory", importance: 75 }
    ]
  },
  {
    category: "Programming & Technology",
    skills: [
      { name: "Python/R", importance: 90 },
      { name: "SQL & Databases", importance: 80 },
      { name: "C++/Java (HFT)", importance: 70 },
      { name: "Cloud Platforms", importance: 65 }
    ]
  },
  {
    category: "Finance Knowledge",
    skills: [
      { name: "Derivatives Pricing", importance: 85 },
      { name: "Risk Management", importance: 90 },
      { name: "Market Microstructure", importance: 75 },
      { name: "Portfolio Theory", importance: 80 }
    ]
  },
  {
    category: "Research Skills",
    skills: [
      { name: "Data Analysis", importance: 95 },
      { name: "Backtesting", importance: 90 },
      { name: "Machine Learning", importance: 75 },
      { name: "Research Methodology", importance: 85 }
    ]
  }
];

export function SkillsMatrix() {
  return (
    <Section title="Essential Quant Skills" description="Key competencies ranked by importance across different quant roles">
      <div className="grid gap-8 md:grid-cols-2">
        {skillCategories.map((category, i) => (
          <FadeIn key={category.category} delay={i * 0.05}>
            <div className="space-y-4">
              <h3 className="font-medium text-lg">{category.category}</h3>
              <div className="space-y-3">
                {category.skills.map(skill => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">{skill.importance}%</span>
                    </div>
                    <Progress value={skill.importance} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}