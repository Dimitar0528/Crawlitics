import { SignUp } from "@clerk/nextjs";
import { ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function Page() {
  return (
    <div className="flex h-screen justify-center items-center">
      <ClerkLoading>
        <div
          className="flex flex-col justify-center items-center min-h-[60vh] text-center"
          aria-live="polite"
          aria-busy="true">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Зареждане на данни...
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Моля, изчакайте.</p>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp />
      </ClerkLoaded>
    </div>
  );
}
