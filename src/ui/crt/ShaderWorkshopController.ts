import { exportShaderWorkshopSettings, importShaderWorkshopSettings, readShaderWorkshopSettings, SHADER_WORKSHOP_PRESETS, type ShaderWorkshopPreset, writeShaderWorkshopSettings } from '../../core/rendering/crt/ShaderWorkshop';

export function installShaderWorkshopController() {
  const root = document.createElement('aside'); root.className = 'shader-workshop'; root.hidden = true; root.dataset.arcadeOverlay = 'true';
  root.innerHTML = `<header><h2>SHADER WORKSHOP</h2><button data-close>BACK</button></header><p>Calibrate bounded display uniforms. The fixed 60 Hz game simulation is unaffected.</p><label>FACTORY <select data-preset>${Object.keys(SHADER_WORKSHOP_PRESETS).map(name => `<option value="${name}">${name.replaceAll('_', ' ')}</option>`).join('')}</select></label><div data-controls></div><button data-save>SAVE LOCAL</button><button data-export>EXPORT</button><textarea data-import placeholder="Paste exported workshop JSON"></textarea><button data-import-button>IMPORT</button>`;
  document.body.appendChild(root);
  const controls = root.querySelector<HTMLElement>('[data-controls]')!;
  const fields = ['curvature', 'scanlineIntensity', 'bloomIntensity', 'shadowMaskIntensity', 'persistenceMs', 'aberrationPixels', 'vignetteIntensity'] as const;
  controls.innerHTML = fields.map(field => `<label>${field.replace(/([A-Z])/g, ' $1').toUpperCase()} <input data-field="${field}" type="range" min="0" max="${field === 'persistenceMs' ? 120 : field === 'aberrationPixels' ? 2 : field === 'curvature' ? .14 : 1}" step="${field === 'persistenceMs' ? 1 : .01}"></label>`).join('');
  const inputs = () => Object.fromEntries(fields.map(field => [field, Number(root.querySelector<HTMLInputElement>(`[data-field="${field}"]`)!.value)]));
  const render = (value = readShaderWorkshopSettings(localStorage)) => fields.forEach(field => root.querySelector<HTMLInputElement>(`[data-field="${field}"]`)!.value = String(value[field]));
  const save = () => { writeShaderWorkshopSettings(localStorage, inputs()); localStorage.setItem('arcade_shader_workshop_enabled', 'true'); window.dispatchEvent(new Event('arcade-settings-change')); };
  root.querySelector('[data-close]')!.addEventListener('click', () => root.hidden = true);
  root.querySelector<HTMLSelectElement>('[data-preset]')!.addEventListener('change', event => { const preset = (event.target as HTMLSelectElement).value as ShaderWorkshopPreset; render(SHADER_WORKSHOP_PRESETS[preset]); save(); });
  controls.addEventListener('input', save); root.querySelector('[data-save]')!.addEventListener('click', save);
  root.querySelector('[data-export]')!.addEventListener('click', () => void navigator.clipboard?.writeText(exportShaderWorkshopSettings(inputs())));
  root.querySelector('[data-import-button]')!.addEventListener('click', () => { const value = importShaderWorkshopSettings(root.querySelector<HTMLTextAreaElement>('[data-import]')!.value); if (value) { render(value); save(); } });
  window.addEventListener('arcade-shader-workshop-open', () => { render(); root.hidden = false; });
}
