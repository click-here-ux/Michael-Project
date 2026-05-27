// =============================================
// Configuração do Supabase
// =============================================
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Supabase
// Encontre em: Settings > API no seu projeto Supabase

const SUPABASE_URL = 'https://ygdhuhntpqqcgzldwfif.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sUybwt2rbLY0P6snoT7fIA_vU9ymq35';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
