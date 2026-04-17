import * as Game from './game.js';

const GEISHA_COLORS = {
  1: 'geisha-1',
  2: 'geisha-2',
  3: 'geisha-3',
  4: 'geisha-4',
  5: 'geisha-5',
  6: 'geisha-6',
  7: 'geisha-7'
};

const COLOR_RGB = {
  'geisha-1': 'rgb(231, 76, 60)',
  'geisha-2': 'rgb(52, 152, 219)',
  'geisha-3': 'rgb(46, 204, 113)',
  'geisha-4': 'rgb(155, 89, 182)',
  'geisha-5': 'rgb(230, 126, 34)',
  'geisha-6': 'rgb(241, 196, 15)',
  'geisha-7': 'rgb(233, 30, 99)'
};

const CARD_ICONS = {
  1: '🪈',
  2: '🪭',
  3: '📜',
  4: '☂️',
  5: '🎸',
  6: '🫖',
  7: '💐'
};

const elements = {
  currentPlayer: document.getElementById('current-player'),
  turnNumber: document.getElementById('turn-number'),
  deckCount: document.getElementById('deck-count'),
  message: document.getElementById('message'),
  boardContainer: document.getElementById('board-container'),
  deckContainer: document.getElementById('deck-container'),
  handList: document.getElementById('hand-list'),
  secretButton: document.getElementById('secret-button'),
  tradeoffButton: document.getElementById('tradeoff-button'),
  giftButton: document.getElementById('gift-button'),
  competitionButton: document.getElementById('competition-button'),
  confirmButton: document.getElementById('confirm-button'),
  restartButton: document.getElementById('restart-button'),
  offerPanel: document.getElementById('offer-panel'),
  resultPanel: document.getElementById('result-panel')
};

let pendingAction = null;
let offerChoices = null;

function updateStatus() {
  elements.currentPlayer.textContent = Game.state.currentPlayer;
  elements.turnNumber.textContent = Game.state.turnsTaken + 1;
  elements.deckCount.textContent = Game.state.deck.length;
  elements.message.textContent = Game.state.message;
}

function createGiftStack(count, rowId, playerLabel) {
  const stack = document.createElement('div');
  stack.className = `gift-stack gift-stack-${playerLabel}`;

  if (count === 0) {
    const empty = document.createElement('div');
    empty.className = 'gift-stack-empty';
    empty.textContent = '\u00A0';
    stack.appendChild(empty);
    return stack;
  }

  for (let i = 0; i < count; i++) {
    const giftCard = document.createElement('div');
    giftCard.className = `gift-card ${GEISHA_COLORS[rowId]}`;
    const iconDiv = document.createElement('div');
    iconDiv.className = 'gift-icon';
    iconDiv.textContent = CARD_ICONS[rowId];
    const valueDiv = document.createElement('div');
    valueDiv.className = 'gift-value';
    valueDiv.textContent = `${Game.cardValue(rowId)} pont`;
    giftCard.appendChild(iconDiv);
    giftCard.appendChild(valueDiv);
    stack.appendChild(giftCard);
  }

  return stack;
}

function buildBoard() {
  const rows = Game.getGeishaRows();
  elements.boardContainer.innerHTML = '';

  const boardGrid = document.createElement('div');
  boardGrid.className = 'geisha-grid';

  rows.forEach((row) => {
    const column = document.createElement('div');
    column.className = 'geisha-column';

    const p2Gifts = createGiftStack(row.player2, row.id, 'player2');
    const geishaDiv = document.createElement('div');
    geishaDiv.className = `geisha-card ${GEISHA_COLORS[row.id]}`;
    const iconDiv = document.createElement('div');
    iconDiv.className = 'geisha-icon';
    iconDiv.textContent = CARD_ICONS[row.id];
    const nameDiv = document.createElement('div');
    nameDiv.className = 'geisha-name';
    nameDiv.textContent = row.name;
    const valueDiv = document.createElement('div');
    valueDiv.className = 'geisha-value';
    valueDiv.textContent = `${row.value} pont`;
    geishaDiv.appendChild(iconDiv);
    geishaDiv.appendChild(nameDiv);
    geishaDiv.appendChild(valueDiv);

    const p1Gifts = createGiftStack(row.player1, row.id, 'player1');

    column.appendChild(p2Gifts);
    column.appendChild(geishaDiv);
    column.appendChild(p1Gifts);
    boardGrid.appendChild(column);
  });

  elements.boardContainer.appendChild(boardGrid);
}

