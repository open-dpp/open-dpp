import type { UpdateProfileDto, UserDto } from "@open-dpp/dto";
import { Language, type LanguageType } from "@open-dpp/dto";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  preferredLanguage: LanguageType;
}

/**
 * Loose shape of vee-validate's form state, where optional Zod fields surface as `T | undefined`.
 * Used by `computeProfileDiff` so it can accept the form's raw values without casts.
 */
export interface ProfileFormInput {
  firstName?: string;
  lastName?: string;
  email: string;
  preferredLanguage?: LanguageType;
}

export function mapUserToFormValues(user: UserDto): ProfileFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    preferredLanguage: user.preferredLanguage ?? Language.en,
  };
}

export function computeProfileDiff(
  formValues: ProfileFormInput,
  original: ProfileFormValues,
): UpdateProfileDto {
  const diff: UpdateProfileDto = {};
  if (formValues.firstName && formValues.firstName !== original.firstName) {
    diff.firstName = formValues.firstName;
  }
  if (formValues.lastName && formValues.lastName !== original.lastName) {
    diff.lastName = formValues.lastName;
  }
  if (
    formValues.preferredLanguage &&
    formValues.preferredLanguage !== original.preferredLanguage
  ) {
    diff.preferredLanguage = formValues.preferredLanguage;
  }
  return diff;
}

export function mergeUpdatedUserIntoOriginal(
  updatedUser: UserDto,
  original: ProfileFormValues,
): ProfileFormValues {
  return {
    ...original,
    firstName: updatedUser.firstName ?? original.firstName,
    lastName: updatedUser.lastName ?? original.lastName,
    preferredLanguage: updatedUser.preferredLanguage ?? original.preferredLanguage,
  };
}
