import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata = {
  title: "GO Manager",
  description: "Sistem Group Order dan rekap",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
