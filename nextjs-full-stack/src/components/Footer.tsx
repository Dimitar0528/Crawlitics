import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const YEAR = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 py-12 transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-18">
        <div className="grid text-center md:text-left justify-center sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <div className="bg-transparent dark:bg-gray-200 p-1 rounded-md flex items-center justify-center">
                  <Image width={20} height={20} src="/favicon.ico" alt="App logo" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-400">
                  Crawlitics
                </span>
              </div>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 w-70">
              Сравни цени лесно и бързо
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">За Сайта</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Как работи
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Защо да избереш нас
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Отзиви на клиенти
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Компания</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  За нас
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Кариери
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Контакти
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Поддръжка</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Помощ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Условия
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Политика за поверителност
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-300">
          <p>&copy; {YEAR} Crawlitics. Всички права запазени.</p>
        </div>
      </div>
    </footer>
  );
}
