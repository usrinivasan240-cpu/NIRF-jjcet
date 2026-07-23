import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center"><CardTitle>Reset Password</CardTitle></CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-500">Contact your Vice Principal or Administrator to reset your password.</p>
          <Link href="/login" className="text-slate-900 hover:underline text-sm font-medium">Back to Login</Link>
        </CardContent>
      </Card>
    </div>
  );
}
