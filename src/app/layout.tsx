import { initDb, seedDb } from '@/lib/db';

// Initialize database on first import
let initialized = false;

if (!initialized) {
  try {
    initDb();
    seedDb();
    initialized = true;
  } catch (e) {
    console.error('DB init error:', e);
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>PLM 项目管理</title>
        <meta name="description" content="公司内部项目管理系统" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
