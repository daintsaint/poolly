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
