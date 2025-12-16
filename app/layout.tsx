import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeSo OIDC Bridge",
  description: "OpenID Connect identity provider bridging DeSo blockchain identities to Microsoft Entra ID",
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
