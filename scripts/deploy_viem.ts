import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { worldchain, worldchainSepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const env = process.env.APP_ENV || 'testnet';
    const isMainnet = env === 'mainnet';
    const chain = isMainnet ? worldchain : worldchainSepolia;

    console.log(`\n🚀 Deploying WorldTower to ${chain.name} (${env})`);

    // 1. Get Deployer Account
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('❌ Missing PRIVATE_KEY in .env');
    }
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`📦 Deployer: ${account.address}`);

    // 2. Load Artifacts
    const artifactPath = path.join(__dirname, '../artifacts/contracts/WorldTower.sol/WorldTower.json');
    if (!fs.existsSync(artifactPath)) {
        throw new Error('❌ Artifacts not found. Run "npx hardhat compile" first.');
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // 4. Clients
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http()
    });

    const publicClient = createPublicClient({
        chain,
        transport: http()
    });

    // 5. Deploy
    console.log('\n📝 Sending deployment transaction for WorldTower...');
    const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        args: []
    });

    console.log(`⏳ Transaction sent: ${hash}`);
    console.log('   Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.contractAddress) {
        const contractAddress = receipt.contractAddress;
        console.log(`\n✅ WorldTower deployed to: ${contractAddress}`);
    } else {
        console.error('❌ Deployment failed (no contract address in receipt)');
    }
}

main().catch(console.error);
