"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  Check,
  Search,
  Menu,
  LogIn,
  UserPlus,
  Bot,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  ClerkLoading,
  useUser,
} from "@clerk/nextjs";
import { toast } from "sonner";
export default function Navigation() {
    const { isSignedIn } = useUser();

  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  const categories = [
    { name: "Смартфони", href: "/category/smartphones" },
    { name: "Лаптопи", href: "/category/laptops" },
  ];

  const switchTheme = (value: string) => {
    if (!document.startViewTransition) {
      setTheme(value);
      return;
    }
    document.startViewTransition(() => {
      setTheme(value);
    });
  };

  const handleQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("q") as string;
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <nav className="sticky top-0 w-full z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between md:justify-evenly">
        <div className="flex items-center gap-6">
          <Link href={"/"} className="flex items-center space-x-2">
            <div className="bg-transparent dark:bg-gray-200 p-1 rounded-md flex items-center justify-center">
              <Image width={20} height={20} src="/favicon.ico" alt="App logo" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-purple-600 bg-clip-text text-transparent">
              Crawlitics
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  href={isSignedIn ? "/crawleebot/search" : "#"}
                  onClick={(e) => {
                    if (!isSignedIn) {
                      e.preventDefault();
                      toast.warning(
                        "Трябва да влезете в акаунта си, за да достъпите тази функционалност!"
                      );
                    }
                  }}
                  className={navigationMenuTriggerStyle()}>
                  CrawleeBot
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Категории
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {categories.map((category) => (
                      <li key={category.name}>
                        <NavigationMenuLink
                          href={category.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">
                            {category.name}
                          </div>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex flex-1 max-w-md items-center justify-center mx-4">
          <form onSubmit={handleQuickSearch} className="relative w-full">
            <Input
              type="search"
              name="q"
              placeholder="Какво търсиш днес?"
              className="pl-10 h-10 rounded-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </form>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.value}
                    onClick={() => switchTheme(t.value)}
                    className={`flex items-center justify-between ${
                      theme === t.value ? "font-semibold" : ""
                    }`}>
                    {t.label}
                    {theme === t.value && (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ClerkLoading>
              <div className="h-9.5 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            </ClerkLoading>
            <SignedOut>
              <SignInButton>
                <Button
                  variant="ghost"
                  className="border flex bg-white dark:bg-transparent dark:hover:bg-gray-500/50">
                  Вход
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="bg-gradient-to-r from-sky-500 to-purple-600 text-white bg-[length:150%_200%] transition-all duration-500 ease-out hover:bg-[position:100%_100%]">
                  Регистрация
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>

          {/* Hamburger Menu Trigger (Mobile) */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="text-xl font-bold">
                    Навигация
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-grow overflow-y-auto px-6">
                  <div className="flex flex-col gap-6 py-4">
                    <Link
                      href="/crawleebot/search"
                      className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 text-lg font-semibold text-primary transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      <Bot className="h-6 w-6" />
                      CrawleeBot
                    </Link>

                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 font-semibold text-muted-foreground">
                        <LayoutGrid className="h-5 w-5" />
                        Категории
                      </h3>
                      <div className="flex flex-col gap-1 border-l-2 border-slate-200 dark:border-slate-700 ml-2.5 pl-5">
                        {categories.map((cat) => (
                          <Link
                            key={cat.name}
                            href={cat.href}
                            className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                            onClick={() => setIsMobileMenuOpen(false)}>
                            <span>{cat.name}</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <SheetFooter className="p-6 border-t border-slate-200 dark:border-slate-800">
                  <SignedOut>
                    <div className="flex w-full items-center gap-2">
                      <SignInButton>
                        <Button
                          variant="ghost"
                          className="w-full flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Вход
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button className="w-full flex items-center gap-2 bg-gradient-to-r from-sky-500 to-purple-600 text-white">
                          <UserPlus className="h-4 w-4" />
                          Регистрация
                        </Button>
                      </SignUpButton>
                    </div>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex w-full justify-end">
                      <UserButton />
                    </div>
                  </SignedIn>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
