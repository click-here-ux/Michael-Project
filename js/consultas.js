// =============================================
// Módulo de Consultas (CRUD)
// =============================================

// Buscar todas as consultas do utilizador
async function getConsultas(userId, filtro = 'todas') {
    let query = supabase
        .from('consultas')
        .select(`
            *,
            medicos:medico_id (id, nome, especialidade)
        `)
        .eq('utilizador_id', userId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

    if (filtro !== 'todas') {
        query = query.eq('estado', filtro);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// Buscar médicos disponíveis
async function getMedicos() {
    const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nome');

    if (error) throw error;
    return data || [];
}

// Criar nova consulta
async function criarConsulta(consulta) {
    const { data, error } = await supabase
        .from('consultas')
        .insert([consulta])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Atualizar consulta
async function atualizarConsulta(id, updates) {
    const { data, error } = await supabase
        .from('consultas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Cancelar consulta
async function cancelarConsulta(id) {
    const { data, error } = await supabase
        .from('consultas')
        .update({ estado: 'cancelada' })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Verificar se já existe consulta no mesmo dia/hora/médico
async function verificarConflito(medicoId, data, hora, excluirId = null) {
    let query = supabase
        .from('consultas')
        .select('id')
        .eq('medico_id', medicoId)
        .eq('data', data)
        .eq('hora', hora)
        .eq('estado', 'agendada');

    if (excluirId) {
        query = query.neq('id', excluirId);
    }

    const { data: existing, error } = await query;
    if (error) throw error;
    return existing && existing.length > 0;
}

// Estatísticas do utilizador
async function getEstatisticas(userId) {
    const { data, error } = await supabase
        .from('consultas')
        .select('estado')
        .eq('utilizador_id', userId);

    if (error) throw error;

    const stats = {
        agendadas: 0,
        concluidas: 0,
        canceladas: 0
    };

    data.forEach(c => {
        if (c.estado === 'agendada') stats.agendadas++;
        else if (c.estado === 'concluída') stats.concluidas++;
        else if (c.estado === 'cancelada') stats.canceladas++;
    });

    return stats;
}
