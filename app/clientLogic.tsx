"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function ClientLogic() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    // Your business logic here
    console.log("Current pathname:", pathname);
    console.log("Session data:", session);
    // Add your specific logic that depends on pathname, router, or session
  }, [pathname, session]);

  return null; // No UI needed if it’s just for logic
}