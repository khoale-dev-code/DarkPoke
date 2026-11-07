-- Dữ liệu mẫu Dark Poke (giống chế độ demo). Chạy sau các file trong migrations.
-- Ảnh mẫu dùng đường dẫn /art/*.svg có sẵn trong thư mục public.

insert into public.product_types (id, code, name, description, track_inventory, is_unique, has_variants, allow_preorder, allow_tradein, hold_in_cart, sort) values
  ('9d876c01-e90f-5047-9e5e-a1140aa628ff', 'sealed', 'Sealed', 'Booster box, ETB, pack, tin, deck còn nguyên seal', true, false, false, true, true, false, 0),
  ('5ba880dc-5ec4-5b34-bc07-01031d87615d', 'the-le', 'Thẻ lẻ', 'Từng thẻ, có tình trạng NM, LP, MP, HP', true, true, false, false, true, true, 1),
  ('f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'the-grading', 'Thẻ grading', 'Thẻ đã chấm điểm, có số cert', true, true, false, false, true, true, 2),
  ('fd048791-a896-5560-83f9-b906ff9556aa', 'phu-kien', 'Phụ kiện', 'Sleeves, binder, hộp đựng', true, false, true, false, false, false, 3),
  ('c7834efb-e539-5863-bf16-c2737466365d', 'hang-thuong', 'Hàng thường', 'Mẫu trống, thêm thuộc tính khi cần', true, false, false, false, false, false, 4)
on conflict (id) do nothing;

insert into public.attribute_defs (id, type_id, code, name, kind, options, required, filterable, visible, sort) values
  ('82fd5263-f8b4-5919-afd8-ca18ecca4aff', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('5be24d84-52c2-536e-8005-30dc8c125cbf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'form', 'Dạng sản phẩm', 'select', array['Booster Box','Elite Trainer Box','Booster Pack','Tin','Starter Deck','Collection Box']::text[], true, true, true, 1),
  ('dc3cf246-f51b-51f2-862b-6d7a405988e2', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('884aeeb9-e300-52f0-98d6-745827dc48a4', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'language', 'Ngôn ngữ', 'select', array['EN','JP','VN']::text[], true, true, true, 3),
  ('3aa10f25-6392-5999-86fa-55fb5cc168ae', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'packs', 'Số pack', 'number', '{}'::text[], false, false, true, 4),
  ('7d02ec83-fcae-5dd0-a40a-450e766a85c1', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'release_date', 'Ngày phát hành', 'date', '{}'::text[], false, false, true, 5),
  ('e38c4a5d-4367-5a73-89c9-c746d7982800', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('1cf4a602-d796-5876-a707-7f416f6d6a06', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], true, false, true, 1),
  ('95c6a87f-f732-5c3e-8246-32b06a740e28', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'card_no', 'Số thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('aa0244a1-aa42-5447-b8b7-851a3e371eb8', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'rarity', 'Độ hiếm', 'select', array['Common','Uncommon','Rare','Ultra Rare','Secret Rare']::text[], false, true, true, 3),
  ('536acbb8-67e5-5e50-a81b-e1442b09e68a', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'condition', 'Tình trạng', 'select', array['NM','LP','MP','HP']::text[], true, true, true, 4),
  ('902cf408-0e5c-577b-b07c-7b99071ffa8d', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'language', 'Ngôn ngữ', 'select', array['EN','JP','VN']::text[], false, true, true, 5),
  ('35dde7b1-9991-5244-babe-1a4d730c0c5d', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'game', 'Game', 'select', array['Pokémon TCG','One Piece TCG','Riftbound']::text[], true, true, true, 0),
  ('d939ee0d-6f7f-5eb8-b06c-338f80fa4cb8', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'set_name', 'Bộ thẻ', 'text', '{}'::text[], true, false, true, 1),
  ('4703bdd0-30fd-5b70-b510-28de26edf45c', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'card_no', 'Số thẻ', 'text', '{}'::text[], false, false, true, 2),
  ('136a5260-24d3-5494-90b2-5751d0f356a5', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'grader', 'Hãng chấm', 'select', array['PSA','BGS','CGC']::text[], true, true, true, 3),
  ('15045dd6-73f2-5501-8d7d-ec4e16af0ce7', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'grade', 'Điểm', 'select', array['10','9.5','9','8.5','8']::text[], true, true, true, 4),
  ('0b43b855-3b90-5f47-a64b-1ca2eb83194e', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'cert_no', 'Số cert', 'text', '{}'::text[], true, false, true, 5),
  ('e692fde8-3516-5d3c-bce5-5c10797777d5', 'fd048791-a896-5560-83f9-b906ff9556aa', 'material', 'Chất liệu', 'select', array['PP trong suốt','Nhựa mờ','Da PU','Vải']::text[], true, false, true, 0),
  ('0c6255ae-2263-5ce1-977d-6724f881f30c', 'fd048791-a896-5560-83f9-b906ff9556aa', 'card_size', 'Kích thước thẻ phù hợp', 'select', array['Chuẩn (63×88)','Nhỏ Nhật (59×86)']::text[], false, true, true, 1),
  ('b896b260-a855-5904-974c-10ba06ddfc2c', 'fd048791-a896-5560-83f9-b906ff9556aa', 'pack_count', 'Số lượng trong gói', 'number', '{}'::text[], false, false, true, 2)
on conflict (id) do nothing;

insert into public.categories (id, parent_id, name, slug, sort, visible) values
  ('2433d42d-eaf9-5afd-bb3e-164333542d12', null, 'Thẻ bài', 'the-bai', 0, true),
  ('c3fd3120-e26a-59c7-be0d-56f12b78eccb', null, 'Phụ kiện', 'phu-kien', 1, true),
  ('77b793ff-d489-5688-afa2-b3c0c09b230e', null, 'Mô hình', 'mo-hinh', 2, true)
on conflict (id) do nothing;

insert into public.categories (id, parent_id, name, slug, sort, visible) values
  ('ad17fe33-3b0a-5453-8b1a-b10905495108', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'Pokémon TCG', 'pokemon-tcg', 0, true),
  ('7589e86f-994e-563b-9c4c-a9e78d9347bd', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'One Piece TCG', 'one-piece-tcg', 1, true),
  ('f48d5368-5b6a-540e-8192-f392885e328a', '2433d42d-eaf9-5afd-bb3e-164333542d12', 'Riftbound', 'riftbound', 2, true),
  ('df4ed986-ebfc-5bd7-bb8e-15fc0410a22d', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Sleeves', 'sleeves', 0, true),
  ('d3d0e7d0-f099-5c7f-a1c6-a8d5e695a492', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Binder', 'binder', 1, true),
  ('be8fff99-0e4b-5df6-8fd0-901384c24147', 'c3fd3120-e26a-59c7-be0d-56f12b78eccb', 'Hộp đựng', 'hop-dung', 2, true)
on conflict (id) do nothing;

insert into public.brands (id, name, slug) values
  ('b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'The Pokémon Company', 'pokemon'),
  ('822455eb-2fcf-57b1-9402-adc15200c469', 'Bandai', 'bandai'),
  ('80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Riot Games', 'riot'),
  ('d5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Ultra Pro', 'ultra-pro'),
  ('7fdf4433-a515-5ea0-95c5-9540a7ab0122', 'Dark Poke', 'dark-poke')
on conflict (id) do nothing;

insert into public.collections (id, name, slug, description, visible, sort) values
  ('1810dcdc-2222-5472-8287-ac66b28b66ce', 'Chaos Rising', 'chaos-rising', 'Bộ mở rộng mới nhất', true, 0),
  ('a105f044-b6d1-59b8-8607-1dc72ade241c', 'Hàng mới về', 'hang-moi-ve', 'Vừa lên kệ tuần này', true, 1),
  ('588121a2-f141-5f3c-ab11-2b7e20e29810', 'Quà tặng mùa lễ hội', 'qua-tang', 'Gợi ý quà cho người chơi', true, 2)
on conflict (id) do nothing;

insert into public.products (id, type_id, category_id, brand_id, name, slug, sku, description, unit, price, compare_at_price, cost, status, online, pos, is_featured, attrs, tags, thumbnail, min_stock, purchase_limit, allow_preorder, preorder_deposit_pct, preorder_release_date, preorder_slots, preorder_closes_at, created_at) values
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Box Chaos Rising', 'booster-box-chaos-rising', 'PKM-BB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 5500000, null, 4400000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Booster Box", "set_name": "Chaos Rising", "language": "EN", "packs": 36, "release_date": "2026-10-24"}'::jsonb, array['bán chạy']::text[], '/art/box1.svg', 3, null, false, null, null, null, null, '2026-11-04T09:00:00+00:00'),
  ('e200ef80-36fd-56b0-a08a-10872e481441', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Elite Trainer Box Chaos Rising', 'etb-chaos-rising', 'PKM-ETB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 2700000, 2900000, 2160000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Elite Trainer Box", "set_name": "Chaos Rising", "language": "EN", "packs": 9}'::jsonb, '{}'::text[], '/art/etb1.svg', 3, null, false, null, null, null, null, '2026-11-04T03:00:00+00:00'),
  ('ad584866-3e6e-5157-b84d-823b3fc8db0f', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Pack Mega Dream ex JP', 'booster-pack-mega-dream-ex-jp', 'PKM-BP-MD-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 95000, null, 76000, 'active', true, true, true, '{"game": "Pokémon TCG", "form": "Booster Pack", "set_name": "Mega Dream ex", "language": "JP", "packs": 1}'::jsonb, '{}'::text[], '/art/pack1.svg', 3, null, false, null, null, null, null, '2026-11-03T21:00:00+00:00'),
  ('50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Mini Tin Chaos Rising', 'mini-tin-chaos-rising', 'PKM-TIN-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 320000, null, 256000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Tin", "set_name": "Chaos Rising", "language": "EN", "packs": 2}'::jsonb, '{}'::text[], '/art/tin1.svg', 3, null, false, null, null, null, null, '2026-11-03T15:00:00+00:00'),
  ('12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Booster Box OP-12', 'booster-box-op-12', 'OP-BB-12-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1870000, null, 1496000, 'active', true, true, true, '{"game": "One Piece TCG", "form": "Booster Box", "set_name": "OP-12", "language": "JP", "packs": 24}'::jsonb, '{}'::text[], '/art/box2.svg', 3, null, false, null, null, null, null, '2026-11-03T09:00:00+00:00'),
  ('eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Booster Box OP-13 (Pre-order)', 'booster-box-op-13-preorder', 'OP-BB-13-JP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1950000, null, 1560000, 'active', true, true, true, '{"game": "One Piece TCG", "form": "Booster Box", "set_name": "OP-13", "language": "JP", "packs": 24, "release_date": "2026-12-12"}'::jsonb, '{}'::text[], '/art/box3.svg', 3, 2, true, 30, '2026-12-12', 60, '2026-11-30T16:59:59+00:00', '2026-11-03T03:00:00+00:00'),
  ('a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Starter Deck Riftbound Origins', 'starter-deck-riftbound-origins', 'RB-SD-OR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 450000, null, 360000, 'active', true, true, false, '{"game": "Riftbound", "form": "Starter Deck", "set_name": "Origins", "language": "EN"}'::jsonb, '{}'::text[], '/art/deck1.svg', 3, null, false, null, null, null, null, '2026-11-02T21:00:00+00:00'),
  ('fae19057-6a43-5d16-b631-288dbccfe9bf', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Booster Box Riftbound Origins', 'booster-box-riftbound-origins', 'RB-BB-OR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 3200000, null, 2560000, 'active', true, true, false, '{"game": "Riftbound", "form": "Booster Box", "set_name": "Origins", "language": "EN", "packs": 24}'::jsonb, '{}'::text[], '/art/box3.svg', 3, null, false, null, null, null, null, '2026-11-02T15:00:00+00:00'),
  ('58470d73-5281-53b9-9fb2-628084a7bafc', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Premium Collection Mega Charizard', 'premium-collection-mega-charizard', 'PKM-PC-MC-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 1450000, null, 1160000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Collection Box", "set_name": "Mega Evolution", "language": "EN", "packs": 6}'::jsonb, '{}'::text[], '/art/coll1.svg', 3, null, false, null, null, null, null, '2026-11-02T09:00:00+00:00'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Build & Battle Box Chaos Rising', 'build-battle-chaos-rising', 'PKM-BNB-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 520000, null, 416000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Starter Deck", "set_name": "Chaos Rising", "language": "EN", "packs": 4}'::jsonb, '{}'::text[], '/art/deck2.svg', 3, null, false, null, null, null, null, '2026-11-02T03:00:00+00:00'),
  ('c92a1d17-6b07-5691-b833-8c751fc6356c', '9d876c01-e90f-5047-9e5e-a1140aa628ff', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Starter Deck ST-21 One Piece', 'starter-deck-st-21', 'OP-ST-21-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 380000, null, 304000, 'active', true, true, false, '{"game": "One Piece TCG", "form": "Starter Deck", "set_name": "ST-21", "language": "EN"}'::jsonb, '{}'::text[], '/art/deck3.svg', 3, null, false, null, null, null, null, '2026-11-01T21:00:00+00:00'),
  ('5c18448e-747e-56ea-aaf1-28ba45ab23dc', '9d876c01-e90f-5047-9e5e-a1140aa628ff', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Booster Pack Chaos Rising EN', 'booster-pack-chaos-rising-en', 'PKM-BP-CR-EN', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Hộp', 160000, null, 128000, 'active', true, true, false, '{"game": "Pokémon TCG", "form": "Booster Pack", "set_name": "Chaos Rising", "language": "EN", "packs": 1}'::jsonb, '{}'::text[], '/art/pack2.svg', 3, null, false, null, null, null, null, '2026-11-01T15:00:00+00:00'),
  ('a722cc89-b72d-59e9-a68e-30c67bc38b28', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Pikachu ex · Chaos Rising #063 · NM', 'pikachu-ex-chaos-rising-063', 'SGL-0101', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 420000, null, 336000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Chaos Rising", "card_no": "063/191", "rarity": "Ultra Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card1.svg', 0, null, false, null, null, null, null, '2026-11-01T09:00:00+00:00'),
  ('58b2c938-7a49-56e8-bec0-f482a08e8d1b', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Gengar · Mega Dream #112 · LP', 'gengar-mega-dream-112', 'SGL-0102', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 180000, null, 144000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Mega Dream ex", "card_no": "112/250", "rarity": "Rare", "condition": "LP", "language": "JP"}'::jsonb, '{}'::text[], '/art/card2.svg', 0, null, false, null, null, null, null, '2026-11-01T03:00:00+00:00'),
  ('98ba03a9-87e2-551f-bbed-0ad99355a8b5', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Umbreon ex · Prismatic #161 · NM', 'umbreon-ex-prismatic-161', 'SGL-0103', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 2350000, null, 1880000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Prismatic Evolutions", "card_no": "161/131", "rarity": "Secret Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card3.svg', 0, null, false, null, null, null, null, '2026-10-31T21:00:00+00:00'),
  ('1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '5ba880dc-5ec4-5b34-bc07-01031d87615d', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Monkey D. Luffy · OP-12 #001 · NM', 'luffy-op12-001', 'SGL-0104', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 650000, null, 520000, 'active', true, true, false, '{"game": "One Piece TCG", "set_name": "OP-12", "card_no": "OP12-001", "rarity": "Secret Rare", "condition": "NM", "language": "JP"}'::jsonb, '{}'::text[], '/art/card1.svg', 0, null, false, null, null, null, null, '2026-10-31T15:00:00+00:00'),
  ('850557ab-be27-5e97-a013-88724b30d328', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Snorlax · Chaos Rising #143 · MP', 'snorlax-chaos-rising-143', 'SGL-0105', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 45000, null, 36000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Chaos Rising", "card_no": "143/191", "rarity": "Uncommon", "condition": "MP", "language": "EN"}'::jsonb, '{}'::text[], '/art/card2.svg', 0, null, false, null, null, null, null, '2026-10-31T09:00:00+00:00'),
  ('3b16fca9-4c3e-588c-ba00-b21928a997b2', '5ba880dc-5ec4-5b34-bc07-01031d87615d', 'f48d5368-5b6a-540e-8192-f392885e328a', '80dcca09-4673-5190-a4be-7cf09f5df0c6', 'Jinx · Origins #030 · NM', 'jinx-origins-030', 'SGL-0106', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 280000, null, 224000, 'active', true, true, false, '{"game": "Riftbound", "set_name": "Origins", "card_no": "030/298", "rarity": "Rare", "condition": "NM", "language": "EN"}'::jsonb, '{}'::text[], '/art/card3.svg', 0, null, false, null, null, null, null, '2026-10-31T03:00:00+00:00'),
  ('0668ea86-b6b1-5931-94cd-5b99154730c4', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Charizard ex · Obsidian Flames #125 · PSA 10', 'charizard-ex-obsidian-flames-125-psa10', 'GRD-0001', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 6500000, null, 5200000, 'active', true, true, true, '{"game": "Pokémon TCG", "set_name": "Obsidian Flames", "card_no": "125/197", "grader": "PSA", "grade": "10", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab1.svg', 0, null, false, null, null, null, null, '2026-10-30T21:00:00+00:00'),
  ('c2a19752-5825-5365-af69-f2dc718c1bcb', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', 'ad17fe33-3b0a-5453-8b1a-b10905495108', 'b3fdabf5-ee0d-5673-8a0b-d1ac9aa37878', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 'pikachu-vmax-vivid-voltage-188-bgs95', 'GRD-0002', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 3800000, null, 3040000, 'active', true, true, false, '{"game": "Pokémon TCG", "set_name": "Vivid Voltage", "card_no": "188/185", "grader": "BGS", "grade": "9.5", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab2.svg', 0, null, false, null, null, null, null, '2026-10-30T15:00:00+00:00'),
  ('694eb561-ab77-52fc-9fc6-f56a8460d43b', 'f7a5879d-1218-5a1d-b3c1-cdfd19d41f69', '7589e86f-994e-563b-9c4c-a9e78d9347bd', '822455eb-2fcf-57b1-9402-adc15200c469', 'Shanks · OP-01 #120 · PSA 9', 'shanks-op01-120-psa9', 'GRD-0003', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 2900000, null, 2320000, 'active', true, true, false, '{"game": "One Piece TCG", "set_name": "OP-01", "card_no": "OP01-120", "grader": "PSA", "grade": "9", "cert_no": "[SỐ CERT]"}'::jsonb, '{}'::text[], '/art/slab3.svg', 0, null, false, null, null, null, null, '2026-10-30T09:00:00+00:00'),
  ('cb28840b-d511-5590-8cd7-3768c25a33b4', 'fd048791-a896-5560-83f9-b906ff9556aa', 'df4ed986-ebfc-5bd7-bb8e-15fc0410a22d', '7fdf4433-a515-5ea0-95c5-9540a7ab0122', 'Sleeves Dark Poke 100 cái', 'sleeves-dark-poke-100', 'ACC-SLV-DP', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 95000, null, 76000, 'active', true, true, true, '{"material": "PP trong suốt", "card_size": "Chuẩn (63×88)", "pack_count": 100}'::jsonb, '{}'::text[], '/art/deck1.svg', 3, null, false, null, null, null, null, '2026-10-30T03:00:00+00:00'),
  ('4a262152-8a32-5508-b505-df9206d8195b', 'fd048791-a896-5560-83f9-b906ff9556aa', 'd3d0e7d0-f099-5c7f-a1c6-a8d5e695a492', 'd5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Binder Collection 9 ngăn', 'binder-collection-9-ngan', 'ACC-BND-09', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 650000, null, 520000, 'active', true, true, false, '{"material": "Da PU", "card_size": "Chuẩn (63×88)", "pack_count": 360}'::jsonb, '{}'::text[], '/art/coll2.svg', 3, null, false, null, null, null, null, '2026-10-29T21:00:00+00:00'),
  ('4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', 'fd048791-a896-5560-83f9-b906ff9556aa', 'be8fff99-0e4b-5df6-8fd0-901384c24147', 'd5b7bb0a-5c60-5c80-8eba-3e1c6ec30379', 'Hộp đựng deck 100+', 'hop-dung-deck-100', 'ACC-DBX-100', 'Hàng chính hãng, bảo quản kỹ, đóng gói chống sốc khi giao.', 'Cái', 120000, null, 96000, 'active', true, true, false, '{"material": "Nhựa mờ", "card_size": "Chuẩn (63×88)", "pack_count": 1}'::jsonb, '{}'::text[], '/art/coll3.svg', 3, null, false, null, null, null, null, '2026-10-29T15:00:00+00:00')
on conflict (id) do nothing;

insert into public.variants (id, product_id, sku, title, option_values, price, stock, active, sort) values
  ('0fad3ed9-798a-5583-8a4e-2f0f1410ff70', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', 'PKM-BB-CR-EN', 'Mặc định', '{}'::text[], null, 12, true, 0),
  ('7445a06f-e11d-5b35-bea2-5716b25e7547', 'e200ef80-36fd-56b0-a08a-10872e481441', 'PKM-ETB-CR-EN', 'Mặc định', '{}'::text[], null, 3, true, 0),
  ('d6437738-5608-524b-adf0-516fc18c666b', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', 'PKM-BP-MD-JP', 'Mặc định', '{}'::text[], null, 240, true, 0),
  ('b3eae4dc-302b-561e-bda9-41a28be13226', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', 'PKM-TIN-CR-EN', 'Mặc định', '{}'::text[], null, 0, true, 0),
  ('7fde9b6f-3f59-5a76-8aa2-eb6efe0b4047', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', 'OP-BB-12-JP', 'Mặc định', '{}'::text[], null, 8, true, 0),
  ('70136bcc-cb98-5895-a480-e1e850825905', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', 'OP-BB-13-JP', 'Mặc định', '{}'::text[], null, 0, true, 0),
  ('8c26f246-3280-5440-b278-7e8f905ecd94', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', 'RB-SD-OR-EN', 'Mặc định', '{}'::text[], null, 22, true, 0),
  ('9cf6b2ae-9517-5aa5-9a77-1ca1becabe8e', 'fae19057-6a43-5d16-b631-288dbccfe9bf', 'RB-BB-OR-EN', 'Mặc định', '{}'::text[], null, 5, true, 0),
  ('0db77e90-78c7-546a-881e-e86b40b105e6', '58470d73-5281-53b9-9fb2-628084a7bafc', 'PKM-PC-MC-EN', 'Mặc định', '{}'::text[], null, 6, true, 0),
  ('be210c69-ccbc-5e47-944f-086f395c5b35', '275bc22d-49dd-5800-94b4-72ed23d35c89', 'PKM-BNB-CR-EN', 'Mặc định', '{}'::text[], null, 14, true, 0),
  ('586c7aa8-4740-52c2-b6d5-2e3972c34b5c', 'c92a1d17-6b07-5691-b833-8c751fc6356c', 'OP-ST-21-EN', 'Mặc định', '{}'::text[], null, 18, true, 0),
  ('43df1daa-d568-55b5-80d7-d763a98d2b72', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', 'PKM-BP-CR-EN', 'Mặc định', '{}'::text[], null, 120, true, 0),
  ('7aadbcf2-b2dd-5150-b698-b7f3bda1f3a5', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', 'SGL-0101', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('1c5fcf5b-fb29-5a64-b084-df4345fa72ad', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', 'SGL-0102', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('27c806a7-6c3c-5fd3-8ac4-c9704629a8a6', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', 'SGL-0103', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('a502f803-9fa7-5d7d-829a-dd54225acacc', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', 'SGL-0104', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('39d3deee-62c7-501f-b511-73692d25d3c2', '850557ab-be27-5e97-a013-88724b30d328', 'SGL-0105', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('a6f65b31-781a-590c-a927-412f4fe5db05', '3b16fca9-4c3e-588c-ba00-b21928a997b2', 'SGL-0106', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('5c178d8a-2f55-5d56-9123-b4e4ef856474', '0668ea86-b6b1-5931-94cd-5b99154730c4', 'GRD-0001', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('7dfde197-7fd8-5079-9314-d6c0c5406a3b', 'c2a19752-5825-5365-af69-f2dc718c1bcb', 'GRD-0002', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('42523df8-c652-5e8d-b879-aa216211a156', '694eb561-ab77-52fc-9fc6-f56a8460d43b', 'GRD-0003', 'Mặc định', '{}'::text[], null, 1, true, 0),
  ('f2abae35-30bc-5e97-a144-3e090d40171e', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-1', 'Đen · Chuẩn', array['Đen','Chuẩn']::text[], 95000, 24, true, 0),
  ('994ee8a0-bd5c-577c-8228-ba60f65ac4ed', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-2', 'Đen · Nhỏ', array['Đen','Nhỏ']::text[], 85000, 12, true, 1),
  ('0437c27f-0453-5852-ae33-95a6798506c5', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-3', 'Xanh · Chuẩn', array['Xanh','Chuẩn']::text[], 95000, 28, true, 2),
  ('964a6cd5-f2cb-5a7f-aa4f-8cf7c14abcb1', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'ACC-SLV-DP-4', 'Xanh · Nhỏ', array['Xanh','Nhỏ']::text[], 85000, 0, true, 3),
  ('b6b37227-c781-50cb-9453-f39f94ca251d', '4a262152-8a32-5508-b505-df9206d8195b', 'ACC-BND-09-1', 'Đen', array['Đen']::text[], null, 12, true, 0),
  ('ec9a2063-b339-5b5a-9cc4-8bfa453ac9c6', '4a262152-8a32-5508-b505-df9206d8195b', 'ACC-BND-09-2', 'Xanh dương', array['Xanh dương']::text[], null, 8, true, 1),
  ('f0d5f94e-51a5-5551-aa7d-d8568739b39a', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', 'ACC-DBX-100', 'Mặc định', '{}'::text[], null, 30, true, 0)
on conflict (id) do nothing;

insert into public.product_images (id, product_id, url, alt, sort) values
  ('f8939720-765b-5a4b-8cad-aab6f330c230', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '/art/box1.svg', 'Booster Box Chaos Rising', 0),
  ('b8e9828d-3095-532c-a8e9-e7189713d8d7', 'bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '/art/box2.svg', 'Booster Box Chaos Rising', 1),
  ('803ad8e1-1cd4-54ad-b94b-8828d4370bce', 'e200ef80-36fd-56b0-a08a-10872e481441', '/art/etb1.svg', 'Elite Trainer Box Chaos Rising', 0),
  ('199a3dd3-fbbb-5618-b467-dc3812bb04dd', 'e200ef80-36fd-56b0-a08a-10872e481441', '/art/etb2.svg', 'Elite Trainer Box Chaos Rising', 1),
  ('7851a868-4fa6-5ff4-a783-fabe2c11b285', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', '/art/pack1.svg', 'Booster Pack Mega Dream ex JP', 0),
  ('1e303974-9021-5f0a-afef-77ae0c743043', 'ad584866-3e6e-5157-b84d-823b3fc8db0f', '/art/pack2.svg', 'Booster Pack Mega Dream ex JP', 1),
  ('673fa107-130c-5617-b6e8-0952443f839a', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '/art/tin1.svg', 'Mini Tin Chaos Rising', 0),
  ('1a01e1e4-1a68-5068-aab9-123a0507749a', '50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '/art/tin2.svg', 'Mini Tin Chaos Rising', 1),
  ('5421d64e-28aa-5a2c-aaae-41385b544009', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '/art/box2.svg', 'Booster Box OP-12', 0),
  ('960b2038-b741-5c36-9071-b684ae73b6d5', '12cd3002-6c38-5d07-acdb-1f1b7ab5caaf', '/art/box1.svg', 'Booster Box OP-12', 1),
  ('84a0ac40-a8bb-52e7-b3b3-aec453a2fb0f', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '/art/box3.svg', 'Booster Box OP-13 (Pre-order)', 0),
  ('02110c60-499b-52e6-8130-c62795ba26c3', 'eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', '/art/box1.svg', 'Booster Box OP-13 (Pre-order)', 1),
  ('0f3bb6a0-f276-5bed-bc6e-6ed386c671cc', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '/art/deck1.svg', 'Starter Deck Riftbound Origins', 0),
  ('a162052a-0d81-524c-bba9-5473a23ac875', 'a16af232-0a0d-5b5b-8368-2a9b568ff9cf', '/art/deck2.svg', 'Starter Deck Riftbound Origins', 1),
  ('cb0302ef-773c-5326-8789-e1c0f1cef077', 'fae19057-6a43-5d16-b631-288dbccfe9bf', '/art/box3.svg', 'Booster Box Riftbound Origins', 0),
  ('cf241f80-44ac-5b7c-97ed-7b0e494a3ac1', 'fae19057-6a43-5d16-b631-288dbccfe9bf', '/art/box1.svg', 'Booster Box Riftbound Origins', 1),
  ('af79c523-19d7-5d72-b3c9-b9cc6d898c53', '58470d73-5281-53b9-9fb2-628084a7bafc', '/art/coll1.svg', 'Premium Collection Mega Charizard', 0),
  ('48181fa4-c8d0-503f-95ed-e984c9453412', '58470d73-5281-53b9-9fb2-628084a7bafc', '/art/coll2.svg', 'Premium Collection Mega Charizard', 1),
  ('116436d5-445e-51e9-b2a0-164e397f2ec1', '275bc22d-49dd-5800-94b4-72ed23d35c89', '/art/deck2.svg', 'Build & Battle Box Chaos Rising', 0),
  ('1c82a79a-de0f-5718-930b-8e3cd39bc402', '275bc22d-49dd-5800-94b4-72ed23d35c89', '/art/deck1.svg', 'Build & Battle Box Chaos Rising', 1),
  ('9b16e84e-397e-51af-aaa7-794f11d6fb41', 'c92a1d17-6b07-5691-b833-8c751fc6356c', '/art/deck3.svg', 'Starter Deck ST-21 One Piece', 0),
  ('1abc998f-53d7-583a-9ad8-f67f376be928', 'c92a1d17-6b07-5691-b833-8c751fc6356c', '/art/deck1.svg', 'Starter Deck ST-21 One Piece', 1),
  ('8df572cd-72df-5f36-afbe-7e360bde3cdb', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', '/art/pack2.svg', 'Booster Pack Chaos Rising EN', 0),
  ('73eb5e79-204b-5146-b45d-89ea45702470', '5c18448e-747e-56ea-aaf1-28ba45ab23dc', '/art/pack1.svg', 'Booster Pack Chaos Rising EN', 1),
  ('dce59953-f225-594c-a9b3-032fa42a2fbc', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', '/art/card1.svg', 'Pikachu ex · Chaos Rising #063 · NM', 0),
  ('95d96b8e-4472-51b5-b5e9-7520a56efa49', 'a722cc89-b72d-59e9-a68e-30c67bc38b28', '/art/card2.svg', 'Pikachu ex · Chaos Rising #063 · NM', 1),
  ('66513347-f013-57e3-b892-ff77a2beeccc', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', '/art/card2.svg', 'Gengar · Mega Dream #112 · LP', 0),
  ('113bd9f2-ba55-5f3e-9fac-8cf391882cd8', '58b2c938-7a49-56e8-bec0-f482a08e8d1b', '/art/card1.svg', 'Gengar · Mega Dream #112 · LP', 1),
  ('90dfee59-da04-5986-bf15-a509c100293f', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', '/art/card3.svg', 'Umbreon ex · Prismatic #161 · NM', 0),
  ('5d2152a2-e110-5291-be21-2c3590c7e1b8', '98ba03a9-87e2-551f-bbed-0ad99355a8b5', '/art/card1.svg', 'Umbreon ex · Prismatic #161 · NM', 1),
  ('a9881793-81cf-5363-a188-c19dda25bafc', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '/art/card1.svg', 'Monkey D. Luffy · OP-12 #001 · NM', 0),
  ('ba2d7384-2a29-592e-9d87-fee8bceaeebb', '1ddeb587-8d49-564f-80d0-245cd5dbd7cd', '/art/card2.svg', 'Monkey D. Luffy · OP-12 #001 · NM', 1),
  ('945a77ac-9269-5e77-979a-99e7fa94f0ff', '850557ab-be27-5e97-a013-88724b30d328', '/art/card2.svg', 'Snorlax · Chaos Rising #143 · MP', 0),
  ('55ffc6f9-453f-589f-94f1-29b1d836fe5c', '850557ab-be27-5e97-a013-88724b30d328', '/art/card1.svg', 'Snorlax · Chaos Rising #143 · MP', 1),
  ('ae4aced2-5d95-528b-bb1b-0cd0dc2a695e', '3b16fca9-4c3e-588c-ba00-b21928a997b2', '/art/card3.svg', 'Jinx · Origins #030 · NM', 0),
  ('e33e83eb-f30c-54b5-a1e4-6266f485e8f9', '3b16fca9-4c3e-588c-ba00-b21928a997b2', '/art/card1.svg', 'Jinx · Origins #030 · NM', 1),
  ('85af6fd7-cfbb-50ad-a302-df749a368e31', '0668ea86-b6b1-5931-94cd-5b99154730c4', '/art/slab1.svg', 'Charizard ex · Obsidian Flames #125 · PSA 10', 0),
  ('43f78304-ddd8-529f-8204-eded20e86add', '0668ea86-b6b1-5931-94cd-5b99154730c4', '/art/slab2.svg', 'Charizard ex · Obsidian Flames #125 · PSA 10', 1),
  ('4a162001-d3d7-5030-95a6-5fb48ac5e14d', 'c2a19752-5825-5365-af69-f2dc718c1bcb', '/art/slab2.svg', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 0),
  ('f9a1bcff-5852-53d2-aa87-7fa3b41b809c', 'c2a19752-5825-5365-af69-f2dc718c1bcb', '/art/slab1.svg', 'Pikachu VMAX · Vivid Voltage #188 · BGS 9.5', 1),
  ('8c1d0877-6b71-5272-8278-19567bd80969', '694eb561-ab77-52fc-9fc6-f56a8460d43b', '/art/slab3.svg', 'Shanks · OP-01 #120 · PSA 9', 0),
  ('f9d43ffa-8fd4-589c-8c51-50c1ccb033d0', '694eb561-ab77-52fc-9fc6-f56a8460d43b', '/art/slab1.svg', 'Shanks · OP-01 #120 · PSA 9', 1),
  ('52267960-45fd-59c4-bbe1-f8fb50533bf6', 'cb28840b-d511-5590-8cd7-3768c25a33b4', '/art/deck1.svg', 'Sleeves Dark Poke 100 cái', 0),
  ('48839718-f7d8-52eb-903a-2d492da2007d', 'cb28840b-d511-5590-8cd7-3768c25a33b4', '/art/deck2.svg', 'Sleeves Dark Poke 100 cái', 1),
  ('cb8d2499-0a61-5b4a-a44c-41d18a885dbf', '4a262152-8a32-5508-b505-df9206d8195b', '/art/coll2.svg', 'Binder Collection 9 ngăn', 0),
  ('daceb784-bfab-50f9-8cef-78fee34a6ee1', '4a262152-8a32-5508-b505-df9206d8195b', '/art/coll1.svg', 'Binder Collection 9 ngăn', 1),
  ('d1d37189-6f23-5e96-a55e-f0d14e2829f4', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', '/art/coll3.svg', 'Hộp đựng deck 100+', 0),
  ('43db8890-79cf-55d9-8767-01f25cf53159', '4fc19181-5dd3-5eb8-a1ae-4b538dd439ac', '/art/coll1.svg', 'Hộp đựng deck 100+', 1)
on conflict (id) do nothing;

insert into public.product_options (id, product_id, name, values, sort) values
  ('e934ae78-93d3-5bf9-a7c1-39a35fdcc400', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'Màu sắc', array['Đen','Xanh']::text[], 0),
  ('d65d9f22-7cc5-56fb-b30b-7f14f9360ab1', 'cb28840b-d511-5590-8cd7-3768c25a33b4', 'Kích cỡ', array['Chuẩn','Nhỏ']::text[], 1),
  ('94d0a7b0-1e3b-5633-b073-152957e89f6b', '4a262152-8a32-5508-b505-df9206d8195b', 'Màu sắc', array['Đen','Xanh dương']::text[], 0)
on conflict (id) do nothing;

insert into public.product_collections (product_id, collection_id) values
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('bc381fb4-8f90-57aa-b7d9-4e9e3f0d93c5', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('e200ef80-36fd-56b0-a08a-10872e481441', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('ad584866-3e6e-5157-b84d-823b3fc8db0f', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('50f7db78-f7b6-577a-b1d0-50b268e2f7c5', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('eb6ab2f8-ec72-5fb8-937a-07d6569a4f3a', 'a105f044-b6d1-59b8-8607-1dc72ade241c'),
  ('58470d73-5281-53b9-9fb2-628084a7bafc', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('275bc22d-49dd-5800-94b4-72ed23d35c89', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('5c18448e-747e-56ea-aaf1-28ba45ab23dc', '1810dcdc-2222-5472-8287-ac66b28b66ce'),
  ('cb28840b-d511-5590-8cd7-3768c25a33b4', '588121a2-f141-5f3c-ab11-2b7e20e29810'),
  ('4a262152-8a32-5508-b505-df9206d8195b', '588121a2-f141-5f3c-ab11-2b7e20e29810')
on conflict (product_id, collection_id) do nothing;
