"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans",
          style: {
            borderRadius: "16px",
            fontFamily: "Sora, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
          },
        }}
      />
    </ThemeProvider>
  );
}
