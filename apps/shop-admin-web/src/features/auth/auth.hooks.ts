import { useMutation } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"
import type { SignInRequestBody } from "./auth.api"

export function useSignInMutation(){
    return useMutation({
        mutationFn: (data: SignInRequestBody) => adminApi.signIn(data)
    }) 
}