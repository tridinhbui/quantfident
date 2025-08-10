import { Section } from "./section";
import { FadeIn } from "@/components/anim/fade-in";

export function ProgramOverview() {
  return (
    <Section title="Chương trình Mentorship QuantFident" description="Tư duy thông minh. Trở thành QuantFident">
      <div className="grid gap-8 md:grid-cols-2">
        <FadeIn>
          <h3 className="font-medium text-lg mb-3">Giới thiệu</h3>
          <p className="text-base text-muted-foreground mt-3">
            Các vị trí quant hàng đầu - dù là Quant Researcher, Trader, hay Quant Developer - đều đòi hỏi sự kết hợp hiếm có giữa chuyên môn kỹ thuật sâu, kinh nghiệm mô hình hóa thực tế và sự tự tin sẵn sàng phỏng vấn.
          </p>
          <p className="text-base text-muted-foreground mt-4">
            Tuyển dụng quant không phải cuộc thi về ai &ldquo;đủ giỏi&rdquo; - mà là về việc trở thành người xuất sắc nhất cả về kỹ năng kỹ thuật lẫn khả năng thuyết trình. Ngay cả những ứng viên thông minh nhất cũng thất bại nếu họ: mắc sai lầm nhỏ dưới áp lực thời gian; thiếu dự án thực tế sẵn sàng cho CV; gặp khó khăn trong việc truyền đạt quy trình của mình một cách rõ ràng.
          </p>
          <p className="text-base text-muted-foreground mt-4">
            QuantFident được tạo ra để loại bỏ những khoảng trống này - mang đến cho bạn lộ trình có cấu trúc từ lý thuyết cốt lõi đến nghiên cứu alpha thực tế, được hỗ trợ bởi những hiểu biết độc quyền từ các quant đang hoạt động hiện tại.
          </p>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h3 className="font-medium text-lg mb-3">Mục tiêu Chương trình</h3>
          <ul className="list-disc pl-6 text-base text-muted-foreground mt-3 space-y-3">
            <li>Thành thạo lý thuyết và các dạng bài trong A Practical Guide to Quantitative Finance Interviews (Ch2-7).</li>
            <li>Xây dựng và kiểm tra lại 2-3 mô hình alpha trên WorldQuant BRAIN.</li>
            <li>Hiểu và áp dụng các chỉ số đánh giá: lợi nhuận, Sharpe, turnover, drawdown, tương quan, độ bền vững.</li>
            <li>Thể hiện cạnh tranh với CV được tinh chỉnh, dự án có tài liệu và sự tự tin phỏng vấn.</li>
            <li>Nắm bắt các cuộc thi, thách thức và cơ hội trong ngành.</li>
          </ul>
          <div className="mt-6">
            <span className="text-base text-muted-foreground">Khám phá chương trình đầy đủ bên dưới</span>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

