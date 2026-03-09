import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Murmur — AI 自演化文字世界',
  description:
    '打开页面，一个小世界里的 AI 角色们在自动生活、对话、博弈。你只是窥屏的观察者。',
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
