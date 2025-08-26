"use client"

import { useRouter } from "next/navigation";
import { Typewriter } from "react-simple-typewriter";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
export default function Hero(){
    const router = useRouter();
    return (
      <section className="relative min-h-160 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <Badge
              variant="secondary"
              className="mb-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200/100 dark:border-gray-700/100">
              🎉 Нова платформа за сравняване на цени
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-300 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                <Typewriter
                  words={[
                    "Намери най-добрите оферти.",
                    "Спести пари при покупка.",
                    "Сравни цени за секунди.",
                    "Пазарувай умно онлайн.",
                    "Открий изгодни продукти.",
                    "Бързо. Лесно. Изгодно.",
                  ]}
                  loop={0} // infinite loop
                  cursor
                  typeSpeed={80}
                  deleteSpeed={80}
                  delaySpeed={1500}
                  cursorColor="oklch(38.1% 0.176 304.987)"
                  cursorStyle="|"
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Сравнявай продукти и цени от множество онлайн магазини на едно
              място. Спести време и пари с нашата интелигентна платформа.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-102 transition-all duration-300"
                onClick={() => router.push("/")}>
                Започни да пестиш сега
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 border border-gray-200/100 dark:border-gray-700/100 hover:from-white/80 hover:to-white/60 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 transition-all duration-300 shadow-md hover:shadow-lg hover:translate-y-1 "
                onClick={() => router.push("#problems")}>
                Повече информация
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
          onClick={() => router.push("#problems")}>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>
    );
}