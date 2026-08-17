import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { getToken, setToken } from '@/shared/auth'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      token: '',
    },
    validators: {
      onSubmit: z.object({ token: z.string() }),
    },
    onSubmit: ({ value }) => {
      setToken(value.token)
      toast.success('Token saved')
      navigate({ to: '..', from: '/auth' })
    },
  })

  useEffect(() => {
    const token = getToken()
    if (token) {
      form.reset({ token })
    }
  }, [form])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Firefly Reimburse
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect to your Firefly III instance
          </p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="token"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="token-field">Bearer token</FieldLabel>
                  <Textarea
                    id="token-field"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Paste your Firefly III API token"
                    className="font-mono text-sm"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <Button type="submit" className="w-full">
            Connect
          </Button>
        </form>
      </div>
    </div>
  )
}
