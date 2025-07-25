import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsOverview from "@/components/StatsOverview";
import InteractiveMap from "@/components/InteractiveMap";
import DeviceList from "@/components/DeviceList";
import RecentActivity from "@/components/RecentActivity";
import ScanControls from "@/components/ScanControls";
import AdvancedDetectionCenter from "@/components/AdvancedDetectionCenter";
import Advanced3DMap from "@/components/Advanced3DMap";
import RealTimeAlerts from "@/components/RealTimeAlerts";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import {
  Radar,
  Map,
  Target,
  Activity,
  Settings,
  BarChart3,
  Zap,
  Brain
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold bg-gradient-to-l from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent" style={{ fontFamily: "'Aref Ruqaa Ink', serif" }}>
            سامانه کاشف - نسخه شبح حبشی 4
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
            اسکن، جستجو، شناسایی، کشف و رصد دستگاه‌های استخراج رمزارز دیجیتال غیرمجاز با فناوری‌های پیشرفته
          </p>
          <div className="flex items-center space-x-reverse space-x-2 mt-2 text-xs text-muted-foreground">
            <span>استان ایلام</span>
            <span>•</span>
            <span>جمهوری اسلامی ایران</span>
            <span>•</span>
            <span className="text-green-600">آنلاین</span>
          </div>
        </div>
        <ScanControls />
      </div>

      {/* Statistics Overview */}
      <StatsOverview />

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="ml-2 h-4 w-4" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center">
            <Radar className="ml-2 h-4 w-4" />
            تشخیص پیشرفته
          </TabsTrigger>
          <TabsTrigger value="3dmap" className="flex items-center">
            <Map className="ml-2 h-4 w-4" />
            نقشه سه‌بعدی
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <Brain className="ml-2 h-4 w-4" />
            تحلیل هوشمند
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center">
            <Target className="ml-2 h-4 w-4" />
            دستگاه‌ها
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <Activity className="ml-2 h-4 w-4" />
            فعالیت‌ها
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Map className="ml-2 h-5 w-5" />
                  نقشه تعاملی کلاسیک
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <Activity className="ml-2 h-5 w-5" />
                  فعالیت‌های اخیر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-800">
                <Target className="ml-2 h-5 w-5" />
                دستگاه‌های شناسایی شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Detection Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedDetectionCenter />
        </TabsContent>

        {/* 3D Map Tab */}
        <TabsContent value="3dmap" className="space-y-6">
          <Advanced3DMap />
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics />
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="ml-2 h-5 w-5 text-primary" />
                مدیریت دستگاه‌های شناسایی شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="ml-2 h-5 w-5 text-primary" />
                  جریان فعالیت‌های سیستم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="ml-2 h-5 w-5 text-yellow-500" />
                  آمار عملکرد سیستم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">تعداد کل اسکن‌ها</span>
                    <span className="font-semibold persian-numbers">147</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ماینرهای تشخیص داده شده</span>
                    <span className="font-semibold persian-numbers text-red-600">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">دقت تشخیص</span>
                    <span className="font-semibold persian-numbers text-green-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">زمان آخرین اسکن</span>
                    <span className="font-semibold text-xs">۵ دقیقه پیش</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time Alerts Component */}
      <RealTimeAlerts />
    </div>
  );
}
