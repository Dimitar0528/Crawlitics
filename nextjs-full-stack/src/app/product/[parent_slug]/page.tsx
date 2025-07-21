import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Product } from "@/types/product";
import { getLatestProducts, getProduct } from "@/lib/data";
import BackButton from "@/components/products/BackButton";
import { calculate_product_variant_prices } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  const newest_products = await getLatestProducts();
  return newest_products.map((product: Product) => ({
    parent_slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ parent_slug: string }>;
}): Promise<Metadata> {
  const { parent_slug } = await params;
  const product = await getProduct(parent_slug);
  if (!product) {
    notFound();
  }
  return {
    title: `${product.name} | Crawlitics`,
    description: `Страница, показваща информация за продукта ${product.name}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ parent_slug: string }>;
}) {
  const { parent_slug } = await params;
  const product = await getProduct(parent_slug);
  if (!product) {
    notFound();
  }
  const SpecList = ({ specs }: { specs: Record<string, string> }) => (
    <ul className="space-y-3">
      {Object.entries(specs).map(([key, value]) => (
        <li
          key={key}
          className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-2">
          <span className="font-medium text-gray-600">{key}</span>
          <span className="font-semibold text-gray-900 text-right">
            {String(value)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-subtle p-8 md:p-12">
        <BackButton />
        <header className="pb-6 border-b border-gray-200">
          <p className="text-base font-semibold text-indigo-600">
            {product.brand}
          </p>
          <h1 className="mt-2 text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
            {product.name}
          </h1>
        </header>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-10">
          <div className="lg:col-span-2">
            {product.description && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  Описание
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </section>
            )}

            {product.common_specs &&
              Object.keys(product.common_specs).length > 0 && (
                <section className="mt-10">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Общи спецификации
                  </h2>
                  <div className="bg-gray-50/80 rounded-lg p-6 border border-gray-200/80">
                    <SpecList specs={product.common_specs} />
                  </div>
                </section>
              )}
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Налични варианти
            </h2>
            <div className="space-y-6">
              {product.variants && product.variants.length > 0 ? (
                product.variants.map((variant) => {
                  const isAvailable = variant.availability === "В наличност";
                  const latest_lowest_price =
                    variant.price_history[variant.price_history.length - 1]
                      .price;
                  const { price_bgn, price_eur } =
                    calculate_product_variant_prices(latest_lowest_price);
                  return (
                    <div
                      key={variant.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-indigo-300">
                      <div className="mb-4">
                        <SpecList specs={variant.variant_specs} />
                      </div>

                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
                        {/* Price block */}
                        <div>
                          <span className="block text-sm font-medium text-gray-500 mb-1">
                            Цена:
                          </span>
                          <div className="flex flex-col space-y-1">
                            {price_bgn && (
                              <span className="text-xl font-bold text-gray-900">
                                {price_bgn}
                              </span>
                            )}
                            {price_eur && (
                              <span className="text-xl font-bold text-gray-900">
                                {price_eur}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-4 py-1 text-xs font-semibold rounded-full ${
                              isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                            {variant.availability}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                  Няма налични варианти за този продукт.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
