/* Sauvegarde / restauration des données locales de KAAFINANCE.
   Toutes les données de l'app vivent dans le localStorage sous deux
   préfixes historiques : `kaafinance.` (transactions, pockets, budgets,
   cryptos, dettes…) et `kaa_` (abonnements, catégories, cache de change).
   On balaie donc les clés par préfixe plutôt que d'en tenir une liste
   figée : une nouvelle clé est sauvegardée sans rien changer ici. */

const PREFIXES = ['kaafinance.', 'kaa_']

export const BACKUP_FORMAT = 'kaafinance-backup'
export const BACKUP_VERSION = 1

const isOwnKey = (key) =>
  typeof key === 'string' && PREFIXES.some((p) => key.startsWith(p))

/* Date locale au format YYYY-MM-DD (pas d'UTC : le nom du fichier doit
   correspondre au jour de l'utilisateur). */
export function backupStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/* Relit toutes les clés de l'app. Les valeurs sont désérialisées pour que
   le JSON exporté reste lisible ; une valeur non-JSON est conservée telle
   quelle (cas théorique, aucune clé actuelle n'est concernée). */
export function collectBackupData() {
  const data = {}
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!isOwnKey(key)) continue
    const raw = window.localStorage.getItem(key)
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return data
}

export function buildBackup() {
  const data = collectBackupData()
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: 'KAAFINANCE',
    exportedAt: new Date().toISOString(),
    keys: Object.keys(data).length,
    data,
  }
}

/* Déclenche le téléchargement du fichier et renvoie son nom. */
export function downloadBackup() {
  const backup = buildBackup()
  const filename = `kaafinance-backup-${backupStamp()}.json`
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  /* Libéré au tick suivant : Safari a besoin que l'URL vive le temps du clic. */
  setTimeout(() => URL.revokeObjectURL(url), 0)
  return { filename, keys: backup.keys }
}

/* Extrait le dictionnaire de clés d'un fichier de sauvegarde. Accepte le
   format complet ({ format, data }) et, par tolérance, un objet plat dont
   les clés portent déjà les bons préfixes. Lève une erreur explicite si le
   contenu ne ressemble à aucune sauvegarde KAAFINANCE. */
export function parseBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.")
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Fichier de sauvegarde illisible.')
  }
  const data =
    parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
      ? parsed.data
      : parsed
  const entries = Object.entries(data).filter(([key]) => isOwnKey(key))
  if (entries.length === 0) {
    throw new Error("Ce fichier ne contient aucune donnée KAAFINANCE.")
  }
  return Object.fromEntries(entries)
}

/* Écrit les données dans le localStorage. Les clés de l'app absentes de la
   sauvegarde sont supprimées, pour que l'état restauré soit exactement
   celui du fichier et non un mélange avec les données courantes. */
export function restoreBackup(data) {
  const keys = Object.keys(data)
  const existing = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (isOwnKey(key)) existing.push(key)
  }
  existing
    .filter((key) => !Object.prototype.hasOwnProperty.call(data, key))
    .forEach((key) => window.localStorage.removeItem(key))

  keys.forEach((key) => {
    window.localStorage.setItem(key, JSON.stringify(data[key]))
  })
  return keys.length
}

/* Lit un fichier sélectionné et renvoie son contenu texte. */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.readAsText(file)
  })
}
