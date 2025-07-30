"use client"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

export default function InteractiveHero() {
    const router = useRouter();
    const searchQuerySchema = z
      .string()
      .trim()
      .min(3, "Полето за търсене трябва да съдържа поне 3 символа.");

    const handleSearchSubmit = ( event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = formData.get("q")?.toString().trim() ?? "";
        const validationResult = searchQuerySchema.safeParse(query);
        if (!validationResult.success) {
        toast.error(`${z.prettifyError(validationResult.error)}`);
        return;
    }
    const sanitizedQuery = validationResult.data;
    const params = new URLSearchParams();
    params.set("q", sanitizedQuery); 
    router.push(`/crawleebot/search?${params.toString()}`);
    };
  return (
    <section
      aria-labelledby="cta-tag"
      className="relative w-full overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12">
      <div className="absolute inset-0 z-0">
        <div className="absolute -inset-24 animate-[spin_80s_linear_infinite] bg-gradient-to-r from-purple-600/50 via-sky-500/50 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_3px,transparent_1px),linear-gradient(to_bottom,#80808012_3px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1
          id="cta-tag"
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-14">
          Спрете да търсите. <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
            Започнете да намирате.
          </span>
        </h1>

        <p className="mt-6 text-lg max-w-2xl text-slate-200">
          Кажете на нашата нова интелигентна анализаторна система{" "}
          <strong>CrawleeBot</strong> името на продукта, който търсите, и тя ще
          сканира и анализира наличните магазини, за да ви покаже всички оферти,
          които наистина си заслужават.
        </p>
        <form onSubmit={handleSearchSubmit} className="mt-10 flex w-full max-w-lg items-center space-x-2">
          <Input
            type="text"
            name="q"
            placeholder="Напр. Samsung Galaxy S25..."
            className="
                h-14 flex-1 rounded-full border-2
                border-slate-300 dark:border-slate-600
                bg-white/80 dark:bg-slate-800/80
                px-6 text-base
                text-black dark:text-white
                placeholder:text-slate-500 dark:placeholder:text-slate-300
                focus:border-purple-500 focus:ring-purple-500
                transition-all duration-200 ease-in-out
              "
            required
          />
          <Button
            type="submit"
            size="icon"
            className="
              h-14 w-14 flex-shrink-0 rounded-full
              bg-gradient-to-r from-sky-500 to-purple-600
              transition-all duration-300 ease-in-out
              hover:scale-105
            ">
            <Search className="h-6 w-6" />
            <span className="sr-only">Анализирай пазара</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
