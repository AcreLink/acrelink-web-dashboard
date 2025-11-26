import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, BarChart, Bar } from "recharts";
import { AlertCircle, Droplet, Download, Battery, Signal, Calendar, RefreshCw, TrendingUp, DollarSign, Activity, CloudRain } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import acreLinkLogo from "@/assets/acrelink-logo.png";


interface SensorZone {
  zone: string;
  moisture: number;
  temperature: number;
  status: string;
  lastIrrigation: string;
  batteryVoltage: number;
  signalStrength: number;
}

const Dashboard = () => {
    // Track which zones are enabled for the chart
    const [enabledZones, setEnabledZones] = useState<{ [zone: string]: boolean }>({
      "North Field": true,
      "South Field": true,
      "East Field": true,
      "West Field": true,
    });

    const handleToggleZone = (zone: string) => {
      setEnabledZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
    };
  // Standalone dashboard: no auth, no navigation
  const [data, setData] = useState<SensorZone[]>([
    { zone: "North Field", moisture: 28, temperature: 19, status: "Dry", lastIrrigation: "36 hours ago", batteryVoltage: 3.2, signalStrength: 85 },
    { zone: "South Field", moisture: 42, temperature: 21, status: "Optimal", lastIrrigation: "18 hours ago", batteryVoltage: 3.6, signalStrength: 92 },
    { zone: "East Field", moisture: 65, temperature: 23, status: "Wet", lastIrrigation: "12 hours ago", batteryVoltage: 3.8, signalStrength: 78 },
    { zone: "West Field", moisture: 51, temperature: 20, status: "Optimal", lastIrrigation: "24 hours ago", batteryVoltage: 3.5, signalStrength: 88 },
  ]);
  const [history, setHistory] = useState<Array<{ timestamp: string; North: number; South: number; East: number; West: number }>>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [chartView, setChartView] = useState<"moisture" | "water" | "forecast">("moisture");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const newData = data.map((zone) => {
        const newMoisture = Math.floor(Math.random() * 70) + 20;
        let newStatus = "Optimal";
        if (newMoisture < 35) newStatus = "Dry";
        else if (newMoisture > 60) newStatus = "Wet";
        
        return {
          ...zone,
          moisture: newMoisture,
          temperature: Math.floor(Math.random() * 10) + 18,
          status: newStatus,
          batteryVoltage: +(Math.random() * 0.8 + 3.0).toFixed(1),
          signalStrength: Math.floor(Math.random() * 30) + 70,
        };
      });
      setData(newData);
      setLastUpdated(new Date().toLocaleTimeString());

      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        weekday: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
      }); // e.g., 'Mon, 24 14:00'
      setHistory((prev) => [
        ...prev.slice(-19), // keep last 20 records
        {
          timestamp,
          North: newData[0].moisture,
          South: newData[1].moisture,
          East: newData[2].moisture,
          West: newData[3].moisture,
        },
      ]);
      setIsRefreshing(false);
    }, 600);
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [data]);

  const lowMoistureZones = data.filter(zone => zone.status === "Dry");
  const avgMoisture = Math.round(data.reduce((acc, z) => acc + z.moisture, 0) / data.length);
  const waterSavedYTD = 197.8;
  const estimatedSavings = (waterSavedYTD * 45).toFixed(0);
  const sensorUptime = 98.4;
  const activeSensors = data.length;
  const offlineSensors = 0;
  const avgBatteryVoltage = (data.reduce((acc, z) => acc + z.batteryVoltage, 0) / data.length).toFixed(1);

  // No logout in standalone dashboard
  
  const generateReport = () => {
    const reportData = [
      ['AcreLink Validation Dashboard Report'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Key Performance Metrics'],
      ['Average Moisture', `${avgMoisture}%`],
      ['Water Saved YTD', `${waterSavedYTD} acre-feet`],
      ['Estimated Savings', `$${estimatedSavings}`],
      ['Sensor Uptime', `${sensorUptime}%`],
      [''],
      ['Zone Data'],
      ['Zone', 'Moisture %', 'Temperature °C', 'Status', 'Last Irrigation', 'Battery (V)', 'Signal %'],
      ...data.map(zone => [
        zone.zone,
        zone.moisture,
        zone.temperature,
        zone.status,
        zone.lastIrrigation,
        zone.batteryVoltage,
        zone.signalStrength
      ]),
      [''],
      ['System Health'],
      ['Active Sensors', activeSensors],
      ['Offline Sensors', offlineSensors],
      ['Avg Battery Voltage', `${avgBatteryVoltage}V`],
      ['Data Latency', '< 2 seconds']
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acrelink-validation-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getLast7DaysHistory = () => {
    // Assuming each entry in history is for a unique timestamp (e.g., hourly or daily)
    // If timestamps are not daily, adjust logic accordingly
    if (!history || history.length <= 7) return history;
    return history.slice(-7);
  };

  // For table and other data displays, use only actual history (last 3 days)
  const getPast3DaysHistory = () => {
    if (!history || history.length <= 3) return history;
    return history.slice(-3);
  };

  // Utility to get formatted day labels
  const getDayLabel = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  // Prepare 7-day data: 3 past, current, 3 future
  const get7DayChartDataWithZeroFuture = () => {
    const now = new Date();
    // Get last 3 days from history
    const pastDays = [];
    for (let i = 3; i > 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      pastDays.push({
        day: getDayLabel(d),
        ...((history[history.length - i] || history[history.length - 1]) ?? {})
      });
    }
    // Current day
    pastDays.push({
      day: getDayLabel(now),
      ...((history[history.length - 1]) ?? {})
    });
    // Future days: show 0 for all moisture values
    const futureDays = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      futureDays.push({
        day: getDayLabel(d),
        North: 0,
        South: 0,
        East: 0,
        West: 0
      });
    }
    return [...pastDays, ...futureDays];
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation Bar */}
      <nav className="bg-card border-b-2 border-border/50 sticky top-0 z-50 shadow-industrial">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={acreLinkLogo} alt="AcreLink" className="h-12 w-auto drop-shadow-md" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">AcreLink Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* <Button 
              onClick={() => {
                const csvData = [
                  ['Zone', 'Moisture %', 'Temperature °C', 'Status', 'Timestamp'],
                  ...data.map(zone => [zone.zone, zone.moisture, zone.temperature, zone.status, lastUpdated])
                ].map(row => row.join(',')).join('\n');
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `acrelink-data-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              variant="outline" 
              size="sm" 
              className="border-2 hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button> */}

                
          
             <Button 
              size="sm" 
              className="border-2 hidden sm:flex bg-background text-[#3a3835] bg-background hover:bg-accent hover:text-accent-foreground"
              onClick={() => window.location.href = "https://myacrelink.com/"}
            >
             
            Back to home
            </Button>
          </div>
          
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 main-content-section">
        <div className="mb-8">
          <h2 className="text-[clamp(23px,2vw,36px)] font-display font-bold text-foreground ">AcreLink Pilot Dashboard</h2>
          <p className="text-[clamp(14px,2vw,18px)] text-muted-foreground">
            Real-time irrigation insights and system performance for your connected fields.
          </p>
        </div>

        {/* Weather Integration removed for minimal dashboard */}



        {/* Today’s Irrigation Call”  */}

  <Card className="mb-8 shadow-industrial-lg border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 main-content-p0">
    <CardHeader className="border-b-2 border-border/50 bg-card/50 main-content-section">
      <CardTitle className="text-[clamp(20px,2vw,30px)] font-display font-bold text-foreground flex items-center">
        
        <Droplet className="h-8 w-8 mr-3  text-primary" />
        Field Status
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6 main-content-section">
      <div className="main-content-section  flex flex-col md:flex-row md:items-start md:justify-between gap-8 bg-card/80 border-2 border-border/50 rounded-lg p-6 shadow-industrial">
        <div className="flex-1 space-y-4 min-w-[200px]">
          {/* Summary Sentence */}
          {/* <div className="mb-4">
            {lowMoistureZones.length > 0 ? (
              <span className="font-medium text-destructive">
                {lowMoistureZones.map(z => z.zone).join(", ")} moisture is below optimal range. All other zones are on track.
              </span>
            ) : (
              <span className="font-medium text-green-700">
                All zones are on track.
              </span>
            )}
          </div> */}


              <div
              className={`text-s font-medium mb-2 ${
                lowMoistureZones.length > 0
                  ? "border-2 border-destructive/60 bg-destructive/10 rounded-lg p-2 text-destructive"
                  : "border-2 border-green-500/60 bg-green-100/40 rounded-lg p-2 text-green-700"
              }`}
            >
              {lowMoistureZones.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-[clamp(14px,2vw,18px)]">
                    <span className="font-bold text-[clamp(14px,2vw,18px)]">
                      {lowMoistureZones.length === 1
                        ? lowMoistureZones[0].zone
                        : `${lowMoistureZones.length} zones`}
                    </span>{" "}
                   moisture is below optimal range. 
                    
                    <span className="ml-1 text-[clamp(14px,2vw,18px)]  ">
                      All other zones are on track.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[clamp(14px,2vw,18px)]">All zones are on track. No immediate irrigation needed.</span>
                </div>
              )}
            </div>


          {/* Priority Zones */}
          {lowMoistureZones.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">Priority Zones</h3>
              <ul className="space-y-2">
                {lowMoistureZones.map(zone => (
                  <li key={zone.zone} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-[#efeeeb80]-300 bg-[#efeeeb80] rounded-lg p-4">
                    <div className="flex items-center gap-3 flex-wrap whitespace-nowrap sm:justify-center">
                      <span className="font-bold text-gray-900 whitespace-nowrap">{zone.zone}</span>
                      <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">{zone.moisture}% moisture</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold border border-yellow-400">Watch</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                      <span className="flex items-center flex-wrap gap-3 text-xs text-800 px-2 py-1 rounded md:whitespace-nowrap whitespace-pre-line">
                        <div className="flex items-center gap-1">
                        <AlertCircle className="min-h-16px min-w-16px text-gray-700" />
                        <span className="text-sm text-muted-foreground">Drying trend: </span>
                        </div>
                         <span className="font-bold text-sm">Zone drying faster than normal</span>
                        
                      </span>
                      <span className="flex items-center flex-wrap gap-3 text-xs  text-blue-700 px-2 py-1 rounded md:whitespace-nowrap whitespace-pre-line">
                        <div className="flex items-center gap-1">
                        <CloudRain className="min-h-16px min-w-16px text-gray-700" />
                         <span className="text-sm text-muted-foreground">Action: </span>
                         </div>
                         <span className="font-bold text-primary text-sm">Address at next irrigation cycle</span>
                        
                      </span>

                     
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Summary Sentence */}
            {/* <div
              className={`text-s font-medium mb-2 ${
                lowMoistureZones.length > 0
                  ? "border-2 border-destructive/60 bg-destructive/10 rounded-lg p-2 text-destructive"
                  : "border-2 border-green-500/60 bg-green-100/40 rounded-lg p-2 text-green-700"
              }`}
            >
              {lowMoistureZones.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span>
                    <span className="font-bold">
                      {lowMoistureZones.length === 1
                        ? lowMoistureZones[0].zone
                        : `${lowMoistureZones.length} zones`}
                    </span>{" "}
                    need irrigation soon.
                    <span className="ml-2">
                      Irrigate{" "}
                      {lowMoistureZones.length === 1
                        ? lowMoistureZones[0].zone
                        : "priority zones"}{" "}
                      within <span className="font-bold">12–24 hours</span>.
                    </span>
                    <span className="ml-2  ">
                      Other zones are on track.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All zones are on track. No immediate irrigation needed.</span>
                </div>
              )}
            </div> */}

          {/* Low Zones List */}
          {/* {lowMoistureZones.length > 0 && (
            <div>
              
               <h3 className="text-xl   font-display font-bold text-foreground mb-4">  Priority Zones</h3>
              <ul className="space-y-2">
                {lowMoistureZones.map((zone, idx) => {
                  
                  const match = zone.lastIrrigation.match(/(\d+)(?:\s*hours?)/i);
                  const days = match ? (parseInt(match[1], 10) / 24).toFixed(1) : zone.lastIrrigation;
                  return (


                    
                    <div  
                      key={zone.zone}
                      className="main-content-section gap-5 border border-[#efeeeb80] bg-[#efeeeb80] rounded-xl p-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between 
                      hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 border-2 border-gray-300 shadow-inner">
                          <AlertCircle className="h-6 w-6 text-gray-600" />
                        </span>
                        <div>
                          <div className="font-display font-bold text-lg text-gray-900">{zone.zone}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-semibold border border-gray-400">
                              {zone.status}
                            </span>
                            <span className="text-xs text-gray-700 font-semibold">
                              {zone.moisture}% moisture
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap flex-col md:flex-row md:items-center gap-6">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-700" />
                          <span className="text-sm text-muted-foreground">Last:</span>
                          </div>
                          <span className="font-bold text-gray-900 text-base">{days} days ago</span>
                        </div>
                        
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Suggested:</span>
                          </div>
                          <span className="font-bold text-primary text-base">2–3 days</span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-gray-700" />
                          <span className="text-sm text-muted-foreground">Battery:</span>
                          </div>
                          <span className="font-bold text-gray-900 text-base">{zone.batteryVoltage}V</span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                          <Signal className="h-4 w-4 text-gray-700" />
                          <span className="text-sm text-muted-foreground">Signal:</span>
                          </div>
                          <span className="font-bold text-gray-900 text-base">{zone.signalStrength}%</span>
                        </div>
                      </div>
                    </div>
                    
                  );
                })}
              </ul>
            </div>
          )} */}

          {/* Weather Note */}
       <div className="flex flex-wrap items-center justify-between mt-6 pt-4 gap-6 ">
           <div className="bg-accent/10 border-1 rounded-lg p-3 shadow-industrial text-blue-700 bg-blue-100/60 md:w-auto w-full ">
                      <div className="flex items-center justify-between">
                        <div className="flex sm:w-full items-center gap-2 h-8">
                          <CloudRain className="h-5 w-5 text-blue-500" />
                          <h3 className="flex text-lg font-display font-medium mb-0">Rain expected in 6 hours</h3>
                        </div>
                        
                      </div>
                    </div>

          {/* View All Zones Button */}
          <div className="md:w-auto w-full">
            <Button size="lg" className="w-full md:w-auto sm:w-full shadow-industrial hover-glow h-14">
              View All Zones
            </Button>
          </div>
          </div>
        </div>
        {/* Optionally, add a visual or illustration here for balance */}
        
      </div>
    </CardContent>
  </Card>






        {/* Alert Section */}
        {/* {lowMoistureZones.length > 0 && (
          <Alert className="mb-8 border-2 border-destructive/50 bg-destructive/10 shadow-industrial">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDescription className="text-destructive font-semibold text-base">
              Low Moisture Alert: {lowMoistureZones.length} zone(s) need attention - {lowMoistureZones.map(z => z.zone).join(", ")}
            </AlertDescription>
          </Alert>
        )} */}



        {/* Irrigation Instructions Card */}
        {/* <Card className="mb-8 shadow-industrial-lg border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5" >
          <CardHeader className="border-b-2 border-border/50 bg-card/50">
            <CardTitle className="text-3xl font-display font-bold text-foreground flex items-center">
              <Droplet className="h-8 w-8 mr-3 text-primary" />
              Irrigation Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {(() => {
                const dryestZone = [...data].sort((a, b) => a.moisture - b.moisture)[0];
                const waterNeeded = Math.max(0, (50 - dryestZone.moisture) * 0.15).toFixed(2);
                const duration = Math.max(0, Math.ceil((50 - dryestZone.moisture) / 5));
                const waterAppliedThisWeek = 12.4;
                const nextIrrigationDate = new Date(Date.now() + 18 * 60 * 60 * 1000);
                
                return (
                  <>
                    <div className="bg-card/80 border-2 border-border/50 rounded-lg p-6 shadow-industrial">
                      <h3 className="text-xl font-display font-bold text-foreground mb-4">Priority Zone</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-base">
                        <span className="text-muted-foreground">Location:</span>{" "}
                        <span className="font-bold text-foreground text-lg">{dryestZone.zone}</span>
                       
                       
                        </p>
                        <p className="text-base">
                        <span className="text-muted-foreground">Estimated Runtime:</span>{" "}
                        <span className="font-bold text-primary text-lg">{duration} hours</span>
                        </p>
                        <p className="text-base">
                        <span className="text-muted-foreground">Water Amount:</span>{" "}
                        <span className="font-bold text-primary text-lg">{waterNeeded} acre-feet</span>
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-base">
                        <span className="text-muted-foreground">Time Since Last:</span>{" "}
                        <span className="font-bold text-foreground text-lg">{dryestZone.lastIrrigation}</span>
                        </p>
                        <p className="text-base">
                        <span className="text-muted-foreground">Forecasted Next:</span>{" "}
                        <span className="font-bold text-foreground text-lg">{nextIrrigationDate.toLocaleDateString()} @ {nextIrrigationDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </p>
                        <p className="text-base">
                        <span className="text-muted-foreground">Water Applied (Week):</span>{" "}
                        <span className="font-bold text-primary text-lg">{waterAppliedThisWeek} acre-feet</span>
                        </p>
                      </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic mt-4 pt-4 border-t border-border">
                      Current moisture: {dryestZone.moisture}% • Target: 50%
                      </p>
                      <div className="mt-6 flex justify-end">
                      
                      </div>
                    </div>
                    
                    <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-5 shadow-industrial">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-1">Year-to-Date Water Usage</h3>
                          <p className="text-sm text-muted-foreground">Total water applied across all zones </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-display font-bold text-accent">
                            {waterAppliedThisWeek * 15 + 22.3}
                          </div>
                          <p className="text-sm text-muted-foreground font-semibold">acre-feet</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card> */}

        {/* Key Performance Overview */}
        <div className="mb-8">
          <h3 className="text-[clamp(20px,2vw,30px)] font-display font-bold text-foreground mb-4 flex items-center">
            <AlertCircle className="h-7 w-7 mr-3 text-primary" />
            Stress &amp; Uniformity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-industrial hover-lift border-2 border-border/50">
              <CardHeader className="pb-3">
          <CardTitle className="text-sm flex-wrap gap-3 font-display font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
            <AlertCircle className="h-6 w-6 mr-2 text-destructive" />
            Number of zones at risk today
          </CardTitle>
              </CardHeader>
              <CardContent>
          <div className="text-3xl font-display font-bold text-destructive">2</div>
          <p className="text-xs text-muted-foreground mt-1">1 Dry, 1 Wet</p>
              </CardContent>
            </Card>
            <Card className="shadow-industrial hover-lift border-2 border-border/50">
              <CardHeader className="pb-3">
          <CardTitle className=" flex-wrap gap-3 text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-primary" />
            Percentage of acres currently on track
          </CardTitle>
              </CardHeader>
              <CardContent>
          <div className="text-3xl font-display font-bold text-primary">85%</div>
          {/* <p className="text-xs text-muted-foreground mt-1">of acres currently on track</p> */}
              </CardContent>
            </Card>

            {/* <Card className="shadow-industrial hover-lift border-2 border-border/50">
              <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-accent" />
            Avg Days Until Next Irrigation
          </CardTitle>
              </CardHeader>
              <CardContent>
          <div className="text-3xl font-display font-bold text-accent">7</div>
          <p className="text-xs text-muted-foreground mt-1">days (average)</p>
              </CardContent>
            </Card> */}
          </div>
          <div className="  main-content-p0">
            <ul className="space-y-2">
              <Alert className="bg-yellow-100/60 border-l-4 border-yellow-400 rounded-md"><li className="flex flex-wrap gap-2 items-center text-yellow-800 text-[clamp(14px,2vw,18px)] font-medium">
                
          <AlertCircle className="h-4 w-4 mr-2 text-yellow-600"  />
          North Field drying faster than normal
              </li>
              </Alert>

              <Alert className="bg-yellow-100/60 border-l-4 border-yellow-400 rounded-md"><li className="flex flex-wrap gap-2 items-center text-yellow-800 text-[clamp(14px,2vw,18px)] font-medium">
          <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
          East Field uneven wetting last irrigation
              </li>
              </Alert>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap sm:justify-between justify-center items-center mb-6 gap-6">
          <p className="text-sm text-muted-foreground font-medium">
            Last updated: <span className="font-bold text-foreground">{lastUpdated}</span>
          </p>
          <Button onClick={refreshData} size="lg" className="shadow-industrial hover-glow h-12 px-6" disabled={isRefreshing}>
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Zone Grid */}
        <div className="mb-8" >
          <h3 className="text-[clamp(20px,2vw,30px)] font-display font-bold text-foreground mb-4">Zone Status Grid Upgrade</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map((zone, index) => {
              const statusColors = {
                "Dry": { bg: "bg-yellow-500/10", border: "border-yellow-500/60", text: "text-yellow-600 dark:text-yellow-400", bar: "bg-yellow-500" },
                "Optimal": { bg: "bg-green-500/10", border: "border-green-500/60", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" },
                "Wet": { bg: "bg-blue-500/10", border: "border-blue-500/60", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
              };
              const colors = statusColors[zone.status as keyof typeof statusColors] || statusColors.Optimal;
              
              return (




                
                <Card  
                  key={index} 
                  className={`shadow-industrial border-2 hover-lift group relative overflow-hidden border-[#DEDBD4]`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${colors.bar}`} />
                  <CardContent className="p-5 pt-7">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-display font-bold text-foreground">{zone.zone}</h2>
                    {zone.status === "Dry" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="space-y-2.5" >
                        {/* Temperature in Fahrenheit */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center">
                          🌡 Temperature
                        </span>
                        <span className="font-bold text-foreground">
                          {Math.round(zone.temperature * 9 / 5 + 32)}°F
                        </span>
                      </div>

                      {/* Moisture bar and percentage of target */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Droplet className="h-3.5 w-3.5 mr-1.5 text-primary" /> Moisture
                        </span>
                        <span className="font-bold text-foreground">{zone.moisture}%</span>
                      </div>

                      {/* <div className="flex justify-between gap-8 items-center">
                       <div className="w-full h-3 bg-border rounded-full mt-1 mb-1 flex items-center">
                        <div
                          className={`h-3 rounded-full ${colors.bar}`}
                          style={{
                            width: `${Math.min(100, Math.round((zone.moisture / 80) * 100))}%`,
                            transition: "width 0.4s"
                          }}
                        />
                      </div>
                        <span className=" font-bold text-foreground">
                          {Math.round((zone.moisture / 80) * 100)}%
                        </span>
                        </div> */}
                    {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" /> Last Irrigation
                    </span>
                    <span className="font-semibold text-foreground text-sm">{zone.lastIrrigation}</span>
                    </div> */}
                    <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Battery className="h-3.5 w-3.5 mr-1.5" /> Battery
                    </span>
                    <span className="font-bold text-foreground">{zone.batteryVoltage}V</span>
                    </div>
                    <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Signal className="h-3.5 w-3.5 mr-1.5" /> Signal
                    </span>
                    <span className="font-bold text-foreground">{zone.signalStrength}%</span>
                    </div>
                    {/* Trend Tag */}
                    {/* <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-primary" />
                      Trend
                    </span>
                    <span className={
                      (() => {
              
                      if (zone.status === "Dry" && zone.moisture < 35) return "px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold border border-yellow-400";
                      if (zone.status === "Wet") return "px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-semibold border border-blue-400";
                      return "px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-semibold border border-green-400";
                      })()
                    }>
                      {(() => {
                      if (zone.status === "Dry" && zone.moisture < 35) return "Drying fast";
                      if (zone.status === "Wet") return "Stable";
                      return "Normal";
                      })()}
                    </span>
                    </div> */}

 {/* Issue tag */}
                      {/* <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1 text-primary" />
                          Issue
                        </span>
                        <span
                          className={
                            (() => {
                              // Example: East Field has uneven wetting, North Field has dry streaks, others no issues
                              if (zone.zone === "East Field") return "px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-300";
                              if (zone.zone === "North Field" && zone.status === "Dry") return "px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold border border-yellow-300";
                              return "px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-300";
                            })()
                          }
                        >
                          {(() => {
                            if (zone.zone === "East Field") return "Uneven wetting";
                            if (zone.zone === "North Field" && zone.status === "Dry") return "Dry streaks detected";
                            return "No issues";
                          })()}
                        </span>
                      </div> */}

                    <div className="pt-3 mt-3 border-t-2 border-border">
                    <p className={`font-display font-bold text-sm flex items-center justify-center ${colors.text}`}>
                      Status: {zone.status}
                    </p>
                    </div>
                  </div>
                  </CardContent>
                </Card>








              );
            })}
          </div>
        </div>

        {/* Trends and Analytics */}
        <Card className=" mb-8 shadow-industrial-lg border-2 border-border/50">
          <CardHeader className="main-content-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
              <div>
              <CardTitle className="text-[clamp(20px,2vw,30px)] font-display font-bold">Moisture Trends by Zone</CardTitle>
               <p className="text-[clamp(14px,2vw,18px)] text-muted-foreground">
            Green Shaded Area is Optimal Moisture Zone” (80%-100%)
          </p>
          </div>

              <div className="flex gap-2 justify-end flex-wrap">
                <Button 
                  onClick={() => setChartView("moisture")}
                  variant={chartView === "moisture" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  Soil Moisture
                </Button>
                <Button 
                  onClick={() => setChartView("forecast")}
                  variant={chartView === "forecast" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  Drying Forecast (7 day future)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="main-content-section"  >
            {chartView === "moisture" && (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={get7DayChartDataWithZeroFuture()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    {/* Optimal Zone band */}
                    <ReferenceArea y1={80} y2={100} stroke={undefined} fill="#b6e7b0" fillOpacity={0.4} />
                    <XAxis 
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      domain={[0, 120]}
                      ticks={[0, 20, 40, 60, 80, 100, 120]}
                      label={{ value: 'Moisture %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                    />
                    {enabledZones["North Field"] && (
                      <Line type="monotone" dataKey="North" stroke="hsl(var(--chart-1))" name="North Field" strokeWidth={3} />
                    )}
                    {enabledZones["South Field"] && (
                      <Line type="monotone" dataKey="South" stroke="hsl(var(--chart-2))" name="South Field" strokeWidth={3} />
                    )}
                    {enabledZones["East Field"] && (
                      <Line type="monotone" dataKey="East" stroke="hsl(var(--chart-3))" name="East Field" strokeWidth={3} />
                    )}
                    {enabledZones["West Field"] && (
                      <Line type="monotone" dataKey="West" stroke="#8B5CF6" name="West Field" strokeWidth={3} dot={{ r: 4 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                {/* Custom legend with checkboxes for toggling zones (only this row, no line legend above) */}
                <div className="flex justify-center flex-wrap gap-6 mt-4 mb-2">
                  {[
                    { zone: "North Field", color: "hsl(var(--chart-1))" },
                    { zone: "South Field", color: "#e2b93b" },
                    { zone: "East Field", color: "#3bb8a6" },
                    { zone: "West Field", color: "#8B5CF6" }
                  ].map(({ zone, color }) => (
                    <label key={zone} className="flex  items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabledZones[zone]}
                        onChange={() => handleToggleZone(zone)}
                        style={{ accentColor: color }}
                        className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      />
                      <span className="whitespace-nowrap text-[clamp(14px,2vw,16px)]" style={{ color, fontWeight: 600 }}>{zone}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
            
            {chartView === "water" && (
              <div style={{ width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      { week: 'Week 1', applied: 8.2, et0: 9.1 },
                      { week: 'Week 2', applied: 11.5, et0: 10.8 },
                      { week: 'Week 3', applied: 9.8, et0: 11.2 },
                      { week: 'Week 4', applied: 12.4, et0: 12.6 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis
                      label={{
                        value: 'acre-feet',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))' }
                      }}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                    />
                    <Legend />
                    <Bar dataKey="applied" fill="hsl(var(--primary))" name="Water Applied (acre-feet)" />
                    <Bar dataKey="et0" fill="hsl(var(--chart-2))" name="ET₀ Reference (acre-feet)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {chartView === "forecast" && (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={[
                    { day: 'Today', North: avgMoisture + 2, South: avgMoisture - 3, East: avgMoisture + 8, West: avgMoisture + 5 },
                    ...Array.from({ length: 6 }, (_, i) => {
                      const futureDate = new Date();
                      futureDate.setDate(futureDate.getDate() + i + 1);
                      const label = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return {
                        day: label,
                        North: avgMoisture - 2 - i * 3,
                        South: avgMoisture - 6 - i * 3,
                        East: avgMoisture + 5 - i * 3,
                        West: avgMoisture + 2 - i * 3,
                      };
                    })
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      label={{ value: 'Forecasted Moisture %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontWeight: 600
                      }}
                    />
                    {/* Only render enabled zone lines */}
                    {enabledZones["North Field"] && (
                      <Line type="monotone" dataKey="North" stroke="hsl(var(--chart-1))" name="North Field" strokeWidth={3} strokeDasharray="5 5" />
                    )}
                    {enabledZones["South Field"] && (
                      <Line type="monotone" dataKey="South" stroke="#e2b93b" name="South Field" strokeWidth={3} strokeDasharray="5 5" />
                    )}
                    {enabledZones["East Field"] && (
                      <Line type="monotone" dataKey="East" stroke="#3bb8a6" name="East Field" strokeWidth={3} strokeDasharray="5 5" />
                    )}
                    {enabledZones["West Field"] && (
                      <Line type="monotone" dataKey="West" stroke="#8B5CF6" name="West Field" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                {/* Custom legend with checkboxes for toggling zones (only this row, no line legend above) */}
                <div className="flex justify-center gap-6 mt-4 mb-2">
                  {[
                    { zone: "North Field", color: "hsl(var(--chart-1))" },
                    { zone: "South Field", color: "#e2b93b" },
                    { zone: "East Field", color: "#3bb8a6" },
                    { zone: "West Field", color: "#8B5CF6" }
                  ].map(({ zone, color }) => (
                    <label key={zone} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabledZones[zone]}
                        onChange={() => handleToggleZone(zone)}
                        style={{ accentColor: color }}
                        className="w-5 h-5 rounded"
                      />
                      <span style={{ color, fontWeight: 600 }}>{zone}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ROI & Reporting Summary */}
        <Card className="mb-8 shadow-industrial-lg border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="border-b-2 border-border/50 bg-card/50">
            <CardTitle className="text-[clamp(20px,2vw,30px)] font-display font-bold text-foreground flex items-center">
              <DollarSign className="h-8 w-8 mr-3 text-primary" />
              Reports & Summaries
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 main-content-section">
            <div className="grid md:grid-cols-3 gap-6 mb-0 main-content-p0">
              {/* Left Card: Irrigation Cycle Summary */}
              <div className="bg-card/80 border-2 border-border/50 rounded-lg p-5 shadow-industrial flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-2">Irrigation Cycle Summary</p>
          <p className="text-[clamp(20px,2vw,30px)] font-display font-bold text-primary">
            {data.filter(z => z.status === "Optimal").length} of {data.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Fields in Optimal Range</p>
              </div>
              {/* Center Card: Lease-to-Own Status */}
              <div className="bg-card/80 border-2 border-border/50 rounded-lg p-5 shadow-industrial flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-2">Lease-to-Own Status</p>
          <p className="text-[clamp(20px,2vw,30px)] font-display font-bold text-chart-2">Month 18 of 36</p>
          <div className="w-full h-[10px] bg-border rounded-full overflow-hidden mt-3 mb-1">
            <div
              className="h-[10px]  bg-primary transition-all duration-500"
              style={{ width: `${Math.round((18 / 36) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{Math.round((18 / 36) * 100)}% complete</p>
              </div>
              {/* Right Card: Reports */}
              <div className="bg-card/80 border-2 border-border/50 rounded-lg p-5 shadow-industrial flex flex-col justify-center">
          <p className="text-lg font-semibold text-primary mb-3">Season Summary Available</p>
          {/* <p className="text-sm text-muted-foreground mb-4">Download or generate reports for your records.</p> */}
          <div className="flex flex-col gap-3">
            <Button size="lg" className="shadow-industrial hover-glow btn-style" onClick={generateReport}>
              <Download className="h-5 w-5 mr-2" />
              Download Season Summary
            </Button>

            <Button size="lg" variant="outline" className="shadow-industrial hover-glow btn-style">
              Generate Cost-Share Report
            </Button>
          </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health Summary */}
        <Card className="mb-8 shadow-industrial-lg border-2 border-border/50">
          <CardHeader className="main-content-section">
            <CardTitle className="  text-[clamp(20px,2vw,30px)] font-display font-bold flex items-center">
              <Activity className="h-8 w-8 mr-3 text-primary" />
              System Health Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="main-content-section">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-display font-bold">Metric</TableHead>
                  <TableHead className="font-display font-bold text-right">Value</TableHead>
                  <TableHead className="font-display font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold whitespace-nowrap">Sensors Online</TableCell>
                  <TableCell className="text-right font-bold text-s">
                    {activeSensors} / {activeSensors + offlineSensors}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="px-3 whitespace-nowrap py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">
                      Good
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold whitespace-nowrap">Average Battery Level</TableCell>
                  <TableCell className="text-right font-bold text-s whitespace-nowrap">{avgBatteryVoltage}V</TableCell>
                  <TableCell className="text-right">
                    <span className={
                      Number(avgBatteryVoltage) < 3.3
                        ? "px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-700 text-sm font-semibold"
                        : "px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold"
                    }>
                      {Number(avgBatteryVoltage) < 3.3 ? "Watch" : "Good"}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold whitespace-nowrap">Last Sync Time</TableCell>
                  <TableCell className="text-right font-bold text-s whitespace-nowrap ">{lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <span className={
                      new Date().getTime() - new Date(`1970-01-01T${lastUpdated}Z`).getTime() > 1000 * 60 * 10
                        ? "px-3 py-1 rounded-full bg-red-500/20 text-red-600 text-sm font-semibold whitespace-nowrap"
                        : "px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold whitespace-nowrap"
                    }>
                      {new Date().getTime() - new Date(`1970-01-01T${lastUpdated}Z`).getTime() > 1000 * 60 * 10
                        ? "Action Needed"
                        : "Good"}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
              {/* <TableHeader>
                <TableRow>
                  <TableHead className="font-display font-bold">Metric</TableHead>
                  <TableHead className="font-display font-bold text-right">Value</TableHead>
                  <TableHead className="font-display font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Active Sensors</TableCell>
                  <TableCell className="text-right font-bold text-lg">{activeSensors}</TableCell>
                  <TableCell className="text-right">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">Excellent</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Offline Sensors</TableCell>
                  <TableCell className="text-right font-bold text-lg">{offlineSensors}</TableCell>
                  <TableCell className="text-right">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">Good</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Average Battery Voltage</TableCell>
                  <TableCell className="text-right font-bold text-lg">{avgBatteryVoltage}V</TableCell>
                  <TableCell className="text-right">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">Healthy</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Data Latency</TableCell>
                  <TableCell className="text-right font-bold text-lg">&lt; 2 seconds</TableCell>
                  <TableCell className="text-right">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">Optimal</span>
                  </TableCell>
                </TableRow>
              </TableBody> */}
            </Table>
          </CardContent>
        </Card>

        {/* No navigation to home in minimal dashboard */}
      </div>
    </div>
  );
};

export default Dashboard;
