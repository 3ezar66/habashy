import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import "../styles/windows11.css";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("4501145031");
  const [password, setPassword] = useState("470505");
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login.mutateAsync({ username, password });
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="win11-app" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="win11-window" style={{
        maxWidth: '400px',
        width: '100%',
        background: 'var(--win11-surface)'
      }}>
        {/* Title Bar */}
        <div className="win11-titlebar">
          <div className="win11-titlebar-title">
            سامانه کاشف - ورود به سیستم
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              background: 'linear-gradient(45deg, var(--win11-accent), var(--win11-accent-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🛡️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--win11-text-primary)'
            }}>
              سامانه کاشف
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--win11-text-secondary)',
              lineHeight: '1.5'
            }}>
              تشخیص و کشف دستگاه‌های استخراج رمزارز غیرمجاز
              <br />
              استان ایلام - جمهوری اسلامی ایران
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--win11-text-primary)'
              }}>
                نام کاربری
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="win11-input"
                style={{ textAlign: 'right' }}
                dir="rtl"
                placeholder="شناسه کاربری خود را وارد کنید"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--win11-text-primary)'
              }}>
                رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="win11-input"
                style={{ textAlign: 'right' }}
                dir="rtl"
                placeholder="رمز عبور خود را وارد کنید"
              />
            </div>

            <button
              type="submit"
              className="win11-button win11-button-primary"
              disabled={login.isPending}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                marginTop: '8px'
              }}
            >
              {login.isPending ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  در حال ورود...
                </span>
              ) : (
                "ورود به سامانه"
              )}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--win11-text-tertiary)'
          }}>
            نسخه 4.0 - شبح حبشی
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
