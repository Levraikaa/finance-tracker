import { useRef, useState } from 'react'
import { CircleCheck, Download, Save, TriangleAlert, Upload } from 'lucide-react'
import {
  downloadBackup,
  parseBackup,
  readFileAsText,
  restoreBackup,
} from '../../lib/backup.js'

/* Sauvegarde des données — export / import du localStorage en JSON.
   L'import recharge la page : c'est le moyen le plus sûr de resynchroniser
   tous les états React (contexts, hooks locaux) avec le stockage restauré. */
export default function BackupSection() {
  const fileRef = useRef(null)
  const [status, setStatus] = useState(null) // { tone: 'ok'|'error', message }
  const [busy, setBusy] = useState(false)

  const handleExport = () => {
    try {
      const { filename } = downloadBackup()
      setStatus({ tone: 'ok', message: `Sauvegarde téléchargée : ${filename}` })
    } catch {
      setStatus({
        tone: 'error',
        message: "Impossible de générer le fichier de sauvegarde.",
      })
    }
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    /* Permet de re-sélectionner le même fichier juste après. */
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setStatus(null)
    try {
      const data = parseBackup(await readFileAsText(file))
      restoreBackup(data)
      setStatus({ tone: 'ok', message: 'Données restaurées avec succès' })
      /* Laisse le message s'afficher avant le rechargement. */
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setBusy(false)
      setStatus({
        tone: 'error',
        message: err?.message || "Import impossible : fichier invalide.",
      })
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
          <Save className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">
            Sauvegarde des données
          </h2>
          <p className="text-xs text-muted">
            Exportez un fichier JSON de tout votre suivi, ou restaurez-le sur un
            autre navigateur.
          </p>
        </div>
      </div>

      {/* Avertissement */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#FFB84D]/25 bg-[#FFB84D]/10 px-4 py-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB84D]" />
        <p className="text-sm text-[#FFB84D]">
          Pense à exporter régulièrement tes données pour ne pas les perdre
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,111,255,0.45)] transition-all hover:bg-accent-dim hover:shadow-[0_0_32px_rgba(124,111,255,0.6)] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exporter mes données
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-elevated disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Importer mes données
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {status && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            status.tone === 'ok'
              ? 'border-positive/30 bg-positive/10 text-positive'
              : 'border-negative/30 bg-negative/10 text-negative'
          }`}
        >
          {status.tone === 'ok' ? (
            <CircleCheck className="h-4 w-4 shrink-0" />
          ) : (
            <TriangleAlert className="h-4 w-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}
    </section>
  )
}
