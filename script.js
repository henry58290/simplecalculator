const display = document.getElementById('display');
const expression = document.getElementById('expression');
const historyElement = document.getElementById('history');
const clearHistoryButton = document.getElementById('clearHistory');

let current = '0';
let previous = null;
let operator = null;
let shouldResetInput = false;
const history = [];

function formatNumber(value) {
  if (value === 'Error') {
    return value;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 'Error';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10
  }).format(numeric);
}

function updateDisplay() {
  display.textContent = formatNumber(current);
  expression.textContent = previous !== null && operator
    ? `${formatNumber(previous)} ${operator}`
    : '\u00a0';
}

function inputNumber(value) {
  if (current === 'Error') {
    current = '0';
  }

  if (shouldResetInput) {
    current = '0';
    shouldResetInput = false;
  }

  if (value === '.') {
    if (!current.includes('.')) {
      current += '.';
    }
    return;
  }

  current = current === '0' ? value : current + value;
}

function clearAll() {
  current = '0';
  previous = null;
  operator = null;
  shouldResetInput = false;
}

function deleteLast() {
  if (shouldResetInput || current === 'Error') {
    current = '0';
    shouldResetInput = false;
    return;
  }

  current = current.length <= 1 ? '0' : current.slice(0, -1);
}

function calculate(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? 'Error' : a / b;
    default:
      return b;
  }
}

function chooseOperator(nextOperator) {
  if (current === 'Error') {
    return;
  }

  const inputValue = Number(current);

  if (previous === null) {
    previous = inputValue;
  } else if (!shouldResetInput) {
    const result = calculate(previous, inputValue, operator);
    if (result === 'Error') {
      current = 'Error';
      previous = null;
      operator = null;
      shouldResetInput = true;
      return;
    }

    previous = result;
    current = String(result);
  }

  operator = nextOperator;
  shouldResetInput = true;
}

function addToHistory(statement) {
  history.unshift(statement);
  if (history.length > 5) {
    history.pop();
  }

  historyElement.innerHTML = '';
  history.forEach((item) => {
    const entry = document.createElement('li');
    entry.textContent = item;
    historyElement.appendChild(entry);
  });
}

function applyImmediateOperation(action) {
  const value = Number(current);
  let result;

  switch (action) {
    case 'negate':
      result = -value;
      break;
    case 'percent':
      result = value / 100;
      break;
    case 'square':
      result = value * value;
      break;
    case 'sqrt':
      result = value < 0 ? 'Error' : Math.sqrt(value);
      break;
    case 'reciprocal':
      result = value === 0 ? 'Error' : 1 / value;
      break;
    default:
      return;
  }

  current = result === 'Error' ? result : String(result);
  shouldResetInput = result !== 'Error';
}

function evaluate() {
  if (operator === null || previous === null) {
    return;
  }

  const a = previous;
  const b = Number(current);
  const result = calculate(a, b, operator);

  if (result === 'Error') {
    current = 'Error';
    previous = null;
    operator = null;
    shouldResetInput = true;
    updateDisplay();
    return;
  }

  addToHistory(`${formatNumber(a)} ${operator} ${formatNumber(b)} = ${formatNumber(result)}`);
  current = String(result);
  previous = null;
  operator = null;
  shouldResetInput = true;
}

function handleAction(action) {
  if (['+', '-', '*', '/'].includes(action)) {
    chooseOperator(action);
    return;
  }

  switch (action) {
    case '=':
      evaluate();
      break;
    case 'clear':
      clearAll();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'negate':
    case 'percent':
    case 'square':
    case 'sqrt':
    case 'reciprocal':
      applyImmediateOperation(action);
      break;
    default:
      break;
  }
}

document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.number !== undefined) {
      inputNumber(button.dataset.number);
    } else if (button.dataset.action) {
      handleAction(button.dataset.action);
    }

    updateDisplay();
  });
});

clearHistoryButton.addEventListener('click', () => {
  history.length = 0;
  historyElement.innerHTML = '';
});

window.addEventListener('keydown', (event) => {
  if ((event.key >= '0' && event.key <= '9') || event.key === '.') {
    inputNumber(event.key);
  } else if (['+', '-', '*', '/'].includes(event.key)) {
    chooseOperator(event.key);
  } else if (event.key === 'Enter' || event.key === '=') {
    evaluate();
  } else if (event.key === 'Backspace') {
    deleteLast();
  } else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
    clearAll();
  } else if (event.key === '%') {
    applyImmediateOperation('percent');
  } else {
    return;
  }

  updateDisplay();
});

updateDisplay();
