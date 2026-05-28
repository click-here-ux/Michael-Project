-- =============================================
-- MedAgenda - Configuração da Base de Dados Supabase
-- =============================================
-- Execute este código no SQL Editor do Supabase
-- Aceda a: SQL Editor > New Query > Colar > Run

-- =============================================
-- 1. CRIAR TABELAS
-- =============================================

-- Tabela de Utilizadores
CREATE TABLE IF NOT EXISTS utilizadores (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Médicos
CREATE TABLE IF NOT EXISTS medicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    foto_url TEXT,
    senha TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Consultas
CREATE TABLE IF NOT EXISTS consultas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    utilizador_id UUID REFERENCES utilizadores(id) ON DELETE CASCADE NOT NULL,
    medico_id UUID REFERENCES medicos(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Geral', 'Especialidade', 'Urgência', 'Exame')),
    estado TEXT NOT NULL DEFAULT 'agendada' CHECK (estado IN ('agendada', 'cancelada', 'concluída')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE utilizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. CRIAR POLÍTICAS DE SEGURANÇA
-- =============================================

-- Políticas para utilizadores
CREATE POLICY "Utilizadores podem ver o próprio perfil"
    ON utilizadores FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Utilizadores podem atualizar o próprio perfil"
    ON utilizadores FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Utilizadores podem inserir o próprio perfil"
    ON utilizadores FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para médicos (todos podem ver)
CREATE POLICY "Todos podem ver médicos"
    ON medicos FOR SELECT
    USING (true);

-- Políticas para consultas
-- Nota: médicos acedem via painel admin (sessão), pacientes via auth
CREATE POLICY "Todos podem ver consultas"
    ON consultas FOR SELECT
    USING (true);

CREATE POLICY "Utilizadores autenticados podem criar consultas"
    ON consultas FOR INSERT
    WITH CHECK (auth.uid() = utilizador_id);

CREATE POLICY "Todos podem atualizar consultas"
    ON consultas FOR UPDATE
    USING (true);

CREATE POLICY "Utilizadores podem eliminar as próprias consultas"
    ON consultas FOR DELETE
    USING (auth.uid() = utilizador_id);

-- =============================================
-- 4. STORAGE PARA FOTOS DOS MÉDICOS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-medicos', 'fotos-medicos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Fotos públicas" ON storage.objects
    FOR SELECT USING (bucket_id = 'fotos-medicos');

CREATE POLICY "Médicos podem fazer upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'fotos-medicos');

CREATE POLICY "Médicos podem atualizar fotos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'fotos-medicos');

-- =============================================
-- 5. INSERIR DADOS DE EXEMPLO (MÉDICOS)
-- =============================================

INSERT INTO medicos (nome, especialidade, foto_url, senha) VALUES
    ('Sara Mabote', 'Medicina Geral', 'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=200&h=200&fit=crop&crop=face', '1234'),
    ('Nelson Nhantumbo', 'Cardiologia', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face', '1234'),
    ('Julius Bola', 'Dermatologia', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face', '1234');

-- =============================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_consultas_utilizador ON consultas(utilizador_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data);
CREATE INDEX IF NOT EXISTS idx_consultas_estado ON consultas(estado);

-- =============================================
-- 6. CRIAR FUNÇÃO PARA AUTO-CRIAR PERFIL
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.utilizadores (id, nome, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente ao registar
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- CONFIGURAÇÃO COMPLETA!
-- =============================================
-- Agora precisa de:
-- 1. Copiar a URL do projeto (Settings > API > Project URL)
-- 2. Copiar a anon key (Settings > API > anon public)
-- 3. Atualizar o ficheiro js/supabase-config.js com estes valores
-- =============================================
