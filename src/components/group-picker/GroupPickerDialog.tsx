import { useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { validatePeriodName } from '@/pages/transaction/lib/transaction'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'assign' | 'move'
  count: number
  existingGroups: Array<string>
  onSubmit: (groupName: string) => void
}

function GroupPickerDialog({
  open,
  onOpenChange,
  mode,
  count,
  existingGroups,
  onSubmit,
}: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const trimmed = name.trim()
  const validationError = trimmed ? validatePeriodName(trimmed) : null
  const suggestions = existingGroups.filter((g) =>
    g.toLowerCase().includes(trimmed.toLowerCase()),
  )
  const exactMatch = existingGroups.some((g) => g === trimmed)
  const canSubmit = trimmed.length > 0 && validationError === null

  function submit(groupName: string) {
    if (validatePeriodName(groupName)) return
    onSubmit(groupName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'assign' ? 'New reimbursement' : 'Move to group'}
          </DialogTitle>
          <DialogDescription>
            {count} transaction{count === 1 ? '' : 's'} selected. Existing tags
            are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            placeholder="e.g. Aug-2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) submit(trimmed)
            }}
          />
          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => submit(group)}
                  className={cn(
                    'rounded-md border border-border px-2 py-1 text-xs text-muted-foreground',
                    'hover:bg-accent hover:text-foreground transition-colors',
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => submit(trimmed)}
          >
            {exactMatch || mode === 'move' ? null : (
              <PlusIcon className="size-4" />
            )}
            {mode === 'assign' ? `Create & assign ${count}` : `Move ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GroupPickerDialog
