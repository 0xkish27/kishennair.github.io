/* shared helpers */
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}} };
