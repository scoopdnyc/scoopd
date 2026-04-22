import "./globals.css";
import { Playfair_Display, DM_Mono, DM_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-dm-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata = {
  title: {
    default: "Scoopd — NYC Restaurant Reservation Intelligence",
    template: "%s | Scoopd",
  },
  description: "NYC restaurant reservation intelligence. Know when tables drop.",
  metadataBase: new URL("https://scoopd.nyc"),
  verification: {
    google: "nC1PVw6rF_tediEZTf6m8N9aQQf6yiw-usiNBbSYbcc",
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
};

export const viewport = {
  themeColor: "#0f0f0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmMono.variable} ${dmSans.variable}`}>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-4SVFRC4DLF"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4SVFRC4DLF');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}