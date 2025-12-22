import React, { useMemo, useState } from "react"
import "./App.css"

const API_BASE = process.env.REACT_APP_API_BASE || "/api"

const templates = [
  {
    id: "luz",
    title: "Luz cálida",
    occasion: "cumpleaños",
    accent: "#f97316",
    gradient: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
    description: "Globos suaves, tipografía redondeada y un titular con brillo.",
    features: ["Confeti animado", "Botón de audio", "Llamado a la acción"]
  },
  {
    id: "aurora",
    title: "Aurora",
    occasion: "aniversario",
    accent: "#8b5cf6",
    gradient: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
    description: "Bordes redondeados y destellos violetas para momentos especiales.",
    features: ["Sticker animado", "Firma manuscrita", "Botón de compartir"]
  },
  {
    id: "verde",
    title: "Hojas y luz",
    occasion: "agradecimiento",
    accent: "#22c55e",
    gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    description: "Trazos orgánicos, ideal para notas de agradecimiento o ánimo.",
    features: ["Botón de descarga", "Etiquetas personalizadas", "Modo responsivo"]
  }
]

const defaultCard = {
  headline: "¡Celebremos a lo grande!",
  recipientName: "",
  senderName: "",
  message: "Añade un mensaje especial, emojis o una invitación rápida.",
  accentColor: "#8b5cf6",
  sticker: "🎉",
  includeAudio: true
}

const statusCopy = {
  idle: "Listo para crear una tarjeta interactiva.",
  submitting: "Guardando en tu backend PHP...",
  success: "Tarjeta guardada y lista para compartir.",
  warning: "No se pudo contactar la API: usando un enlace de demostración."
}

