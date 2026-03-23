import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Wedding Website</CardTitle>
          <CardDescription>
            Everything is set up and working!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Next.js + Tailwind CSS + shadcn/ui + Prisma
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
