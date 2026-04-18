// scripts/generate-secrets.js
import fs from 'fs';
import crypto from 'crypto';

const keysPath = './admin_keys.json';
const outputPath = './src/admin-secrets.ts';

function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

try {
    const rawData = fs.readFileSync(keysPath, 'utf8');
    const keys = JSON.parse(rawData);

    const secretsContent = `// This file is auto-generated. Do not edit manually.
export const ADMIN_HASHES = {
    RANK_1: "${hash(keys.tester)}",
    RANK_2: "${hash(keys.balancer)}",
    RANK_3: "${hash(keys.master)}"
};
`;

    fs.writeFileSync(outputPath, secretsContent);
    console.log('✅ Admin secrets generated successfully.');
} catch (err) {
    console.error('❌ Failed to generate admin secrets:', err.message);
    process.exit(1);
}
