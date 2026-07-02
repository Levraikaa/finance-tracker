import Anthropic from '@anthropic-ai/sdk'

/* Fonction serverless Vercel — « Conseiller IA » de KAAFINANCE.
   Reçoit un résumé chiffré des finances de l'utilisateur (POST { summary }),
   demande à Claude une analyse d'expert, et renvoie { advice, model }.

   La clé API reste côté serveur (variable d'environnement ANTHROPIC_API_KEY),
   jamais exposée au navigateur. Le modèle est configurable via ADVISOR_MODEL
   (défaut : Haiku 4.5, ~0,6 centime par analyse). */

const DEFAULT_MODEL = 'claude-haiku-4-5'

const SYSTEM_PROMPT = `Tu es un conseiller financier personnel expert, chaleureux et pédagogue, qui aide un particulier à mieux gérer son budget au quotidien. Tu analyses ses données de dépenses et de revenus et tu lui fais un point clair, honnête et actionnable.

Règles :
- Réponds en français, en Markdown, de façon concise et structurée.
- Structure ta réponse avec ces sections (titres en ## ) : « ## Bilan du mois », « ## Tes tendances », « ## Points à améliorer », « ## Mes conseils ».
- Sois concret et chiffré : appuie-toi sur les vrais montants fournis, cite des catégories précises, donne des ordres de grandeur d'économies réalistes.
- Priorise : mets en avant les 2-3 leviers qui comptent vraiment, pas une liste exhaustive.
- Ton bienveillant, direct, jamais moralisateur. Encourage ce qui va bien avant de pointer ce qui coince.
- Tu n'es PAS un conseiller en investissement : reste sur la gestion de budget et les dépenses. Ne recommande pas de produits financiers ni de placements précis.
- Ne réclame pas de données supplémentaires : travaille avec ce qui est fourni. Si une donnée manque, fais avec.
- Reste bref : vise 200 à 350 mots au total.`

function buildUserPrompt(summary) {
  return `Voici mes données financières (montants en euros). Analyse-les et fais-moi un point d'expert.

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

Fais ton analyse en suivant la structure demandée.`
}

/* Lit le corps JSON de la requête, que le body soit déjà parsé (Vercel) ou
   qu'il faille lire le flux (middleware de dev Vite). */
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'missing_api_key',
      message:
        "Clé API manquante. Ajoute la variable d'environnement ANTHROPIC_API_KEY dans ton projet Vercel (Settings → Environment Variables), puis redéploie.",
    })
  }

  let summary
  try {
    ;({ summary } = await readJsonBody(req))
  } catch {
    return sendJson(res, 400, { error: 'invalid_body' })
  }
  if (!summary || typeof summary !== 'object') {
    return sendJson(res, 400, { error: 'missing_summary' })
  }

  const model = process.env.ADVISOR_MODEL || DEFAULT_MODEL

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model,
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(summary) }],
    })
    const advice = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    return sendJson(res, 200, { advice, model })
  } catch (err) {
    const status = err?.status ?? 500
    return sendJson(res, status >= 400 && status < 600 ? status : 500, {
      error: 'advisor_failed',
      message:
        err?.status === 401
          ? "Clé API refusée (401). Vérifie ANTHROPIC_API_KEY dans les réglages Vercel."
          : `L'analyse a échoué : ${err?.message || 'erreur inconnue'}`,
    })
  }
}
