import type { UpdateProfileDto, UserDto } from "@open-dpp/dto";
import { DisplayLanguage, type DisplayLanguageType } from "@open-dpp/dto";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  preferredLanguage: DisplayLanguageType;
}

export interface ProfileFormInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  preferredLanguage?: DisplayLanguageType;
}

export function mapUserToFormValues(user: UserDto): ProfileFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    preferredLanguage: user.preferredLanguage ?? DisplayLanguage.en,
  };
}

export function computeProfileDiff(
  formValues: ProfileFormInput,
  original: ProfileFormValues,
): UpdateProfileDto {
  const diff: UpdateProfileDto = {};
  // Diff on !== original (not truthiness) so clearing a name to "" is a real change.
  if (formValues.firstName !== undefined && formValues.firstName !== original.firstName) {
    diff.firstName = formValues.firstName;
  }
  if (formValues.lastName !== undefined && formValues.lastName !== original.lastName) {
    diff.lastName = formValues.lastName;
  }
  if (formValues.preferredLanguage && formValues.preferredLanguage !== original.preferredLanguage) {
    diff.preferredLanguage = formValues.preferredLanguage;
  }
  return diff;
}
