// =============================================
// Configuração do Supabase
// =============================================
// IMPORTANTE: Substitua os valores abaixo pelas suas credenciais do Supabase
// Encontre em: Settings > API no seu projeto Supabase

const SUPABASE_URL = 'https://ygdhuhntpqqcgzldwfif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGh1aG50cHFxY2d6bGR3ZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTg4MzUsImV4cCI6MjA5NTQ3NDgzNX0.yhB388Y5toAnQa7gsJ3izOqlmerbltZ377xP2xVX5xY';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
