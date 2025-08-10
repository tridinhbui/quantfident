import { Section } from "./section";

export function Testimonial() {
  return (
    <Section>
      <div className="rounded-2xl border p-8 text-center">
        <p className="text-lg md:text-xl">
          “Break into quant là cuộc chơi lì đòn và bền bỉ, không cần thiên tài toán.”
        </p>
        <div className="mt-3 text-sm text-muted-foreground">— Mentor Minh Nguyễn</div>
      </div>
    </Section>
  );
}

