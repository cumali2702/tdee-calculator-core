// app.js
document.addEventListener('DOMContentLoaded', () => {
  /* Element refs */
  const form = document.getElementById('form');
  const progress = document.getElementById('progress');
  const progressFill = progress?.querySelector('i');
  const result = document.getElementById('result');

  const tdeeValueEl = document.getElementById('tdeeValue');
  const bmrNote = document.getElementById('bmrNote');
  const macroSplit = document.getElementById('macroSplit');

  const donutCarbs = document.getElementById('donutCarbs');
  const donutProtein = document.getElementById('donutProtein');
  const donutFat = document.getElementById('donutFat');
  const donutKcal = document.getElementById('donutKcal');

  const barCarbs = document.getElementById('barCarbs');
  const barProtein = document.getElementById('barProtein');
  const barFat = document.getElementById('barFat');
  const carbsVal = document.getElementById('carbsVal');
  const proteinVal = document.getElementById('proteinVal');
  const fatVal = document.getElementById('fatVal');

  const bmiVal = document.getElementById('bmiVal');
  const protPerKg = document.getElementById('protPerKg');
  const deficitRange = document.getElementById('deficitRange');
  const weeklyChange = document.getElementById('weeklyChange');

  const shareBtn = document.getElementById('shareBtn');
  const copyBtn = document.getElementById('copyBtn');
  const openLinkBtn = document.getElementById('openLinkBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  const langSelect = document.getElementById('lang');
  const subtitle = document.getElementById('subtitle');
  const lead = document.getElementById('lead');

  const macroPreset = document.getElementById('macroPreset');
  const macroCustom = document.getElementById('macroCustom');
  const macroCarbs = document.getElementById('macroCarbs');
  const macroProtein = document.getElementById('macroProtein');
  const macroFat = document.getElementById('macroFat');
  const applyMacro = document.getElementById('applyMacro');

  /* Helpers and constants */
  const activityMap = {sedentary:1.2, light:1.375, moderate:1.55, active:1.725, athlete:1.9};
  const R = 15.9155;
  const CIRC = 2 * Math.PI * R;
  function toNum(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
  function fmt(n){ return new Intl.NumberFormat('en-GB').format(Math.round(n)); }

  /* Formulas */
  function mifflin({bio, weight, height, age}) { return (10 * weight) + (6.25 * height) - (5 * age) + (bio === 'male' ? 5 : -161); }
  function harris({bio, weight, height, age}) { if (bio === 'male') return 13.397 * weight + 4.799 * height - 5.677 * age + 88.362; return 9.247 * weight + 3.098 * height - 4.330 * age + 447.593; }
  function katch({weight, bodyfat}) { const lean = weight * (1 - (bodyfat / 100)); return 370 + (21.6 * lean); }

  /* Macro state and UI */
  let currentMacro = { carbsPct:45, proteinPct:25, fatPct:30 };

  function setMacroPreset(preset) {
    if (!macroCustom) return;
    if (preset === 'default') currentMacro = { carbsPct:45, proteinPct:25, fatPct:30 };
    else if (preset === 'highProtein') currentMacro = { carbsPct:40, proteinPct:35, fatPct:25 };
    else if (preset === 'lowCarb') currentMacro = { carbsPct:30, proteinPct:40, fatPct:30 };
    else if (preset === 'custom') { macroCustom.style.display = ''; return; }
    macroCustom.style.display = 'none';
    macroCarbs.value = currentMacro.carbsPct;
    macroProtein.value = currentMacro.proteinPct;
    macroFat.value = currentMacro.fatPct;
  }
  if (macroPreset) {
    macroPreset.addEventListener('change', (e) => {
      if (e.target.value === 'custom') macroCustom.style.display = '';
      else setMacroPreset(e.target.value);
    });
    setMacroPreset(macroPreset.value || 'default');
  }
  if (applyMacro) {
    applyMacro.addEventListener('click', () => {
      const c = toNum(macroCarbs.value), p = toNum(macroProtein.value), f = toNum(macroFat.value);
      if (c === null || p === null || f === null) { alert('Enter valid macro percentages'); return; }
      const sum = c + p + f;
      if (sum !== 100) { alert('Macro percentages must sum to 100'); return; }
      currentMacro = { carbsPct:c, proteinPct:p, fatPct:f };
      alert(`Custom macros set: ${c}/${p}/${f}`);
    });
  }

  function macros(tdee, goal='maintain') {
    const target = goal === 'cut10' ? tdee * 0.9 : goal === 'cut15' ? tdee * 0.85 : goal === 'bulk10' ? tdee * 1.1 : tdee;
    const carbsKcal = target * (currentMacro.carbsPct / 100);
    const proteinKcal = target * (currentMacro.proteinPct / 100);
    const fatKcal = target * (currentMacro.fatPct / 100);
    const carbs = Math.round(carbsKcal / 4);
    const protein = Math.round(proteinKcal / 4);
    const fat = Math.round(fatKcal / 9);
    return { target: Math.round(target), carbs, protein, fat, carbsKcal, proteinKcal, fatKcal };
  }

  /* Donut helpers */
  function setDonutSlices(carbsPct, proteinPct, fatPct) {
    if (!donutCarbs || !donutProtein || !donutFat) return;
    const carbsLen = (carbsPct / 100) * CIRC;
    const proteinLen = (proteinPct / 100) * CIRC;
    const fatLen = (fatPct / 100) * CIRC;
    donutCarbs.setAttribute('stroke-dasharray', `${carbsLen} ${CIRC - carbsLen}`); donutCarbs.setAttribute('stroke-dashoffset', 0);
    donutProtein.setAttribute('stroke-dasharray', `${proteinLen} ${CIRC - proteinLen}`); donutProtein.setAttribute('stroke-dashoffset', -carbsLen);
    donutFat.setAttribute('stroke-dasharray', `${fatLen} ${CIRC - fatLen}`); donutFat.setAttribute('stroke-dashoffset', -(carbsLen + proteinLen));
  }

  function animateCount(el, from, to, duration = 700) {
    if (!el) return; from = Number(from) || 0; to = Number(to) || 0;
    const start = performance.now(); const diff = to - from;
    function step(ts){ const t = Math.min(1, (ts - start) / duration); const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; const value = Math.round(from + diff * eased); el.textContent = value.toLocaleString('en-GB') + ' kcal/day'; if (t < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* Progress */
  function showProgress(){ if (progress) { progress.style.display = 'block'; if (progressFill) progressFill.style.width = '20%'; setTimeout(()=> { if (progressFill) progressFill.style.width = '70%'; }, 120); } }
  function hideProgress(){ if (progressFill) { progressFill.style.width = '100%'; setTimeout(()=> { if (progress) progress.style.display = 'none'; if (progressFill) progressFill.style.width = '0'; }, 450); } }

  /* i18n */
  const translations = {
    "en-GB": { subtitle:"EU metric units · Evidence-based formulas · No signup", lead:"Metric units (kg, cm). Choose formula and activity level." },
    "de":    { subtitle:"Metrische Einheiten · Evidenzbasierte Formeln · Keine Anmeldung", lead:"Metrische Einheiten (kg, cm). Wählen Sie Formel und Aktivitätsniveau." },
    "fr":    { subtitle:"Unités métriques · Formules basées sur des preuves · Pas d'inscription", lead:"Unités métriques (kg, cm). Choisissez la formule et le niveau d'activité." },
    "tr":    { subtitle:"Metric units · Science based formulas", lead:"Metric units (kg, cm)." }
  };
  function applyLanguage(code){ const t = translations[code] || translations['en-GB']; if (subtitle) subtitle.textContent = t.subtitle; if (lead) lead.textContent = t.lead; }
  if (langSelect) { applyLanguage(langSelect.value || 'en-GB'); langSelect.addEventListener('change', (e) => applyLanguage(e.target.value)); } else applyLanguage('en-GB');

  /* Form submit */
  if (!form) { console.error('Form not found (id="form")'); return; }
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const weight = toNum(data.weight), height = toNum(data.height), age = toNum(data.age);
    if (!age || !data.bio || !height || !weight || !data.activity) { alert('Please complete required fields with valid numbers.'); return; }
    showProgress();
    setTimeout(() => {
      const bodyfat = data.bodyfat ? toNum(data.bodyfat) : null;
      const formula = document.getElementById('formula')?.value || 'mifflin';
      let bmr = 0;
      try {
        if (formula === 'mifflin') bmr = mifflin({bio: data.bio, weight, height, age});
        else if (formula === 'harris') bmr = harris({bio: data.bio, weight, height, age});
        else if (formula === 'katch') { if (!bodyfat) { alert('Katch–McArdle requires body fat percentage.'); hideProgress(); return; } bmr = katch({weight, bodyfat}); }
      } catch (err) { alert('Calculation error: ' + err.message); hideProgress(); return; }
      bmr = Math.round(bmr);
      const tdee = Math.round(bmr * (activityMap[data.activity] || 1.2));
      const goal = document.getElementById('goal')?.value || 'maintain';
      const m = macros(tdee, goal);
      const bmi = weight / Math.pow(height/100, 2);
      const bmiRounded = Math.round(bmi * 10) / 10;
      const protMin = Math.round(1.6 * weight);
      const protMax = Math.round(2.2 * weight);
      const safeDeficitLow = Math.round(tdee * 0.10);
      const safeDeficitHigh = Math.round(tdee * 0.15);
      const weeklyKgLow = Math.round((safeDeficitLow * 7) / 7700 * 100) / 100;
      const weeklyKgHigh = Math.round((safeDeficitHigh * 7) / 7700 * 100) / 100;
      const last = Number(tdeeValueEl?.dataset?.last) || 0;
      animateCount(tdeeValueEl, last, tdee, 800);
      if (tdeeValueEl) tdeeValueEl.dataset.last = tdee;
      if (bmrNote) bmrNote.textContent = `BMR: ${fmt(bmr)} kcal/day · Formula: ${formula === 'mifflin' ? 'Mifflin–St Jeor' : formula === 'harris' ? 'Harris–Benedict' : 'Katch–McArdle'}`;
      if (macroSplit) macroSplit.textContent = `${m.carbs}g carbs · ${m.protein}g protein · ${m.fat}g fat · ${fmt(m.target)} kcal`;
      const totalKcal = m.target || 1;
      const carbsPct = Math.round((m.carbs * 4 / totalKcal) * 100);
      const proteinPct = Math.round((m.protein * 4 / totalKcal) * 100);
      const fatPct = Math.max(0, 100 - carbsPct - proteinPct);
      setDonutSlices(carbsPct, proteinPct, fatPct);
      if (donutKcal) donutKcal.textContent = (Math.round(m.target / 100) / 10) + 'k';
      if (barCarbs) barCarbs.style.width = Math.max(4, carbsPct) + '%';
      if (barProtein) barProtein.style.width = Math.max(4, proteinPct) + '%';
      if (barFat) barFat.style.width = Math.max(4, fatPct) + '%';
      if (carbsVal) carbsVal.textContent = m.carbs + ' g';
      if (proteinVal) proteinVal.textContent = m.protein + ' g';
      if (fatVal) fatVal.textContent = m.fat + ' g';
      if (bmiVal) bmiVal.textContent = bmiRounded;
      if (protPerKg) protPerKg.textContent = `${Math.round((m.protein / weight) * 10) / 10} g/kg · ${protMin}-${protMax} g/day`;
      if (deficitRange) deficitRange.textContent = `${safeDeficitLow}–${safeDeficitHigh} kcal/day`;
      if (weeklyChange) weeklyChange.textContent = `${weeklyKgLow}–${weeklyKgHigh} kg/week (est.)`;
      result.hidden = false;
      hideProgress();
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data)) if (v) params.set(k, v);
      params.set('formula', formula);
      params.set('goal', goal);
      history.replaceState(null, '', location.pathname + '?' + params.toString());
    }, 350);
  });

  /* Share / copy / open link / export PDF helpers */

  function buildSharePayload({tdee, bmr, carbs, protein, fat}) {
    const title = 'My TDEE result';
    const text = `My estimated TDEE: ${tdee} kcal/day (BMR ${bmr} kcal/day). Macros: ${carbs}g carbs / ${protein}g protein / ${fat}g fat.`;
    const url = location.origin + location.pathname + location.search;
    return { title, text, url };
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      let payload;
      if (!result.hidden && tdeeValueEl && bmrNote) {
        const tdeeText = tdeeValueEl.textContent.replace(' kcal/day','').replace(/,/g,'').trim();
        const bmrMatch = bmrNote.textContent.match(/BMR:\s*([\d,]+)/);
        const bmr = bmrMatch ? bmrMatch[1].replace(/,/g,'') : '';
        const carbs = carbsVal ? carbsVal.textContent.replace(' g','') : '';
        const protein = proteinVal ? proteinVal.textContent.replace(' g','') : '';
        const fat = fatVal ? fatVal.textContent.replace(' g','') : '';
        payload = buildSharePayload({ tdee: tdeeText, bmr, carbs, protein, fat });
      } else payload = { title: 'TDEE Calculator (EU)', text: 'Calculate your daily calorie needs with EU-standard formulas.', url: location.origin + location.pathname };
      if (navigator.share) {
        try { await navigator.share({ title: payload.title, text: payload.text, url: payload.url }); return; }
        catch (err) { /* fallback below */ }
      }
      const twitterText = encodeURIComponent(payload.text + ' ' + payload.url);
      window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank', 'noopener');
    });
  }

  /* Mobile-friendly copy fallback */
  async function safeCopy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn('Clipboard API failed', e);
    }
    try {
      window.prompt('Copy the results below (Ctrl/Cmd+C then Enter)', text);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        if (!result || result.hidden) { alert('No results to copy. Calculate first.'); return; }
        const tdeeText = (tdeeValueEl?.textContent || '').trim();
        const bmrText = (bmrNote?.textContent || '').trim();
        const macrosText = `${carbsVal?.textContent || ''} / ${proteinVal?.textContent || ''} / ${fatVal?.textContent || ''}`;
        const bmiText = `BMI: ${bmiVal?.textContent || ''}`;
        const url = location.origin + location.pathname + location.search;
        const text = `${tdeeText}\n${bmrText}\nMacros: ${macrosText}\n${bmiText}\n${url}`;
        const ok = await safeCopy(text);
        if (ok) {
          copyBtn.textContent = 'Copied';
          setTimeout(()=> copyBtn.textContent = 'Copy results', 1400);
        } else {
          alert('Unable to copy automatically. A prompt was shown for manual copy.');
        }
      } catch (err) {
        console.error('Copy failed', err);
        alert('Unable to copy results.');
      }
    }, { passive: true });
  }

  if (openLinkBtn) {
    openLinkBtn.addEventListener('click', async () => {
      const shareUrl = location.origin + location.pathname + location.search;
      if (navigator.share) {
        try { await navigator.share({ title: document.title, text: 'My TDEE result', url: shareUrl }); return; } catch (err) {}
      }
      window.open(shareUrl, '_blank', 'noopener');
    }, { passive: true });
  }

  /* Simple export PDF: open print dialog */
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      if (!result || result.hidden) { alert('No results to export. Calculate first.'); return; }
      setTimeout(() => { window.print(); }, 80);
    }, { passive: true });
  }

  /* Prefill from URL params */
  (function loadFromURL(){
    const params = new URLSearchParams(location.search);
    if (params.has('age')) document.getElementById('age').value = params.get('age');
    if (params.has('bio')) document.getElementById('bio').value = params.get('bio');
    if (params.has('height')) document.getElementById('height').value = params.get('height');
    if (params.has('weight')) document.getElementById('weight').value = params.get('weight');
    if (params.has('activity')) document.getElementById('activity').value = params.get('activity');
    if (params.has('formula')) document.getElementById('formula').value = params.get('formula');
    if (params.has('goal')) document.getElementById('goal').value = params.get('goal');
    if (params.has('bodyfat')) document.getElementById('bodyfat').value = params.get('bodyfat');
  })();

});

document.querySelectorAll('.faq-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.faq-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.faq-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});
