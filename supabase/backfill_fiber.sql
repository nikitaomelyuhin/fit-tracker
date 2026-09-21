-- Разовый бэкфилл клетчатки для уже существующих продуктов.
-- Выполнить в Supabase → SQL Editor ПОСЛЕ применения schema.sql (там добавлена
-- колонка fiber). Значения — ориентировочные оценки по памяти, НЕ лабораторные
-- данные и не с упаковки. Для брендовых/фасованных продуктов (Лаваш delicados,
-- Лаваш mission, Тортилья mutlukal, Пудинг hyper, Neo high protein шоколад,
-- Сыр легкий, Сосиски из индейки, Творожный крем шоколад) — если под рукой есть
-- упаковка, лучше поправить цифру на настоящую с этикетки, там она точная.
--
-- unit='g' → граммы клетчатки на 100г продукта. unit='piece' → на 1 штуку/порцию.

update public.products set fiber = 1.0 where id = '5a73a0bd-8a26-4f0c-b701-81ce40502978'; -- Венгерская закуска дядя ваня
update public.products set fiber = 2.7 where id = '6952401f-635a-4131-9886-6ef254c6a60b'; -- Гречка варёная
update public.products set fiber = 2.0 where id = 'ee17e6bf-88ba-4148-868e-808dd6e6428b'; -- Картофель запеченый
update public.products set fiber = 2.0 where id = '179eed3f-24bb-4102-bf83-50518d742260'; -- Клубника
update public.products set fiber = 0.5 where id = '03b7c2e0-02a0-467f-b888-a2c50ffdab26'; -- Коктейль клубничный
update public.products set fiber = 0.4 where id = 'e07fc7a5-0b15-4367-8dff-5323a09975cf'; -- Курица с помидором, сыром и йогуртом
update public.products set fiber = 1.5 where id = 'bc2d565a-d183-4c02-9edf-a4e5475a9b88'; -- Лаваш delicados
update public.products set fiber = 1.2 where id = 'c7d3bfba-a9a2-4b80-acad-7c05b6a0777d'; -- Лаваш mission гриль
update public.products set fiber = 1.5 where id = '1321669a-a635-47e6-9e1a-698eb260cbab'; -- Лечо
update public.products set fiber = 0.0 where id = '8fc3686e-e8d8-4080-ba9f-6adcfd3f79a7'; -- Масло растительное
update public.products set fiber = 12.5 where id = '4969a99a-3856-4415-99bb-275265cdd7a3'; -- Миндаль
update public.products set fiber = 0.0 where id = '240d064c-03f7-4c9c-877a-66ae1c31d327'; -- Молоко 2%
update public.products set fiber = 1.8 where id = 'a7af488d-bcc2-40c9-82ff-4c77cf182cf4'; -- Овощи рагу 4 сезона
update public.products set fiber = 0.5 where id = 'f8ac82f5-09ff-4e43-971c-25ea1ec304dd'; -- Пудинг hyper
update public.products set fiber = 1.8 where id = '409f9faa-c0b6-40fa-890c-fcb41133daae'; -- Салат айсберг + овощи + горошек + греч. йогурт
update public.products set fiber = 0.0 where id = '5ddaf469-0f31-4c08-b03c-4b0600cec397'; -- Сосиски из индейки самокат
update public.products set fiber = 0.0 where id = '8485b67e-09ef-4b38-8108-32ef5e052599'; -- Сыр легкий
update public.products set fiber = 0.0 where id = 'd1eeb829-dded-4fcb-8e89-a59cd57e0c10'; -- Творог 1.8%
update public.products set fiber = 0.5 where id = '9be06ed1-4758-4cf9-833f-c0bdff217df0'; -- Творожный крем шоколад
update public.products set fiber = 3.0 where id = '84d810fb-b29a-4718-b8a2-2c0c65fd2e45'; -- Тортилья mutlukal
update public.products set fiber = 3.0 where id = 'ec77609c-9dbf-4e26-bd93-3d16fb163162'; -- Хлеб домашний
update public.products set fiber = 0.0 where id = '920a8f7b-0868-4f8d-91eb-3add28e9cf36'; -- Яйцо С0
update public.products set fiber = 0.0 where id = '40d61815-1846-43b3-b65a-999cd8ba473d'; -- Яйцо С1
update public.products set fiber = 0.0 where id = 'fd302b92-29f8-497c-9448-a7299d17066c'; -- Яйцо С2
update public.products set fiber = 2.0 where id = '8a405097-3382-4e34-86e5-13f1ce3f7774'; -- Neo high protein шоколад
