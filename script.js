const board = document.getElementById("gameBoard");
const roundDisplay = document.getElementById("round");
const playerScoreDisplay = document.getElementById("playerScore");
const machineScoreDisplay = document.getElementById("machineScore");

const icons = [
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
let cards = [...icons, ...icons];

let round = 1;
let playerPoints = 0;
let machinePoints = 0;
let firstCard = null;
let secondCard = null;
let lockBoard = false;

shuffleAndCreateCards();

function shuffleAndCreateCards() {
  board.innerHTML = "";
  cards = cards.sort(() => Math.random() - 0.5);

  cards.forEach((icon) => {
    const imgUrl = `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/${icon}.png`;
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front"></div>
        <div class="card-back">
          <img src="${imgUrl}" alt="pokemon">
        </div>
      </div>
    `;

    card.addEventListener("click", () => handleCardClick(card));
    board.appendChild(card);
  });

  updateDisplay();
}

function handleCardClick(card) {
  if (
    lockBoard ||
    card.classList.contains("flipped") ||
    card.classList.contains("invisible")
  )
    return;

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
  } else {
    secondCard = card;
    lockBoard = true;

    setTimeout(() => checkMatch(), 1000);
  }
}

function checkMatch() {
  const icon1 = getIconId(firstCard);
  const icon2 = getIconId(secondCard);

  if (icon1 === icon2) {
    playerPoints += 13 - round;
    removeMatchedCards(icon1);
    setTimeout(() => nextRound(), 600);
  } else {
    machinePoints += 1;
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");

    setTimeout(() => {
      removeOneRandomPair();
    }, 800);
  }
}

function getIconId(card) {
  const img = card.querySelector(".card-back img");
  return img.src.split("/").pop().replace(".png", "");
}

function removeMatchedCards(icon) {
  cards = cards.filter((c) => c !== icon);
  document.querySelectorAll(".card").forEach((card) => {
    if (getIconId(card) === icon) {
      card.classList.add("invisible");
      card.classList.remove("flipped");
    }
  });
}

function removeOneRandomPair() {
  const uniqueIcons = [...new Set(cards)];
  if (uniqueIcons.length === 0) return;

  const icon = uniqueIcons[Math.floor(Math.random() * uniqueIcons.length)];

  const cardsToRemove = [];
  document.querySelectorAll(".card").forEach((card) => {
    if (
      getIconId(card) === icon &&
      cardsToRemove.length < 2 &&
      !card.classList.contains("invisible")
    ) {
      cardsToRemove.push(card);
    }
  });

  cardsToRemove.forEach((card) => card.classList.add("flipped"));

  setTimeout(() => {
    cards = cards.filter((c) => c !== icon);
    cardsToRemove.forEach((card) => {
      card.classList.add("invisible");
      card.classList.remove("flipped");
    });
    alert(`🤖 Máquina removeu 1 par (Pokémon #${icon})`);
    nextRound();
  }, 1000);
}

function nextRound() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
  round++;
  updateDisplay();

  if (cards.length === 0) {
    setTimeout(() => showEndMessage(), 500);
  }
}

function updateDisplay() {
  roundDisplay.textContent = round;
  playerScoreDisplay.textContent = playerPoints;
  machineScoreDisplay.textContent = machinePoints;
}

function showEndMessage() {
  const message = document.createElement("div");
  message.classList.add("end-message");

  const title =
    playerPoints > machinePoints
      ? "🎉 Você venceu!"
      : playerPoints < machinePoints
      ? "💀 Você perdeu!"
      : "🤝 Empate!";

  const colorClass =
    playerPoints > machinePoints
      ? "win"
      : playerPoints < machinePoints
      ? "lose"
      : "draw";

  message.innerHTML = `
    <div class="message-box ${colorClass}">
      <h2>${title}</h2>
      <p>Sua pontuação: <strong>${playerPoints}</strong></p>
      <p>Pontuação da máquina: <strong>${machinePoints}</strong></p>
      <button onclick="restartGame()">🔄 Jogar novamente</button>
    </div>
  `;

  board.innerHTML = "";
  board.appendChild(message);
}

function restartGame() {
  cards = [...icons, ...icons];
  round = 1;
  playerPoints = 0;
  machinePoints = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  shuffleAndCreateCards();
}
