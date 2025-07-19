import type { Metadata } from "next";
import HowItWorksPage from "./HowItWorksPage";
export const metadata: Metadata = {
  title: "Landing Page",
  description: "Crawlitics landing page",
};
export default function Page() {
  return (
      <HowItWorksPage />
  );
}