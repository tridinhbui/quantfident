import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

export function Timeline() {
  return (
    <Section title="Lộ trình học tập">
      <div className="grid gap-6 md:grid-cols-3">
        <FadeIn className="rounded-2xl border p-6">
          <div className="font-medium">Lý thuyết</div>
          <p className="text-sm text-muted-foreground mt-2">
            Lý thuyết bao phủ toàn bộ Green Book Ch2–7 và các bài tập tính giờ luyện nhanh và chuẩn.
          </p>
        </FadeIn>
        <FadeIn delay={0.05} className="rounded-2xl border p-6">
          <div className="font-medium">Nghiên cứu Alpha</div>
          <p className="text-sm text-muted-foreground mt-2">
            Xây dựng 2–3 mô hình alpha trên WorldQuant BRAIN theo quy trình đầy đủ và kiểm tra độ bền vững.
          </p>
        </FadeIn>
        <FadeIn delay={0.1} className="rounded-2xl border p-6">
          <div className="font-medium">Sản phẩm cuối</div>
          <p className="text-sm text-muted-foreground mt-2">
            Kho GitHub, Hướng dẫn sống sót phỏng vấn, CV/LinkedIn tối ưu, cuộc thi & cơ hội.
          </p>
        </FadeIn>
      </div>
    </Section>
  );
}

