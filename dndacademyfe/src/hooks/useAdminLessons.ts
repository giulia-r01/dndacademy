import { useEffect, useState } from "react"
import { lessonService } from "@/services/lesson.service"
import type {
  CreateLessonRequest,
  Lesson,
  UpdateLessonRequest,
} from "@/types/lesson"

export function useAdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [lessonBlockedByRelations, setLessonBlockedByRelations] =
    useState<Lesson | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadInitialLessons() {
      try {
        const data = await lessonService.getAll()

        if (!isMounted) {
          return
        }

        setLessons([...data].sort((a, b) => a.orderIndex - b.orderIndex))
      } catch (err) {
        if (!isMounted) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Errore nel caricamento lezioni"

        setError(message)
      } finally {
        if (isMounted) {
          setIsLoadingLessons(false)
        }
      }
    }

    void loadInitialLessons()

    return () => {
      isMounted = false
    }
  }, [])

  async function createLesson(request: CreateLessonRequest) {
    setError("")
    setSuccessMessage("")
    setIsCreating(true)

    try {
      const createdLesson = await lessonService.create(request)

      setLessons((current) =>
        [...current, createdLesson].sort((a, b) => a.orderIndex - b.orderIndex),
      )

      setSuccessMessage("Lezione creata correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione lezione"

      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function updateLesson(id: number, request: UpdateLessonRequest) {
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const updatedLesson = await lessonService.update(id, request)

      setLessons((current) =>
        current
          .map((lesson) =>
            lesson.id === updatedLesson.id ? updatedLesson : lesson,
          )
          .sort((a, b) => a.orderIndex - b.orderIndex),
      )

      setSuccessMessage("Lezione aggiornata correttamente.")
      setLessonToEdit(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica lezione"

      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteLesson() {
    if (!lessonToDelete) {
      return
    }

    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await lessonService.remove(lessonToDelete.id)

      setLessons((current) =>
        current.filter((lesson) => lesson.id !== lessonToDelete.id),
      )

      setSuccessMessage("Lezione eliminata correttamente.")
      setLessonToDelete(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione lezione"

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

  function closeBlockedByRelationsModal() {
    setLessonBlockedByRelations(null)
  }

  function openEditModal(lesson: Lesson) {
    setLessonToEdit(lesson)
    setError("")
    setSuccessMessage("")
  }

  function closeEditModal() {
    setLessonToEdit(null)
  }

  function openDeleteModal(lesson: Lesson) {
    setError("")
    setSuccessMessage("")

    if (lesson.quiz || lesson.chapters.length > 0) {
      setLessonBlockedByRelations(lesson)
      return
    }

    setLessonToDelete(lesson)
  }

  function closeDeleteModal() {
    setLessonToDelete(null)
  }

  return {
    lessons,
    isLoadingLessons,
    isCreating,
    isUpdating,
    isDeleting,
    lessonToEdit,
    lessonToDelete,
    error,
    successMessage,
    createLesson,
    updateLesson,
    deleteLesson,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    isCreateModalOpen,
    lessonBlockedByRelations,
    openCreateModal,
    closeCreateModal,
    closeBlockedByRelationsModal,
  }
}
