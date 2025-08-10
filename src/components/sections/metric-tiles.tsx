import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

const metrics = [
  { label: "Mock interviews", value: "Unlimited" },
  { label: "Alpha models", value: "2–3+" },
  { label: "Support", value: "1 year" },
];

export function MetricTiles() {
  return (
    <Section>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((m, i) => (
          <FadeIn key={m.label} delay={i * 0.05}>
            <div className="rounded-2xl border p-6 text-center">
              <div className="text-3xl font-semibold">{m.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{m.label}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

