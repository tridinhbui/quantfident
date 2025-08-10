import { Section } from "./section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Có cần giải toán quốc gia không?",
    a: "Không. Chúng tôi ưu tiên nền tảng chắc, kiên trì apply và “play the game” liên tục.",
  },
  { q: "Chưa mạnh code có theo kịp?", a: "Có lộ trình ôn Python/numpy/pandas trước." },
  { q: "Không quen WorldQuant BRAIN?", a: "Có tutorial và mentor review." },
  { q: "Success fee tính thế nào?", a: "Thu khi bạn nhận offer quant-related." },
  { q: "Không vào quant ngay thì sao?", a: "Bạn vẫn apply SWE/Quant Dev với projects + interview prep sẵn có." },
  { q: "Thời gian học linh hoạt?", a: "Có." },
  { q: "Cần học gì trước khi vào chương trình?", a: "Python cơ bản, xác suất/thống kê nền tảng, và kiến thức tài chính sơ cấp là lợi thế." },
  { q: "BRAIN có khó không?", a: "Có tutorial, starter cert và mentor hướng dẫn từng bước trong pipeline." },
  { q: "Có hỗ trợ portfolio tối ưu không?", a: "Có, bao gồm kết hợp signals, risk controls, và báo cáo metrics chuẩn." },
];

export function FAQAccordion() {
  return (
    <Section title="FAQ">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, idx) => (
          <AccordionItem value={`item-${idx}`} key={f.q}>
            <AccordionTrigger>{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

