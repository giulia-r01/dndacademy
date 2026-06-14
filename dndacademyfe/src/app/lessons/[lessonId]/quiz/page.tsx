"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FiArrowLeft, FiCheckCircle, FiXCircle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { quizService } from "@/services/quiz.service"
import type { Question, Quiz, QuizResult } from "@/types/quiz"

type SelectedAnswers = Record<number, number>

export default function LessonQuizPage() {
  const params = useParams<{ lessonId: string }>()
  const lessonId = Number(params.lessonId)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadQuiz() {
      if (Number.isNaN(lessonId)) {
        setError("ID lezione non valido")
        setIsLoading(false)
        return
      }

      try {
        const quizData = await quizService.getByLesson(lessonId)
        setQuiz(quizData)

        const questionsData = await quizService.getQuestionsByQuiz(quizData.id)
        setQuestions(questionsData)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento quiz"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuiz()
  }, [lessonId])

  function handleAnswerChange(questionId: number, answerId: number) {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: answerId,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!quiz) {
      setError("Quiz non disponibile")
      return
    }

    if (Object.keys(selectedAnswers).length !== questions.length) {
      setError("Devi rispondere a tutte le domande prima di inviare il quiz.")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const payload = {
        quizId: quiz.id,
        answers: questions.map((question) => ({
          questionId: question.id,
          answerId: selectedAnswers[question.id],
        })),
      }

      const quizResult = await quizService.submit(payload)
      setResult(quizResult)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'invio del quiz"

      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href={`/lessons/${lessonId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna alla lezione
        </Link>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento quiz...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && quiz && !result && (
          <>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
                Quiz
              </p>

              <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
                {quiz.title}
              </h2>

              <p className="mt-2 text-[var(--text-soft)]">
                Punteggio minimo richiesto: {quiz.passingScore}%
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {questions.map((question, index) => (
                <AppCard key={question.id} className="space-y-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                      Domanda {index + 1}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-[var(--text-main)]">
                      {question.text}
                    </h3>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="sr-only">
                      Risposte per la domanda {index + 1}
                    </legend>

                    {question.answers.map((answer) => {
                      const inputId = `question-${question.id}-answer-${answer.id}`

                      return (
                        <label
                          key={answer.id}
                          htmlFor={inputId}
                          className={[
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                            selectedAnswers[question.id] === answer.id
                              ? "border-[var(--accent)] bg-[rgba(245,158,11,0.12)] text-[var(--text-main)]"
                              : "border-[var(--border-teal-soft)] bg-[var(--surface-muted)] text-[var(--text-soft)] hover:border-[var(--accent)]",
                          ].join(" ")}
                        >
                          <input
                            id={inputId}
                            type="radio"
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={selectedAnswers[question.id] === answer.id}
                            onChange={() =>
                              handleAnswerChange(question.id, answer.id)
                            }
                            className="h-4 w-4 accent-[var(--accent)]"
                          />

                          <span>{answer.text}</span>
                        </label>
                      )
                    })}
                  </fieldset>
                </AppCard>
              ))}

              <AppButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Invio risposte..." : "Invia quiz"}
              </AppButton>
            </form>
          </>
        )}

        {result && (
          <AppCard className="space-y-5">
            <div className="flex items-center gap-3">
              {result.passed ? (
                <FiCheckCircle
                  className="text-[var(--primary)]"
                  size={32}
                  aria-hidden="true"
                />
              ) : (
                <FiXCircle
                  className="text-[var(--danger)]"
                  size={32}
                  aria-hidden="true"
                />
              )}

              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)]">
                  {result.passed ? "Quiz superato!" : "Quiz non superato"}
                </h2>

                <p className="mt-1 text-[var(--text-muted)]">
                  Hai risposto correttamente a {result.correctAnswers} domande
                  su {result.totalQuestions}.
                </p>
              </div>
            </div>

            <p className="text-xl font-black text-[var(--accent-soft)]">
              Punteggio: {result.score}%
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/lessons">
                <AppButton variant="secondary">Torna alle lezioni</AppButton>
              </Link>

              {!result.passed && (
                <AppButton onClick={() => setResult(null)}>
                  Riprova quiz
                </AppButton>
              )}
            </div>
          </AppCard>
        )}
      </section>
    </AppShell>
  )
}
