import { useEffect, useRef, useState } from "react"

import { campaignService } from "@/services/campaign.service"
import { characterService } from "@/services/character.service"
import type { Campaign } from "@/types/campaign"
import type {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character"

export function useAdminCharacters() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  )

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const mutation = useRef(false)

  async function uploadPortrait(characterId: number, file: File) {
    setIsUploadingImage(true)
    try {
      return await characterService.uploadImage(characterId, file)
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function uploadCharacterImage(characterId: number, file: File) {
    if (mutation.current)
      throw new Error("Attendi il completamento dell’operazione in corso.")
    mutation.current = true
    setError("")
    setSuccessMessage("")
    try {
      const updated = await uploadPortrait(characterId, file)
      setCharacters((current) =>
        current.map((character) =>
          character.id === updated.id ? updated : character,
        ),
      )
    } finally {
      mutation.current = false
    }
  }

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await campaignService.getAll()

        setCampaigns(data)

        if (data.length === 1) {
          setSelectedCampaignId(data[0].id)
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Errore nel caricamento campagne",
        )
      } finally {
        setIsLoadingCampaigns(false)
      }
    }

    loadCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaignId == null) {
      return
    }

    const campaignId = selectedCampaignId

    async function loadCharacters() {
      setError("")
      setSuccessMessage("")
      setIsLoadingCharacters(true)

      try {
        const data = await characterService.getAllByCampaignForAdmin(campaignId)
        setCharacters(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Errore nel caricamento personaggi",
        )
      } finally {
        setIsLoadingCharacters(false)
      }
    }

    loadCharacters()
  }, [selectedCampaignId])

  async function createCharacter(
    payload: CreateCharacterRequest,
    imageFile: File | null,
  ) {
    if (mutation.current) return false
    mutation.current = true
    setError("")
    setSuccessMessage("")
    setIsCreating(true)

    try {
      const createdCharacter = await characterService.create(payload)
      setCharacters((current) => [createdCharacter, ...current])

      if (imageFile) {
        try {
          const uploaded = await uploadPortrait(createdCharacter.id, imageFile)
          setCharacters((current) =>
            current.map((character) =>
              character.id === uploaded.id ? uploaded : character,
            ),
          )
        } catch (err) {
          setError(
            `Personaggio creato, ma il ritratto non è stato caricato. Apri Modifica per riprovare. ${err instanceof Error ? err.message : ""}`,
          )
          return true
        }
      }
      setSuccessMessage(
        imageFile
          ? "Personaggio creato e immagine caricata correttamente."
          : "Personaggio creato correttamente.",
      )

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore nella creazione personaggio",
      )

      return false
    } finally {
      mutation.current = false
      setIsCreating(false)
    }
  }

  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  )

  async function updateCharacter(
    characterId: number,
    payload: UpdateCharacterRequest,
  ) {
    if (mutation.current) return false
    mutation.current = true
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const updatedCharacter = await characterService.update(
        characterId,
        payload,
      )

      setCharacters((current) =>
        current.map((character) =>
          character.id === updatedCharacter.id ? updatedCharacter : character,
        ),
      )

      setSuccessMessage("Personaggio aggiornato correttamente.")

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore nella modifica personaggio",
      )

      return false
    } finally {
      mutation.current = false
      setIsUpdating(false)
    }
  }

  async function deleteCharacter(characterId: number) {
    if (mutation.current) return false
    mutation.current = true
    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await characterService.remove(characterId)

      setCharacters((current) =>
        current.filter((character) => character.id !== characterId),
      )

      setSuccessMessage("Personaggio eliminato correttamente.")

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore nell'eliminazione personaggio",
      )

      return false
    } finally {
      mutation.current = false
      setIsDeleting(false)
    }
  }

  return {
    campaigns,
    characters,
    selectedCampaign,
    selectedCampaignId,
    setSelectedCampaignId,

    isLoadingCampaigns,
    isLoadingCharacters,
    isCreating,

    error,
    successMessage,
    setError,
    setSuccessMessage,

    createCharacter,
    isUpdating,
    isDeleting,
    updateCharacter,
    deleteCharacter,
    uploadCharacterImage,
    isUploadingImage,
    isBusy: isCreating || isUpdating || isDeleting || isUploadingImage,
  }
}
