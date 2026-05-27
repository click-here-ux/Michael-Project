// =============================================
// Módulo de Autenticação
// =============================================

// Verificar se o utilizador está autenticado
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        // Redirecionar para login se não estiver autenticado
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return null;
    }
    return session;
}

// Obter dados do utilizador atual
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    // Buscar dados extras do utilizador na tabela utilizadores
    const { data, error } = await supabaseClient
        .from('utilizadores')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Erro ao buscar utilizador:', error);
        return user;
    }

    return data;
}

// Registar novo utilizador
async function registerUser(nome, email, telefone, password) {
    // 1. Criar conta no Auth com metadata
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                nome: nome,
                telefone: telefone
            }
        }
    });

    if (authError) throw authError;

    return authData;
}

// Login
async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;
    return data;
}

// Logout
async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
}

// Atualizar perfil do utilizador
async function updateUserProfile(userId, updates) {
    const { data, error } = await supabaseClient
        .from('utilizadores')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// =============================================
// Event Listeners para as páginas
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Formulário de Login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');

            try {
                errorDiv.classList.add('d-none');
                await loginUser(email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorDiv.textContent = 'Email ou password incorretos.';
                errorDiv.classList.remove('d-none');
            }
        });
    }

    // Formulário de Registo
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('regNome').value;
            const email = document.getElementById('regEmail').value;
            const telefone = document.getElementById('regTelefone').value;
            const password = document.getElementById('regPassword').value;
            const errorDiv = document.getElementById('registerError');
            const successDiv = document.getElementById('registerSuccess');

            try {
                errorDiv.classList.add('d-none');
                successDiv.classList.add('d-none');
                await registerUser(nome, email, telefone, password);
                successDiv.textContent = 'Conta criada com sucesso! Verifique o seu email para confirmar.';
                successDiv.classList.remove('d-none');
                formRegister.reset();
            } catch (error) {
                errorDiv.textContent = error.message || 'Erro ao criar conta.';
                errorDiv.classList.remove('d-none');
            }
        });
    }

    // Botão de Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await logoutUser();
        });
    }

    // Verificar autenticação em páginas protegidas
    if (!window.location.pathname.includes('index.html')) {
        const session = await checkAuth();
        if (!session) return;

        // Atualizar nome do utilizador no dashboard
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            const user = await getCurrentUser();
            if (user) {
                userNameEl.textContent = user.nome || 'Utilizador';
            }
        }
    }
});
