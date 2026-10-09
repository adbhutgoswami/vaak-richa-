-- Supabase > SQL Editor में पूरा चलाएँ
create table profiles(id uuid primary key references auth.users on delete cascade, name text, is_editor boolean default false);
create table posts(id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, author_name text not null,
 author_id uuid references auth.users, category text not null, body text not null, bio text, image_url text,
 published boolean default true, featured boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table comments(id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, name text not null check(char_length(name)<=60),
 body text not null check(char_length(body)<=1000), created_at timestamptz default now());
create table likes(post_id uuid references posts on delete cascade, user_id uuid references auth.users, primary key(post_id,user_id));
create function is_editor() returns boolean language sql security definer as $$ select coalesce((select is_editor from profiles where id=auth.uid()),false) $$;
create function handle_new_user() returns trigger language plpgsql security definer as $$ begin insert into profiles(id,name) values(new.id,split_part(new.email,'@',1)); return new; end $$;
create trigger on_auth_user after insert on auth.users for each row execute function handle_new_user();
alter table profiles enable row level security; alter table posts enable row level security; alter table comments enable row level security; alter table likes enable row level security;
create policy "p_read" on profiles for select using(id=auth.uid());
create policy "posts_read" on posts for select using(published or author_id=auth.uid() or is_editor());
create policy "posts_ins" on posts for insert with check(auth.uid()=author_id and (category<>'संपादकीय' or is_editor()) and featured=false);
create policy "posts_upd" on posts for update using(author_id=auth.uid() or is_editor()) with check(author_id=auth.uid() or is_editor());
create policy "posts_del" on posts for delete using(is_editor());
create policy "c_read" on comments for select using(true);
create policy "c_ins" on comments for insert with check(true);
create policy "c_del" on comments for delete using(is_editor());
create policy "l_read" on likes for select using(true);
create policy "l_ins" on likes for insert with check(user_id=auth.uid());
create policy "l_del" on likes for delete using(user_id=auth.uid());
-- सामान्य लेखक featured/published खुद नहीं बदल सके:
create function guard_post() returns trigger language plpgsql as $$ begin
 if not is_editor() then new.featured:=old.featured; new.published:=old.published; new.author_id:=old.author_id; new.slug:=old.slug; end if;
 new.updated_at:=now(); return new; end $$;
create trigger guard before update on posts for each row execute function guard_post();
-- फोटो के लिए: Storage में 'images' नाम का Public bucket बनाएँ, फिर:
create policy "img_up" on storage.objects for insert to authenticated with check(bucket_id='images');
create policy "img_rd" on storage.objects for select using(bucket_id='images');
-- संपादक बनाने के लिए (अपना ईमेल डालकर, पहले साइट पर खाता बना लें):
-- update profiles set is_editor=true where id=(select id from auth.users where email='आपका@ईमेल');
