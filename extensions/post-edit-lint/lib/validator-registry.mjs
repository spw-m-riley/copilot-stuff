import { isLoreSchemaTrigger, validateLoreSchema } from "./lore-validator.mjs";

const DEFAULT_VALIDATORS = [
  {
    matches: isLoreSchemaTrigger,
    validate: validateLoreSchema,
  },
];

export function createValidatorRegistry(validators = DEFAULT_VALIDATORS) {
  return {
    async validate(changedFiles, context) {
      const summaries = [];

      for (const validator of validators) {
        const triggerFile = changedFiles.find((filePath) => validator.matches(filePath));
        if (!triggerFile) {
          continue;
        }

        summaries.push(...(await validator.validate(triggerFile, context)));
      }

      return summaries;
    },
  };
}
