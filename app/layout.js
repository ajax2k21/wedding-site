import './globals.css';
import wedding from '@/wedding.config';

const { couple } = wedding;
const people = couple.order === 'bride-first' ? [couple.bride, couple.groom] : [couple.groom, couple.bride];
const coupleLabel = `${people[0].shortName} & ${people[1].shortName}`;
const eventName = wedding.eventLabel.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const metadata = {
  metadataBase: new URL(wedding.siteUrl),
  title: `${coupleLabel} — ${eventName}`,
  description: wedding.seo.description,
  keywords: wedding.seo.keywords,
  openGraph: {
    title: `${coupleLabel} — ${eventName}`,
    description: wedding.seo.description,
    type: 'website',
    images: [{ url: wedding.seo.ogImage, width: 1672, height: 941, alt: `${coupleLabel} wedding invitation` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${coupleLabel} — ${eventName}`,
    description: wedding.seo.description,
    images: [wedding.seo.ogImage],
  },
};

export const viewport = {
  themeColor: wedding.themeColor,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Montserrat:wght@300;400;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-primary-bg text-text-main antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
