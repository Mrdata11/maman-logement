"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const HIDDEN_ROUTES = ["/questionnaire"];

export function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDDEN_ROUTES.includes(pathname)) return null;
  return <Footer />;
}