function buildDeck() {
  elements.deckContainer.innerHTML = '';
  
  const deckDiv = document.createElement('div');
  deckDiv.className = 'deck-container';
  
  const countDiv = document.createElement('div');
  countDiv.className = 'deck-count';
  countDiv.textContent = Game.state.deck.length;
  
  const cardDiv = document.createElement('div');
  cardDiv.className = 'deck-card';
  cardDiv.textContent = 'PAKLI';
  
  deckDiv.appendChild(countDiv);
  deckDiv.appendChild(cardDiv);
  elements.deckContainer.appendChild(deckDiv);
}

function buildHand() {
  const hand = Game.getHand(Game.state.currentPlayer);
  elements.handList.innerHTML = '';
  
  hand.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card-button ${GEISHA_COLORS[card]}`;
    button.title = Game.cardName(card);
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'card-icon';
    iconDiv.textContent = CARD_ICONS[card];
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'card-value';
    valueDiv.textContent = `${Game.cardValue(card)} pont`;
    
    button.appendChild(iconDiv);
    button.appendChild(valueDiv);
    
    button.disabled = !pendingAction || pendingAction.mode !== 'select';
    
    if (pendingAction && pendingAction.selected.indexOf(index) !== -1) {
      button.classList.add('selected');
    }
    
    button.addEventListener('click', () => handleCardClick(index));
    elements.handList.appendChild(button);
  });
}

function buildOfferPanel() {
  elements.offerPanel.innerHTML = '';
  elements.offerPanel.classList.add('hidden');
  
  if (!offerChoices) {
    return;
  }
  
  elements.offerPanel.classList.remove('hidden');
  const title = document.createElement('p');
  title.className = 'offer-title';
  title.textContent = offerChoices.title;
  elements.offerPanel.appendChild(title);

  offerChoices.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'offer-button';
    button.type = 'button';
    button.textContent = option.label;
    button.addEventListener('click', () => offerChoices.handler(index));
    elements.offerPanel.appendChild(button);
  });
}

function buildResultPanel() {
  elements.resultPanel.innerHTML = '';
  elements.resultPanel.classList.add('hidden');
  
  if (!Game.state.gameOver) {
    return;
  }
  
  elements.resultPanel.classList.remove('hidden');
  const result = Game.getResultSummary();
  
  const heading = document.createElement('h2');
  heading.textContent = 'Játék vége';
  
  const details = document.createElement('div');
  details.className = 'result-details';
  details.innerHTML = `
    <p><strong>1. játékos:</strong> ${result.player1.score} pont, ${result.player1.geishaCount} gésa</p>
    <p><strong>2. játékos:</strong> ${result.player2.score} pont, ${result.player2.geishaCount} gésa</p>
    <p><strong>Nyertes:</strong> ${result.winner === 0 ? 'Döntetlen!' : result.winner + '. játékos'}</p>
  `;
  
  elements.resultPanel.appendChild(heading);
  elements.resultPanel.appendChild(details);
}

function updateActionButtons() {
  const player = Game.state.currentPlayer;
  elements.secretButton.disabled = !Game.canUseAction(player, 'secret') || Game.state.gameOver || pendingAction;
  elements.tradeoffButton.disabled = !Game.canUseAction(player, 'tradeoff') || Game.state.gameOver || pendingAction;
  elements.giftButton.disabled = !Game.canUseAction(player, 'gift') || Game.state.gameOver || pendingAction;
  elements.competitionButton.disabled = !Game.canUseAction(player, 'competition') || Game.state.gameOver || pendingAction;
  elements.confirmButton.disabled = !pendingAction || pendingAction.mode !== 'select';
}

function setPendingAction(actionType) {
  if (Game.state.gameOver) {
    return;
  }
  
  let max = 1;
  let prompt = '';
  
  switch (actionType) {
    case 'secret':
      max = 1;
      prompt = 'Válassz egy kártyát titoknak.';
      break;
    case 'tradeoff':
      max = 2;
      prompt = 'Válassz két kártyát, amit eldobsz.';
      break;
    case 'gift':
      max = 3;
      prompt = 'Válassz három kártyát, amit felajánlasz.';
      break;
    case 'competition':
      max = 4;
      prompt = 'Válassz négy kártyát a versenyhez.';
      break;
    default:
      return;
  }
  
  pendingAction = {
    mode: 'select',
    type: actionType,
    selected: [],
    maxSelection: max,
    prompt
  };
  
  Game.state.message = prompt;
  offerChoices = null;
  render();
}

function handleCardClick(index) {
  if (!pendingAction || pendingAction.mode !== 'select') {
    return;
  }
  
  const existingIndex = pendingAction.selected.indexOf(index);
  if (existingIndex >= 0) {
    pendingAction.selected.splice(existingIndex, 1);
  } else if (pendingAction.selected.length < pendingAction.maxSelection) {
    pendingAction.selected.push(index);
  }
  
  render();
}

function confirmSelection() {
  if (!pendingAction || pendingAction.mode !== 'select') {
    return;
  }
  
  const player = Game.state.currentPlayer;
  const selected = [...pendingAction.selected].sort((a, b) => a - b);
  
  if (selected.length !== pendingAction.maxSelection) {
    Game.state.message = `Pontosan ${pendingAction.maxSelection} kártyát kell kiválasztanod.`;
    render();
    return;
  }
  
  switch (pendingAction.type) {
    case 'secret':
      Game.performSecret(player, selected[0]);
      pendingAction = null;
      break;
    case 'tradeoff':
      Game.performTradeoff(player, selected);
      pendingAction = null;
      break;
    case 'gift':
      prepareGiftResponse(player, selected);
      break;
    case 'competition':
      prepareCompetitionResponse(player, selected);
      break;
  }
  
  render();
}

function prepareGiftResponse(player, selectedIndex) {
  const hand = Game.getHand(player);
  const giftCards = selectedIndex.map((index) => hand[index]);
  
  pendingAction = null;
  offerChoices = {
    title: 'Az ellenfél válasszon egy kártyát az ajánlatból.',
    options: giftCards.map((card, index) => ({ label: `${index + 1}. ${Game.cardName(card)}` })),
    handler: (chosenOfferIndex) => {
      Game.performGift(player, selectedIndex, chosenOfferIndex);
      offerChoices = null;
      pendingAction = null;
      render();
    }
  };
  
  Game.state.message = 'Az ellenfél választ az ajánlott kártyák közül.';
}

function prepareCompetitionResponse(player, selectedIndex) {
  const hand = Game.getHand(player);
  const competitionCards = selectedIndex.map((index) => hand[index]);
  const firstPair = competitionCards.slice(0, 2);
  const secondPair = competitionCards.slice(2, 4);
  
  pendingAction = null;
  offerChoices = {
    title: 'Az ellenfél válassza ki, melyik párt szeretné megszerezni.',
    options: [
      { label: `1. pár: ${Game.cardName(firstPair[0])}, ${Game.cardName(firstPair[1])}` },
      { label: `2. pár: ${Game.cardName(secondPair[0])}, ${Game.cardName(secondPair[1])}` }
    ],
    handler: (chosenPairIndex) => {
      Game.performCompetition(player, selectedIndex, chosenPairIndex + 1);
      offerChoices = null;
      pendingAction = null;
      render();
    }
  };
  
  Game.state.message = 'Az ellenfél választ a párok közül.';
}

function render() {
  updateStatus();
  buildBoard();
  buildDeck();
  buildHand();
  buildOfferPanel();
  buildResultPanel();
  updateActionButtons();
}

function restartGame() {
  Game.startGame();
  pendingAction = null;
  offerChoices = null;
  render();
}

export function startApp() {
  Game.startGame();
  render();
  
  elements.secretButton.addEventListener('click', () => setPendingAction('secret'));
  elements.tradeoffButton.addEventListener('click', () => setPendingAction('tradeoff'));
  elements.giftButton.addEventListener('click', () => setPendingAction('gift'));
  elements.competitionButton.addEventListener('click', () => setPendingAction('competition'));
  elements.confirmButton.addEventListener('click', () => confirmSelection());
  elements.restartButton.addEventListener('click', () => restartGame());
}
