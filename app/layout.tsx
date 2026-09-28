import './globals.css';

export const metadata = {
  title: '陪玩平台',
  description: '专业陪玩 · 快乐上分 · 陪你赢到天明',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}