function TemplateCard({ template, onSelect, selected }) {
  return (
    <button
      className={`template-card ${selected ? "template-card--active" : ""}`}
      onClick={() => onSelect(template.id)}
      type="button"
    >
      <div className="template-card__accent" style={{ background: template.gradient }} />
      <div className="template-card__body">
        <div className="template-card__title">
          {template.title}
          <span className="template-card__occasion">{template.occasion}</span>
        </div>
        <p className="template-card__description">{template.description}</p>
        <div className="template-card__chips">
          {template.features.map(feature => (
            <span key={feature} className="chip">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

function PreviewCard({ template, formData, shareLink }) {
  const accentColor = formData.accentColor || template.accent
  return (
    <div className="preview" style={{ background: template.gradient }}>
      <div className="preview__header">
        <span className="pill" style={{ backgroundColor: accentColor }}>
          {template.title}
        </span>
        <span className="pill pill--ghost">{template.occasion}</span>
      </div>
      <div className="preview__content">
        <div className="preview__sticker" aria-hidden>
          {formData.sticker}
        </div>
        <h3 style={{ color: accentColor }}>{formData.headline || "Tu titular"}</h3>
        <p className="preview__recipient">Para: {formData.recipientName || "Nombre"}</p>
        <p className="preview__message">{formData.message}</p>
        <div className="preview__footer">
          <span className="pill pill--soft">De: {formData.senderName || "Tu nombre"}</span>
          {formData.includeAudio ? <span className="pill pill--ghost">🔊 Audio activado</span> : null}
        </div>
        {shareLink ? (
          <div className="preview__share">
            <p>Enlace listo para compartir:</p>
            <code>{shareLink}</code>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function App() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id)
  const [selectedOccasion, setSelectedOccasion] = useState("todas")
  const [card, setCard] = useState(defaultCard)
  const [status, setStatus] = useState(statusCopy.idle)
  const [shareLink, setShareLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId) || templates[0], [selectedTemplateId])
  const visibleTemplates = useMemo(
    () => (selectedOccasion === "todas" ? templates : templates.filter(t => t.occasion === selectedOccasion)),
    [selectedOccasion]
  )

  const updateField = field => event => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value
    setCard(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus(statusCopy.submitting)

    const payload = {
      template_id: selectedTemplateId,
      headline: card.headline,
      message: card.message,
      recipient_name: card.recipientName,
      sender_name: card.senderName,
      accent_color: card.accentColor,
      sticker: card.sticker,
      include_audio: card.includeAudio
    }

    try {
      const response = await fetch(`${API_BASE}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const slug = data.slug || data.share_slug || `card-${Date.now()}`
      const url = data.share_url || `${window.location.origin}/cards/${slug}`

      setShareLink(url)
      setStatus(data.message || statusCopy.success)
    } catch (error) {
      const fallbackSlug = `demo-${Date.now()}`
      setShareLink(`${window.location.origin}/cards/${fallbackSlug}`)
      setStatus(statusCopy.warning)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Tarjetas interactivas · PHP + MySQL + React</p>
          <h1>Personaliza plantillas y compártelas al instante.</h1>
          <p className="lede">
            Crea plantillas para diferentes ocasiones, edítalas con un editor visual y genera enlaces listos para enviar desde un backend PHP
            compatible con Hostinger.
          </p>
          <div className="hero__actions">
            <button className="button" type="button" onClick={() => window.scrollTo({ top: 480, behavior: "smooth" })}>
              Explorar plantillas
            </button>
            <a className="button button--ghost" href="#php">Ver guía Hostinger</a>
          </div>
          <div className="badges">
            <span className="pill">Cargas ligeras</span>
            <span className="pill">Listo para SPA</span>
            <span className="pill">CORS configurado</span>
          </div>
        </div>
        <div className="hero__note">
          <p>Consejo</p>
          <strong>Usa REACT_APP_API_BASE para apuntar al API en Hostinger.</strong>
          <small>Ejemplo: https://tu-dominio.com/api</small>
        </div>
      </header>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">1. Plantillas</p>
            <h2>Elige una base visual</h2>
            <p className="muted">Filtra por ocasión y selecciona la tarjeta a personalizar.</p>
          </div>
          <div className="filters">
            <label>
              Ocasión
              <select value={selectedOccasion} onChange={event => setSelectedOccasion(event.target.value)}>
                <option value="todas">Todas</option>
                <option value="cumpleaños">Cumpleaños</option>
                <option value="aniversario">Aniversario</option>
                <option value="agradecimiento">Agradecimiento</option>
              </select>
            </label>
          </div>
        </div>
        <div className="templates">
          {visibleTemplates.map(template => (
            <TemplateCard key={template.id} template={template} onSelect={setSelectedTemplateId} selected={template.id === selectedTemplateId} />
          ))}
        </div>
      </section>

      <section className="panel panel--grid">
        <div>
          <p className="eyebrow">2. Editor visual</p>
          <h2>Contenido, color y stickers</h2>
          <p className="muted">Envía el payload al backend PHP y genera el slug compartible.</p>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__grid">
              <label>
                Titular
                <input type="text" value={card.headline} onChange={updateField("headline")} placeholder="Felicidades" required />
              </label>
              <label>
                Ocasión (solo texto)
                <input type="text" value={selectedTemplate.occasion} disabled />
              </label>
              <label>
                Destinatario
                <input type="text" value={card.recipientName} onChange={updateField("recipientName")} placeholder="Nombre de la persona" />
              </label>
              <label>
                Remitente
                <input type="text" value={card.senderName} onChange={updateField("senderName")} placeholder="Tu nombre" />
              </label>
              <label>
                Color de acento
                <input type="color" value={card.accentColor} onChange={updateField("accentColor")} />
              </label>
              <label>
                Sticker o emoji
                <input type="text" value={card.sticker} onChange={updateField("sticker")} maxLength={2} />
              </label>
            </div>
            <label>
              Mensaje
              <textarea value={card.message} onChange={updateField("message")} rows={4} placeholder="Texto, emojis o breve invitación" />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={card.includeAudio} onChange={updateField("includeAudio")} /> Activar botón de audio
            </label>
            <div className="form__footer">
              <div>
                <p className="muted">Estado: {status}</p>
                {shareLink ? <p className="muted">Enlace actual: {shareLink}</p> : null}
              </div>
              <button className="button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Guardando..." : "Guardar en PHP"}
              </button>
            </div>
          </form>
        </div>
        <PreviewCard template={selectedTemplate} formData={card} shareLink={shareLink} />
      </section>

      <section className="panel panel--alt" id="php">
        <div>
          <p className="eyebrow">3. Backend Hostinger</p>
          <h2>PHP + MySQL listos para subir</h2>
          <p className="muted">Copia la carpeta <code>hostinger/public_html</code> al servidor y crea las tablas con <code>hostinger/schema.sql</code>.</p>
          <ul className="list">
            <li>Configura las credenciales en <code>hostinger/public_html/api/config.php</code>.</li>
            <li>La API responde en <code>/api/health</code>, <code>/api/templates</code> y <code>/api/cards</code>.</li>
            <li>La raíz <code>.htaccess</code> maneja SPA + rutas de API.</li>
          </ul>
        </div>
        <div className="callout">
          <p className="eyebrow">Rutas de ejemplo</p>
          <div className="callout__grid">
            <div>
              <strong>GET /api/templates</strong>
              <p className="muted">Obtiene plantillas desde MySQL o datos de respaldo.</p>
            </div>
            <div>
              <strong>POST /api/cards</strong>
              <p className="muted">Inserta la tarjeta y devuelve <code>share_slug</code> y URL.</p>
            </div>
            <div>
              <strong>GET /api/cards/:slug</strong>
              <p className="muted">Comparte la vista pública y el JSON de estilo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
