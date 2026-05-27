// =============================================
// Lógica da Página de Perfil
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const session = await checkAuth();
    if (!session) return;

    const userId = session.user.id;

    // Carregar dados do perfil
    await carregarPerfil();

    // Formulário de edição de perfil
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUpdateProfile();
        });
    }

    // Carregar dados do perfil
    async function carregarPerfil() {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            // Atualizar display
            document.getElementById('perfilNome').textContent = user.nome || 'Nome não definido';
            document.getElementById('perfilEmail').textContent = user.email || '';

            // Preencher formulário
            document.getElementById('perfilNomeInput').value = user.nome || '';
            document.getElementById('perfilTelefone').value = user.telefone || '';
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        }
    }

    // Atualizar perfil
    async function handleUpdateProfile() {
        const nome = document.getElementById('perfilNomeInput').value;
        const telefone = document.getElementById('perfilTelefone').value;
        const errorDiv = document.getElementById('perfilError');
        const successDiv = document.getElementById('perfilSuccess');

        try {
            errorDiv.classList.add('d-none');
            successDiv.classList.add('d-none');

            await updateUserProfile(userId, {
                nome: nome,
                telefone: telefone
            });

            successDiv.textContent = 'Perfil atualizado com sucesso!';
            successDiv.classList.remove('d-none');

            // Atualizar nome no display
            document.getElementById('perfilNome').textContent = nome;

            // Atualizar nome na navbar
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = nome;
            }
        } catch (error) {
            errorDiv.textContent = 'Erro ao atualizar perfil: ' + error.message;
            errorDiv.classList.remove('d-none');
        }
    }
});
