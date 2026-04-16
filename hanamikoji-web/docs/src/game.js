const CARD_NAMES = [
  '',
  'furulya 2',
  'legyező 2',
  'tekercs 2',
  'ernyő 3',
  'dibár 3',
  'tea 4',
  'virág 5'
];
const CARD_VALUES = [0, 2, 2, 2, 3, 3, 4, 5];
const INITIAL_DECK = [1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 7];

export const state = {
  deck: [],
  currentPlayer: 1,
  turnsTaken: 0,
  players: {
    1: {
      hand: [],
      actions: {
        secret: true,
        tradeoff: true,
        gift: true,
        competition: true
      }
    },
    2: {
      hand: [],
      actions: {
        secret: true,
        tradeoff: true,
        gift: true,
        competition: true
      }
    }
  },
  geishagifts: [null, Array(8).fill(0), Array(8).fill(0)],
  secretCard: [null, null, null],
  geishalove: Array(8).fill(0),
  scores: [0, 0, 0],
  geishaCount: [0, 0, 0],
  gameOver: false,
  winner: 0,
  message: ''
};

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function other(player) {
  return player === 1 ? 2 : 1;
}

function sortHand(hand) {
  hand.sort((a, b) => b - a);
}

export function cardName(code) {
  return CARD_NAMES[code] || 'ismeretlen';
}

export function cardValue(code) {
  return CARD_VALUES[code] || 0;
}

export function resetGame() {
  state.deck = shuffle(INITIAL_DECK);
  state.currentPlayer = 1;
  state.turnsTaken = 0;
  state.players[1].hand = state.deck.slice(0, 6);
  state.players[2].hand = state.deck.slice(6, 12);
  state.deck = state.deck.slice(12);
  sortHand(state.players[1].hand);
  sortHand(state.players[2].hand);
  state.players[1].actions = { secret: true, tradeoff: true, gift: true, competition: true };
  state.players[2].actions = { secret: true, tradeoff: true, gift: true, competition: true };
  state.geishagifts = [null, Array(8).fill(0), Array(8).fill(0)];
  state.secretCard = [null, null, null];
  state.geishalove = Array(8).fill(0);
  state.scores = [0, 0, 0];
  state.geishaCount = [0, 0, 0];
  state.gameOver = false;
  state.winner = 0;
  state.message = 'A játék elkezdődött. Az első játékos körrel kezd.';
}

export function startGame() {
  resetGame();
  drawCard(state.currentPlayer);
}

export function drawCard(player) {
  if (state.deck.length === 0) {
    return;
  }
  const card = state.deck.shift();
  state.players[player].hand.push(card);
  sortHand(state.players[player].hand);
}

export function getHand(player) {
  return [...state.players[player].hand];
}

export function canUseAction(player, action) {
  return state.players[player].actions[action] && !state.gameOver;
}

function removeCardsFromHand(hand, indexes) {
  const sorted = [...indexes].sort((a, b) => b - a);
  const removed = [];
  for (const index of sorted) {
    if (index >= 0 && index < hand.length) {
      removed.unshift(hand.splice(index, 1)[0]);
    }
  }
  return removed;
}

function advanceTurn() {
  state.turnsTaken += 1;
  if (state.turnsTaken >= 8) {
    finishGame();
    return;
  }
  state.currentPlayer = other(state.currentPlayer);
  drawCard(state.currentPlayer);
}

export function performSecret(player, cardIndex) {
  const hand = state.players[player].hand;
  if (!state.players[player].actions.secret || cardIndex < 0 || cardIndex >= hand.length) {
    return false;
  }
  const card = hand.splice(cardIndex, 1)[0];
  state.secretCard[player] = card;
  state.players[player].actions.secret = false;
  state.message = `A ${CARD_NAMES[card]} kártya titokként félretenve.`;
  advanceTurn();
  return true;
}

export function performTradeoff(player, cardIndexes) {
  const hand = state.players[player].hand;
  if (!state.players[player].actions.tradeoff || cardIndexes.length !== 2) {
    return false;
  }
  removeCardsFromHand(hand, cardIndexes);
  state.players[player].actions.tradeoff = false;
  state.message = 'A kompromisszum megtörtént. Két kártyát eldobtál.';
  advanceTurn();
  return true;
}

