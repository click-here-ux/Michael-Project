// =============================================
// Lógica da Página de Agendamento
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const session = await checkAuth();
    if (!session) return;

    const userId = session.user.id;

    // Carregar médicos no select
    await carregarMedicos();

    // Definir data mínima como hoje
    const inputData = document.getElementById('inputData');
    if (inputData) {
        const today = new Date().toISOString().split('T')[0];
        inputData.min = today;
        inputData.value = today;
    }

    // Formulário de agendamento
    const formAgendar = document.getElementById('formAgendar');
    if (formAgendar) {
        formAgendar.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAgendar();
        });
    }

    // Carregar médicos
    async function carregarMedicos() {
        try {
            const medicos = await getMedicos();
            const select = document.getElementById('selectMedico');

            medicos.forEach(m => {
                select.innerHTML += `<option value="${m.id}">${m.nome} - ${m.especialidade}</option>`;
            });
        } catch (error) {
            console.error('Erro ao carregar médicos:', error);
        }
    }

    // Processar agendamento
    async function handleAgendar() {
        const medicoId = document.getElementById('selectMedico').value;
        const data = document.getElementById('inputData').value;
        const hora = document.getElementById('selectHora').value;
        const tipo = document.getElementById('selectTipo').value;
        const notas = document.getElementById('inputNotas').value;
        const errorDiv = document.getElementById('agendarError');
        const successDiv = document.getElementById('agendarSuccess');

        try {
            errorDiv.classList.add('d-none');
            successDiv.classList.add('d-none');

            // Validar campos
            if (!medicoId || !data || !hora || !tipo) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.');
            }

            // Verificar se a data não é no passado
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataConsulta = new Date(data + 'T00:00:00');
            if (dataConsulta < hoje) {
                throw new Error('Não é possível agendar consultas no passado.');
            }

            // Verificar conflito
            const conflito = await verificarConflito(medicoId, data, hora);
            if (conflito) {
                throw new Error('Já existe uma consulta agendada para este médico nesta data e hora. Escolha outro horário.');
            }

            // Criar consulta
            await criarConsulta({
                utilizador_id: userId,
                medico_id: medicoId,
                data: data,
                hora: hora,
                tipo: tipo,
                notas: notas,
                estado: 'agendada'
            });

            successDiv.innerHTML = '<i class="bi bi-check-circle me-2"></i>Consulta agendada com sucesso!';
            successDiv.classList.remove('d-none');

            // Limpar formulário
            document.getElementById('selectMedico').value = '';
            document.getElementById('selectHora').value = '';
            document.getElementById('selectTipo').value = '';
            document.getElementById('inputNotas').value = '';

            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }
});
