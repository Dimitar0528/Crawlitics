import { Metadata } from "next";
import SearchPage from "./SearchPage";

export const metadata: Metadata = {
  title: "Търсене на продукти",
  description:
    "Открий най-добрите оферти и продукти с Crawlitics. Използвай търсачката, за да намериш бързо това, което търсиш.",
};

export const revalidate = 3600;

export default function Page(){
    return (
        <SearchPage/>
    )
}