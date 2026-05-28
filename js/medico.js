// =============================================
// Lógica da Área do Médico
// =============================================

let medicoAtualId = null;
let consultaParaResponder = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarMedicosLogin();

    // Verificar sessão
    const medicoId = sessionStorage.getItem('medico_id');
    const medicoNome = sessionStorage.getItem('medico_nome');
    if (medicoId && medicoNome) {
        medicoAtualId = medicoId;
        mostrarDashboard(medicoId, medicoNome);
    }

    // Login
    const formLogin = document.getElementById('formLoginMedico');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogoutMedico');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('medico_id');
            sessionStorage.removeItem('medico_nome');
            window.location.reload();
        });
    }

    // Upload foto
    const uploadFoto = document.getElementById('uploadFoto');
    if (uploadFoto) {
        uploadFoto.addEventListener('change', handleFotoUpload);
    }

    // Perfil form
    const formPerfil = document.getElementById('formPerfilMedico');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPerfilMedico();
        });

        // Preview ao colar URL
        const fotoUrl = document.getElementById('editFotoUrl');
        if (fotoUrl) {
            fotoUrl.addEventListener('input', () => {
                const url = fotoUrl.value.trim();
                if (url) document.getElementById('previewFoto').src = url;
            });
        }
    }

    // Confirmar resposta
    const btnConfirmar = document.getElementById('btnConfirmarResposta');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarResposta);
    }
});

// ========== LOGIN ==========

