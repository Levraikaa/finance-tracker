/* Catalogue des cryptos suivies + helpers de calcul de portefeuille.
   `geckoId` = identifiant CoinGecko (null pour « Autre », sans prix live). */

export const CRYPTO_CATALOG = [
  {
    key: 'bitcoin',
    geckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
  },
  {
    key: 'ethereum',
    geckoId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    logo: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
  },
  {
    key: 'solana',
    geckoId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    logo: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756',
  },
  {
    key: 'bnb',
    geckoId: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    logo: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970',
  },
  {
    key: 'xrp',
    geckoId: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    logo: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442',
  },
  {
    key: 'cardano',
    geckoId: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    logo: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090',
  },
  {
    key: 'avalanche',
    geckoId: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    logo: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
  },
  {
    key: 'polkadot',
    geckoId: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    logo: 'https://coin-images.coingecko.com/coins/images/12171/large/polkadot.jpg?1766533446',
  },
  {
    key: 'chainlink',
    geckoId: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    logo: 'https://coin-images.coingecko.com/coins/images/877/large/Chainlink_Logo_500.png?1760023405',
  },
  { key: 'autre', geckoId: null, symbol: '', name: 'Autre', logo: null },
]

export function getCryptoMeta(key) {
  return (
    CRYPTO_CATALOG.find((c) => c.key === key) ??
    CRYPTO_CATALOG[CRYPTO_CATALOG.length - 1]
  )
}

const DAY_MS = 86400000

/* Nombre de jours entiers écoulés depuis une date « YYYY-MM-DD » (>= 0). */
export function daysSince(isoDate) {
  if (!isoDate) return 0
  const [y, m, d] = isoDate.split('-').map(Number)
  const start = new Date(y, m - 1, d).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, Math.floor((Date.now() - start) / DAY_MS))
}

/* Intérêts de staking accumulés :
   (quantité × prix actuel × taux) × (jours écoulés / 365). */
export function stakingInterest(holding, price) {
  const s = holding.staking
  if (!s || !s.enabled || !price) return 0
  const days = daysSince(s.startDate)
  return holding.quantity * price * (s.rate / 100) * (days / 365)
}

/* Valeur totale du portefeuille crypto : valeur de marché + intérêts de
   staking. À défaut de prix live, on retombe sur le prix snapshot. */
export function portfolioValue(cryptos, prices) {
  return cryptos.reduce((total, c) => {
    const meta = getCryptoMeta(c.coin)
    const live = meta.geckoId ? prices[meta.geckoId] : undefined
    const price = live ?? c.snapshotPrice ?? 0
    return total + c.quantity * price + stakingInterest(c, price)
  }, 0)
}
