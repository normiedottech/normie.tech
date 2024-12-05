import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ComingSoonTab({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>This feature is coming soon</CardDescription>
      </CardHeader>
      <CardContent>
        <p>We're working hard to bring you this feature. Stay tuned for updates!</p>
      </CardContent>
    </Card>
  )
}