async function carregarMedicosLogin() {
    try {
        const { data: medicos, error } = await supabaseClient
            .from('medicos')
            .select('*')
            .order('nome');

        if (error) throw error;

        const select = document.getElementById('selectMedicoLogin');
        if (medicos && medicos.length > 0) {
            medicos.forEach(m => {
                select.innerHTML += `<option value="${m.id}">${m.nome} — ${m.especialidade}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
    }
}

async function handleLogin() {
    const medicoId = document.getElementById('selectMedicoLogin').value;
    const senha = document.getElementById('inputSenha').value;
    const errorDiv = document.getElementById('loginMedicoError');

    try {
        errorDiv.classList.add('d-none');

        if (!medicoId || !senha) {
            throw new Error('Por favor, preencha todos os campos.');
        }

        const { data, error } = await supabaseClient
            .from('medicos')
            .select('id, nome, senha')
            .eq('id', medicoId)
            .single();

        if (error) throw error;
        if (!data.senha || data.senha !== senha) {
            throw new Error('Senha incorreta.');
        }

        sessionStorage.setItem('medico_id', data.id);
        sessionStorage.setItem('medico_nome', data.nome);
        medicoAtualId = data.id;

        mostrarDashboard(data.id, data.nome);

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

// ========== DASHBOARD ==========

async function mostrarDashboard(medicoId, medicoNome) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('navMedico').style.display = 'flex';
    document.getElementById('medicoName').textContent = medicoNome;

    await carregarDadosMedico(medicoId);
    await carregarPerfilMedico(medicoId);

    // Filtros
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await carregarConsultasMedico(medicoId, btn.dataset.filter);
        });
    });
}

async function carregarDadosMedico(medicoId) {
    await carregarEstatisticasMedico(medicoId);
    await carregarConsultasMedico(medicoId, 'todas');
}

async function carregarEstatisticasMedico(medicoId) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabaseClient
            .from('consultas')
            .select('estado, data')
            .eq('medico_id', medicoId);

        if (error) throw error;

        let hoje = 0, proximas = 0, total = 0;
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

// ========== CONSULTAS ==========

async function carregarConsultasMedico(medicoId, filtro) {
    const container = document.getElementById('consultasMedicoList');
    const spinner = document.getElementById('loadingMedico');

    try {
        if (spinner) spinner.style.display = 'block';
        container.innerHTML = '';

        const today = new Date().toISOString().split('T')[0];

        const { data: consultas, error } = await supabaseClient
            .from('consultas')
            .select(`*, utilizadores:utilizador_id (nome, email, telefone)`)
            .eq('medico_id', medicoId)
            .order('data', { ascending: true })
            .order('hora', { ascending: true });

        if (error) throw error;

        let filtradas = consultas || [];

        if (filtro === 'hoje') filtradas = filtradas.filter(c => c.data === today);
        else if (filtro === 'agendada') filtradas = filtradas.filter(c => c.estado === 'agendada');
        else if (filtro === 'concluída') filtradas = filtradas.filter(c => c.estado === 'concluída');
        else if (filtro === 'cancelada') filtradas = filtradas.filter(c => c.estado === 'cancelada');

        if (filtradas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5" style="color:var(--text-muted);">
                    <i class="bi bi-calendar-x" style="font-size:2.5rem;"></i>
                    <p class="mt-2">Nenhuma consulta encontrada</p>
                </div>
            `;
            if (spinner) spinner.style.display = 'none';
            return;
        }

        // Renderizar como cards
        let html = '<div class="row g-3">';
        filtradas.forEach(c => {
            const estadoClass = getEstadoClass(c.estado);
            const dataFormatada = formatDate(c.data);
            const hora = c.hora?.substring(0, 5);
            const paciente = c.utilizadores;
            const isAgendada = c.estado === 'agendada';

            html += `
                <div class="col-md-6">
                    <div class="card h-100" style="border-left: 3px solid ${getEstadoCor(c.estado)};">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="fw-bold mb-1">${paciente?.nome || 'N/A'}</h6>
                                    <span class="badge ${estadoClass}">${capitalizeFirst(c.estado)}</span>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold" style="color:var(--primary);">${dataFormatada}</div>
                                    <small style="color:var(--text-muted);">${hora}</small>
                                </div>
                            </div>
                            <div class="mb-2" style="font-size:0.85rem;color:var(--text-secondary);">
                                <div class="mb-1"><i class="bi bi-envelope me-2"></i>${paciente?.email || 'N/A'}</div>
                                <div class="mb-1"><i class="bi bi-telephone me-2"></i>${paciente?.telefone || 'N/A'}</div>
                                <div><i class="bi bi-clipboard-pulse me-2"></i>${c.tipo}</div>
                            </div>
                            ${c.notas ? `<div class="mb-2 p-2" style="background:var(--bg-input);border-radius:0.4rem;font-size:0.82rem;color:var(--text-muted);"><i class="bi bi-journal-text me-1"></i>${c.notas}</div>` : ''}
                            ${isAgendada ? `
                                <div class="d-flex gap-2 mt-2">
                                    <button class="btn btn-sm btn-primary flex-grow-1" onclick="abrirResponder('${c.id}', '${paciente?.nome || ''}', '${dataFormatada}', '${hora}', '${c.tipo}', '${c.notas || ''}')">
                                        <i class="bi bi-chat-dots me-1"></i>Responder
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="cancelarRapido('${c.id}')">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Erro ao carregar consultas:', error);
        container.innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-triangle" style="font-size:2rem;"></i>
                <p class="mt-2">Erro ao carregar consultas</p>
            </div>
        `;
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

// ========== RESPONDER À CONSULTA ==========

window.abrirResponder = function(id, nome, data, hora, tipo, notas) {
    consultaParaResponder = id;
    const info = document.getElementById('responderInfo');
    info.innerHTML = `
        <div class="fw-bold mb-1">${nome}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);">
            <i class="bi bi-calendar me-1"></i>${data} às ${hora} — ${tipo}
        </div>
        ${notas ? `<div class="mt-1" style="font-size:0.82rem;color:var(--text-dim);"><i class="bi bi-journal-text me-1"></i>${notas}</div>` : ''}
    `;
    document.getElementById('responderEstado').value = 'concluída';
    document.getElementById('responderNotas').value = '';
    new bootstrap.Modal(document.getElementById('responderModal')).show();
};

async function confirmarResposta() {
    if (!consultaParaResponder) return;

    const estado = document.getElementById('responderEstado').value;
    const notas = document.getElementById('responderNotas').value.trim();

    try {
        const updates = { estado };
        if (notas) updates.notas = notas;

        const { error } = await supabaseClient
            .from('consultas')
            .update(updates)
            .eq('id', consultaParaResponder);

        if (error) throw error;

        bootstrap.Modal.getInstance(document.getElementById('responderModal')).hide();
        await carregarDadosMedico(medicoAtualId);

    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

window.cancelarRapido = async function(id) {
    if (!confirm('Cancelar esta consulta?')) return;

    try {
        const { error } = await supabaseClient
            .from('consultas')
            .update({ estado: 'cancelada' })
            .eq('id', id);

        if (error) throw error;
        await carregarDadosMedico(medicoAtualId);
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

// ========== PERFIL ==========

async function carregarPerfilMedico(medicoId) {
    try {
        const { data, error } = await supabaseClient
            .from('medicos')
            .select('*')
            .eq('id', medicoId)
            .single();

        if (error) throw error;

        document.getElementById('editNomeMedico').value = data.nome || '';
        document.getElementById('editFotoUrl').value = data.foto_url || '';
        if (data.foto_url) {
            document.getElementById('previewFoto').src = data.foto_url;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

async function handleFotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${medicoAtualId}.${fileExt}`;

        // Upload para Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('fotos-medicos')
            .upload(fileName, file, { upsert: true });

        if (error) throw error;

        // Obter URL pública
        const { data: urlData } = supabaseClient.storage
            .from('fotos-medicos')
            .getPublicUrl(fileName);

        const fotoUrl = urlData.publicUrl;

        // Atualizar preview e campo hidden
        document.getElementById('previewFoto').src = fotoUrl;
        document.getElementById('editFotoUrl').value = fotoUrl;

        // Guardar automaticamente na base de dados
        await supabaseClient
            .from('medicos')
            .update({ foto_url: fotoUrl })
            .eq('id', medicoAtualId);

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload: ' + error.message);
    }
}

async function guardarPerfilMedico() {
    const nome = document.getElementById('editNomeMedico').value.trim();
    const fotoUrl = document.getElementById('editFotoUrl').value.trim();
    const senha = document.getElementById('editSenhaMedico').value;
    const errorDiv = document.getElementById('perfilMedicoError');
    const successDiv = document.getElementById('perfilMedicoSuccess');

    try {
        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');

        if (!nome) throw new Error('O nome é obrigatório.');

        const updates = { nome, foto_url: fotoUrl };
        if (senha) updates.senha = senha;

        const { error } = await supabaseClient
            .from('medicos')
            .update(updates)
            .eq('id', medicoAtualId);

        if (error) throw error;

        document.getElementById('medicoName').textContent = nome;
        sessionStorage.setItem('medico_nome', nome);
        document.getElementById('editSenhaMedico').value = '';

        successDiv.textContent = 'Perfil atualizado com sucesso!';
        successDiv.classList.remove('d-none');

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

// ========== HELPERS ==========

function getEstadoClass(estado) {
    switch (estado) {
        case 'agendada': return 'badge-agendada';
        case 'cancelada': return 'badge-cancelada';
        case 'concluída': return 'badge-concluida';
        default: return '';
    }
}

function getEstadoCor(estado) {
    switch (estado) {
        case 'agendada': return 'var(--primary)';
        case 'cancelada': return 'var(--danger)';
        case 'concluída': return 'var(--success)';
        default: return 'var(--border)';
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
