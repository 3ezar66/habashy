import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-destructive">
            ۴۰۴
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            صفحه مورد نظر یافت نشد
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
          </p>
          <Link href="/">
            <Button>بازگشت به صفحه اصلی</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
