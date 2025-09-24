import { Metadata } from "next";
import ProductListPage from "../../components/products/ProductListPage";

export async function generateMetadata(
  props: PageProps<"/search">
): Promise<Metadata> {
  const search_query = (await props.searchParams).q;
  return {
    title: search_query
      ? `Резултати от търсенето за "${search_query}"`
      : "Резултати от търсенето на продукти",
    description:
      "Открий най-добрите оферти и продукти с Crawlitics. Използвай търсачката, за да намериш бързо това, което търсиш.",
  };
}

export const revalidate = 3600;

export default async function Page(props: PageProps<"/search">) {
    const search_query = (await props.searchParams).q as string;
    return <ProductListPage pageType="search" pageValue={search_query} />;
}