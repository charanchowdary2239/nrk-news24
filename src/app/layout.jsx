import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'NRK News24 — Truth, Speed, Integrity | 24/7 Digital Journalism',
    template: '%s | NRK News24',
  },
  description: 'NRK News24 is an independent digital news organization delivering real-time coverage across Andhra Pradesh, Telangana, India, and the World.',
  keywords: ['NRK News24', 'Andhra Pradesh News', 'Telangana News', 'India News', 'Amaravati', 'Hyderabad', 'Breaking News', 'Politics', 'Technology'],
  authors: [{ name: 'NRK News24 Bureau' }],
  creator: 'NRK News24',
  publisher: 'NRK News24 Media Network',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'NRK News24',
    title: 'NRK News24 — Truth, Speed, Integrity | 24/7 Digital Journalism',
    description: 'Real-time verified journalism covering Andhra Pradesh, Telangana, India, and Global affairs.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'NRK News24 - Digital Journalism',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nrknews24',
    creator: '@nrknews24',
    title: 'NRK News24 — Truth, Speed, Integrity',
    description: 'Real-time verified journalism covering Andhra Pradesh, Telangana, India, and Global affairs.',
    images: ['https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-brand-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
