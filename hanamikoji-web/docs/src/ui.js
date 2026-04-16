import * as Game from './game.js';

const elements = {
  currentPlayer: document.getElementById('current-player'),
  turnNumber: document.getElementById('turn-number'),
  deckCount: document.getElementById('deck-count'),
  message: document.getElementById('message'),
  board: document.getElementById('board'),
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

function buildBoard() {
  const rows = Game.getGeishaRows();
  const table = document.createElement('table');
  table.className = 'geisha-board';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Gésa</th>
        <th>1. játékos</th>
        <th>2. játékos</th>
        <th>Elnyerő</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `
          <tr class="geisha-row ${row.owner === 1 ? 'player-one' : ''} ${row.owner === 2 ? 'player-two' : ''}">
            <td>${row.name}</td>
            <td>${row.player1}</td>
            <td>${row.player2}</td>
            <td>${row.owner === 0 ? '—' : row.owner + '. játékos'}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  `;
  elements.board.innerHTML = '';
  elements.board.appendChild(table);
}

function buildHand() {
  const hand = Game.getHand(Game.state.currentPlayer);
  elements.handList.innerHTML = '';
  hand.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-button';
    button.textContent = `${index + 1}. ${Game.cardName(card)}`;
    button.dataset.index = index.toString();
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
    <p>1. játékos: ${result.player1.score} pont, ${result.player1.geishaCount} gésa</p>
    <p>2. játékos: ${result.player2.score} pont, ${result.player2.geishaCount} gésa</p>
    <p>${result.winner === 0 ? 'Döntetlen.' : result.winner + '. játékos nyert.'}</p>
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
    Game.state.message = `Legalább ${pendingAction.maxSelection} kártyát kell kiválasztanod.`;
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
  Game.state.message = 'Kattints a felajánlott kártyák közül arra, amelyik az ellenfélhez kerül.';
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
  Game.state.message = 'Válassz egy párt. Az ellenfél ezt a párt kapja.';
}

function render() {
  updateStatus();
  buildBoard();
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
