// Production seed data.
// If a private, git-ignored src/data/transactions.js exists (real account data),
// it is auto-loaded here at build time. Otherwise (clean checkout / new tenant)
// the app starts empty. localStorage always takes priority over these seeds.
// The glob is optional: a missing transactions.js does NOT break the build.
const local = import.meta.glob('./transactions.js', { eager: true });
const real = local['./transactions.js'];

export const SEED_TRANSACTIONS = (real && real.SEED_TRANSACTIONS) || [];
export const SEED_RULES = (real && real.SEED_RULES) || [];
