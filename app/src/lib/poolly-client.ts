import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL, Poolly } from "./idl";
import { MEMBER_SEED, POOL_SEED, POOLLY_PROGRAM_ID } from "./constants";

export type MemberRecord = {
  publicKey: PublicKey;
  pool: PublicKey;
  wallet: PublicKey;
  joinedAt: BN;
  cyclesPaid: number;
  bump: number;
};

export type PoolAccount = {
  publicKey: PublicKey;
  host: PublicKey;
  mint: PublicKey;
  title: string;
  category: number;
  pricePerSlot: BN;
  maxSlots: number;
  minSlots: number;
  filledSlots: number;
  cycleDays: number;
  status: { pending?: {} } | { active?: {} } | { closed?: {} };
  createdAt: BN;
  nextChargeAt: BN;
  totalCycles: number;
  lastProofUri: string;
  isDisputed: boolean;
};

export function getProgram(provider: AnchorProvider): Program<Poolly> {
  return new Program(IDL, provider);
}

export function derivePoolPda(host: PublicKey, title: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [POOL_SEED, host.toBuffer(), Buffer.from(title)],
    POOLLY_PROGRAM_ID
  );
  return pda;
}

export function deriveMemberPda(pool: PublicKey, member: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [MEMBER_SEED, pool.toBuffer(), member.toBuffer()],
    POOLLY_PROGRAM_ID
  );
  return pda;
}

export async function fetchAllPools(
  connection: Connection
): Promise<PoolAccount[]> {
  const provider = new AnchorProvider(connection, {} as never, {});
  const program = getProgram(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = await (program.account as any).pool.all();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return accounts.map((a: any) => ({ publicKey: a.publicKey, ...a.account }));
}

export async function fetchPoolMembers(
  connection: Connection,
  poolKey: PublicKey
): Promise<MemberRecord[]> {
  const provider = new AnchorProvider(connection, {} as never, {});
  const program = getProgram(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = await (program.account as any).memberRecord.all([
    { memcmp: { offset: 8, bytes: poolKey.toBase58() } },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return accounts.map((a: any) => ({ publicKey: a.publicKey, ...a.account }));
}

/** All pools where host === hostKey */
export async function fetchHostPools(
  connection: Connection,
  hostKey: PublicKey
): Promise<PoolAccount[]> {
  const provider = new AnchorProvider(connection, {} as never, {});
  const program = getProgram(provider);
  // host is first field after 8-byte discriminator → offset 8
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = await (program.account as any).pool.all([
    { memcmp: { offset: 8, bytes: hostKey.toBase58() } },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return accounts.map((a: any) => ({ publicKey: a.publicKey, ...a.account }));
}

/** All memberRecords for a given wallet, with the corresponding pool fetched */
export async function fetchMembershipPools(
  connection: Connection,
  walletKey: PublicKey
): Promise<{ record: MemberRecord; pool: PoolAccount }[]> {
  const provider = new AnchorProvider(connection, {} as never, {});
  const program = getProgram(provider);
  // wallet is second pubkey field → offset 8 (disc) + 32 (pool pubkey) = 40
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = await (program.account as any).memberRecord.all([
    { memcmp: { offset: 40, bytes: walletKey.toBase58() } },
  ]);
  if (records.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedRecords: MemberRecord[] = records.map((a: any) => ({
    publicKey: a.publicKey,
    ...a.account,
  }));

  // Fetch all pools in parallel
  const poolKeys = typedRecords.map((r) => r.pool);
  const poolInfos = await connection.getMultipleAccountsInfo(poolKeys);
  const results: { record: MemberRecord; pool: PoolAccount }[] = [];

  for (let i = 0; i < typedRecords.length; i++) {
    if (!poolInfos[i]) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poolData = await (program.account as any).pool.fetch(poolKeys[i]);
      results.push({
        record: typedRecords[i],
        pool: { publicKey: poolKeys[i], ...poolData },
      });
    } catch {
      // pool account might be closed
    }
  }
  return results;
}

export function isPoolActive(pool: PoolAccount): boolean {
  return "active" in pool.status;
}

export function isPoolPending(pool: PoolAccount): boolean {
  return "pending" in pool.status;
}

export function formatUsdc(lamports: BN): string {
  return (lamports.toNumber() / 1_000_000).toFixed(2);
}

export function savingsPercent(
  pricePerSlot: BN,
  maxSlots: number,
  retailPrice: number
): number {
  const total = pricePerSlot.toNumber() * maxSlots;
  return Math.round(((retailPrice - pricePerSlot.toNumber()) / retailPrice) * 100);
}
