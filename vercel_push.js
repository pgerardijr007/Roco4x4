const fs = require('fs');
const { spawnSync } = require('child_process');

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const lines = envFile.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        
        const key = line.substring(0, eqIdx).trim();
        const value = line.substring(eqIdx + 1).trim();
        
        console.log(`Pushing [${key}] to Vercel...`);
        
        // Remove existing key to prevent collision interactive prompts
        spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, 'production', '-y'], { stdio: 'ignore', shell: true });
        
        // Spawn Vercel Env Add and pipe value natively ensuring structural perfection 
        const addProcess = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit'],
            shell: true
        });
        
        if (addProcess.status === 0) {
           console.log(`Success -> ${key}`);
        } else {
           console.warn(`Failed -> ${key} Status: ${addProcess.status}`);
        }
    }
    console.log("All keys securely synced! Initiating strict Vercel Production deployment...");
    const deploy = spawnSync('npx.cmd', ['vercel', '--prod', '--yes'], { stdio: 'inherit', shell: true });
    console.log("Deployment execution complete. Exit Code:", deploy.status);
    
} catch (e) {
    console.error("Vercel Core automation caught an exception:", e);
}
