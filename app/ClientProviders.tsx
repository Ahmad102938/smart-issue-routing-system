"use client";

import { SessionProvider } from "next-auth/react";
import ClientLogic from "./clientLogic";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClientLogic />
      {children}
    </SessionProvider>
  );
} 