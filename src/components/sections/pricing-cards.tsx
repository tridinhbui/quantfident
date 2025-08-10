import { Section } from "./section";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PricingPlan = {
  price: string;
  perks: string[];
  note?: string;
};

const plan: PricingPlan = {
  price: "750 USD (~18 triệu VNĐ)",
  perks: [
    "Unlimited mock interviews (trong chương trình + 1 năm sau)",
    "WorldQuant BRAIN alpha projects",
    "CV/LinkedIn tối ưu",
    "Interview Survival Guide",
  ],
  note:
    "Có success fee nếu đậu vị trí quant-related. Đợt đầu phí hợp lý kèm discount mạnh.",
};

export function PricingCards() {
  return (
    <Section title="Pricing">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Mentorship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{plan.price}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.perks.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            {plan.note && (
              <p className="text-sm text-muted-foreground mt-4">{plan.note}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/apply">Apply Now</Link>
            </Button>
          </CardFooter>
        </Card>
        <div className="rounded-2xl border p-6">
          <h3 className="font-medium">FAQ Pricing</h3>
          <ul className="mt-3 text-sm space-y-2">
            <li>• Success fee thu khi bạn nhận offer quant-related.</li>
            <li>• Mock interview không giới hạn.</li>
            <li>• Hỗ trợ qua chat và review async.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

