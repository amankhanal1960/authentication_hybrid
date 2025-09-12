// app/layout.jsx
"use cleint";
import "./globals.css";
import { Provider } from "@/app/provider";

export const metadata = { title: "My App" };

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
