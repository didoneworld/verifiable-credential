import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifiable Credential Platform',
  description: 'Built with walt.id',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
