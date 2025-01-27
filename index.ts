import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";


const suiClient = new SuiClient({
    url: "https://fullnode.mainnet.sui.io:443"
});






const getKeyPair = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set");
  }
  const keyPair = Ed25519Keypair.fromSecretKey(privateKey);
  return keyPair;
};

const main = async () => {
    const keyPair = getKeyPair()
    
}

main()