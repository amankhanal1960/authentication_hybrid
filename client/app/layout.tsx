// app/layout.jsx
import "./globals.css";
import { Providers } from "@/app/provider";

export const metadata = { title: "My App" };

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
