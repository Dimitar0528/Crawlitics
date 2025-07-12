import type { Metadata } from "next";
import LandingPage from "./LandingPage";
export const metadata: Metadata = {
  title: "Landing Page",
  description: "Crawlitics landing page",
};
export default function Page() {
  return (
      <LandingPage />
  );
}