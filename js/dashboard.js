// =============================================
// Lógica do Dashboard
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const session = await checkAuth();
    if (!session) return;

    const userId = session.user.id;
    let filtroAtual = 'todas';
    let consultaParaCancelar = null;

    // Carregar dados iniciais
    await carregarDados();

    // Filtros
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAtual = btn.dataset.filter;
            await carregarConsultas();
        });
    });

    // Carregar médicos para o modal de edição
    const medicos = await getMedicos();
    const editMedicoSelect = document.getElementById('editMedico');
    if (editMedicoSelect) {
        medicos.forEach(m => {
            editMedicoSelect.innerHTML += `<option value="${m.id}">${m.nome} - ${m.especialidade}</option>`;
        });
    }

    // Guardar edição
    const btnSaveEdit = document.getElementById('btnSaveEdit');
    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', async () => {
            const id = document.getElementById('editId').value;
            const medicoId = document.getElementById('editMedico').value;
            const data = document.getElementById('editData').value;
            const hora = document.getElementById('editHora').value;
            const tipo = document.getElementById('editTipo').value;
            const notas = document.getElementById('editNotas').value;

            try {
                // Verificar conflito
                const conflito = await verificarConflito(medicoId, data, hora, id);
                if (conflito) {
                    alert('Já existe uma consulta agendada para este médico nesta data e hora.');
                    return;
                }

                await atualizarConsulta(id, {
                    medico_id: medicoId,
                    data: data,
                    hora: hora,
                    tipo: tipo,
                    notas: notas
                });

                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                await carregarDados();
            } catch (error) {
                alert('Erro ao atualizar consulta: ' + error.message);
            }
        });
    }

    // Confirmar cancelamento
    const btnConfirmCancel = document.getElementById('btnConfirmCancel');
    if (btnConfirmCancel) {
        btnConfirmCancel.addEventListener('click', async () => {
            if (!consultaParaCancelar) return;

            try {
                await cancelarConsulta(consultaParaCancelar);
                bootstrap.Modal.getInstance(document.getElementById('cancelModal')).hide();
                consultaParaCancelar = null;
                await carregarDados();
            } catch (error) {
                alert('Erro ao cancelar consulta: ' + error.message);
            }
        });
    }

    // Carregar todos os dados
    async function carregarDados() {
        await carregarEstatisticas();
        await carregarConsultas();
    }

    // Carregar estatísticas
    async function carregarEstatisticas() {
        try {
            const stats = await getEstatisticas(userId);
            document.getElementById('statAgendadas').textContent = stats.agendadas;
            document.getElementById('statConcluidas').textContent = stats.concluidas;
            document.getElementById('statCanceladas').textContent = stats.canceladas;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Carregar consultas
    async function carregarConsultas() {
        const tableBody = document.getElementById('consultasTable');
        const spinner = document.getElementById('loadingSpinner');

        try {
            spinner.style.display = 'block';
            tableBody.innerHTML = '';

            const consultas = await getConsultas(userId, filtroAtual);

            if (consultas.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-muted">
                            <i class="bi bi-calendar-x fs-1 d-block mb-2"></i>
                            ${filtroAtual === 'todas' ? 'Ainda não tem consultas agendadas' : 'Nenhuma consulta encontrada'}
                        </td>
                    </tr>
                `;
                spinner.style.display = 'none';
                return;
            }

            consultas.forEach(consulta => {
                const estadoClass = getEstadoClass(consulta.estado);
                const dataFormatada = formatDate(consulta.data);
                const podeEditar = consulta.estado === 'agendada';

                tableBody.innerHTML += `
                    <tr>
                        <td>
                            <div class="fw-semibold">${consulta.medicos?.nome || 'N/A'}</div>
                        </td>
                        <td>${consulta.medicos?.especialidade || 'N/A'}</td>
                        <td>${dataFormatada}</td>
                        <td>${consulta.hora?.substring(0, 5)}</td>
                        <td>${consulta.tipo}</td>
                        <td><span class="badge ${estadoClass}">${capitalizeFirst(consulta.estado)}</span></td>
                        <td>
                            ${podeEditar ? `
                                <button class="btn btn-action btn-outline-primary btn-sm me-1" onclick="editConsulta('${consulta.id}')" title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-action btn-outline-danger btn-sm" onclick="confirmCancel('${consulta.id}')" title="Cancelar">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            ` : '-'}
                        </td>
                    </tr>
                `;
            });

            // Guardar consultas para edição
            window._consultas = consultas;

        } catch (error) {
            console.error('Erro ao carregar consultas:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-danger">
                        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                        Erro ao carregar consultas
                    </td>
                </tr>
            `;
        } finally {
            spinner.style.display = 'none';
        }
    }

    // Funções globais para os botões da tabela
    window.editConsulta = function(id) {
        const consulta = window._consultas.find(c => c.id === id);
        if (!consulta) return;

        document.getElementById('editId').value = consulta.id;
        document.getElementById('editMedico').value = consulta.medico_id;
        document.getElementById('editData').value = consulta.data;
        document.getElementById('editHora').value = consulta.hora?.substring(0, 5);
        document.getElementById('editTipo').value = consulta.tipo;
        document.getElementById('editNotas').value = consulta.notas || '';

        new bootstrap.Modal(document.getElementById('editModal')).show();
    };

    window.confirmCancel = function(id) {
        consultaParaCancelar = id;
        new bootstrap.Modal(document.getElementById('cancelModal')).show();
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
});
