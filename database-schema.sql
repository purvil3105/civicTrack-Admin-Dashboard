-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.issues (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT issues_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  image_url text,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending'::text,
  latitude double precision,
  longitude double precision,
  upvote_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  user_has_upvoted boolean DEFAULT false,
  upvoted_by ARRAY DEFAULT '{}'::text[],
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports_data (
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  image_url text,
  user_id uuid NOT NULL,
  status text NOT NULL
);
CREATE TABLE public.report_upvotes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  report_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT report_upvotes_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id),
  CONSTRAINT report_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);