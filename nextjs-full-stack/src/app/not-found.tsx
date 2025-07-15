import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4 text-center">
      <Ghost className="w-20 h-20 text-purple-600 dark:text-purple-400 mb-6 animate-pulse" />

      <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
        404
      </h2>

      <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-100 mb-8">
        Упс! Страницата, която търсиш, не съществува.
      </p>

      <Link href="/">
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
          Върни се към началото
        </Button>
      </Link>
    </div>
  );
}
