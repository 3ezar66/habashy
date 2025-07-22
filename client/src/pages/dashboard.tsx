import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsOverview } from "@/components/StatsOverview";
import { InteractiveMap } from "@/components/InteractiveMap";
import DeviceList from "@/components/DeviceList";
import { RecentActivity } from "@/components/RecentActivity";
import { ScanControls } from "@/components/ScanControls";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-right">سامانه تشخیص ماینر</h1>
        <ScanControls />
      </div>
      
      <StatsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">نقشه تعاملی</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveMap />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-right">فعالیت‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-right">لیست دستگاه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceList />
        </CardContent>
      </Card>
    </div>
  );
}
