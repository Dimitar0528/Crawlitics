import { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PricingTableSkeleton from "@/components/pricing/PricingTableSkeleton";

export const metadata: Metadata = {
  title: "Цени и абонаменти",
  description:
    "Разгледайте абонаментните планове на Crawlitics – Безплатен и Pro. Сравнете функционалностите и изберете най-подходящия план за вашите нужди.",
};

export default function PricingPage() {
  return (
    <div className="relative isolate overflow-hidden bg-white dark:bg-slate-950">
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/575] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8085ff] to-[#4506b3] opacity-30 dark:opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <header className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Ясно и прозрачно ценообразуване
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700 dark:text-slate-300">
            Изберете план, който отговаря на вашите нужди. Започнете безплатно и
            надстройте по всяко време.
          </p>
        </header>
        <section className="mt-16">
          <PricingTable fallback={<PricingTableSkeleton />} />
        </section>

        <section className="mt-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Често задавани въпроси
            </h2>
            <Accordion type="single" collapsible className="w-full mt-8">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 text-lg underline-offset-4 cursor-pointer">
                  Мога ли да променя плана си по-късно?
                </AccordionTrigger>
                <AccordionContent className="text-slate-700 dark:text-slate-300 text-base">
                  <strong>Да, абсолютно.</strong> Можете да надстроите, понижите
                  или отмените плана си по всяко време както оттук, така и от таблото за управление
                  на вашия акаунт. Пропорционални такси или кредити ще бъдат
                  приложени автоматично.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 text-lg underline-offset-4 cursor-pointer">
                  Каква е разликата между безплатния и Про плана?
                </AccordionTrigger>
                <AccordionContent className="text-slate-700 dark:text-slate-300 text-base">
                  Безплатният план ви дава достъп до всички основни
                  функционалности на сайта – разглеждане, търсене, сравняване и
                  др. Освен това получавате 7-дневна ценова история на
                  продуктите и възможност{" "}
                  <strong>
                    <i>еднократно</i>
                  </strong>{" "}
                  да изпробвате Про функциите, като CrawleeBot и известия.{" "}
                  <br />С Про плана отключвате пълната, неограничена ценова
                  история и получавате неограничен достъп до всички премиум
                  функционалности на приложението.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 text-lg underline-offset-4 cursor-pointer">
                  Предлагате ли безплатен пробен период за Pro плана?
                </AccordionTrigger>
                <AccordionContent className="text-slate-700 dark:text-slate-300 text-base">
                  <strong>Не предлагаме пробен период.</strong> Вместо това,
                  нашият безплатен план е създаден, за да ви позволи да
                  изпробвате основните функционалности на нашата платформа
                  толкова дълго, колкото е необходимо, преди да решите да
                  надстроите за по-разширени данни и функции.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 text-lg underline-offset-4  cursor-pointer">
                  Какви методи на плащане приемате?
                </AccordionTrigger>
                <AccordionContent className="text-slate-700 dark:text-slate-300 text-base">
                  Приемаме всички основни кредитни карти, включително Visa,
                  Mastercard и American Express, обработени сигурно чрез нашия
                  партньор за плащания.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </div>
  );
}
