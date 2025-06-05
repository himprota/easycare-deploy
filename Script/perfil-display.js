// Scripts/perfil-display.js
document.addEventListener("DOMContentLoaded", () => {
    const perfilFoto = document.getElementById("perfilFoto");
    const perfilNome = document.getElementById("perfilNome");
    const perfilEmail = document.getElementById("perfilEmail");
    const perfilTelefone = document.getElementById("perfilTelefone");
    const perfilTipoConta = document.getElementById("perfilTipoConta");
    const nomeContextoPerfilHeader = document.getElementById("nomeContextoPerfilHeader");


    // Função para obter o token JWT do localStorage.
    function getAuthToken() {
        return localStorage.getItem('jwtToken');
    }

    // Função para carregar os dados do perfil do usuário a partir da API.
    async function fetchUserProfileData() {
        const token = getAuthToken();
        if (!token) {
            console.warn("Nenhum token JWT encontrado. Redirecionando para o login.");
            window.location.href = 'index.html'; // Redireciona se não houver token
            return null;
        }

        try {
            const response = await fetch('http://localhost:3000/api/user/profile', { // Endpoint unificado
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.error("Token inválido ou não autorizado. Removendo token e redirecionando para login.");
                    localStorage.removeItem('jwtToken');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userType');
                    window.location.href = 'index.html';
                }
                // Tenta pegar a mensagem de erro do JSON, se houver
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}. O servidor não retornou um JSON de erro válido.` }));
                throw new Error(errorData.message || `Erro ${response.status} ao buscar perfil.`);
            }
            const data = await response.json();
            console.log("Dados do perfil carregados da API:", data);
            return data;
        } catch (error) {
            console.error('Falha ao buscar dados do perfil:', error.message);
            displayErrorOnProfileFields();
            return null;
        }
    }

    function displayErrorOnProfileFields() {
        const errorMessage = "Erro ao carregar dados";
        if(perfilFoto) perfilFoto.alt = errorMessage; // Altera o alt da imagem em caso de erro
        if(perfilNome) perfilNome.textContent = errorMessage;
        if(perfilEmail) perfilEmail.textContent = errorMessage;
        if(perfilTelefone) perfilTelefone.textContent = errorMessage;
        if(perfilTipoConta) perfilTipoConta.textContent = errorMessage;
        if(nomeContextoPerfilHeader) nomeContextoPerfilHeader.textContent = "Usuário";
    }

    // Função para popular os campos do perfil na página
    function displayUserProfile(profileData) {
        if (!profileData) {
            displayErrorOnProfileFields(); // Usa a função de erro se não houver dados
            return;
        }

        if (perfilFoto) {
            // O backend (userRoutes.js -> mapClienteToProfile/mapCuidadorToProfile)
            // deve fornecer 'fotoPrincipalUrl' no objeto profileData.
            perfilFoto.src = profileData.fotoPrincipalUrl || 'https://placehold.co/150x150/e0e0e0/777?text=Sem+Foto';
            perfilFoto.alt = `Foto de ${profileData.nomeCompleto || 'Usuário'}`;
        }
        if (perfilNome) {
            perfilNome.textContent = profileData.nomeCompleto || "Não informado";
        }
        if (perfilEmail) {
            perfilEmail.textContent = profileData.email || "Não informado";
        }
        if (perfilTelefone) {
            // A API /api/user/profile retorna 'telefoneCompleto'
            perfilTelefone.textContent = profileData.telefoneCompleto || "Não informado";
        }
        if (perfilTipoConta) {
            // A API /api/user/profile retorna 'tipoConta'
            const tipo = profileData.tipoConta;
            perfilTipoConta.textContent = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Não informado";
        }
        
        // Atualizar nome no header do painel
        if(nomeContextoPerfilHeader && profileData.nomeCompleto) {
            const primeiroNome = profileData.nomeCompleto.split(" ")[0];
            const tipoContaFormatado = profileData.tipoConta ? profileData.tipoConta.charAt(0).toUpperCase() + profileData.tipoConta.slice(1) : "";
            nomeContextoPerfilHeader.textContent = `${primeiroNome} (${tipoContaFormatado})`;
        } else if (nomeContextoPerfilHeader) {
            nomeContextoPerfilHeader.textContent = "Meu Perfil";
        }
    }

    // Inicialização: Carregar e exibir os dados do perfil
    async function initPage() {
        const userData = await fetchUserProfileData();
        // displayUserProfile será chamado mesmo se userData for null, para exibir mensagens de erro.
        displayUserProfile(userData);
    }

    // Botões de Sair (lógica de navegação-perfil.js pode ser integrada aqui ou mantida separada)
    const btnSairDesktopPerfil = document.getElementById("btnSairDesktopPerfil");
    const btnSairMobilePerfil = document.getElementById("btnSairMobilePerfil");

    function logout() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        window.location.href = 'index.html';
    }

    if (btnSairDesktopPerfil) {
        btnSairDesktopPerfil.addEventListener('click', logout);
    }
    if (btnSairMobilePerfil) {
        btnSairMobilePerfil.addEventListener('click', logout);
    }

    // Chama a inicialização da página
    initPage();
});