require('dotenv/config');
const path = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');
const childProcess = require('child_process');

const TEMP_DIR = path.join(__dirname, '..', 'dist', 'temp');

if (!fs.statSync(TEMP_DIR).isDirectory()) {
  fs.mkdirSync(TEMP_DIR);
}

// Download "CodeSignTool" and move to /scripts/CodeSignTool
// https://www.ssl.com/download/codesigntool-for-windows/
const CODE_SIGN_TOOL_DIR = path.join(__dirname, 'CodeSignTool');
const CODE_SIGN_TOOL_PATH = path.join(CODE_SIGN_TOOL_DIR, 'CodeSignTool.bat');

// Validate CodeSignTool existence
if (!fs.existsSync(CODE_SIGN_TOOL_PATH)) {
  console.error(`
Error: CodeSignTool not found at ${CODE_SIGN_TOOL_PATH}

Please follow these steps:
1. Download CodeSignTool from: https://www.ssl.com/download/codesigntool-for-windows/
2. Extract the downloaded file
3. Move the extracted 'CodeSignTool' folder to: ${CODE_SIGN_TOOL_DIR}
`);
  process.exit(1);
}

function sign(configuration) {
  // credentials from ssl.com
  const USER_NAME = process.env.WINDOWS_SIGN_USER_NAME;
  const USER_PASSWORD = process.env.WINDOWS_SIGN_USER_PASSWORD;
  const CREDENTIAL_ID = process.env.WINDOWS_SIGN_CREDENTIAL_ID;
  const USER_TOTP = process.env.WINDOWS_SIGN_USER_TOTP;
  if (USER_NAME && USER_PASSWORD && USER_TOTP && CREDENTIAL_ID) {
    console.log(`Signing ${configuration.path}`);
    const { name, dir } = path.parse(configuration.path);

    const tempFile = path.join(TEMP_DIR, name);
    const setDir = `cd "${CODE_SIGN_TOOL_DIR}"`;
    const signFile = `CodeSignTool.bat sign -input_file_path=${configuration.path} -output_dir_path=${TEMP_DIR} -credential_id=${CREDENTIAL_ID} -username=${USER_NAME} -password=${USER_PASSWORD} -totp_secret=${USER_TOTP}`;
    const moveFile = `move "${tempFile}.exe" "${dir}"`;

    childProcess.execSync(`${setDir} && ${signFile} && ${moveFile}`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
  } else {
    console.warn(`sign.js - Can't sign file ${configuration.path}, missing value for:
${USER_NAME ? '' : 'WINDOWS_SIGN_USER_NAME'}
${USER_PASSWORD ? '' : 'WINDOWS_SIGN_USER_PASSWORD'}
${CREDENTIAL_ID ? '' : 'WINDOWS_SIGN_CREDENTIAL_ID'}
${USER_TOTP ? '' : 'WINDOWS_SIGN_USER_TOTP'}
`);
    process.exit(1);
  }
}

module.exports = sign;