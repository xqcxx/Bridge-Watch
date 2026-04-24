import * as StellarSdk from "@stellar/stellar-sdk";
import {
  BridgeWatchConnectionError,
  BridgeWatchQueryError,
  BridgeWatchTransactionError,
} from "./errors";
import type {
  BridgeWatchSdkConfig,
  EventSubscription,
  EventSubscriptionOptions,
  InvokeContractParams,
  QueryContractParams,
  SdkHealth,
} from "./types";

export class BridgeWatchContractSdk {
  private readonly config: Required<BridgeWatchSdkConfig>;
  private readonly server: StellarSdk.rpc.Server;
  private connected = false;

  constructor(config: BridgeWatchSdkConfig) {
    this.config = {
      allowHttp: false,
      defaultFee: "100000",
      defaultTimeoutSeconds: 30,
      ...config,
    };

    this.server = new StellarSdk.rpc.Server(this.config.rpcUrl, {
      allowHttp: this.config.allowHttp,
    });
  }

  async connect(): Promise<SdkHealth> {
    try {
      const latestLedger = await this.getLatestLedger();
      this.connected = true;

      return {
        connected: true,
        rpcUrl: this.config.rpcUrl,
        latestLedger,
      };
    } catch (error) {
      throw new BridgeWatchConnectionError("Unable to connect to Soroban RPC", error);
    }
  }

  disconnect() {
    this.connected = false;
  }

  async getLatestLedger(): Promise<number | undefined> {
    const health = await this.server.getHealth();
    return health.latestLedger;
  }

  async getHealth(): Promise<SdkHealth> {
    const latestLedger = await this.getLatestLedger();

    return {
      connected: this.connected,
      rpcUrl: this.config.rpcUrl,
      latestLedger,
    };
  }

  async buildInvokeTransaction(params: InvokeContractParams) {
    try {
      const account = await this.server.getAccount(params.sourcePublicKey);
      const contract = new StellarSdk.Contract(this.config.contractId);

      return new StellarSdk.TransactionBuilder(account, {
        fee: params.fee ?? this.config.defaultFee,
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(
          contract.call(
            params.method,
            ...((params.args ?? []) as StellarSdk.xdr.ScVal[])
          )
        )
        .setTimeout(params.timeoutSeconds ?? this.config.defaultTimeoutSeconds)
        .build();
    } catch (error) {
      throw new BridgeWatchTransactionError("Failed to build invoke transaction", error);
    }
  }

  async simulateTransaction(
    transaction: ReturnType<StellarSdk.TransactionBuilder["build"]>
  ): Promise<StellarSdk.rpc.Api.SimulateTransactionResponse> {
    const simulation = await this.server.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new BridgeWatchTransactionError("Simulation failed", simulation);
    }

    return simulation;
  }

  async sendTransaction(
    signedTransaction: ReturnType<StellarSdk.TransactionBuilder["build"]>
  ): Promise<StellarSdk.rpc.Api.SendTransactionResponse> {
    const result = await this.server.sendTransaction(signedTransaction);

    if (result.status === "ERROR") {
      throw new BridgeWatchTransactionError("Transaction submission failed", result);
    }

    return result;
  }

  async invokeAndSend(params: InvokeContractParams, signerSecret: string) {
    const transaction = await this.buildInvokeTransaction(params);
    const simulation = await this.simulateTransaction(transaction);
    const assembled = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulation
    ).build();

    const keypair = StellarSdk.Keypair.fromSecret(signerSecret);
    assembled.sign(keypair);

    return this.sendTransaction(assembled);
  }

  async queryMethod(
    params: QueryContractParams
  ): Promise<StellarSdk.rpc.Api.SimulateTransactionResponse> {
    try {
      const sourcePublicKey =
        params.sourcePublicKey ?? StellarSdk.Keypair.random().publicKey();
      const sourceAccount = new StellarSdk.Account(sourcePublicKey, "0");
      const contract = new StellarSdk.Contract(this.config.contractId);

      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(
          contract.call(
            params.method,
            ...((params.args ?? []) as StellarSdk.xdr.ScVal[])
          )
        )
        .setTimeout(10)
        .build();

      return this.simulateTransaction(tx);
    } catch (error) {
      throw new BridgeWatchQueryError("Failed to query contract method", error);
    }
  }

  subscribeToEvents(options: EventSubscriptionOptions): EventSubscription {
    let active = true;
    let cursor = options.startLedger;

    const run = async () => {
      while (active) {
        try {
          const response = await (this.server as unknown as {
            getEvents: (request: {
              startLedger?: number;
              filters?: Array<{
                type?: string;
                contractIds?: string[];
                topics?: string[][];
              }>;
            }) => Promise<{ events?: unknown[]; latestLedger?: number }>;
          }).getEvents({
            startLedger: cursor,
            filters: options.filter ? [options.filter] : undefined,
          });

          (response.events ?? []).forEach((event) => options.onEvent(event));

          if (response.latestLedger) {
            cursor = response.latestLedger + 1;
          }
        } catch (error) {
          options.onError?.(
            error instanceof Error
              ? error
              : new BridgeWatchConnectionError("Event polling failed", error)
          );
        }

        await new Promise((resolve) => {
          setTimeout(resolve, options.pollIntervalMs ?? 5000);
        });
      }
    };

    void run();

    return {
      unsubscribe: () => {
        active = false;
      },
    };
  }
}
