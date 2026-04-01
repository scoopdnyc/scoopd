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
  title: "Scoopd — NYC Reservation Intelligence",
  description: "Know exactly when reservations drop at NYC's hardest tables. Release times, drop dates, and booking intelligence for Resy, OpenTable, and DoorDash.",
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