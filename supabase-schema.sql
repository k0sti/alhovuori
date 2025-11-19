-- Create the survey_responses table in Supabase
-- Run this in your Supabase SQL Editor

create table if not exists survey_responses (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now(),
  data jsonb not null
);

-- Enable Row Level Security (RLS)
alter table survey_responses enable row level security;

-- Create policy to allow anyone to insert responses (anonymous submissions)
create policy "Anyone can submit responses"
  on survey_responses
  for insert
  with check (true);

-- Create policy to allow anyone to read responses (view results)
create policy "Anyone can view responses"
  on survey_responses
  for select
  using (true);

-- Create policy to allow anyone to delete responses (for the clear button)
create policy "Anyone can delete responses"
  on survey_responses
  for delete
  using (true);

-- Create an index on created_at for faster sorting
create index if not exists survey_responses_created_at_idx
  on survey_responses (created_at desc);

-- Optional: Add a comment to document the table
comment on table survey_responses is 'Stores survey form responses with JSONB data';
