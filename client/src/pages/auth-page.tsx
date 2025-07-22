import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/AuthProvider";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("4501145031");
  const [password, setPassword] = useState("470505");
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login.mutateAsync({ username, password });
      // AuthProvider will handle the redirect via onSuccess
      setLocation("/");
    } catch (error) {
      // Error is handled by AuthProvider's onError
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2">
            سامانه کاشف - نسخه شبح حبشی
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            اسکن، جستجو، شناسایی، کشف و رصد دستگاه‌های استخراج رمزارز دیجیتال غیرمجاز
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right block">
                نام کاربری
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block">
                رمز عبور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
                dir="rtl"
              />
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
