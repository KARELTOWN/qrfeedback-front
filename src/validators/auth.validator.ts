import * as yup from 'yup';

const strongPasswordMessage = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.';
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const signupSchema = yup.object({
  companyName: yup.string().trim().max(120, 'Le nom est trop long.').optional(),
  email: yup.string().trim().email('Adresse email invalide.').required("L'email est requis."),
  password: yup.string().matches(strongPasswordRegex, strongPasswordMessage).required('Le mot de passe est requis.')
});

export const loginSchema = yup.object({
  email: yup.string().trim().email('Adresse email invalide.').required("L'email est requis."),
  password: yup.string().min(8, 'Mot de passe requis.').required('Le mot de passe est requis.')
});

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().email('Adresse email invalide.').required("L'email est requis.")
});

export const resetPasswordSchema = yup.object({
  password: yup.string().matches(strongPasswordRegex, strongPasswordMessage).required('Le mot de passe est requis.')
});

export const otpSchema = yup.object({
  code: yup.string().matches(/^\d{6}$/, 'Le code doit contenir 6 chiffres.').required('Le code OTP est requis.')
});

export const forgotPasswordConfirmSchema = yup.object({
  code: yup.string().matches(/^\d{6}$/, 'Le code doit contenir 6 chiffres.').required('Le code OTP est requis.'),
  password: yup.string().matches(strongPasswordRegex, strongPasswordMessage).required('Le mot de passe est requis.'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'La confirmation ne correspond pas au mot de passe.')
    .required('La confirmation est requise.')
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().min(8, 'Le mot de passe actuel est requis.').required('Le mot de passe actuel est requis.'),
  newPassword: yup.string()
    .matches(strongPasswordRegex, strongPasswordMessage)
    .notOneOf([yup.ref('currentPassword')], "Le nouveau mot de passe doit etre different de l'ancien.")
    .required('Le nouveau mot de passe est requis.'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'La confirmation ne correspond pas au nouveau mot de passe.')
    .required('La confirmation est requise.')
});

export type FormErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

export async function validateForm<T extends Record<string, unknown>>(schema: yup.ObjectSchema<T>, values: T): Promise<FormErrors<T>> {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) throw error;

    return error.inner.reduce<FormErrors<T>>((acc, current) => {
      const path = current.path as keyof T | undefined;
      if (path && !acc[path]) acc[path] = current.message;
      return acc;
    }, {});
  }
}
