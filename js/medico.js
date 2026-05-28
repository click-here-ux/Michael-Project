// =============================================
// Lógica da Área do Médico
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar médicos no select de login
    await carregarMedicosLogin();

    // Verificar se já está logado
    const medicoId = sessionStorage.getItem('medico_id');
    const medicoNome = sessionStorage.getItem('medico_nome');
    if (medicoId && medicoNome) {
        mostrarDashboard(medicoId, medicoNome);
    }

    // Formulário de login
    const formLogin = document.getElementById('formLoginMedico');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    // Botão de logout
    const btnLogout = document.getElementById('btnLogoutMedico');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('medico_id');
            sessionStorage.removeItem('medico_nome');
            window.location.reload();
        });
    }
});

// Carregar médicos no select de login
async function carregarMedicosLogin() {
    try {
        const medicos = await getMedicos();
        const select = document.getElementById('selectMedicoLogin');
        medicos.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${m.nome} - ${m.especialidade}</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
    }
}

// Processar login do médico
async function handleLogin() {
    const medicoId = document.getElementById('selectMedicoLogin').value;
    const senha = document.getElementById('inputSenha').value;
    const errorDiv = document.getElementById('loginMedicoError');

    try {
        errorDiv.classList.add('d-none');

        if (!medicoId || !senha) {
            throw new Error('Por favor, preencha todos os campos.');
        }

        // Verificar senha na tabela medicos
        const { data, error } = await supabaseClient
            .from('medicos')
            .select('id, nome, senha')
            .eq('id', medicoId)
            .single();

        if (error) throw error;

        if (!data.senha || data.senha !== senha) {
            throw new Error('Senha incorreta.');
        }

        // Guardar sessão
        sessionStorage.setItem('medico_id', data.id);
        sessionStorage.setItem('medico_nome', data.nome);

        mostrarDashboard(data.id, data.nome);

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

// Mostrar dashboard do médico
async function mostrarDashboard(medicoId, medicoNome) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('navMedico').style.display = 'flex';
    document.getElementById('medicoName').textContent = medicoNome;

    // Carregar dados
    await carregarDadosMedico(medicoId);

    // Filtros
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await carregarConsultasMedico(medicoId, btn.dataset.filter);
        });
    });
}

// Carregar dados do médico
async function carregarDadosMedico(medicoId) {
    await carregarEstatisticasMedico(medicoId);
    await carregarConsultasMedico(medicoId, 'todas');
}

// Carregar estatísticas
async function carregarEstatisticasMedico(medicoId) {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseClient
            .from('consultas')
            .select('estado, data')
            .eq('medico_id', medicoId);

        if (error) throw error;

        let hoje = 0;
        let proximas = 0;
        let total = 0;

        data.forEach(c => {
            total++;
            if (c.data === today) hoje++;
            if (c.estado === 'agendada' && c.data >= today) proximas++;
        });

        document.getElementById('statHoje').textContent = hoje;
        document.getElementById('statProximas').textContent = proximas;
        document.getElementById('statTotal').textContent = total;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar consultas do médico
async function carregarConsultasMedico(medicoId, filtro) {
    const tableBody = document.getElementById('consultasMedicoTable');
    const spinner = document.getElementById('loadingMedico');

    try {
        if (spinner) spinner.style.display = 'block';
        tableBody.innerHTML = '';

        const today = new Date().toISOString().split('T')[0];

        let query = supabaseClient
            .from('consultas')
            .select(`
                *,
                utilizadores:utilizador_id (nome, email, telefone)
            `)
            .eq('medico_id', medicoId)
            .order('data', { ascending: true })
            .order('hora', { ascending: true });

        const { data: consultas, error } = await query;
        if (error) throw error;

        let filtradas = consultas || [];

        if (filtro === 'hoje') {
            filtradas = filtradas.filter(c => c.data === today);
        } else if (filtro === 'agendada') {
            filtradas = filtradas.filter(c => c.estado === 'agendada');
        } else if (filtro === 'concluída') {
            filtradas = filtradas.filter(c => c.estado === 'concluída');
        }

        if (filtradas.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5" style="color:var(--gray-500);">
                        <i class="bi bi-calendar-x fs-1 d-block mb-2"></i>
                        Nenhuma consulta encontrada
                    </td>
                </tr>
            `;
            if (spinner) spinner.style.display = 'none';
            return;
        }

        filtradas.forEach(consulta => {
            const estadoClass = getEstadoClass(consulta.estado);
            const dataFormatada = formatDate(consulta.data);
            const isPassado = consulta.data < today;
            const isAgendada = consulta.estado === 'agendada';

            tableBody.innerHTML += `
                <tr>
                    <td><div class="fw-semibold">${consulta.utilizadores?.nome || 'N/A'}</div></td>
                    <td>${consulta.utilizadores?.email || 'N/A'}</td>
                    <td>${consulta.utilizadores?.telefone || '-'}</td>
                    <td>${dataFormatada}</td>
                    <td>${consulta.hora?.substring(0, 5)}</td>
                    <td>${consulta.tipo}</td>
                    <td><span class="badge ${estadoClass}">${capitalizeFirst(consulta.estado)}</span></td>
                    <td>
                        ${isAgendada ? `
                            <button class="btn btn-action btn-outline-success btn-sm" onclick="marcarConcluida('${consulta.id}', '${medicoId}')" title="Marcar como concluída">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        });

        // Guardar para referência
        window._consultasMedico = filtradas;

    } catch (error) {
        console.error('Erro ao carregar consultas:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                    Erro ao carregar consultas
                </td>
            </tr>
        `;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

// Marcar consulta como concluída
window.marcarConcluida = async function(id, medicoId) {
    if (!confirm('Marcar esta consulta como concluída?')) return;

    try {
        const { error } = await supabaseClient
            .from('consultas')
            .update({ estado: 'concluída' })
            .eq('id', id);

        if (error) throw error;

        await carregarDadosMedico(medicoId);
    } catch (error) {
        alert('Erro ao atualizar consulta: ' + error.message);
    }
};

// Funções auxiliares
function getEstadoClass(estado) {
    switch (estado) {
        case 'agendada': return 'badge-agendada';
        case 'cancelada': return 'badge-cancelada';
        case 'concluída': return 'badge-concluida';
        default: return 'bg-secondary';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
