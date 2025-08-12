"use client";

import { Sun, Moon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  const { setTheme, theme } = useTheme(); 
  
  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];
  
  function switchTheme(value: string){
    if(!document.startViewTransition){
      setTheme(value);
      return
    }
    document.startViewTransition(()=>{
      setTheme(value);
    })
  }
  return (
    <nav className="sticky top-0 w-full z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/20 dark:border-gray-700/20">
      <div className="container mx-auto px-4 lg:px-18 py-4 flex items-center justify-between">
        <Link href={"/"} className="flex items-center space-x-2">
          <div className="bg-transparent dark:bg-gray-100 rounded-lg flex items-center justify-center ">
            <Image width={20} height={20} src="/favicon.ico" alt="App logo" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Crawlitics
          </span>
        </Link>

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
          <Button
            variant="outline"
            className="hidden md:flex bg-white dark:bg-transparent dark:hover:bg-gray-500/50">
            Вход
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-400 dark:hover:to-purple-500 text-white">
            Регистрация
          </Button>
        </div>
      </div>
    </nav>
  );
}
