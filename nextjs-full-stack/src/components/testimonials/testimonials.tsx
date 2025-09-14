"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type User = {
  name: string;
  location: string;
  quote: string;
  rating: number;
  gender: "male" | "female";
  avatar: string;
};
type UserPicture = {
  large: string;
  medium: string;
  thumbnail: string;
};

type RandomUser = {
  picture: UserPicture;
};
export default function Testimonials() {
  const [avatars, setAvatars] = useState<{ male: string[]; female: string[] }>({
    male: [],
    female: [],
  });

  useEffect(() => {
    const fetchAvatars = async () => {
      const maleRes = await fetch(
        "https://randomuser.me/api/?results=6&gender=male"
      );
      const femaleRes = await fetch(
        "https://randomuser.me/api/?results=6&gender=female"
      );

      const maleData = await maleRes.json();
      const femaleData = await femaleRes.json();

      setAvatars({
        male: maleData.results.map((u: RandomUser) => u.picture.large),
        female: femaleData.results.map((u: RandomUser) => u.picture.large),
      });
    };
    fetchAvatars();
  }, []);

  const testimonials: User[] = [
    {
      name: "Иван Петров",
      location: "София",
      quote:
        "Преди да открия Crawlitics, прекарвах часове в обикаляне по различни сайтове и все не бях сигурен дали наистина намирам най-добрата цена. Сега всичко става за минути – въвеждам продукта и получавам резултатите на едно място. Това е приложение, което реално ми спести време, пари и доста нерви.",
      rating: 5,
      gender: "male",
      avatar: avatars.male[0],
    },
    {
      name: "Мария Георгиева",
      location: "Пловдив",
      quote:
        "Като човек, който често пазарува онлайн, винаги съм се притеснявала дали няма да пропусна по-добра оферта. Crawlitics ми даде спокойствие и увереност – вече знам, че купувам на възможно най-добрата цена. Освен това интерфейсът е толкова интуитивен, че дори родителите ми могат да го използват.",
      rating: 4,
      gender: "female",
      avatar: avatars.female[0],
    },
    {
      name: "Георги Димитров",
      location: "Варна",
      quote:
        "Приложението е изключително прецизно – сравнява само реални оферти и елиминира фалшивите намаления, които често ме подвеждаха преди. Най-много ме впечатли колко бързо намирам резултатите и как те винаги са актуални. Честно казано, вече не си представям да пазарувам без Crawlitics.",
      rating: 5,
      gender: "male",
      avatar: avatars.male[1],
    },
    {
      name: "Елена Николова",
      location: "Бургас",
      quote:
        "Харесвам минималистичния дизайн и вниманието към детайла. Всичко е подредено и ясно – няма досадни реклами, няма претрупаност. Просто фокус върху това, което ми трябва: да сравня и да купя разумно. Чувствам се сякаш приложението е направено точно за мен.",
      rating: 5,
      gender: "female",
      avatar: avatars.female[1],
    },
    {
      name: "Даниел Тодоров",
      location: "Русе",
      quote:
        "Аз съм от хората, които не обичат да губят време в онлайн магазини. Crawlitics ми помогна да намеря изгодна техника за офиса буквално за няколко минути. Харесва ми, че системата е бърза, сигурна и винаги актуализирана. Това ми дава увереност, че няма да сбъркам в избора си.",
      rating: 4,
      gender: "male",
      avatar: avatars.male[2],
    },
    {
      name: "Симона Алексиева",
      location: "Стара Загора",
      quote:
        "Преди Crawlitics често купувах импулсивно и след това съжалявах, когато видя същия продукт по-евтин другаде. Сега мога да сравня за секунди и да направя информиран избор. Това приложение ми спести не само пари, но и много разочарования.",
      rating: 5,
      gender: "female",
      avatar: avatars.female[2],
    },
    {
      name: "Николай Иванов",
      location: "Благоевград",
      quote:
        "Най-силното предимство за мен е точността. Crawlitics винаги ми показва най-изгодните оферти и ме предпазва от фалшиви намаления. Споделих приложението с приятели и всички реагираха с едно и също: „Еха, защо никой не го беше направил досега?",
      rating: 5,
      gender: "male",
      avatar: avatars.male[3],
    },
    {
      name: "Габриела Костова",
      location: "Шумен",
      quote:
        "Признавам си – първо свалих приложението от любопитство. Но с времето започнах да го използвам постоянно, защото ме улеснява ужасно много. Мога да проверя цената на даден продукт докато съм в магазина и веднага знам дали има смисъл да го купувам на място. Това е безценно удобство.",
      rating: 4,
      gender: "female",
      avatar: avatars.female[3],
    },
    {
      name: "Александър Христов",
      location: "Плевен",
      quote:
        "Обичам да пазарувам смарт техника и винаги търся най-добрата оферта. Crawlitics буквално се превърна в моя личен асистент за пазаруване – намира най-изгодното и ми спестява стотици левове на година. Чувствам се сякаш имам суперсила, когато пазарувам с него.",
      rating: 5,
      gender: "male",
      avatar: avatars.male[4],
    },
    {
      name: "Десислава Пенева",
      location: "Велико Търново",
      quote:
        "Това, което най-много ме впечатли, е бързината. Всичко се зарежда мигновено, а резултатите винаги са точни. Crawlitics е пример как една модерна българска разработка може да бъде не само полезна, но и красива за ползване. Чувствам гордост, че е създадено тук.",
      rating: 5,
      gender: "female",
      avatar: avatars.female[4],
    },
    {
      name: "Мартин Станчев",
      location: "Пазарджик",
      quote:
        "По принцип избягвам нови приложения, защото често са претрупани или не работят добре. Но Crawlitics ме спечели с простота и ефективност. Всичко е кристално ясно – без сложни менюта, без излишни опции. Това е приложение, което мисли за потребителя.",
      rating: 4,
      gender: "male",
      avatar: avatars.male[5],
    },
    {
      name: "Гергана Лозанова",
      location: "Кюстендил",
      quote:
        "Най-много ме радват плавните анимации и модерният вид. Усеща се, че екипът е вложил внимание във всеки детайл – от дизайн до функционалност. Чувствам, че пазаруването вече не е скучно, а приятно изживяване. Честно казано, вече го препоръчвам на всички приятели.",
      rating: 5,
      gender: "female",
      avatar: avatars.female[5],
    },
  ];
  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((user, i) => (
        <div
          key={i}
          className={`
    relative transform transition-all duration-700 ease-out
    bg-gradient-to-br from-white/60 via-purple-100/30 to-blue-50/50 
    dark:from-gray-900/60 dark:via-purple-900/30 dark:to-blue-900/30
    backdrop-blur-xl rounded-3xl shadow-2xl
    p-6 hover:scale-105 hover:shadow-3xl
    group overflow-hidden
  `}>
          <div className="absolute top-4 right-4 bg-blue-800 dark:bg-blue-400  text-white dark:text-black px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            ВИП
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-300/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>

          <div className="relative z-10 flex items-center space-x-5 mb-5">
            {user.avatar && (
              <Image
                src={user.avatar}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full border-4 border-white/50 dark:border-gray-700 shadow-lg"
              />
            )}
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white transition-colors">
                {user.name}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {user.location}
              </p>
            </div>
          </div>

          <p className="relative text-gray-800 dark:text-gray-200 italic text-sm sm:text-base mb-5 leading-relaxed">
            <span className="absolute -top-2 -left-4 text-4xl text-purple-800 dark:text-purple-400 select-none pointer-events-none">
              “
            </span>
            {user.quote}
            <span className="absolute -bottom-3 text-4xl text-purple-800 dark:text-purple-400 select-none pointer-events-none">
              ”
            </span>
          </p>

          <div className="flex mt-2">
            {[...Array(5)].map((_, starIndex) => (
              <svg
                key={starIndex}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill={starIndex < user.rating ? "gold" : "lightgray"}
                className="w-6 h-6 transition-transform duration-300 group-hover:scale-125">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
