"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchQueryForm, SearchQueryFormSchema } from "@/lib/validations/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Typewriter } from "react-simple-typewriter";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function InteractiveHero() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const onSubmit = (values: SearchQueryForm) => {
    if(!isSignedIn) return toast.warning("Трябва да влезете в акаунта си за да достъпите тази функционалност!")
    const sanitized_query = values.search_query;
    const params = new URLSearchParams();
    params.set("q", sanitized_query);
    router.push(`/crawleebot/search?${params.toString()}`);
  };

  // define form structure.
  const form = useForm<SearchQueryForm>({
    resolver: zodResolver(SearchQueryFormSchema),
    defaultValues: {
      search_query: "",
    },
  });

  return (
    <section
      aria-labelledby="cta-tag"
      className="relative w-full overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12">
      <div className="absolute inset-0 z-0">
        <div className="absolute -inset-24 animate-[spin_100s_linear_infinite] bg-gradient-to-r from-purple-600/50 via-sky-500/50 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_3px,transparent_1px),linear-gradient(to_bottom,#80808012_3px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1
          id="cta-tag"
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-14">
          Спрете да търсите. Започнете <br />
          <span className="bg-gradient-to-r from-sky-300 to-purple-400 bg-clip-text text-transparent">
            да{" "}
            <Typewriter
              words={["намирате.", "откривате.", "избирате.", "действате."]}
              loop={0}
              typeSpeed={100}
              deleteSpeed={100}
              delaySpeed={1800}
              cursor
              
              cursorColor="white"
              cursorStyle="|"
            />
          </span>
        </h1>

        <p className="mt-6 text-lg max-w-2xl text-slate-200">
          Кажете на нашата нова интелигентна анализаторна система{" "}
          <strong>CrawleeBot</strong> името на продукта, който търсите, и тя ще
          сканира и анализира наличните магазини, за да ви покаже всички оферти,
          които наистина си заслужават.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-10 flex w-full max-w-lg items-start justify-center space-x-2">
            <FormField
              control={form.control}
              name="search_query"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Напр. Samsung Galaxy S25..."
                      className="
                sm:w-md h-14 flex-1 rounded-full border-2
                border-slate-300 dark:border-slate-600
                bg-white/80 dark:bg-slate-800/80
                px-6 text-base
                text-black dark:text-white
                placeholder:text-slate-500 dark:placeholder:text-slate-300
                focus:border-purple-500 focus:ring-purple-500
                transition-all duration-200 ease-in-out
              "
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
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
        </Form>
      </div>
    </section>
  );
}
