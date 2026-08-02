import { useMutation } from "@tanstack/react-query"
import { adminApi } from "../../lib/admin-api-client"

export function useSignInMutation(){
    return useMutation({
        mutationFn: (credentials: Parameters<typeof adminApi.signIn>[0]) =>
            adminApi.signIn(credentials)
    })
}