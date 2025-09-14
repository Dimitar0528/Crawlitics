
import Link from "next/link";
import Testimonials from "@/components/testimonials/testimonials";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Отзиви на потребители ",
  description: "Вижте какво казват част от нашите потребители за Crawlitics",
};
export default function TestimonialsPage() {

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-950 dark:to-black text-gray-900 dark:text-gray-100 overflow-hidden py-16 px-6">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
          Отзиви на потребители
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Вижте какво споделят малка част от нашите клиенти за Crawlitics
        </p>
      </div>

      <Testimonials />
      
      <h2 className="text-2xl md:text-3xl font-bold mt-8 text-center">
        + още {" "}
        <span className="text-purple-600 dark:text-purple-400">стотици ревюта</span>
      </h2>

      <section className="relative py-16 px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Влиянието на{" "}
          <span className="text-blue-600 dark:text-blue-400">Crawlitics</span>
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {[
            { number: "69,000+", label: "Сравнени оферти" },
            { number: "5,000+", label: "Доволни клиенти" },
            { number: "420 000+", label: "Спестени пари" },
            { number: "24/7/365", label: "Надеждна поддръжка" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl backdrop-blur-md bg-white/70 dark:bg-gray-800/40 shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1">
              <h3 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {stat.number}
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative text-center py-16 px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Готови ли сте да започнете?
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Присъединете се към хиляди българи, които вече използват Crawlitics,
          за да пазаруват по-умно и изгодно.
        </p>
        <Link
          href="/sign-up"
          className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-sky-600 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          Регистрирай се безплатно
        </Link>
      </section>
    </div>
  );
}
