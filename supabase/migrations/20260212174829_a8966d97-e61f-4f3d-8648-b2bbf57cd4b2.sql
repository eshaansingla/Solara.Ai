
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'technician');

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'analyst',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Sensor data
CREATE TABLE public.sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  temperature DOUBLE PRECISION,
  irradiance DOUBLE PRECISION,
  output_efficiency DOUBLE PRECISION,
  vibration DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  failure_probability DOUBLE PRECISION,
  remaining_useful_life DOUBLE PRECISION,
  confidence DOUBLE PRECISION,
  feature_importance JSONB,
  prediction_type TEXT DEFAULT 'sensor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  sensor_type TEXT,
  value DOUBLE PRECISION,
  threshold DOUBLE PRECISION,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Maintenance plans
CREATE TABLE public.maintenance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  estimated_cost DOUBLE PRECISION,
  estimated_savings DOUBLE PRECISION,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- sensor_data
CREATE POLICY "Users can view own sensor data" ON public.sensor_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sensor data" ON public.sensor_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- predictions
CREATE POLICY "Users can view own predictions" ON public.predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- alerts
CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- maintenance_plans
CREATE POLICY "Users can view own plans" ON public.maintenance_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.maintenance_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.maintenance_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'analyst');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;
