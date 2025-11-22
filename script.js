const display = document.getElementById('display');
let current = '';
let previous = '';
let operator = null;
let resetNext = false;

function updateDisplay(){
  display.textContent = current || previous || '0';
}

function appendNumber(num){
  if(resetNext){ current = ''; resetNext = false; }
  if(num === '.' && current.includes('.')) return;
  if(current === '0' && num !== '.') current = num;
  else current = (current || '') + num;
}

function chooseOperator(op){
  if(current === '' && previous === '') return;
  if(previous !== '' && current !== '') compute();
  operator = op;
  if(current !== ''){ previous = current; current = ''; }
}

function compute(){
  if(!operator || previous === '' ) return;
  const a = parseFloat(previous);
  const b = parseFloat(current || previous);
  let result = 0;
  switch(operator){
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = b === 0 ? 'Error' : a / b; break;
    case '%': result = a % b; break;
  }
  result = (typeof result === 'number' && !Number.isInteger(result)) 
    ? parseFloat(result.toFixed(8)) : result;

  current = String(result);
  previous = '';
  operator = null;
  resetNext = true;
}

function clearAll(){ current = ''; previous = ''; operator = null; }
function deleteLast(){ if(current) current = current.slice(0,-1); }

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const num = btn.dataset.number;
    const action = btn.dataset.action;

    if(num !== undefined) { appendNumber(num); updateDisplay(); return; }
    if(action){
      if(['+','-','*','/'].includes(action)) { chooseOperator(action); updateDisplay(); return; }
      if(action === '='){ if(operator) compute(); updateDisplay(); return; }
      if(action === 'clear'){ clearAll(); updateDisplay(); return; }
      if(action === 'delete'){ deleteLast(); updateDisplay(); return; }
      if(action === 'percent'){ chooseOperator('%'); compute(); updateDisplay(); return; }
    }
  });
});

window.addEventListener('keydown', (e) => {
  if((e.key >= '0' && e.key <= '9') || e.key === '.') { appendNumber(e.key); updateDisplay(); }
  if(['+','-','*','/'].includes(e.key)) { chooseOperator(e.key); updateDisplay(); }
  if(e.key === 'Enter' || e.key === '=') { if(operator) compute(); updateDisplay(); }
  if(e.key === 'Backspace') { deleteLast(); updateDisplay(); }
  if(e.key.toLowerCase() === 'c') { clearAll(); updateDisplay(); }
});

updateDisplay();
