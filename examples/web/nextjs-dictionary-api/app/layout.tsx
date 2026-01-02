import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WordNet Dictionary API',
  description: 'Serverless-optimized multilingual dictionary powered by WordNet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
