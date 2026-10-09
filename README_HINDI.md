# वाक्-ऋचा — सेटअप (सरल हिंदी)
1. **Supabase** (supabase.com) पर नया Project बनाएँ। SQL Editor में `supabase.sql` पूरा चलाएँ।
2. Storage → New bucket → नाम `images`, **Public** चुनें। (SQL में इसकी policy पहले से है।)
3. Authentication → Providers → Email चालू रखें। Settings → API से **Project URL** और **anon public key** लें (service_role key कभी न डालें)।
4. साइट पर अपना खाता बनाएँ, फिर SQL Editor में अंतिम टिप्पणी वाली `update profiles ...` पंक्ति (अपना ईमेल डालकर) चलाएँ — आप संपादक बन जाएँगे।
5. यह फ़ोल्डर GitHub Repository में अपलोड करें (`.env` अपलोड न करें)।
6. **Netlify** → Add new site → Import from GitHub। Build command `npm run build`, Publish directory `dist` (netlify.toml में पहले से है)।
7. Netlify → Site settings → Environment variables में `VITE_SUPABASE_URL` और `VITE_SUPABASE_ANON_KEY` जोड़ें, फिर दोबारा Deploy करें।
8. Supabase → Authentication → URL Configuration में अपनी Netlify साइट का URL डालें।
स्थानीय परीक्षण: `.env.example` को `.env` नाम से कॉपी करें, `npm install`, `npm run dev`।
