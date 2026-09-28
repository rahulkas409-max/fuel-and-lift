// All exercise photos + steps: the core set and the extended library.
import { EXERCISE_MEDIA, type ExerciseMedia } from "./exercise-media";
import { LIBRARY_MEDIA } from "./exercise-library";

export type { ExerciseMedia };
export const MEDIA: Record<string, ExerciseMedia> = { ...EXERCISE_MEDIA, ...LIBRARY_MEDIA };
