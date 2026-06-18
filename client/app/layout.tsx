import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://www.dr-koren.dp.ua";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Корень Марина Григорівна — лікар-психіатр у Дніпрі",
    template: "%s | Лікар-психіатр у Дніпрі",
  },
  description:
    "Персональна сторінка психіатра: інформація про освіту та досвід, послуги, форма запису на прийом та контакти. Стаж 27 років. Ліцензія МОЗ.",
  keywords: [
    "Корень Марина Григорівна психіатр",
    "лікар психіатр Дніпро",
    "психіатр Дніпро запис",
    "лікування депресії Дніпро",
    "тривожний розлад лікування",
    "панічні атаки лікар",
    "психіатр онлайн запис",
    "психіатрична допомога Дніпро",
    "психіатр Святослава Хороброго",
  ],
  alternates: {
    canonical: SITE_URL + "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: "Корень Марина Григорівна — лікар-психіатр",
    title: "Психіатр",
    description:
      "Персональна сторінка психіатра: інформація про освіту та досвід, послуги, форма запису на прийом та контакти",
  },
  twitter: {
    card: "summary",
    title: "Психіатр",
    description:
      "Персональна сторінка психіатра: інформація про освіту та досвід, послуги, форма запису на прийом та контакти",
  },
  other: {
    "format-detection": "telephone=no",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
