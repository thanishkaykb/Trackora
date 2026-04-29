
-- 1. Add role to profiles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('seller', 'receiver');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Trigger to auto-create profile on signup (function already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Touch updated_at on profiles
DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Extend shipments
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS item_name text NOT NULL DEFAULT 'Package',
  ADD COLUMN IF NOT EXISTS shop text NOT NULL DEFAULT 'Unknown shop',
  ADD COLUMN IF NOT EXISTS recipient_name text NOT NULL DEFAULT 'Recipient',
  ADD COLUMN IF NOT EXISTS recipient_address text,
  ADD COLUMN IF NOT EXISTS amount_due numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS segment_progress numeric NOT NULL DEFAULT 0;

-- Touch updated_at on shipments
DROP TRIGGER IF EXISTS shipments_touch_updated_at ON public.shipments;
CREATE TRIGGER shipments_touch_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Public lookup policy (by tracking_id) — anyone (including anon) can SELECT
DROP POLICY IF EXISTS "Public can lookup by tracking id" ON public.shipments;
CREATE POLICY "Public can lookup by tracking id"
ON public.shipments
FOR SELECT
TO anon, authenticated
USING (true);

-- Keep an index for fast tracking_id lookups
CREATE INDEX IF NOT EXISTS shipments_tracking_id_idx ON public.shipments (tracking_id);
CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_id_uniq ON public.shipments (tracking_id);
