const display = document.getElementById('display');
const expressionEl = document.getElementById('expression');

const state = {
  current: '0',
  previous: null,
  operator: null,
  shouldResetCurrent: false,
  justEvaluated: false,
};

const symbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

let audioContext;

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioContext = new Context();
  }
  return audioContext;
}

function playTapSound() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(480, now);
  oscillator.frequency.exponentialRampToValueAtTime(340, now + 0.045);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.065);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatNumber(value) {
  if (value === 'Error') return value;
  const str = String(value);
  if (str === '' || str === '-') return str || '0';

  const num = toNumber(str);
  if (Number.isNaN(num)) return 'Error';

  return num.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function setError() {
  state.current = 'Error';
  state.previous = null;
  state.operator = null;
  state.shouldResetCurrent = true;
  state.justEvaluated = true;
}

function compute() {
  if (!state.operator || state.previous === null) return;

  const a = toNumber(state.previous);
  const b = toNumber(state.current);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    setError();
    return;
  }

  let result;
  switch (state.operator) {
    case '+':
      result = a + b;
      break;
    case '-':
      result = a - b;
      break;
    case '*':
      result = a * b;
      break;
    case '/':
      if (b === 0) {
        setError();
        return;
      }
      result = a / b;
      break;
    default:
      return;
  }

  const rounded = Number(result.toFixed(10));
  state.current = String(rounded);
  state.previous = null;
  state.operator = null;
  state.shouldResetCurrent = true;
  state.justEvaluated = true;
}

function updateDisplay() {
  display.textContent = formatNumber(state.current);

  if (state.operator && state.previous !== null) {
    expressionEl.textContent = `${formatNumber(state.previous)} ${symbols[state.operator]}`;
  } else {
    expressionEl.textContent = '\u00A0';
  }
}

function clearAll() {
  state.current = '0';
  state.previous = null;
  state.operator = null;
  state.shouldResetCurrent = false;
  state.justEvaluated = false;
}

function clearEntry() {
  state.current = '0';
}

function appendNumber(char) {
  if (state.current === 'Error') clearAll();

  if (state.shouldResetCurrent) {
    state.current = '0';
    state.shouldResetCurrent = false;
  }

  if (char === '.') {
    if (state.current.includes('.')) return;
    state.current += '.';
    return;
  }

  state.current = state.current === '0' ? char : state.current + char;
  state.justEvaluated = false;
}

function chooseOperator(op) {
  if (state.current === 'Error') return;

  if (state.operator && !state.shouldResetCurrent) {
    compute();
  }

  state.previous = state.current;
  state.operator = op;
  state.shouldResetCurrent = true;
  state.justEvaluated = false;
}

function toggleSign() {
  if (state.current === 'Error' || state.current === '0') return;
  state.current = state.current.startsWith('-') ? state.current.slice(1) : `-${state.current}`;
}

function applyPercent() {
  if (state.current === 'Error') return;

  const value = toNumber(state.current);
  if (Number.isNaN(value)) {
    setError();
    return;
  }

  if (state.previous !== null && state.operator) {
    const base = toNumber(state.previous);
    if (Number.isNaN(base)) {
      setError();
      return;
    }

    if (state.operator === '+' || state.operator === '-') {
      state.current = String((base * value) / 100);
    } else {
      state.current = String(value / 100);
    }
  } else {
    state.current = String(value / 100);
  }
}

function deleteLast() {
  if (state.current === 'Error') {
    clearAll();
    return;
  }

  if (state.shouldResetCurrent) return;

  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
    state.current = '0';
    return;
  }

  state.current = state.current.slice(0, -1);
}

function handleAction(action) {
  if (['+', '-', '*', '/'].includes(action)) {
    chooseOperator(action);
    return;
  }

  switch (action) {
    case '=':
      compute();
      break;
    case 'clear-all':
      clearAll();
      break;
    case 'clear-entry':
      clearEntry();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'toggle-sign':
      toggleSign();
      break;
    case 'percent':
      applyPercent();
      break;
  }
}

document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const num = btn.dataset.number;
    const action = btn.dataset.action;

    playTapSound();

    if (num !== undefined) appendNumber(num);
    if (action) handleAction(action);

    updateDisplay();
  });
});

window.addEventListener('keydown', (event) => {
  const { key } = event;
  let handled = true;

  if ((key >= '0' && key <= '9') || key === '.') {
    appendNumber(key);
  } else if (['+', '-', '*', '/'].includes(key)) {
    handleAction(key);
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleAction('=');
  } else if (key === 'Backspace') {
    handleAction('delete');
  } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    handleAction('clear-all');
  } else if (key === '%') {
    handleAction('percent');
  } else {
    handled = false;
  }

  if (!handled) return;

  playTapSound();
  updateDisplay();
});

updateDisplay();
