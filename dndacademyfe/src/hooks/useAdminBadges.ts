import { useEffect, useState } from "react"
import { badgeService } from "@/services/badge.service"
import type {
  Badge,
  CreateBadgeRequest,
  UpdateBadgeRequest,
} from "@/types/badge"

export function useAdminBadges() {
  const [badges, setBadges] = useState<Badge[]>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [badgeToEdit, setBadgeToEdit] = useState<Badge | null>(null)
  const [badgeToDelete, setBadgeToDelete] = useState<Badge | null>(null)

  const [isLoadingBadges, setIsLoadingBadges] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [badgeBlockedByRelations, setBadgeBlockedByRelations] =
    useState<Badge | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadInitialBadges() {
      try {
        const data = await badgeService.getAll()

        if (!isMounted) {
          return
        }

        setBadges(data)
      } catch (err) {
        if (!isMounted) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Errore nel caricamento badge"

        setError(message)
      } finally {
        if (isMounted) {
          setIsLoadingBadges(false)
        }
      }
    }

    void loadInitialBadges()

    return () => {
      isMounted = false
    }
  }, [])

  async function createBadge(request: CreateBadgeRequest) {
    setError("")
    setSuccessMessage("")
    setIsCreating(true)

    try {
      const createdBadge = await badgeService.create(request)

      setBadges((current) => [createdBadge, ...current])
      setSuccessMessage("Badge creato correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione badge"

      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function updateBadge(id: number, request: UpdateBadgeRequest) {
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const updatedBadge = await badgeService.update(id, request)

      setBadges((current) =>
        current.map((badge) =>
          badge.id === updatedBadge.id ? updatedBadge : badge,
        ),
      )

      setBadgeToEdit(null)
      setSuccessMessage("Badge aggiornato correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica badge"

      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteBadge() {
    if (!badgeToDelete) {
      return
    }

    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await badgeService.remove(badgeToDelete.id)

      setBadges((current) =>
        current.filter((badge) => badge.id !== badgeToDelete.id),
      )

      setBadgeToDelete(null)
      setSuccessMessage("Badge eliminato correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione badge"

      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  function openCreateModal() {
    setIsCreateModalOpen(true)
    setError("")
    setSuccessMessage("")
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
  }

  function openEditModal(badge: Badge) {
    setBadgeToEdit(badge)
    setError("")
    setSuccessMessage("")
  }

  function closeEditModal() {
    setBadgeToEdit(null)
  }

  function openDeleteModal(badge: Badge) {
    setError("")
    setSuccessMessage("")

    if (badge.assignedToUsers || badge.usedAsChapterReward) {
      setBadgeBlockedByRelations(badge)
      return
    }

    setBadgeToDelete(badge)
  }

  function closeDeleteModal() {
    setBadgeToDelete(null)
  }

  function closeBlockedByRelationsModal() {
    setBadgeBlockedByRelations(null)
  }

  return {
    badges,
    isCreateModalOpen,
    badgeToEdit,
    badgeToDelete,
    isLoadingBadges,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    successMessage,
    createBadge,
    updateBadge,
    deleteBadge,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    badgeBlockedByRelations,
    closeBlockedByRelationsModal,
  }
}
