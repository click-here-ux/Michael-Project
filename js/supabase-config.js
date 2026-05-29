// =============================================
// Configuração do Supabase
// =============================================
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Supabase
// Encontre em: Settings > API no seu projeto Supabase

const SUPABASE_URL = 'https://ygdhuhntpqqcgzldwfif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGh1aG50cHFxY2d6bGR3ZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTg4MzUsImV4cCI6MjA5NTQ3NDgzNX0.yhB388Y5toAnQa7gsJ3izOqlmerbltZ377xP2xVX5xY';

// Inicializar o cliente Supabase
if (typeof supabase === 'undefined') {
    console.error('Supabase CDN não carregou. Verifica a tua ligação à internet.');
    document.body.innerHTML = '<div style="text-align:center;padding:2rem;color:#f87171;"><h2>Erro de ligação</h2><p>Não foi possível carregar os serviços. Verifica a tua ligação à internet e recarrega a página.</p><button onclick="location.reload()" style="padding:0.5rem 1rem;border:none;border-radius:8px;background:#6366f1;color:#fff;cursor:pointer;">Recarregar</button></div>';
} else {
    var { createClient } = supabase;
    var supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
