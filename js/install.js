// =============================================
// Banner de Instalação PWA
// =============================================

let deferredPrompt = null;

// Capturar o evento de instalação
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Mostrar banner após 2 segundos
    setTimeout(() => {
        mostrarBanner();
    }, 2000);
});

// Criar e mostrar o banner
function mostrarBanner() {
    // Não mostrar se já foi dispensado
    if (sessionStorage.getItem('banner_dismissed')) return;

    // Não mostrar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-top: 2px solid #6366f1;
            padding: 1rem 1.25rem;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
            animation: slideUp 0.4s ease;
        ">
            <div style="
                width: 45px;
                height: 45px;
                min-width: 45px;
                background: #6366f1;
                border-radius: 0.6rem;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
            </div>
            <div style="flex-grow: 1;">
                <div style="color: #fafafa; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.15rem;">Instalar MedAgenda</div>
                <div style="color: #a1a1aa; font-size: 0.8rem;">Aceda mais rápido — instale no seu telemóvel</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button onclick="instalarApp()" style="
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1.2rem;
                    border-radius: 0.4rem;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    white-space: nowrap;
                ">Instalar</button>
                <button onclick="dismissBanner()" style="
                    background: transparent;
                    color: #71717a;
                    border: none;
                    padding: 0.5rem;
                    cursor: pointer;
                    font-size: 1.2rem;
                    line-height: 1;
                ">✕</button>
            </div>
        </div>
        <style>
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    document.body.appendChild(banner);
}

// Instalar a app
async function instalarApp() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('App instalada!');
    }

    deferredPrompt = null;
    removerBanner();
}

// Dispensar o banner
window.dismissBanner = function() {
    sessionStorage.setItem('banner_dismissed', 'true');
    removerBanner();
};

function removerBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
        banner.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => banner.remove(), 300);
    }
}

// Se já está instalado, não mostrar nada
window.addEventListener('appinstalled', () => {
    console.log('MedAgenda instalada!');
    deferredPrompt = null;
    removerBanner();
});
