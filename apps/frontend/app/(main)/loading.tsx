import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="size-8" />
    </div>
  )
}
