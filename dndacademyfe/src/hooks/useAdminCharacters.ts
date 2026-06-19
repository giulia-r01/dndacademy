import { useEffect, useState } from "react"

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
    setError("")
    setSuccessMessage("")
    setIsCreating(true)

    try {
      const createdCharacter = await characterService.create(payload)

      let finalCharacter = createdCharacter

      if (imageFile) {
        finalCharacter = await characterService.uploadImage(
          createdCharacter.id,
          imageFile,
        )
      }

      setCharacters((current) => [finalCharacter, ...current])
      setSuccessMessage("Personaggio creato correttamente.")

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore nella creazione personaggio",
      )

      return false
    } finally {
      setIsCreating(false)
    }
  }

  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedCampaignId,
  )

  async function updateCharacter(
    characterId: number,
    payload: UpdateCharacterRequest,
    imageFile: File | null,
  ) {
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const updatedCharacter = await characterService.update(
        characterId,
        payload,
      )

      let finalCharacter = updatedCharacter

      if (imageFile) {
        finalCharacter = await characterService.uploadImage(
          updatedCharacter.id,
          imageFile,
        )
      }

      setCharacters((current) =>
        current.map((character) =>
          character.id === finalCharacter.id ? finalCharacter : character,
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
      setIsUpdating(false)
    }
  }

  async function deleteCharacter(characterId: number) {
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
  }
}
