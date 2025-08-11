import type { Metadata } from "next";
import ComparePage from "./ComparePage";
export const metadata: Metadata = {
  title: "Сравни продукти",
  description:
    "Сравнете избраните от вас продукти един до друг. Вижте пълните им характеристики, цени и лесно открийте разликите между тях, за да направите най-добрия и информиран избор.",
};


export default function Page() {
  return <ComparePage />;
}
