// Script/script_match.js

document.addEventListener('DOMContentLoaded', () => {

    const matchListTitle = document.getElementById('matchListTitle');
    const profileCardsContainer = document.querySelector('.profile-cards-container');
    const noMoreProfilesCard = document.querySelector('.profile-card.no-more-profiles');
    const dislikeBtn = document.getElementById('dislikeBtn');
    const likeBtn = document.getElementById('likeBtn');

    let currentUserType = '';
    let profiles = [];
    let currentIndex = 0;
    let isLoadingProfiles = false; // Adicionado para evitar múltiplas buscas simultâneas

    async function initializeMatchPage() {
        currentUserType = localStorage.getItem('userType');
        const token = localStorage.getItem('jwtToken');

        if (!currentUserType || !token) {
            console.error('Usuário não logado ou tipo de usuário não encontrado.');
            matchListTitle.textContent = 'Erro: Faça login para continuar.';
            // Idealmente, redirecionar para a página de login
            // window.location.href = 'login.html';
            return;
        }

        if (currentUserType === 'cliente') {
            matchListTitle.textContent = 'Cuidadores Disponíveis';
        } else if (currentUserType === 'cuidador') {
            matchListTitle.textContent = 'Clientes Buscando Cuidado';
        } else {
            matchListTitle.textContent = 'Tipo de usuário inválido.';
            return;
        }
        await loadProfilesFromAPI(token);
    }

    async function loadProfilesFromAPI(token) {
        if (isLoadingProfiles) return; // Previne múltiplas chamadas
        isLoadingProfiles = true;
        matchListTitle.textContent = 'Carregando Perfis...'; // Indica carregamento
        if (profileCardsContainer) profileCardsContainer.innerHTML = ''; // Limpa cards existentes
        if (noMoreProfilesCard) noMoreProfilesCard.style.display = 'none'; // Esconde a mensagem de "sem mais perfis"

        console.log(`Buscando perfis para match do usuário tipo: ${currentUserType}`);

        try {
            const response = await fetch('http://localhost:3000/api/user/match-candidates', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    matchListTitle.textContent = 'Sessão expirada ou inválida. Faça login novamente.';
                    localStorage.removeItem('jwtToken');
                    localStorage.removeItem('userType');
                } else {
                    matchListTitle.textContent = 'Não foi possível carregar os perfis.';
                }
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const fetchedProfiles = await response.json();
            profiles = fetchedProfiles; // Sobrescreve os perfis com os recém-buscados
            currentIndex = 0;

            if (profiles.length > 0) {
                displayCurrentProfile();
            } else {
                console.log('API retornou 0 perfis. Chamando showNoMoreProfiles.');
                showNoMoreProfiles();
            }
        } catch (error) {
            console.error('Falha ao carregar perfis da API:', error);
            if (matchListTitle.textContent === 'Carregando Perfis...') { // Só sobrescreve se não for um erro específico
                matchListTitle.textContent = 'Erro ao conectar com o servidor.';
            }
            showNoMoreProfiles();
        } finally {
            isLoadingProfiles = false;
        }
    }

    function displayCurrentProfile() {
        if (profileCardsContainer) profileCardsContainer.innerHTML = '';

        if (currentIndex < profiles.length) {
            const profile = profiles[currentIndex];
            const card = createProfileCard(profile);
            if (profileCardsContainer) profileCardsContainer.appendChild(card);
            if (noMoreProfilesCard) noMoreProfilesCard.style.display = 'none';
        } else {
            // Não há mais perfis no lote atual. Tenta carregar mais.
            console.log('Fim dos perfis atuais. Tentando carregar mais...');
            const token = localStorage.getItem('jwtToken');
            if (token && !isLoadingProfiles) {
                // Aqui pode ser implementada paginação (e.g., loadProfilesFromAPI(token, { offset: profiles.length, limit: 10 }));
                // Por simplicidade, está recarregando tudo, o que não é o ideal, mas demonstra a intenção.
                loadProfilesFromAPI(token);
            } else {
                showNoMoreProfiles();
            }
        }
    }

    function createProfileCard(profile) {
        const card = document.createElement('div');
        card.classList.add('profile-card');
        card.dataset.profileId = profile.id;

        card.innerHTML = `
            <div class="profile-card-image-wrapper">
                <img src="${profile.fotoUrl || 'https://placehold.co/300x400/cccccc/999999?text=Sem+Foto'}" alt="Foto de ${profile.nome}" class="profile-card-image">
            </div>
            <div class="profile-card-info">
                <h3 class="profile-card-name">${profile.nome || 'Nome não disponível'}</h3>
                <p class="profile-card-account-type"><strong>Tipo:</strong> ${profile.tipoConta || 'N/A'}</p>
                ${profile.bio ? `<p class="profile-card-bio">${profile.bio}</p>` : ''}
                ${profile.cidade ? `<p class="profile-card-location"><i class="fas fa-map-marker-alt"></i> ${profile.cidade}</p>` : ''}
                </div>
        `;
        return card;
    }

    function showNoMoreProfiles() {
        console.log('--- showNoMoreProfiles foi chamado ---');
        if (profileCardsContainer) profileCardsContainer.innerHTML = '';
        if (noMoreProfilesCard) {
            noMoreProfilesCard.style.display = 'flex';
        }
        console.log('Não há mais perfis para mostrar.');
        matchListTitle.textContent = 'Não há mais perfis com esses critérios.';
    }

    function handleAction(actionType) {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) {
            console.warn('Nenhum perfil atual para ação.');
            showNoMoreProfiles();
            return;
        }

        console.log(`Ação: ${actionType} no perfil ID: ${currentProfile.id} (${currentProfile.nome})`);

        const cardElement = profileCardsContainer.querySelector('.profile-card:not(.no-more-profiles)');
        if (cardElement) {
            const animationClass = actionType === 'dislike' ? 'swiping-left' : 'swiping-right';
            cardElement.classList.add(animationClass);

            cardElement.addEventListener('transitionend', () => {
                console.log('Evento animationend disparado!');
                processNextProfile(actionType, currentProfile);
            }, { once: true });
        } else {
            console.log('CardElement não encontrado, chamando processNextProfile diretamente.');
            processNextProfile(actionType, currentProfile);
        }
    }

    function processNextProfile(actionType, profileInteractedWith) {
        // Se a ação for 'like', inicia o chat/redirecionamento
        if (actionType === 'like') {
            initiateChat(profileInteractedWith);
        }
        currentIndex++;
        console.log('Novo currentIndex:', currentIndex);
        displayCurrentProfile();
    }

    async function initiateChat(profileToChatWith) {
        console.log('initiateChat foi chamado.');
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            return;
        }

        console.log(`REGISTRANDO LIKE PARA: ${profileToChatWith.nome} (ID: ${profileToChatWith.id})`);

        // Dispara a requisição para registrar o like no backend
        fetch('http://localhost:3000/api/chat/initiate', { // Confirmação do like/match
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId: profileToChatWith.id })
        })
            .then(response => {
                if (!response.ok) {
                    console.error('Backend reportou um erro ao registrar o like:', response.status, response.statusText);
                    response.json().then(errorData => console.error('Detalhes do erro do backend:', errorData.message || errorData)).catch(() => { });
                    // Mesmo com erro no registro do like, podemos tentar redirecionar para o chat se tivermos o telefone
                } else {
                    console.log('Like registrado no backend com sucesso.');
                }
            })
            .catch(error => {
                console.error('Erro de rede ao registrar o like:', error);
                // Continua para o redirecionamento mesmo com erro de rede no registro do like
            });

        // *** Adaptação para redirecionar para o WhatsApp SE o número de telefone estiver disponível ***
        if (profileToChatWith.ddd && profileToChatWith.telefone) { // Verifica se DDD e telefone existem
            // Concatena DDD e Telefone com o código do país (55 para Brasil)
            const fullPhoneNumber = `55${profileToChatWith.ddd}${profileToChatWith.telefone}`;
            const cleanedPhone = fullPhoneNumber.replace(/\D/g, ''); // Remove caracteres não numéricos

            alert(`Você deu match com ${profileToChatWith.nome}! Redirecionando para o chat do WhatsApp.`);
            window.open(`https://wa.me/${cleanedPhone}`, '_blank'); // Abre em nova aba
        } else {
            // *** Fallback: Se o telefone NÃO estiver disponível, você pode decidir o que fazer. ***
            // Por exemplo, mostrar um alerta ou simplesmente não fazer nada se a intenção é APENAS WhatsApp.
            alert(`Você deu match com ${profileToChatWith.nome}, mas o número de WhatsApp não está disponível.`);
            // Se você remover chat.html e chat.css, esta parte do fallback não fará mais sentido
            // e pode ser removida ou alterada para uma mensagem de erro ou redirecionamento para outra página de ajuda.
            console.log('Número de telefone não disponível. Não redirecionando para WhatsApp.');
        }
    }


    if (dislikeBtn) dislikeBtn.addEventListener('click', () => handleAction('dislike'));
    if (likeBtn) likeBtn.addEventListener('click', () => handleAction('like'));

    initializeMatchPage();
});