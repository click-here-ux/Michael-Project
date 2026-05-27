// =============================================
// Configuração do Supabase
// =============================================
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Supabase
// Encontre em: Settings > API no seu projeto Supabase

const SUPABASE_URL = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
