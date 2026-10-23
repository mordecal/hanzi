// Возьмите эти значения в Supabase: Project Settings → API.
// SUPABASE_ANON_KEY — это публичный ключ, его можно спокойно светить
// в клиентском коде: реальная защита данных обеспечивается Row Level
// Security-политиками в schema.sql, а не секретностью этого ключа.

const SUPABASE_URL = 'https://zzuzaqnactnfuamkhrkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dXphcW5hY3RuZnVhbWtocmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjQwNDksImV4cCI6MjEwODMwMDA0OX0.HcuCIP6xvMd6o2kBmY2FH3xAuvh3I0yMXMkdLb3CbcU';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
