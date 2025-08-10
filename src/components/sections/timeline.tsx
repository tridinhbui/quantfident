import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

export function Timeline() {
  return (
    <Section title="Roadmap">
      <div className="grid gap-6 md:grid-cols-3">
        <FadeIn className="rounded-2xl border p-6">
          <div className="font-medium">Theory</div>
          <p className="text-sm text-muted-foreground mt-2">
            Lý thuyết cover trọn Green Book Ch2–7 và timed drills luyện nhanh và chuẩn.
          </p>
        </FadeIn>
        <FadeIn delay={0.05} className="rounded-2xl border p-6">
          <div className="font-medium">Alpha Research</div>
          <p className="text-sm text-muted-foreground mt-2">
            Build 2–3 alpha models trên WorldQuant BRAIN theo full pipeline và robustness tests.
          </p>
        </FadeIn>
        <FadeIn delay={0.1} className="rounded-2xl border p-6">
          <div className="font-medium">Deliverables</div>
          <p className="text-sm text-muted-foreground mt-2">
            GitHub repo, Interview Survival Guide, CV/LinkedIn tối ưu, competitions & opportunities.
          </p>
        </FadeIn>
      </div>
    </Section>
  );
}

