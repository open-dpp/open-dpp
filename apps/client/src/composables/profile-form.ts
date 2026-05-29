import type { UpdateProfileDto, UserDto } from "@open-dpp/dto";
import { Language, type LanguageType } from "@open-dpp/dto";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  preferredLanguage: LanguageType;
}

export interface ProfileFormInput {
  firstName?: string;
  lastName?: string;
  email?: string;
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
  if (formValues.preferredLanguage && formValues.preferredLanguage !== original.preferredLanguage) {
    diff.preferredLanguage = formValues.preferredLanguage;
  }
  return diff;
}

export function shouldSubmitEmailChange(candidate: string, currentEmail: string): boolean {
  if (!candidate) return false;
  if (candidate === currentEmail) return false;
  return true;
}
