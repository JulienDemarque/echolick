import { Card, CardTitle } from '../../../components/ui/card'
import type { GenerateLickResponse } from '../../../api/client'

type SelectedLickCardProps = {
  selectedLick: GenerateLickResponse | null
}

export function SelectedLickCard({ selectedLick }: SelectedLickCardProps) {
  return (
    <Card className="space-y-3">
      <CardTitle>Selected Bar Lick</CardTitle>
      <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
        {selectedLick ? JSON.stringify(selectedLick, null, 2) : 'No lick generated for this bar yet.'}
      </pre>
    </Card>
  )
}
