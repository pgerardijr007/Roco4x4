const electronInstaller = require('electron-winstaller');

async function build() {
  console.log('Starting installer compilation...');
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: './public/Roco_4x4-win32-x64',
      outputDirectory: './public/Roco_4x4_Installer',
      authors: 'Roco 4x4',
      exe: 'Roco_4x4.exe',
      setupExe: 'Roco_4x4_Setup.exe',
      noMsi: true,
      description: 'Roco 4x4 B2B Catalogue Portal Installer'
    });
    console.log('Installer successfully built! Roco_4x4_Setup.exe generated.');
  } catch (e) {
    console.error(`Installer generation failed: ${e.message}`);
  }
}

build();
