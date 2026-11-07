-- (Tùy chọn) Tự hủy đơn quá hạn chuyển khoản mỗi 15 phút bằng pg_cron của Supabase.
-- Bật extension pg_cron trong Dashboard > Database > Extensions trước khi chạy.
select cron.schedule('dark-poke-cancel-expired', '*/15 * * * *', $$select public.cancel_expired_orders()$$);
-- Gỡ lịch: select cron.unschedule('dark-poke-cancel-expired');
