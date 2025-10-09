import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CCC Inventory System',
  description: 'Inventory management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, height: '100%' }}>
      <body style={{ margin: 0, padding: 0, height: '100%' }}>
        {children}
      </body>
    </html>
  );
}