import { init, check } from '../dist/index.js'; // adjust if dist path differs

const btn = document.getElementById('btn') as HTMLButtonElement;
const txt = document.getElementById('txt') as HTMLTextAreaElement;
const out = document.getElementById('out') as HTMLPreElement;

(async () => {
  out.textContent = 'Loading engine…';
  await init();                 // spins up worker & loads WASM
  out.textContent = 'Ready ✔ – click "Analyze".';
  btn.disabled = false;
})();

btn.addEventListener('click', async () => {
  out.textContent = 'Checking…';
  const issues = await check(txt.value);
  out.textContent = JSON.stringify(issues, null, 2);
});
