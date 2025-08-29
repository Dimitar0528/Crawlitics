import {
  ProductPreviewsResponseSchema,
  ProductSchema,
  ComparisonResponseSchema,
  ProductPreview,
  Product,
  ComparisonProduct,
  CategoriesResponseSchema,
  Category,
} from "@/lib/validations/product";
import { cache } from "react";
import { SpecialSearchFormValues } from "./validations/form";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type DataResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getLatestProducts(): Promise<
  DataResponse<ProductPreview[]>
> {
  try {
    const response = await fetch(`${API_BASE}/api/latest-products`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch latest products",
        response.status,
        errorText
      );
      return {
        success: false,
        error: `Неуспешно извличане на данни. Сървърът отговори със статус ${response.status}.`,
      };
    }

    const rawData: unknown = await response.json();

    const result = ProductPreviewsResponseSchema.safeParse(rawData);

    if (!result.success) {
      console.error(
        "Validation Error: The latest products data is malformed.",
        result.error
      );
      return {
        success: false,
        error: "Получени са неправилно форматирани данни от сървъра.",
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error(
      "Мрежова или неочаквана грешка при извличане на най-новите продукти.",
      err
    );
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна грешка." };
  }
}
export const getProduct = cache(
  async (slug: string): Promise<DataResponse<Product>> => {
    try {
      const response = await fetch(`${API_BASE}/api/product/${slug}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to fetch product ${slug}:`,
          response.status,
          errorText
        );
        return {
          success: false,
          error: `Неуспешно извличане на данни за продукт ${slug}. Сървърът отговори със статус ${response.status}.`,
        };
      }

      const rawData: unknown = await response.json();

      const result = ProductSchema.safeParse(rawData);

      if (!result.success) {
        console.error(
          "Validation Error: The product data is malformed.",
          result.error
        );
        return {
          success: false,
          error: "Получени са неправилно форматирани данни от сървъра.",
        };
      }

      return { success: true, data: result.data };
    } catch (err) {
      console.error(
        "Мрежова или неочаквана грешка при извличане на продукта.",
        err
      );
      if (err instanceof Error) {
        return { success: false, error: err.message };
      }
      return { success: false, error: "Възникна неизвестна грешка." };
    }
  }
);

export default async function getComparisonProductData(
  ids: number[]
): Promise<DataResponse<ComparisonProduct[]>> {
  if (!ids || ids.length === 0) {
    return { success: true, data: [] };
  }
  const idQueryString = ids.join(",");
  try {
    const response = await fetch(
      `${API_BASE}/api/compare-products?ids=${idQueryString}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch product:`, response.status, errorText);
      return {
        success: false,
        error: `Неуспешно извличане на данни за продуктите за сравнение. Сървърът отговори със статус ${response.status}.`,
      };
    }

    const rawData: unknown = await response.json();

    const result = ComparisonResponseSchema.safeParse(rawData);

    if (!result.success) {
      console.error(
        "Validation Error: The product data is malformed.",
        result.error
      );
      return {
        success: false,
        error: "Получени са неправилно форматирани данни от сървъра.",
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error(
      "Мрежова или неочаквана грешка при извличане на продуктите за сравнение.",
      err
    );
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна грешка." };
  }
}

type CrawleeSuccessResponse = {
  task_id: string;
};

export async function startCrawleeBot(
  values: SpecialSearchFormValues
): Promise<DataResponse<CrawleeSuccessResponse>> {
  try {
    const response = await fetch(`${API_BASE}/api/start-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.detail ||
        `Заявката е неуспешна със статус ${response.status}`;
      console.error("API Error:", errorMessage);
      return { success: false, error: errorMessage };
    }

    const data: CrawleeSuccessResponse = await response.json();
    return { success: true, data: data };
  } catch (err) {
    console.error("Network or client-side error:", err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна мрежова грешка." };
  }
}

export async function getProductsByCategory(
  category: string
): Promise<DataResponse<ProductPreview[]>> {
  try {
    const response = await fetch(`${API_BASE}/api/category-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: category }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch category products",
        response.status,
        errorText
      );
      return {
        success: false,
        error: `Неуспешно извличане на данни. Сървърът отговори със статус ${response.status}.`,
      };
    }

    const rawData: unknown = await response.json();

    const result = ProductPreviewsResponseSchema.safeParse(rawData);

    if (!result.success) {
      console.error(
        "Validation Error: The category products data is malformed.",
        result.error
      );
      return {
        success: false,
        error: "Получени са неправилно форматирани данни от сървъра.",
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error(
      "Мрежова или неочаквана грешка при извличане на най-новите продукти.",
      err
    );
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна грешка." };
  }
}

export async function getCategories(): Promise<DataResponse<Category[]>> {
  try {
    const response = await fetch(`${API_BASE}/api/categories`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch categories", response.status, errorText);
      return {
        success: false,
        error: `Неуспешно извличане на категории. Сървърът отговори със статус ${response.status}.`,
      };
    }

    const rawData: unknown = await response.json();
    const result = CategoriesResponseSchema.safeParse(rawData);
    if (!result.success) {
      console.error(
        "Validation Error: Categories data is malformed.",
        result.error
      );
      return {
        success: false,
        error: "Получени са неправилно форматирани данни от сървъра.",
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error(
      "Мрежова или неочаквана грешка при извличане на категориите.",
      err
    );
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна грешка." };
  }
}

export async function getSearchProducts(params: URLSearchParams): Promise<DataResponse<ProductPreview[]>> {
  try {
    const response = await fetch(
      `${API_BASE}/api/search-products?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch categories", response.status, errorText);
      return {
        success: false,
        error: `Неуспешно извличане на категории. Сървърът отговори със статус ${response.status}.`,
      };
    }

    const rawData: unknown = await response.json();
    const result = ProductPreviewsResponseSchema.safeParse(rawData);
    if (!result.success) {
      console.error(
        "Validation Error: Categories data is malformed.",
        result.error
      );
      return {
        success: false,
        error: "Получени са неправилно форматирани данни от сървъра.",
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error(
      "Мрежова или неочаквана грешка при извличане на категориите.",
      err
    );
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Възникна неизвестна грешка." };
  }
}