export function performGift(player, cardIndexes, chosenOfferIndex) {
  const hand = state.players[player].hand;
  if (!state.players[player].actions.gift || cardIndexes.length !== 3) {
    return false;
  }
  const selected = removeCardsFromHand(hand, cardIndexes);
  if (chosenOfferIndex < 0 || chosenOfferIndex >= selected.length) {
    return false;
  }
  const opponent = other(player);
  for (let i = 0; i < selected.length; i++) {
    if (i === chosenOfferIndex) {
      state.geishagifts[opponent][selected[i]] += 1;
    } else {
      state.geishagifts[player][selected[i]] += 1;
    }
  }
  state.players[player].actions.gift = false;
  state.message = 'Ajándék akció végrehajtva.';
  advanceTurn();
  return true;
}

export function performCompetition(player, cardIndexes, chosenPair) {
  const hand = state.players[player].hand;
  if (!state.players[player].actions.competition || cardIndexes.length !== 4) {
    return false;
  }
  const selected = removeCardsFromHand(hand, cardIndexes);
  if (chosenPair !== 1 && chosenPair !== 2) {
    return false;
  }
  const opponent = other(player);
  const firstPair = [selected[0], selected[1]];
  const secondPair = [selected[2], selected[3]];
  const playerPair = chosenPair === 2 ? firstPair : secondPair;
  const opponentPair = chosenPair === 2 ? secondPair : firstPair;
  for (const card of playerPair) {
    state.geishagifts[player][card] += 1;
  }
  for (const card of opponentPair) {
    state.geishagifts[opponent][card] += 1;
  }
  state.players[player].actions.competition = false;
  state.message = 'Versenyzés befejezve. Az ellenfél választása érvényesült.';
  advanceTurn();
  return true;
}

function computeEndgame() {
  if (state.secretCard[1] !== null) {
    state.geishagifts[1][state.secretCard[1]] += 1;
  }
  if (state.secretCard[2] !== null) {
    state.geishagifts[2][state.secretCard[2]] += 1;
  }
  state.geishalove = Array(8).fill(0);
  state.scores = [0, 0, 0];
  state.geishaCount = [0, 0, 0];
  for (let i = 1; i <= 7; i++) {
    if (state.geishagifts[1][i] > state.geishagifts[2][i]) {
      state.geishalove[i] = 1;
      state.scores[1] += CARD_VALUES[i];
      state.geishaCount[1] += 1;
    } else if (state.geishagifts[2][i] > state.geishagifts[1][i]) {
      state.geishalove[i] = 2;
      state.scores[2] += CARD_VALUES[i];
      state.geishaCount[2] += 1;
    }
  }
  if (state.geishaCount[1] > 3 || state.scores[1] > 10) {
    state.winner = 1;
  } else if (state.geishaCount[2] > 3 || state.scores[2] > 10) {
    state.winner = 2;
  } else if (state.scores[1] > state.scores[2]) {
    state.winner = 1;
  } else if (state.scores[2] > state.scores[1]) {
    state.winner = 2;
  } else {
    state.winner = 0;
  }
}

function finishGame() {
  computeEndgame();
  state.gameOver = true;
  if (state.winner === 0) {
    state.message = 'Döntetlen!';
  } else {
    state.message = `A játék véget ért. A nyertes: ${state.winner}. játékos.`;
  }
}

export function getGeishaRows() {
  return Array.from({ length: 7 }, (_, index) => {
    const cardId = index + 1;
    return {
      id: cardId,
      name: CARD_NAMES[cardId],
      value: CARD_VALUES[cardId],
      player1: state.geishagifts[1][cardId],
      player2: state.geishagifts[2][cardId],
      owner: state.geishalove[cardId]
    };
  });
}

export function getResultSummary() {
  return {
    player1: {
      score: state.scores[1],
      geishaCount: state.geishaCount[1]
    },
    player2: {
      score: state.scores[2],
      geishaCount: state.geishaCount[2]
    },
    winner: state.winner
  };
}
