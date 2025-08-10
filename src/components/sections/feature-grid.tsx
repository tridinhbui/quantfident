import { Section } from "./section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/anim/fade-in";

const features = [
  "Lộ trình từ Lý thuyết đến Alpha",
  "Dự án WorldQuant BRAIN",
  "Phỏng vấn thử không giới hạn",
  "Hoàn thiện CV & LinkedIn",
  "Sổ tay Cuộc thi",
  "Hỗ trợ Mentor",
];

export function FeatureGrid() {
  return (
    <Section title="Giá trị cốt lõi">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {features.map((f, i) => (
          <FadeIn key={f} delay={i * 0.05}>
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{f}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Bao gồm</Badge>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}

