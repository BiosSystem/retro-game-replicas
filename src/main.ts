import './style.css';

async function bootArcade() {
  const boot = document.getElementById('bios-post');
  const firstBoot = sessionStorage.getItem('bios_post_complete') !== 'true';
  if (boot && firstBoot) {
    boot.classList.add('bios-post-visible');
    const output = boot.querySelector('[data-post-output]');
    const lines = ['BIOSSYSTEM ARCADE BIOS v3.0', 'ROM CHECK ........ OK', 'VECTOR UNIT ...... OK', 'AUDIO DSP ........ OK', 'RAM 640K ......... OK', 'BOOTING ARCADE CORE'];
    for (const line of lines) {
      if (output) output.textContent += `${line}\n`;
      await new Promise(resolve => window.setTimeout(resolve, 150));
    }
    sessionStorage.setItem('bios_post_complete', 'true');
    await new Promise(resolve => window.setTimeout(resolve, 250));
  }
  boot?.classList.remove('bios-post-visible');
  await import('./bootstrap');
}

void bootArcade();
