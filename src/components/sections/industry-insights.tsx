import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

const insights = [
  {
    title: "Tạo lập thị trường & HFT",
    description: "Các công ty giao dịch tần số cao như Citadel, Jump Trading và Optiver tập trung vào vi cấu trúc thị trường, tối ưu hóa độ trễ và chênh lệch giá thống kê.",
    topics: ["Động học sổ lệnh", "Chênh lệch độ trễ", "Mô hình tác động thị trường", "Chiến lược đồng vị trí"]
  },
  {
    title: "Quản lý tài sản",
    description: "Các nhà quản lý tài sản truyền thống như BlackRock, AQR và Two Sigma sử dụng phương pháp định lượng để xây dựng danh mục và quản lý rủi ro.",
    topics: ["Đầu tư yếu tố", "Cân bằng rủi ro", "Dữ liệu thay thế", "Tích hợp ESG"]
  },
  {
    title: "Quỹ phòng hộ",
    description: "Các quỹ phòng hộ định lượng như Renaissance, DE Shaw và Millennium sử dụng các mô hình toán học tinh vi để tạo alpha.",
    topics: ["Nghiên cứu Alpha", "Nền tảng đa quản lý", "Bộ dữ liệu thay thế", "Ứng dụng học máy"]
  },
  {
    title: "Ngân hàng đầu tư",
    description: "Các ngân hàng như Goldman Sachs, Morgan Stanley và JP Morgan sử dụng quant để định giá phái sinh, quản lý rủi ro và giao dịch điện tử.",
    topics: ["Định giá phái sinh", "Mô hình rủi ro tín dụng", "Vốn quy định", "Tạo lập thị trường điện tử"]
  }
];

export function IndustryInsights() {
  return (
    <Section title="Bối cảnh ngành" description="Hiểu về các lĩnh vực khác nhau và cách tiếp cận định lượng của họ">
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight, i) => (
          <FadeIn key={insight.title} delay={i * 0.05}>
            <div className="rounded-2xl border p-6">
              <h3 className="font-medium text-lg mb-2">{insight.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
              <div className="flex flex-wrap gap-2">
                {insight.topics.map(topic => (
                  <span key={topic} className="px-2 py-1 text-xs bg-muted rounded-md">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}