-- Kho ảnh: ảnh sản phẩm (công khai) và ảnh chuyển khoản của khách (riêng tư).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Ảnh sản phẩm: ai cũng xem (bucket public), quản lý được tải lên, sửa, xóa.
create policy "products_images_manager_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_manager()));
create policy "products_images_manager_update" on storage.objects for update to authenticated
  using (bucket_id = 'products' and (select public.is_manager()));
create policy "products_images_manager_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select public.is_manager()));

-- Ảnh chuyển khoản: chỉ nhân viên xem. Khách tải lên qua server (service role) sau khi kiểm tra mã đơn + token.
create policy "payment_proofs_staff_select" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_staff()));
