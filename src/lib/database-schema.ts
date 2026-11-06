import { ensureDatabaseSchema } from "./database";
import { onceSuccessful } from "./once-successful";

export const ensureDataSchema = onceSuccessful(ensureDatabaseSchema);
