-- Разовый сид твоих продуктов из таблицы. Выполнить в Supabase → SQL Editor.
--
-- ВАЖНО: SQL Editor выполняет запросы от имени postgres, а не от твоего
-- пользователя — auth.uid() тут будет NULL. Поэтому ниже user_id проставлен
-- явно. Возьми свой id: Supabase Dashboard → Authentication → Users →
-- скопируй UUID своей учётки, и подставь вместо плейсхолдера ниже.

do $$
declare
  v_user_id uuid := 'REPLACE_WITH_YOUR_USER_ID';
begin

insert into public.products (user_id, name, category, unit, kcal, protein, fat, carbs) values
  (v_user_id, 'Гречка варёная', 'base', 'g', 110, 4.2, 1.1, 21.3),
  (v_user_id, 'Лечо', 'dish', 'g', 24, 1.0, 0.2, 4.5),
  (v_user_id, 'Курица с помидором, сыром 20% и греч. йогуртом', 'dish', 'g', 160, 27.0, 4.5, 1.5),
  (v_user_id, 'Салат айсберг + овощи + горошек + греч. йогурт', 'dish', 'g', 40, 2.5, 0.5, 6.0),
  (v_user_id, 'Миндаль', 'base', 'g', 579, 21.2, 49.9, 21.6),
  (v_user_id, 'Масло растительное', 'base', 'g', 899, 0, 99.9, 0),
  (v_user_id, 'Молоко 2%', 'base', 'g', 50, 3.0, 2.0, 4.7),
  (v_user_id, 'Творог 1.8%', 'base', 'g', 100, 18.0, 1.8, 3.0),
  (v_user_id, 'Клубника', 'base', 'g', 32, 0.7, 0.3, 7.7),
  (v_user_id, 'Яйцо С0', 'base', 'piece', 94, 7.6, 6.5, 0.4),
  (v_user_id, 'Яйцо С1', 'base', 'piece', 78, 6.3, 5.4, 0.4),
  (v_user_id, 'Яйцо С2', 'base', 'piece', 65, 5.3, 4.5, 0.3);

end $$;
