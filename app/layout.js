import "./globals.css";

export const metadata = {
  title: "줍줍",
  description: "오늘 예약 가능한 서울 공공서비스를 빠르게 발견하세요."
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
