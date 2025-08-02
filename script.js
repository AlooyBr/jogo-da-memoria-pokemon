const Game = (() => {
  // Configuração
  const ICONS = [
    "004",
    "007",
    "001",
    "025",
    "039",
    "052",
    "066",
    "092",
    "133",
    "147",
    "152",
    "155",
  ];
  const PAIR_DELAY_MS = 1000;
  const MISMATCH_REVERT_MS = 800;

  // Estado interno
  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let round = 1; // tentativas
  let matchesFound = 0;
  let startTime = null;

  // DOM refs
  const board = document.getElementById("gameBoard");
  const roundDisplay = document.getElementById("round");
  const timerDisplay = document.getElementById("timer"); // opcional, crie no HTML se quiser

  // Util
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  function fisherYatesShuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function createCardElement(iconId) {
    const imgUrl = `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/${iconId}.png`;
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-icon", iconId);
    card.setAttribute("tabindex", "0"); // acessível por teclado
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front" aria-label="Carta virada para baixo"></div>
        <div class="card-back">
          <img src="${imgUrl}" alt="Pokémon #${iconId}">
        </div>
      </div>
    `;
    return card;
  }

  function preloadImages() {
    ICONS.forEach((id) => {
      const img = new Image();
      img.src = `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/${id}.png`;
    });
  }

  function updateDisplay() {
    roundDisplay.textContent = round;
    if (timerDisplay && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timerDisplay.textContent = formatTime(elapsed);
    }
  }

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function incrementRound() {
    round++;
    updateDisplay();
  }

  function resetBoardState() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
  }

  function getIconId(card) {
    return card.dataset.icon;
  }

  function handleMatch() {
    // Deixa as cartas visivelmente “combinadas”
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    // Remover da lógica do jogo
    matchesFound += 1;
    // Não remove do DOM imediatamente; só desabilita
    firstCard.classList.add("invisible");
    secondCard.classList.add("invisible");
  }

  function handleMismatch() {
    firstCard.classList.add("shake");
    secondCard.classList.add("shake");
  }

  async function checkMatch() {
    const icon1 = getIconId(firstCard);
    const icon2 = getIconId(secondCard);

    if (icon1 === icon2) {
      await delay(PAIR_DELAY_MS);
      handleMatch();
    } else {
      await delay(MISMATCH_REVERT_MS);
      handleMismatch();
      // pequena pausa para animação
      await delay(300);
      firstCard.classList.remove("flipped", "shake");
      secondCard.classList.remove("flipped", "shake");
    }

    resetBoardState();
    incrementRound();

    if (matchesFound === ICONS.length) {
      showFinalRanking();
    }
  }

  function handleCardClick(card) {
    if (
      lockBoard ||
      card.classList.contains("flipped") ||
      card.classList.contains("invisible")
    ) {
      return;
    }
    if (card === firstCard) return; // mesmo clique duplicado

    card.classList.add("flipped");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;
    checkMatch().finally(() => {
      lockBoard = false;
    });
  }

  function attachEventListeners() {
    // Delegação: capturar clique em .card dentro do board
    board.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      handleCardClick(card);
    });
    // Acessibilidade: Enter / Space
    board.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".card");
        if (!card) return;
        handleCardClick(card);
      }
    });
  }

  function getRankingLabel(attempts) {
    if (attempts <= 28)
      return ["🧠✨ Mente Incrível!", "Você tem uma memória fora do comum!"];
    if (attempts <= 34)
      return ["🧠 Muito Boa Memória", "Sua memória está afiada!"];
    if (attempts <= 42) return ["📚 Memória Padrão", "Nada mal!"];
    if (attempts <= 50)
      return ["🤔 Precisa Treinar", "Pode melhorar com prática."];
    return [
      "🧑‍⚕️😵‍💫 Precisa de um Descanso",
      "Recomenda-se dar uma pausa e tentar de novo depois.",
    ];
  }

  function showFinalRanking() {
    const attempts = round - 1;
    const [title, message] = getRankingLabel(attempts);
    const totalTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    board.innerHTML = "";

    const messageBox = document.createElement("div");
    messageBox.className = "end-message";

    messageBox.innerHTML = `
      <div class="message-box win">
        <h2>${title}</h2>
        <p>${message}</p>
        <p><strong>Tentativas:</strong> ${attempts}</p>
        <p><strong>Tempo:</strong> ${formatTime(totalTimeSeconds)}</p>
        <button class="restart">🔄 Jogar novamente</button>
      </div>
    `;

    board.appendChild(messageBox);

    messageBox
      .querySelector(".restart")
      .addEventListener("click", () => startNewGame());
  }

  function startNewGame() {
    // reset completo
    round = 1;
    matchesFound = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    startTime = Date.now();
    cards = fisherYatesShuffle([...ICONS, ...ICONS]);
    renderBoard();
    updateDisplay();
  }

  function renderBoard() {
    board.innerHTML = "";
    cards.forEach((icon) => {
      const cardEl = createCardElement(icon);
      board.appendChild(cardEl);
    });
  }

  function init() {
    preloadImages();
    attachEventListeners();
    startNewGame();
    // Atualiza timer a cada segundo se estiver sendo mostrado
    if (timerDisplay) {
      setInterval(updateDisplay, 1000);
    }
  }

  return { init };
})();

// Inicializa o jogo
document.addEventListener("DOMContentLoaded", () => {
  Game.init();
});
