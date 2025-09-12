import type { Metadata } from "next";
import Link from "next/link";
import {
  BrainCircuit,
  BarChart4,
  Globe,
  ShieldCheck,
  Eye,
  Lock,
  UserCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Защо да изберете Crawlitics",
  description:
    "Открийте защо Crawlitics е вашият доверен помощник при онлайн пазаруването – интелигентен анализ, проследяване на цени и пълно покритие в реално време.",
};

export default function WhyChooseUsPage() {
  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="relative isolate overflow-hidden">
        <div
          className="absolute inset-x-0 -top-40 -z-10 blur-3xl sm:-top-80"
          aria-hidden="true">
          <div
            className="relative left-1/2 aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-sky-500 to-purple-600 opacity-20 sm:w-[72rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 72.5% 32.5%, 60.2% 62.4%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16 pt-24 lg:px-8 space-y-24 sm:space-y-32">
          <header className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-br from-sky-700 to-purple-800 bg-clip-text text-transparent dark:from-sky-400 dark:to-purple-400">
              Отвъд простото сравнение на цени
            </h1>
            <p className="mt-6 text-lg max-w-2xl mx-auto leading-8 text-slate-600 dark:text-slate-400">
              В дигиталния свят интелигентните решения се вземат с правилната
              информация, в точния момент. Crawlitics трансформира хаоса от
              данни от търговците в ясно и стратегическо структирирана
              информация.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                asChild
                size="lg"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-sky-800 to-purple-800 px-6 py-3 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Link href="/crawleebot">
                  <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 transform bg-gradient-to-r from-transparent to-white opacity-40 group-hover:inset-0 group-hover:duration-500" />
                  Опитай CrawleeBot
                </Link>
              </Button>
            </div>
          </header>

          <section className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Спрете да губите време и пари
              </h2>
              <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
                Сравнете ръчния метод срещу Crawlitics.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="rounded-3xl p-8 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/40 dark:border-slate-700/40 shadow-lg hover:shadow-2xl transition">
                <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-300">
                  Старият начин
                </h3>
                <ul className="mt-6 space-y-4 text-slate-600 dark:text-slate-400">
                  {[
                    "Десетки отворени табове и безкрайно превъртане.",
                    "Несигурност дали сравнявате правилните модели.",
                    "Пропуснати промоции и изгодни оферти.",
                    "Решения, базирани на непълна информация.",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 dark:text-slate-300">
                      <XCircle className="h-6 w-6 text-red-500 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl p-8 backdrop-blur-lg bg-gradient-to-br from-sky-50/80 to-purple-100/80 dark:from-sky-900/40 dark:to-purple-900/30 border border-purple-300/40 dark:border-purple-600/30 shadow-xl hover:shadow-purple-400/30 transition">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent">
                  Crawlitics Методът
                </h3>
                <ul className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
                  {[
                    "Едно търсене обхваща целия пазар за секунди.",
                    "Автоматично групиране на идентични продукти.",
                    "Ясна история на цените, за да знаете кога да купите.",
                    "Решения, подкрепени от данни за интелигентни покупки.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Нашата философия: <br /> От данни към решения
                </h2>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
                  Crawlitics е създаден не просто като инструмент, а като
                  партньор. Филтрираме шума на дигиталния пазар и ви даваме
                  яснота, увереност и силата да вземете най-доброто решение.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="p-12 bg-gradient-to-br from-sky-100 to-purple-200 dark:from-sky-900/40 dark:to-purple-900/40 rounded-full shadow-xl hover:scale-105 transition">
                  <ShieldCheck className="h-20 w-20 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-20 sm:space-y-28 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-400">
            <div className="mx-auto max-w-4xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Трите стълба на Crawlitics
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Ето как превръщаме хаоса в ред и ви даваме силата да избирате
                информирано.
              </p>
            </div>

            <div
              className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-12 gap-y-12 lg:max-w-none lg:grid-cols-2 
                  bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/20 
                  rounded-2xl p-8 shadow-lg hover:shadow-purple-300/40 dark:hover:shadow-purple-800/40 
                  transition duration-300">
              <div className="order-2 lg:order-1 ">
                <h3 className="text-2xl font-bold tracking-tight">
                  Интелигентен анализ, а не просто списък
                </h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  CrawleeBot, нашият интелигентен асистент, не просто събира
                  данни. Той ги разбира. Автоматично групира идентични продукти
                  и също така анализира спецификациите, за да разграничи
                  ключовите характеристики от маркетинговия шум, давайки ви ясна
                  представа за това, което наистина има значение.
                </p>
              </div>
              <div className="flex justify-center order-1 lg:order-2">
                <BrainCircuit className="h-48 w-48 text-purple-500/70 dark:text-purple-400/40" />
              </div>
            </div>

            <div
              className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-12 gap-y-12 lg:max-w-none lg:grid-cols-2 
                  bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/40 dark:to-sky-800/20 
                  rounded-2xl p-8 shadow-lg hover:shadow-sky-300/40 dark:hover:shadow-sky-800/40 
                  transition duration-300">
              <div className="flex justify-center">
                <BarChart4 className="h-48 w-48 text-sky-500/70 dark:text-sky-400/40" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">
                  Визуална история на цените
                </h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  Най-добрата цена не е само текущата. С нашите графики, вие
                  виждате пълната картина – как цената се е променяла във
                  времето. Това ви позволява да идентифицирате тенденции, да
                  предвидите бъдещи намаления и да вземете стратегическото
                  решение кога е най-подходящият момент за покупка.
                </p>
              </div>
            </div>

            <div
              className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-12 gap-y-12 lg:max-w-none lg:grid-cols-2 
                  bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/20 
                  rounded-2xl p-8 shadow-lg hover:shadow-green-300/40 dark:hover:shadow-green-800/40 
                  transition duration-300">
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl font-bold tracking-tight">
                  Пълно пазарно покритие в реално време
                </h3>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  Нашата система работи денонощно, за да ви предостави
                  най-актуалната информация за цени и наличности от водещите
                  магазини в България. Едно търсене в Crawlitics замества часове
                  ръчна работа и ви дава увереността, че разполагате с цялата
                  необходима информация на едно място.
                </p>
              </div>
              <div className="flex justify-center order-1 lg:order-2">
                <Globe className="h-48 w-48 text-green-500/70 dark:text-green-400/40" />
              </div>
            </div>
          </section>

          <section className="animate-in fade-in slide-in-from-bottom-24 duration-1000 delay-500 bg-slate-200 dark:bg-slate-800 rounded-lg px-8 py-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Изграден върху доверие
              </h2>
              <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
                Вашата сигурност е наш топ приоритет.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  title: "Пълна прозрачност",
                  desc: "Ние винаги посочваме източника на нашите данни. Вие знаете откъде идва информацията и можете да я проверите по всяко време.",
                  icon: <Eye className="h-10 w-10 text-purple-600" />,
                },
                {
                  title: "Поверителност на 1-во място",
                  desc: "Вашите търсения са ваша работа. Ние не продаваме вашите данни и използваме водещи практики за сигурност, за да защитим вас.",
                  icon: <Lock className="h-10 w-10 text-purple-600" />,
                },
                {
                  title: "Фокус върху потребителя",
                  desc: "Crawlitics е създаден, за да решава вашите проблеми. Ние непрекъснато се вслушваме във вашите отзиви, за да подобряваме платформата.",
                  icon: <UserCheck className="h-10 w-10 text-purple-600" />,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-8 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/30 dark:border-slate-800/30 shadow-lg hover:shadow-xl hover:scale-105 transition">
                  {item.icon}
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
