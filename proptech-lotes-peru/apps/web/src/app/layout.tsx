import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@/components/Analytics';
import { FeriaBanner } from '@/components/FeriaBanner';
import { FloatingChat } from '@/components/FloatingChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'PerúInversión — Terrenos y Lotes de Inversión en Perú',
    template: '%s | PerúInversión',
  },
  description: 'Encuentra y compara los mejores terrenos y lotes en Perú. Simulador de cuotas, proyectos verificados y asesoría gratuita. Lima, Ica y más.',
  keywords: ['terrenos', 'lotes', 'Perú', 'Lima', 'Ica', 'comparador', 'inmobiliaria', 'inversión'],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'PerúInversión',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <FeriaBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingChat />
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
