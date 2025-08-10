import { Section } from "./section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/anim/fade-in";

const features = [
  "Theory-to-Alpha Pipeline",
  "WorldQuant BRAIN Projects",
  "Unlimited Mock Interviews",
  "Resume & LinkedIn Polish",
  "Competition Playbook",
  "Mentor Support",
];

export function FeatureGrid() {
  return (
    <Section title="Value props">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {features.map((f, i) => (
          <FadeIn key={f} delay={i * 0.05}>
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{f}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Included</Badge>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

