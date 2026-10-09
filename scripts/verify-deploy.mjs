// Comprueba que lo que corre en el servidor es EXACTAMENTE lo que está en la rama principal de GitHub.
//   node scripts/verify-deploy.mjs [dirección]          (por defecto https://57-156-57-186.sslip.io)
// Compara el commit que publica /version.json con el último commit de main en GitHub.
import { execFileSync } from 'node:child_process';

const base = (process.argv[2] || 'https://57-156-57-186.sslip.io').replace(/\/$/, '');
const repo = 'https://github.com/cuoconatwatah-create/Metztli.git';

const res = await fetch(`${base}/version.json`, { headers: { 'Cache-Control': 'no-cache' } });
if (!res.ok) { console.error(`✗ ${base}/version.json respondió ${res.status}`); process.exit(1); }
const deployed = await res.json();

const line = execFileSync('git', ['ls-remote', repo, 'refs/heads/main'], { encoding: 'utf8' }).trim();
const main = line.split(/\s+/)[0];

console.log(`Servidor  : ${base}`);
console.log(`Versión   : ${deployed.version}  (rama ${deployed.rama}, publicado ${deployed.desplegado})`);
console.log(`Commit en Azure : ${deployed.commit}`);
console.log(`Commit en main  : ${main}`);
if (deployed.commit === main) {
  console.log('\n✓ IDÉNTICOS: el código publicado en Azure es el de la rama principal.');
} else {
  console.log('\n✗ DIFERENTES: Azure no está en el último commit de main. Actualiza con 6-actualizar.sh.');
  process.exit(2);
}
