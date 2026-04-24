import { Networks, xdr } from "@stellar/stellar-sdk";
import { BridgeWatchContractSdk } from "../src/client";

async function run() {
  const sdk = new BridgeWatchContractSdk({
    rpcUrl: "https://soroban-testnet.stellar.org",
    contractId: "CCONTRACTID",
    networkPassphrase: Networks.TESTNET,
  });

  await sdk.connect();

  const query = await sdk.queryMethod({
    method: "get_health",
    args: [xdr.ScVal.scvString("USDC")],
  });

  console.log("Query result", query.result?.retval?.toXDR("base64"));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
