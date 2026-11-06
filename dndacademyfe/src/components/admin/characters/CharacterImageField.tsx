"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  FiCheckCircle,
  FiExternalLink,
  FiLoader,
  FiUpload,
} from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import EntityPortrait from "@/components/common/EntityPortrait"

type Props = {
  name: string
  imageUrl: string | null
  imageFile: File | null
  isBusy: boolean
  isUploading: boolean
  onSelect: (file: File | null) => void
  onUpload?: (file: File) => Promise<void>
}

function resourceName(imageUrl: string) {
  try {
    return decodeURIComponent(
      new URL(imageUrl).pathname.split("/").at(-1) || "Immagine salvata",
    )
  } catch {
    return "Immagine salvata"
  }
}

export default function CharacterImageField({
  name,
  imageUrl,
  imageFile,
  isBusy,
  isUploading,
  onSelect,
  onUpload,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)
  const id = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [failedFile, setFailedFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [uploadedName, setUploadedName] = useState("")
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  async function upload(file: File) {
    if (!onUpload || inFlight.current || isBusy) return
    inFlight.current = true
    setError("")
    setFailedFile(null)
    setUploadedName("")
    try {
      await onUpload(file)
      setUploadedName(file.name)
    } catch (err) {
      setFailedFile(file)
      setError(
        err instanceof Error
          ? err.message
          : "Impossibile caricare il ritratto.",
      )
    } finally {
      inFlight.current = false
    }
  }

  function select(file: File | undefined) {
    if (input.current) input.current.value = ""
    if (!file || inFlight.current || isBusy) return
    setUploadedName("")
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Scegli un’immagine JPG, PNG o WEBP, fino a 5 MB.")
      setFailedFile(null)
      return
    }
    setError("")
    if (onUpload) void upload(file)
    else {
      onSelect(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  return (
    <section
      aria-label="Immagine del personaggio"
      aria-busy={isUploading}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-black">Immagine del personaggio</h3>
        <p id={`${id}-help`} className="mt-1 text-sm text-[var(--text-muted)]">
          {onUpload
            ? "Scegli un’immagine per aggiornarla subito. Il caricamento è indipendente dalle modifiche alla scheda."
            : "Scegli un ritratto: verrà caricato insieme alla creazione del personaggio."}{" "}
          JPG, PNG o WEBP, massimo 5 MB.
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-start">
        <div className="relative w-36 shrink-0">
          <EntityPortrait
            name={name.trim() || "nuovo personaggio"}
            imageUrl={onUpload ? imageUrl : preview}
            className="h-52 w-36"
          />
          {isUploading && (
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60"
            >
              <FiLoader
                size={36}
                className="animate-spin text-white motion-reduce:animate-none"
              />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {imageUrl ? (
            <div className="space-y-2">
              <p className="font-bold text-[var(--accent-soft)]">
                Ultima immagine salvata
              </p>
              <p className="break-all text-sm text-[var(--text-muted)]">
                Risorsa: {resourceName(imageUrl)}
              </p>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] underline underline-offset-4"
              >
                Apri immagine attuale
                <FiExternalLink aria-hidden="true" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Nessuna immagine ancora salvata.
            </p>
          )}
          {!onUpload && imageFile && (
            <p className="break-all text-sm text-[var(--accent-soft)]">
              File selezionato: <strong>{imageFile.name}</strong> · Da salvare
            </p>
          )}
          <input
            ref={input}
            id={`${id}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Scegli ritratto"
            aria-describedby={`${id}-help`}
            disabled={isBusy}
            tabIndex={-1}
            onChange={(event) => select(event.target.files?.[0])}
            className="sr-only"
          />
          <div className="flex flex-wrap gap-3">
            <AppButton
              variant="secondary"
              disabled={isBusy}
              onClick={() => input.current?.click()}
            >
              <FiUpload aria-hidden="true" className="mr-2" />
              {imageUrl || imageFile
                ? "Sostituisci immagine"
                : "Carica immagine"}
            </AppButton>
            {!onUpload && imageFile && (
              <AppButton
                variant="ghost"
                disabled={isBusy}
                onClick={() => {
                  onSelect(null)
                  setPreview(null)
                  setError("")
                }}
              >
                Annulla selezione
              </AppButton>
            )}
          </div>
        </div>
      </div>
      {isUploading && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[var(--border-gold)] bg-[var(--surface-muted)] p-3 text-sm font-bold text-[var(--accent-soft)]"
        >
          <FiLoader
            aria-hidden="true"
            className="shrink-0 animate-spin motion-reduce:animate-none"
          />
          Caricamento immagine in corso…
        </p>
      )}
      {uploadedName && (
        <p
          role="status"
          className="flex items-start gap-2 text-sm text-[var(--primary)]"
        >
          <FiCheckCircle aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Immagine caricata correttamente:{" "}
            <strong className="break-all">{uploadedName}</strong>
          </span>
        </p>
      )}
      {error && (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-[var(--text-danger)]">
            {error}
            {onUpload && imageUrl
              ? " L’immagine attuale è rimasta invariata."
              : ""}
          </p>
          {failedFile && (
            <AppButton
              variant="secondary"
              disabled={isBusy}
              onClick={() => void upload(failedFile)}
            >
              Riprova caricamento
            </AppButton>
          )}
        </div>
      )}
    </section>
  )
}
