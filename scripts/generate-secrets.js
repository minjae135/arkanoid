// scripts/generate-secrets.js
import fs from 'fs';
import crypto from 'crypto';

const keysPath = './admin_keys.json';
const outputPath = './src/admin/admin-secrets.ts';

function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

try {
    let keys = { tester: 'default', balancer: 'default', master: 'default' };
    
    if (fs.existsSync(keysPath)) {
        const rawData = fs.readFileSync(keysPath, 'utf8').trim();
        if (rawData) {
            keys = JSON.parse(rawData);
        } else {
            console.warn('⚠️ admin_keys.json is empty. Using dummy secrets.');
        }
    } else {
        console.warn('⚠️ admin_keys.json not found. Using dummy secrets.');
    }

    const secretsContent = `// This file is auto-generated. Do not edit manually.
export const ADMIN_HASHES = {
    RANK_1: "${hash(keys.tester || 'default')}",
    RANK_2: "${hash(keys.balancer || 'default')}",
    RANK_3: "${hash(keys.master || 'default')}"
};
`;

    fs.writeFileSync(outputPath, secretsContent);
    console.log('✅ Admin secrets generated successfully.');
} catch (err) {
    console.error('❌ Failed to generate admin secrets:', err.message);
    // Critical error (like invalid JSON formatting when file exists) should still probably notify the user
    process.exit(1);
}
