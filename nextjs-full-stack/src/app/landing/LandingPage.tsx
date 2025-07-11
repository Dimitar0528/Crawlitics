"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  Shield,
  Store,
  Clock,
  Star,
  StarHalf,
  Moon,
  Sun,
  ChevronDown,
  CheckCircle,
  TrendingDown,
  Users,
  Bell,
  Tag,
  ChevronRight,
} from "lucide-react";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Typewriter } from "react-simple-typewriter";

export default function LandingPage() {
      useEffect(() => {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1)

        document.cookie =
          "hasVisitedLanding=true; expires=" +
          expires.toUTCString() +
          "; path=/";
      }, []);
      
  const { setTheme } = useTheme();
  const router = useRouter();
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  const YEAR = new Date().getFullYear();
  return (
    <div className={`min-h-screen transition-colors duration-500`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="container mx-auto  px-4  lg:px-18 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crawlitics
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="hidden md:flex bg-transparent">
              Вход
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Регистрация
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Animated background elements */}
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
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
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
                onClick={()=> router.replace('/')}>
                Започни да пестиш сега
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 border border-gray-200/100 dark:border-gray-700/100 hover:from-white/80 hover:to-white/60 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 transition-all duration-300 shadow-md hover:shadow-lg"
                onClick={() => scrollToSection("problems")}>
                Повече информация
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
          onClick={() => scrollToSection("problems")}>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>

      {/* Problem Section */}
      <section id="problems" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Познати ли са ти тези проблеми?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Всеки ден милиони хора губят време и пари заради тези чести
              проблеми при онлайн пазаруване
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Clock className="w-12 h-12 text-red-500" />,
                title: "Губиш време с търсене",
                description:
                  "Проверяваш десетки сайтове за да намериш най-добрата цена на продукта, който искаш",
              },
              {
                icon: <TrendingDown className="w-12 h-12 text-orange-500" />,
                title: "Объркан от много цени",
                description:
                  "Различни магазини показват различни цени и не знаеш кой наистина предлага най-добрата оферта",
              },
              {
                icon: <Users className="w-12 h-12 text-yellow-500" />,
                title: "Пропускаш добри оферти",
                description:
                  "Не знаеш кога любимите ти продукти са на промоция в различните онлайн магазини",
              },
            ].map((problem, index) => (
              <Card
                key={index}
                className="p-8 text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/20 border-red-400/80 dark:border-red-700/50">
                <CardContent className="space-y-4">
                  <div className="flex justify-center">{problem.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {problem.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {problem.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section
        id="solution"
        className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Ето как Crawlitics решава проблемите ти
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Нашата платформа прави онлайн пазаруването лесно, бързо и изгодно
            </p>
          </div>

          {/* Vertical timeline list */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4.5 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 rounded-full"></div>

            {[
              {
                icon: <Search className="w-6 h-6 text-blue-500" />,
                title: "Лесно търсене с филтри",
                description:
                  "С Crawlitics можеш да търсиш и филтрираш продукти по цена, марка, рейтинг, характеристики и други критерии. Спести време и усилия, като откриеш точно това, което търсиш, без да отваряш десетки сайтове.",
              },
              {
                icon: <Zap className="w-6 h-6 text-green-500" />,
                title: "Актуални цени в реално време",
                description:
                  "Нашата платформа ти предоставя напълно актуални цени и наличности директно от проверени магазини. Така винаги ще знаеш реалната стойност на продукта и ще можеш да направиш най-добрия избор без риск от подвеждаща информация.",
              },
              {
                icon: <Bell className="w-6 h-6 text-purple-500" />,
                title: "Персонализирани известия",
                description:
                  "Crawlitics те уведомява веднага, когато избран от теб продукт е намален, има нова оферта или се появи по-добра цена в друг магазин. Така никога повече няма да пропускаш намаления и промоции, които ти пестят пари.",
              },
            ].map((solution, index) => (
              <div key={index} className="flex items-start mb-10 relative">
                <div className="absolute left-0 top-0">
                  <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full border border-gray-300 dark:border-gray-700 shadow">
                    {solution.icon}
                  </div>
                </div>
                <div className="ml-14">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {solution.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {solution.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Защо да избереш Crawlitics?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Всичко, от което се нуждаеш за интелигентно онлайн пазаруване
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: <Store className="w-10 h-10 text-blue-500" />,
                title: "Широк избор от магазини",
                description:
                  "Открий продукти от множество онлайн магазини, събрани на едно място за лесно и бързо пазаруване",
              },
              {
                icon: <Clock className="w-10 h-10 text-green-500" />,
                title: "Спести време при пазаруване",
                description:
                  "Намирай най-добрите продукти и оферти за секунди, без да обикаляш излишно десетки сайтове.",
              },
              {
                icon: <Tag className="w-10 h-10 text-purple-500" />,
                title: "Лесно сравнение на цени",
                description:
                  "Сравнявай бързо цени, марки и характеристики, за да откриеш най-изгодната оферта за желания продукт",
              },
              {
                icon: <Shield className="w-10 h-10 text-red-500" />,
                title: "Сигурна и надеждна платформа",
                description:
                  "Гарантираме защитата на твоите данни и предлагаме проверени магазини за сигурно пазаруване",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="p-6 text-center hover:shadow-lg transition-all duration-300 group">
                <CardContent className="space-y-4">
                  <div className="flex justify-center group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Какво казват нашите потребители
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Присъедини се към хилядите доволни потребители
            </p>
          </div>

          {/* Testimonials */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Какво казват потребителите?
              </h2>
            </div>

            <Carousel
              opts={{
                align: "start",
              }}
              className="w-[80%] mx-auto">
              <CarouselContent>
                {[
                  {
                    name: "Мария Петрова",
                    role: "Редовен потребител",
                    content:
                      "Crawlitics ми спести над 500 лв. само за първия месец! Невероятно лесно е да намеря най-добрите оферти.",
                    rating: 5,
                  },
                  {
                    name: "Георги Иванов",
                    role: "Онлайн предприемач",
                    content:
                      "Използвам платформата всеки ден за бизнеса си. Винаги намирам най-добрите цени за офис техниката.",
                    rating: 4.5,
                  },
                  {
                    name: "Анна Димитрова",
                    role: "Майка на две деца",
                    content:
                      "Перфектно за семейни покупки! Спестявам време и пари, а известията за намаления са страхотни.",
                    rating: 5,
                  },
                  {
                    name: "Иван Георгиев",
                    role: "Студент",
                    content:
                      "Супер платформа за намиране на лаптопи и техника на добри цени. Препоръчвам на всичките си приятели.",
                    rating: 4,
                  },
                  {
                    name: "Светлана Николова",
                    role: "Фрийланс дизайнер",
                    content:
                      "Обичам колко бързо намирам нужните ми неща за работа без да губя часове в сравнение. Невероятно приложение.",
                    rating: 4.5,
                  },
                ].map((testimonial, index) => (
                  <CarouselItem
                    key={index}
                    className="sm:basis-1/2 lg:basis-1/3">
                    <Card className="p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300">
                      <CardContent className="space-y-4">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starNumber = i + 1;
                            if (testimonial.rating >= starNumber) {
                              return (
                                <Star
                                  key={i}
                                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                                />
                              );
                            } else if (
                              testimonial.rating >= starNumber - 0.5 &&
                              testimonial.rating < starNumber
                            ) {
                              return (
                                <StarHalf
                                  key={i}
                                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                                />
                              );
                            } else {
                              return (
                                <Star
                                  key={i}
                                  className="w-5 h-5 text-yellow-400 opacity-30"
                                />
                              );
                            }
                          })}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 italic">
                          &quot;{testimonial.content}&quot;
                        </p>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {testimonial.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          
          {/* Partner Logos */}
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Доверени от водещи магазини в България
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Работим с най-големите онлайн магазини, за да ти предоставим
              най-добрите оферти и актуални цени
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {["emag", "technopolis", "technomarket"].map((store, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                  <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">
                    {store}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Присъедини се към хилядите, които пестят пари всеки ден!
            </h2>
            <p className="text-xl md:text-2xl opacity-90">
              Започни да използваш Crawlitics безплатно и открий колко можеш да
              спестиш
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <CheckCircle className="mr-2 w-5 h-5" />
                Регистрирай се безплатно
              </Button>
            </div>

            <div className="flex justify-center items-center space-x-8 pt-8 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Безплатна регистрация</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Без скрити такси</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Отказ по всяко време</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="container mx-auto px-4 lg:px-18">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Crawlitics</span>
              </div>
              <p className="text-gray-400 w-70">
                Най-добрата платформа за сравняване на цени в България
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Как работи
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Защо да избереш нас
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Отзиви на клиенти
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    За нас
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Кариери
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Контакти
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Поддръжка</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Помощ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Условия
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Поверителност
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {YEAR} Crawlitics. Всички права запазени.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
