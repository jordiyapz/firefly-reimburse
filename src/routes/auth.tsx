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
      toast.success('Token set!')
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
    <div className="max-w-lg mx-auto">
      <form
        className="my-4 flex flex-col gap-4"
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
                <FieldLabel htmlFor="token-field">Firefly-III token</FieldLabel>
                <Textarea
                  id="token-field"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Firefly-III Bearer Token"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  )
}
