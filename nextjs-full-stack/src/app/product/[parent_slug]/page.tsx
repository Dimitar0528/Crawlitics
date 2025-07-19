import { Metadata } from "next";
import { Product } from "@/types/product";
export const revalidate = 3600;

export async function generateStaticParams() {
  const newest_products = await fetch("http://localhost:8000/api/latest-products").then(
    (res) => res.json()
  );

  return newest_products.map((newest_product: Product) => ({
    parent_slug: newest_product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ parent_slug: string }>
}): Promise <Metadata> {
  const { parent_slug } = await params;
  return {
    title: `${parent_slug}`,
    description: `Страница, показваща информация за продукта ${parent_slug}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ parent_slug: string }>
}) {
  const { parent_slug } = await params;

  return (
    <div>
      <h1 className="py-50">Hi {parent_slug}</h1>
    </div>
  );
}
