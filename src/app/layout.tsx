import type { Metadata } from 'next'; // This line is needed for the Metadata type
import './globals.css';  // Global styles import

export const metadata: Metadata = {  // Metadata definition
  title: 'CCC Inventory System',
  description: 'Inventory management system',
};

export default function RootLayout({ // RootLayout component definition
  children,
}: {
  children: React.ReactNode;
}) {
  return (  // JSX return statement
    <html lang="en" style={{ margin: 0, padding: 0, height: '100%' }}>
      <body style={{ margin: 0, padding: 0, height: '100%' }}>
        {children}
      </body>
    </html>
  );
}