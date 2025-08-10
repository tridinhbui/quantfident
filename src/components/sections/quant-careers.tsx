import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, Code } from "lucide-react";

const careers = [
  {
    icon: TrendingUp,
    title: "Nhà nghiên cứu Quant",
    description: "Thiết kế tín hiệu alpha, kiểm tra lại chiến lược, phân tích bất thường thị trường. Tập trung vào mô hình thống kê, nghiên cứu yếu tố và phân tích dự đoán.",
    skills: ["Thống kê & Xác suất", "Xử lý tín hiệu", "Mô hình yếu tố", "Phương pháp nghiên cứu"]
  },
  {
    icon: Brain,
    title: "Trader Quant",
    description: "Thực hiện chiến lược thuật toán, quản lý rủi ro thời gian thực, tối ưu hóa phân bổ danh mục. Kết hợp phân tích định lượng với trực giác thị trường.",
    skills: ["Vi cấu trúc thị trường", "Quản lý rủi ro", "Tối ưu danh mục", "Thuật toán thực thi"]
  },
  {
    icon: Code,
    title: "Lập trình viên Quant",
    description: "Xây dựng hệ thống giao dịch, triển khai khung kiểm tra lại, tối ưu hóa hạ tầng độ trễ thấp. Kết nối nghiên cứu định lượng và công nghệ.",
    skills: ["Thiết kế hệ thống", "Tối ưu hiệu suất", "Kỹ thuật dữ liệu", "Hạ tầng giao dịch"]
  }
];

export function QuantCareers() {
  return (
    <Section title="Lộ trình nghề nghiệp Quant" description="Khám phá ba vai trò chính trong tài chính định lượng và điều gì làm nên sự độc đáo của từng vai trò">
      <div className="grid gap-6 md:grid-cols-3">
        {careers.map((career, i) => {
          const Icon = career.icon;
          return (
            <FadeIn key={career.title} delay={i * 0.1}>
              <Card className="rounded-3xl shadow-xl h-full border-0 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-serif">{career.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{career.description}</p>
                  <div>
                    <div className="text-sm font-medium mb-2">Kỹ năng chính:</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {career.skills.map(skill => (
                        <li key={skill}>• {skill}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </Section>
  );
}