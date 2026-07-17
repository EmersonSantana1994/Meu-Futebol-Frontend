import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu Futebol",
  description: "Sistema de campeonatos, rankings e elencos de futebol.",
  icons: {
    icon: "/favicon-bola.png",
    shortcut: "/favicon-bola.png",
    apple: "/favicon-bola.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
