import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ResourceProvider } from "../context/ResourceContext";
import { ImageProvider } from "../context/ImageContext";

export const metadata: Metadata = {
  title: "VMware Cloud Management Console",
  description: "Self-service cloud management console for VMware Cloud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ResourceProvider>
            <ImageProvider>
              {children}
            </ImageProvider>
          </ResourceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
