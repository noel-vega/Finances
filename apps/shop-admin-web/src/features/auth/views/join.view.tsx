import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import { useAcceptInviteMutation } from "../auth.hooks";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { InfoIcon } from "lucide-react";
import { appConfig } from "../../../config";

const JoinFormSchema = z.object({
  password: z.string().min(8),
});

type JoinForm = z.infer<typeof JoinFormSchema>;

export function JoinView(props: { token: string }) {
  const acceptInvite = useAcceptInviteMutation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<JoinForm>({
    resolver: zodResolver(JoinFormSchema),
    defaultValues: { password: "" },
  });

  function handleSubmit(formData: JoinForm) {
    acceptInvite.mutate(
      { token: props.token, password: formData.password },
      {
        onError: () => {
          setErrorMessage(
            "This invite link is invalid or has expired. Ask the account owner to resend it.",
          );
        },
        onSuccess: () => {
          navigate({ to: appConfig.homeRoute });
        },
      },
    );
  }

  function ErrorMessage() {
    if (!errorMessage) return null;
    return (
      <Alert variant="destructive">
        <InfoIcon />
        <AlertTitle>Couldn't join</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="h-full flex items-center">
      <div className="max-w-sm mx-auto w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Set your password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a password to finish joining your team on Harbor.
          </p>
        </div>
        <ErrorMessage />
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel>Password</FieldLabel>
                <Input type="password" autoFocus placeholder="*********" {...field} />
                {fieldState.error && (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                )}
              </Field>
            )}
          />

          <Button type="submit" className="w-full" disabled={acceptInvite.isPending}>
            {acceptInvite.isPending ? "Joining..." : "Set password & sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
