import z from "zod";

export const SignInRequestBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type SignInRequestBody = z.infer<typeof SignInRequestBodySchema>;

export const SignInResponseSchema = z.object({access_token: z.string()})

export type SignInResponse = z.infer<typeof SignInResponseSchema>