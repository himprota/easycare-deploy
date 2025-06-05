// Scripts/perfil-publico.js (Adaptado para focar em Foto, Nome, Email, Telefone)

document.addEventListener("DOMContentLoaded", () => {
    const Utils = window.EasyCareProfileUtils;
    if (!Utils) {
        console.error("Fatal: EasyCareProfileUtils não encontrado. Verifique a ordem de inclusão dos scripts.");
        return;
    }

    // --- SELETORES DO DOM ATUALIZADOS ---
    const viewInfoPrincipaisDiv = document.getElementById("viewInfoPrincipais"); // Div que contém a visualização
    const viewFotoPrincipal = document.getElementById("viewFotoPrincipal");
    const viewNomeCompleto = document.getElementById("viewNomeCompleto");
    const viewTelefonePrincipal = document.getElementById("viewTelefonePrincipal");
    const viewEmailPrincipal = document.getElementById("viewEmailPrincipal");

    const btnEditarInfoPrincipais = document.getElementById("btnEditarInfoPrincipais");
    const btnAbrirGerenciadorFotosModal = document.getElementById("btnAbrirGerenciadorFotosModal");

    const formEditarInfoContato = document.getElementById("formEditarInfoContato");
    const editNomeCompletoVisualizado = document.getElementById("editNomeCompletoVisualizado"); // Readonly
    const editTelefoneForm = document.getElementById("editTelefoneForm");
    const editEmailForm = document.getElementById("editEmailForm"); // Readonly

    const btnSalvarInfoContato = document.getElementById("btnSalvarInfoContato");
    const btnCancelarEdicaoContato = document.getElementById("btnCancelarEdicaoContato");

    const modalGerenciadorFotosPublicas = document.getElementById("modalGerenciadorFotosPublicas");
    const btnFecharModalFotosPublicas = document.getElementById("btnFecharModalFotosPublicas");
    const gerenciadorFotosContainerModal = document.getElementById("gerenciadorFotosContainerModal");
    const btnConcluirEdicaoFotosModal = document.getElementById("btnConcluirEdicaoFotosModal");

    let currentProfileData = {}; // Para armazenar os dados do perfil carregados

    // --- FUNÇÕES DE API ---
    function getAuthToken() {
        return localStorage.getItem('jwtToken');
    }

    async function fetchUserProfile() {
        const token = getAuthToken();
        if (!token) {
            console.warn("Nenhum token JWT encontrado.");
            // Idealmente, redirecionar para login ou mostrar mensagem
            // window.location.href = 'index.html'; 
            return null;
        }
        try {
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                localStorage.removeItem('jwtToken'); // Limpa token se inválido
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            console.log("Perfil do usuário carregado da API:", data);
            currentProfileData = data;
            return data;
        } catch (error) {
            console.error('Falha ao buscar perfil do usuário:', error);
            // Tratar erro, talvez redirecionar para login se for 401
            // if (error.message.includes("401") || error.message.toLowerCase().includes("token")) {
            //     window.location.href = 'index.html'; // Redireciona para login
            // }
            return null;
        }
    }
    
    async function updateProfileOnBackend(updates) {
        const token = getAuthToken();
        if (!token) {
            alert("Sessão expirada. Por favor, faça login novamente.");
            // window.location.href = 'index.html';
            return false;
        }
        try {
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const data = await response.json(); // Backend deve retornar o perfil atualizado
            console.log("Perfil atualizado no backend:", data);
            currentProfileData = data; // Atualiza o estado local com os dados mais recentes
            return true;
        } catch (error) {
            console.error('Erro ao salvar informações:', error);
            alert(`Erro ao salvar informações: ${error.message}`);
            return false;
        }
    }

    // --- FUNÇÕES DE VISUALIZAÇÃO ---
    function carregarInfoPrincipaisView() {
        const profile = currentProfileData;
        if (!profile || Object.keys(profile).length === 0) {
            if (viewNomeCompleto) viewNomeCompleto.textContent = "Nome não disponível";
            if (viewTelefonePrincipal) viewTelefonePrincipal.textContent = "Não disponível";
            if (viewEmailPrincipal) viewEmailPrincipal.textContent = "Não disponível";
            if (viewFotoPrincipal) viewFotoPrincipal.src = 'https://placehold.co/300x350/e0e0e0/777?text=Foto';
            return;
        }

        if (viewFotoPrincipal) {
            // A API /api/user/profile deve retornar 'fotoPrincipalUrl' (para cliente) 
            // ou 'foto_perfil_url' (para cuidador, se for o caso, e o userRoutes.js mapeia para fotoPrincipalUrl)
            viewFotoPrincipal.src = profile.fotoPrincipalUrl || 'https://placehold.co/300x350/e0e0e0/777?text=Sem+Foto';
        }
        if (viewNomeCompleto) {
            viewNomeCompleto.textContent = profile.nomeCompleto || "Nome não informado";
        }
        if (viewTelefonePrincipal) {
            // A API /api/user/profile deve retornar 'telefoneCompleto'
            viewTelefonePrincipal.textContent = profile.telefoneCompleto || "Não informado";
        }
        if (viewEmailPrincipal) {
            // A API /api/user/profile deve retornar 'email'
            viewEmailPrincipal.textContent = profile.email || "Não informado";
        }
    }
    
    if (Utils) Utils.refreshPublicProfileView = carregarInfoPrincipaisView; // Para consistência se outro script chamar

    // --- FUNÇÕES DE EDIÇÃO ---
    function mostrarFormEdicaoContato(mostrar = true) {
        if (viewInfoPrincipaisDiv) viewInfoPrincipaisDiv.classList.toggle('hidden-input', mostrar);
        if (formEditarInfoContato) formEditarInfoContato.classList.toggle('hidden-input', !mostrar);
        if (mostrar) popularFormEdicaoContato();
    }

    function popularFormEdicaoContato() {
        const profile = currentProfileData;
        if (!profile || Object.keys(profile).length === 0) {
            console.warn("Dados do perfil não disponíveis para popular o formulário de edição.");
            return;
        }

        if (editNomeCompletoVisualizado) editNomeCompletoVisualizado.value = profile.nomeCompleto || "";
        if (editTelefoneForm) editTelefoneForm.value = profile.telefoneCompleto || ""; // Telefone principal da conta
        if (editEmailForm) editEmailForm.value = profile.email || ""; // Email de login (readonly)
    }

    if (btnEditarInfoPrincipais) {
        btnEditarInfoPrincipais.addEventListener('click', () => mostrarFormEdicaoContato(true));
    }
    if (btnCancelarEdicaoContato) {
        btnCancelarEdicaoContato.addEventListener('click', () => {
            mostrarFormEdicaoContato(false);
            carregarInfoPrincipaisView(); // Recarrega a view para reverter quaisquer mudanças não salvas no form
        });
    }

    if (formEditarInfoContato) {
        formEditarInfoContato.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const apiUpdates = {
                // Apenas o telefone é editável neste formulário simplificado
                telefoneCompleto: editTelefoneForm.value.trim(),
                // Se você quiser que o nome seja editável aqui (não recomendado se for nome de conta)
                // nomeCompleto: editNomeCompletoVisualizado.value.trim(), 
            };
            
            const success = await updateProfileOnBackend(apiUpdates);
            if (success) {
                alert("Informações de contato salvas com sucesso!");
                mostrarFormEdicaoContato(false);
                carregarInfoPrincipaisView(); // Recarrega a visualização com os dados mais recentes
            }
        });
    }

    // --- LÓGICA DE GERENCIAMENTO DE FOTO PRINCIPAL ---
    function mostrarModalFotos(mostrar = true) {
        if (modalGerenciadorFotosPublicas) {
            modalGerenciadorFotosPublicas.classList.toggle('hidden-input', !mostrar);
            modalGerenciadorFotosPublicas.classList.toggle('active', mostrar);
            if (mostrar) renderizarSlotFotoPrincipalModal();
        }
    }

    if (btnAbrirGerenciadorFotosModal) {
        btnAbrirGerenciadorFotosModal.addEventListener('click', () => mostrarModalFotos(true));
    }
     if (viewFotoPrincipal) { 
        viewFotoPrincipal.addEventListener('click', () => mostrarModalFotos(true));
    }
    if (btnFecharModalFotosPublicas) {
        btnFecharModalFotosPublicas.addEventListener('click', () => mostrarModalFotos(false));
    }

    function renderizarSlotFotoPrincipalModal() {
        const fotoAtual = currentProfileData.fotoPrincipalUrl; // Vem do backend (userRoutes mapeia para este campo)
        if (!gerenciadorFotosContainerModal) return;
        gerenciadorFotosContainerModal.innerHTML = '';

        const slotDiv = document.createElement('div');
        slotDiv.className = `slot-foto principal`;
        slotDiv.title = "Sua Foto Principal";
        slotDiv.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px;";


        const img = document.createElement('img');
        img.src = fotoAtual || `https://placehold.co/200x250/e0e7ee/777?text=Sua+Foto`;
        img.alt = "Foto Principal";
        img.style.cssText = "max-width: 200px; max-height: 250px; border-radius: 8px; border: 1px solid #ccc; object-fit: cover;";


        const inputFile = document.createElement('input');
        inputFile.type = 'file';
        inputFile.id = `inputFotoModalPrincipal`;
        inputFile.className = 'input-foto-match hidden-input'; // Para esconder o input de arquivo padrão
        inputFile.accept = "image/*";
        inputFile.addEventListener('change', handleSelecaoFotoPrincipalModal);

        const labelAdicionar = document.createElement('label');
        labelAdicionar.htmlFor = `inputFotoModalPrincipal`;
        labelAdicionar.className = 'btn btn-contorno-painel'; // Estilo de botão
        labelAdicionar.innerHTML = (fotoAtual && !fotoAtual.startsWith('https://placehold.co')) ? '<i class="fas fa-edit"></i> Alterar Foto' : '<i class="fas fa-plus"></i> Adicionar Foto';
        labelAdicionar.title = (fotoAtual && !fotoAtual.startsWith('https://placehold.co')) ? "Alterar foto principal" : "Adicionar foto principal";
        labelAdicionar.style.cursor = 'pointer';


        slotDiv.appendChild(img);
        slotDiv.appendChild(inputFile); // Input escondido
        slotDiv.appendChild(labelAdicionar); // Botão estilizado
        gerenciadorFotosContainerModal.appendChild(slotDiv);
    }

    function handleSelecaoFotoPrincipalModal(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Atualiza preview no modal e na página
                const imgElementModal = gerenciadorFotosContainerModal.querySelector('img');
                if (imgElementModal) imgElementModal.src = e.target.result;
                if (viewFotoPrincipal) viewFotoPrincipal.src = e.target.result; 
                
                // Armazena temporariamente para envio ao clicar em "Concluir"
                // Em um sistema real, você usaria FormData para enviar 'file' diretamente.
                // Para este exemplo, vamos simular com base64, mas isso NÃO é ideal para produção.
                currentProfileData.novaFotoPrincipalTemp_Base64 = e.target.result; 
            }
            reader.readAsDataURL(file);
        }
    }
    
    if (btnConcluirEdicaoFotosModal) {
        btnConcluirEdicaoFotosModal.addEventListener('click', async () => {
            if (currentProfileData.novaFotoPrincipalTemp_Base64) {
                // ALERTA: Upload de Base64 é ineficiente e não recomendado para produção.
                // Idealmente, você usaria FormData para enviar o 'file' objeto diretamente.
                // O backend precisaria de uma rota para lidar com multipart/form-data.
                console.warn("Tentando 'salvar' foto como base64. Isto é apenas para demonstração e NÃO é para produção.");
                
                const success = await updateProfileOnBackend({ 
                    fotoPrincipalUrl_base64: currentProfileData.novaFotoPrincipalTemp_Base64 
                    // O backend precisaria ser capaz de processar este campo 'fotoPrincipalUrl_base64'
                });

                if(success) {
                   // currentProfileData será atualizado pelo updateProfileOnBackend com a nova URL real se o backend retornar
                   delete currentProfileData.novaFotoPrincipalTemp_Base64; // Limpa o temp
                   alert("Foto principal 'salva' com sucesso! (Backend precisa processar o upload real e retornar a nova URL)");
                   mostrarModalFotos(false);
                   carregarInfoPrincipaisView(); // Deveria recarregar com a nova URL da foto do currentProfileData atualizado
                } else {
                   alert("Erro ao tentar salvar a foto principal. O backend pode não estar configurado para upload via base64.");
                }
            } else {
                mostrarModalFotos(false); // Apenas fecha se nenhuma foto nova foi selecionada
            }
        });
    }

    // --- INICIALIZAÇÃO DO MÓDULO ---
    async function inicializarPerfilView() {
        if (!viewInfoPrincipaisDiv && !formEditarInfoContato) {
            console.warn("Elementos de visualização/edição do perfil principal não encontrados.");
            return;
        }
        const profileData = await fetchUserProfile();
        if (profileData) {
            carregarInfoPrincipaisView();
            mostrarFormEdicaoContato(false); 
            mostrarModalFotos(false); 
        } else {
            console.error("Não foi possível carregar os dados do perfil para visualização.");
            // Poderia redirecionar para login ou mostrar uma mensagem de erro mais proeminente
            if (viewNomeCompleto) viewNomeCompleto.textContent = "Erro ao carregar perfil.";
            if (viewTelefonePrincipal) viewTelefonePrincipal.textContent = "-";
            if (viewEmailPrincipal) viewEmailPrincipal.textContent = "-";
        }
    }

    inicializarPerfilView();
});