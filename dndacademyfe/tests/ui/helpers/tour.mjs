// Existing feature tests represent accounts that have already dismissed onboarding.
// Tour tests use fresh contexts and exercise automatic startup explicitly.
export async function skipAutomaticTour(context, userId = 1) {
  await context.addInitScript(({ userId }) => {
    for (const role of ["PLAYER", "MASTER"]) for (const audience of ["player", "master"]) {
        localStorage.setItem(`dndacademy:tour:v2:${userId}:${role}:${audience}`, JSON.stringify({ version: 2, status: "dismissed" }))
    }
  }, { userId })
}
