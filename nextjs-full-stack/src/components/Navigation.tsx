"use client";

import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  SearchCheck,
  Menu,
  Bot,
  LayoutGrid,
  BadgeEuro,
  ChevronRight,
  Computer,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
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

import { getCategories } from "@/lib/data";
import { Route } from "next";

export default function Navigation() {
  const { isSignedIn } = useUser();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<
    { name: string; href: string }[]
  >([]);

  const themes = [
    { name: "Light", value: "light", Icon: Sun },
    { name: "Dark", value: "dark", Icon: Moon },
    { name: "System", value: "system", Icon: Computer },
  ] as const;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getCategories();
      if (mounted && res.success) {
        setCategories(
          res.data.map((c) => ({ name: c.name_bg, href: `/${c.slug}` }))
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const switchTheme = (value: string) => {
    if (!document.startViewTransition) {
      setTheme(value);
      return;
    }
    document.startViewTransition(() => setTheme(value));
  };

  const handleQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("q") as string;
    if (searchQuery.trim()) {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      router.push(`/search?${params.toString()}`);
    } else{
      toast.warning("Полето за търсене е празно. Попълнете го!");
    }
  };

  const navLinks = [
    {
      label: "CrawleeBot",
      href: "/crawleebot",
      protected: true,
      icon: <Bot className="h-5 w-5" />,
    },
    {
      label: "Цени",
      href: "/pricing",
      protected: false,
      icon: <BadgeEuro className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="sticky top-0 w-full z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between md:justify-evenly">
        <div className="flex items-center gap-6">
          <Link href={"/"} className="flex items-center space-x-2">
            <div className="bg-transparent dark:bg-gray-200 p-1 rounded-md flex items-center justify-center">
              <Image width={20} height={20} src="/favicon.ico" alt="App logo" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Crawlitics
            </span>
          </Link>

          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Категории
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg
        data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                    {categories.length === 0 ? (
                      <div className="w-[400px] md:w-[500px] lg:w-[600px] p-8 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
                        <AlertTriangle className="h-12 w-12 text-yellow-500/80" />
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                            Грешка при зареждане
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Категориите не могат да бъдат показани в момента.
                            Моля, опитайте отново по-късно.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] max-h-[400px] overflow-y-auto">
                        {categories.map((category) => (
                          <NavigationMenuItem
                            key={category.name}
                            className="list-none">
                            <Link
                              href={category.href as Route}
                              className="group flex items-center justify-between p-3 rounded-md transition-all duration-300 ease-in-out
                    hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 
                    dark:hover:from-slate-800 dark:hover:to-slate-700">
                              <span
                                className="text-base font-medium text-slate-700 dark:text-slate-300 transition-colors
                    group-hover:text-purple-600 dark:group-hover:text-purple-300">
                                {category.name}
                              </span>
                              <ChevronRight
                                className="h-5 w-5 text-slate-400 dark:text-slate-500 
                    transition-transform duration-300 group-hover:translate-x-1 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                              />
                            </Link>
                          </NavigationMenuItem>
                        ))}
                      </ul>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {navLinks.map((link) => (
                <NavigationMenuItem key={link.label}>
                  <Link
                    href={
                      isSignedIn || !link.protected ? (link.href as Route) : "#"
                    }
                    onClick={(e) => {
                      if (link.protected && !isSignedIn) {
                        e.preventDefault();
                        toast.warning(
                          "Трябва да влезеш в акаунта си, за да достъпиш тази функционалност!"
                        );
                      }
                    }}
                    className={navigationMenuTriggerStyle()}>
                    {link.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex flex-1 max-w-md items-center justify-center mx-4 relative">
          <form onSubmit={handleQuickSearch} className="relative w-full">
            <Input
              type="search"
              name="q"
              placeholder="Какво търсиш днес?"
              className="pl-8 h-10 rounded-full"
            />
            <Button
              type="submit"
              variant="link"
              size="sm"
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full">
              <SearchCheck />
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="text-purple-600 h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="text-purple-300 absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="" align="end">
              {themes.map(({ name, value, Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => switchTheme(value)}
                  className={`group transition-colors cursor-pointer ${
                    theme === value ? "bg-accent text-accent-foreground" : ""
                  }`}>
                  <Icon className="size-4 group-hover:text-white group-focus-visible:text-white" />
                  <span className="group-hover:text-white group-focus-visible:text-white">
                    {name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ClerkLoading>
            <div className="h-9.5 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          </ClerkLoading>

          <SignedOut>
            <SignInButton>
              <Button variant="ghost">Вход</Button>
            </SignInButton>
            <SignUpButton>
              <Button
                className="bg-gradient-to-r from-sky-800 to-purple-800 text-white 
                   hover:shadow-lg hover:shadow-purple-500/50 dark:hover:shadow-purple-700/50 transition-all duration-300">
                Регистрация
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="text-xl font-bold">
                    Навигация
                  </SheetTitle>
                </SheetHeader>
                <div className="mx-4 relative">
                  <form
                    onSubmit={handleQuickSearch}
                    className="relative w-full">
                    <Input
                      type="search"
                      name="q"
                      placeholder="Какво търсиш днес?"
                      className="pl-8 h-10 rounded-full"
                    />
                    <Button
                      type="submit"
                      variant="link"
                      size="sm"
                      className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full">
                      <SearchCheck />
                    </Button>
                  </form>
                </div>
                <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-muted-foreground">
                      <LayoutGrid className="h-5 w-5" />
                      Категории
                    </h3>
                    <div className="ml-2.5 mt-2 flex flex-col gap-1 border-l-2 pl-5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href as Route}
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => setIsMobileMenuOpen(false)}>
                          {cat.name}
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={
                        isSignedIn || !link.protected
                          ? (link.href as Route)
                          : "#"
                      }
                      onClick={(e) => {
                        if (link.protected && !isSignedIn) {
                          e.preventDefault();
                          toast.warning(
                            "Трябва да влезеш в акаунта си, за да достъпиш тази функционалност!"
                          );
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className="flex items-center gap-3 rounded-lg p-3 text-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
