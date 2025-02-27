import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const productName = packageJson.build.productName;
const version = packageJson.version;
const installerName = `${productName}-SETUP-v${version}.exe`;
const installerPath = path.join(__dirname, '..', 'dist', 'nsis-web', installerName);

console.log(`Buscando instalador en: ${installerPath}`);

if (fs.existsSync(installerPath)) {
  console.log(`Ejecutando instalador: ${installerName}`);
  try {
    execSync(`"${installerPath}" /S`, { stdio: 'inherit' });
    console.log('Instalación completada con éxito');
  } catch (error) {
    console.error('Error durante la instalación:', error);
  }
} else {
  console.error(`No se encontró el instalador en: ${installerPath}`);
  const distFiles = fs.readdirSync(path.join(__dirname, '..', 'dist', 'nsis-web'));
  console.log('Archivos disponibles en dist:', distFiles);
}