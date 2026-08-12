import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Field, FieldLabel } from "ui/field";
import { Input } from "ui/input";
import { Button } from "ui/button";
import { useCreateUserMutation } from "../users.hooks";

const CreateUserFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.email("Enter a valid email"),
});

type CreateUserForm = z.infer<typeof CreateUserFormSchema>;

export function CreateUserView() {
  const navigate = useNavigate();
  const createUser = useCreateUserMutation();
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "" },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createUser.mutate(data, {
      onSuccess: () => {
        navigate({ to: "/app/users" });
      },
    });
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add Staff</h1>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>First name</FieldLabel>
              <Input autoFocus {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Last name</FieldLabel>
              <Input {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Phone</FieldLabel>
              <Input placeholder="(555) 555-5555" {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" {...field} />
              {fieldState.error && (
                <p className="text-sm text-destructive">{fieldState.error.message}</p>
              )}
            </Field>
          )}
        />

        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? "Adding..." : "Add staff"}
        </Button>
      </form>
    </div>
  );
}
