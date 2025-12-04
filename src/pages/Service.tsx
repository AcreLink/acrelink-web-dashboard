// src/pages/service/ServicePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import acreLinkLogo from "@/assets/acrelink-logo.png";
import { QrCode } from "lucide-react";


// --- Mock Data (replace with API calls later) ---
const MOCK_SITES = [

    { id: "none", name: "Select a site", info: "" },
  { id: "demo-a", name: "Demo Site A", info: "Hay Farm, 20 sensors planned", planned: 20 },
  { id: "demo-b", name: "Demo Site B", info: "Orchard, 35 sensors planned", planned: 35 },
  { id: "demo-c", name: "Demo Site C", info: "Wheat Farm, 21 sensors planned", planned: 21 },
];

type SensorStatus = "Planned" | "Installed" | "Needs service" | "Offline";

type Sensor = {
  id: string; // unique e.g. ACR-0001
  label?: string;
  siteId: string;
  depth?: "Shallow (0–6 in)" | "Medium (6–12 in)" | "Deep (12–24 in)";
  installDate?: string; // ISO
  gps?: { lat: number; lng: number; accuracyFt: number; capturedAt: string } | null;
  status?: SensorStatus;
  notes?: string;
  history?: string[]; // simple list of past events
};

const DEFAULT_MOCK_SENSORS: Sensor[] = [
  { id: "ACR-0001", siteId: "demo-a", depth: "Medium (6–12 in)", installDate: "2025-03-10", gps: null, status: "Installed", notes: "", history: ["2025-03-10 – Installed at 6–8 in, east field, Parker"] },
  { id: "ACR-0002", siteId: "demo-a", depth: "Shallow (0–6 in)", installDate: "2025-03-12", gps: null, status: "Planned", notes: "", history: [] },
  { id: "ACR-0101", siteId: "demo-b", depth: "Deep (12–24 in)", installDate: "2025-02-20", gps: { lat: 36.12, lng: -115.17, accuracyFt: 14, capturedAt: "2025-04-01T10:30:00Z" }, status: "Installed", notes: "Near oak tree", history: ["2025-02-20 – Installed by Lopez"] },
  { id: "ACR-0201", siteId: "demo-c", depth: "Medium (6–12 in)", installDate: "2025-01-10", gps: null, status: "Needs service", notes: "Intermittent connectivity", history: ["2025-04-15 – Checked connectivity, OK"] },
];

// --- Utilities ---
const metersToFeet = (m: number) => m * 3.28084;
const nowISO = () => new Date().toISOString();


function makeId() {
  // Simple ID generator for new sensors
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ACR-${n.toString().slice(0, 4)}`;
}

// --- Main Page ---
const Service: React.FC = () => {
  // Load sensors from localStorage or use mock
  const [sensors, setSensors] = useState<Sensor[]>(() => {
    try {
      const raw = localStorage.getItem("acrelink_service_sensors");
      if (raw) return JSON.parse(raw) as Sensor[];
    } catch (e) { /* ignore */ }
    return DEFAULT_MOCK_SENSORS;
  });

  useEffect(() => {
    // persist to localStorage
    localStorage.setItem("acrelink_service_sensors", JSON.stringify(sensors));
  }, [sensors]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("none");
  // const [selectedSiteId, setSelectedSiteId] = useState<string>(MOCK_SITES[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [remarks, setRemarks] = useState("");
  const [techName] = useState("Parker"); // placeholder; in future replace with auth

  // Filter sensors by selected site and search
  const visibleSensors = useMemo(() => {
    return sensors
      .filter(s => s.siteId === selectedSiteId)
      .filter(s => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return s.id.toLowerCase().includes(t) || (s.label || "").toLowerCase().includes(t);
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [sensors, selectedSiteId, searchTerm]);

  // Open panel for create
  const openCreate = () => {
    const newSensor: Sensor = {
      id: "",
      siteId: selectedSiteId,
      depth: undefined,
      installDate: format(new Date(), "yyyy-MM-dd"),
      gps: null,
      status: "Planned",
      notes: "",
      history: [],
    };
    setEditingSensor(newSensor);
    setPanelOpen(true);
  };

  // Open panel for edit
  const openEdit = (s: Sensor) => {
    // simple deep clone
    setEditingSensor(JSON.parse(JSON.stringify(s)));
    setPanelOpen(true);
  };

  // Save sensor (stub: updates local state)
  const saveSensor = (sensor: Sensor) => {
    if (!sensor.id || sensor.id.trim() === "") {
      // For new sensors, generate id if not provided
      sensor.id = makeId();
    }

    setSensors(prev => {
      const existingIdx = prev.findIndex(p => p.id === sensor.id);
      if (existingIdx >= 0) {
        // update
        const copy = [...prev];
        copy[existingIdx] = sensor;
        return copy;
      } else {
        // add
        return [sensor, ...prev];
      }
    });

    // stubbed save action - console log and localStorage handled by hook
    console.log("Stub save sensor:", sensor);
    alert(`Saved ${sensor.id}`);
    setPanelOpen(false);
    setEditingSensor(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setPanelOpen(false);
    setEditingSensor(null);
  };

  // Capture GPS for the editing sensor
  const captureGPS = async () => {
    if (!editingSensor) return;
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyMeters = pos.coords.accuracy || 0;
        const accuracyFt = Math.round(metersToFeet(accuracyMeters));
        const capturedAt = new Date().toISOString();

        setEditingSensor(prev => prev ? { ...prev, gps: { lat, lng, accuracyFt, capturedAt } } : prev);
      },
      (err) => {
        console.error("GPS error", err);
        alert("Unable to get GPS, please try again. (" + (err.message || "unknown") + ")");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  // Delete sensor (optional small helper)
  const deleteSensor = (id: string) => {
    if (!confirm("Delete this sensor?")) return;
    setSensors(prev => prev.filter(s => s.id !== id));
  };

  // Site info
  // const selectedSite = MOCK_SITES.find(s => s.id === selectedSiteId)!;




const [selectedSensors, setSelectedSensors] = useState<string[]>([]);

 const handleSelectSensor = (id: string) => {
  if (!selectedSensors.includes(id)) {
    setSelectedSensors(prev => [...prev, id]);
  }
};

const removeSelected = (id: string) => {
  setSelectedSensors(prev => prev.filter(s => s !== id));
};

const handleSaveSelection = () => {
  if (selectedSensors.length === 0) {
    alert("No sensors selected!");
    return;
  }

  console.log("Selected sensors:", selectedSensors);
  console.log("Remarks:", remarks);

  alert("Saved successfully!");

  // reset after save
  setSelectedSensors([]);
  setRemarks("");
};





  return (
    <div>
              <nav className="bg-card border-b-2 border-border/50 sticky top-0 z-50 shadow-industrial">
                     <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <img src={acreLinkLogo} alt="AcreLink" className="h-12 w-auto drop-shadow-md" />
                         <div>
                           <h1 className="text-[clamp(18px,2vw,24px)] font-display font-bold text-foreground">AcreLink Service</h1>
                           
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
         

                
          
               <div className="text-sm text-muted-foreground">Tech: <span className="font-medium">{techName}</span></div>
          </div>
                       
                     </div>
                   </nav>
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-7xl mx-auto px-6 py-8 main-content-section">
      {/* Top bar */}
      

      
      <div className="mb-8 flex items-center justify-between">

        <div>
          <h2 className="text-[clamp(23px,2vw,36px)] font-display font-bold text-foreground ">Service Mode</h2>
          <p className="text-[clamp(14px,2vw,18px)] text-muted-foreground">
            Tag sensors, capture GPS, and log install or service visits.
          </p>
          </div>
     
        </div>








      {/* Step 1 - site selector */}
 <Card className="mb-8 shadow-industrial-lg border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 main-content-p0">
    <CardHeader className="border-b-2 border-border/50 bg-card/50 main-content-section">
      <CardTitle className="text-[clamp(20px,2vw,30px)] font-display font-semiBold text-foreground flex items-center">
        
       
        Select site
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6 main-content-section">
      
    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
  <SelectTrigger className="h-[80px] border-2 rounded-lg p-4 focus:none focus:none focus:ring-offset-0 ">
    <SelectValue placeholder="Select a site" />
  </SelectTrigger>

  <SelectContent>

    {/* Default placeholder (disabled) */}
    <SelectItem value="none" >
      <span className="opacity-60 text-lg">Select a site</span>
    </SelectItem>

    {/* Actual items */}
    {MOCK_SITES.filter(s => s.id !== "none").map(site => (
      <SelectItem key={site.id} value={site.id}>
        <div className="flex flex-col text-start">
          <span className="font-semibold text-lg">{site.name}</span>
          <span className="text-md text-muted-foreground">{site.info}</span>
        </div>
      </SelectItem>
    ))}

  </SelectContent>
</Select>


      
       
      {/* Step 2 - sensors */}
   {selectedSiteId !== "none" && (

    <section className="mb-10 mt-8">

  <div className="flex items-center justify-between mb-4 sensor-mob">
    <h2 className="text-lg font-semibold">Sensors on this site</h2>
    <Button onClick={openCreate} size="sm">+ Add Sensor</Button>
  </div>

  {/* CHIPS + SEARCH (Gmail style) */}
  <div className="mb-4 border rounded-lg px-3 py-2 bg-white min-h-[50px] flex flex-wrap gap-2 items-center">

    {selectedSensors.map(id => (
      <span
        key={id}
        className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 
        text-xs rounded-full flex items-center gap-2"
      >
        {id}
        <button
          onClick={() => removeSelected(id)}
          className="text-primary hover:text-red-600"
        >
          ✕
        </button>
      </span>
    ))}

    <input
      className="outline-none flex-1 text-lg h-[50px]"
      placeholder={selectedSensors.length === 0 ? "Search sensors..." : ""}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  
              {/* <Alert className="bg-yellow-100/60 border-l-4 border-yellow-400 rounded-md"><div className="flex flex-wrap gap-2 items-center text-yellow-800 text-[clamp(14px,2vw,18px)] font-medium">
                
          <AlertCircle className="h-4 w-4 mr-2 text-yellow-600"  />
          North Field drying faster than normal
              </div>
              </Alert> */}

  {/* SENSOR LIST */}
  <div className="space-y-3 max-h-[40vh] overflow-auto pb-6">

    {visibleSensors
      .filter(s => !selectedSensors.includes(s.id))   // hide selected
      .filter(s => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return s.id.toLowerCase().includes(t) || (s.label || "").toLowerCase().includes(t);
      })
      .map(s => (

         

              
         
        <div
          key={s.id}
          onClick={() => handleSelectSensor(s.id)}
          className="cursor-pointer  rounded-lg p-3 
          shadow-sm hover:border-blue-400 hover:bg-blue-50 transition bg-yellow-100/60 border-l-4 border-yellow-400 rounded-md"
        >
          <div className="flex gap-4  items-center flex justify-between mob-wrap">
<div className=" w-full">
          <div className="text-lg font-semibold">{s.id}</div>
          <div className="text-md text-muted-foreground mt-1 flex flex-wrap gap-4">
            <span>Depth: {s.depth ?? "—"}</span>
            <span>GPS: {s.gps ? `captured (±${s.gps.accuracyFt} ft)` : "Not captured"}</span>
            <span>Status: {s.status}</span>
             
            

          </div>
          {s.notes && (
            <div className="text-md mt-3  text-muted-foreground">Note: {s.notes}</div>
          )}

          </div>
          <div className="text-md text-muted-foreground mt-1 whitespace-nowrap">
            {s.installDate ? `Installed: ${format(new Date(s.installDate), "MMM d, yyyy")}` : ""}
          </div>
          </div>
        </div>
      ))}

    {/* No sensors found */}
    {visibleSensors.filter(s =>
      !selectedSensors.includes(s.id) &&
      (searchTerm ? s.id.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    ).length === 0 && (
      <div className="text-sm text-muted-foreground">No sensors found.</div>
    )}

  </div>

  {/* REMARKS INPUT */}
  <div className="mt-4">
    <label className="text-lg font-semibold">Remarks</label>
    <textarea
      className="w-full mt-2 p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary text-md"
      rows={3}
      placeholder="Write any notes or remarks..."
      value={remarks}
      onChange={(e) => setRemarks(e.target.value)}
    />
  </div>

  {/* SAVE BUTTON */}
  <div className="mt-4 flex justify-end">
    <Button size="lg" className="shadow-industrial hover-glow h-12 px-6" onClick={handleSaveSelection}>
      Save Selection
    </Button>
  </div>

</section>
)}

        
      
    </CardContent>
  </Card>



     




      {/* Detail Panel - slide over / full screen */}
      {panelOpen && editingSensor && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => { /* don't close on backdrop click to avoid accidental close */ }} />

          <div className="absolute inset-y-0 right-0 w-full md:w-[640px] bg-white overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={cancelEdit} className="text-sm text-muted-foreground">← Back</button>
              <div className="text-lg font-semibold">{editingSensor.id ? `Sensor ${editingSensor.id}` : "New Sensor"}</div>
              <div style={{ width: 32 }} />
            </div>

            {/* Panel content */}
            <div className="space-y-4 pb-24 mt-4">
              {/* Sensor ID */}
              <div className="mt-4 ">
                <Label className="text-md ">Sensor ID / Label</Label>
                <div className="flex items-center gap-2 mt-2">
                <Input className=""
                  placeholder="ACR-0001"
                  value={editingSensor.id}
                  onChange={(e: any) => setEditingSensor(prev => prev ? { ...prev, id: e.target.value } : prev)}
                />
               
                <div className="">
  <Button 
    size="sm" 
    variant="outline"
    className="flex items-center gap-2"
    onClick={() => alert("Scan QR - placeholder")}
  >
    <QrCode className="h-5 w-5" />
  </Button>
</div>
 </div>

               

              </div>
                {/* <div className="text-xs text-muted-foreground mt-1">Scan QR or enter ID manually.</div> */}

              {/* Device metadata (read only) */}
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <div className="text-sm text-muted-foreground mb-2">Device metadata (read-only)</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>DevEUI: —</div>
                  <div>Battery: —</div>
                  <div>RF: —</div>
                  <div>Last seen: —</div>
                </div>
              </div>

              {/* Depth */}
              <div>
                <Label className="text-md ">Depth</Label>
                <Select value={editingSensor.depth ?? ""} onValueChange={(val) => setEditingSensor(prev => prev ? { ...prev, depth: val as Sensor["depth"] } : prev)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shallow (0–6 in)">Shallow (0–6 in)</SelectItem>
                    <SelectItem value="Medium (6–12 in)">Medium (6–12 in)</SelectItem>
                    <SelectItem value="Deep (12–24 in)">Deep (12–24 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Install date */}
              {/* <div>
                <Label>Install date</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={editingSensor.installDate ?? format(new Date(), "yyyy-MM-dd")}
                    onChange={(e: any) => setEditingSensor(prev => prev ? { ...prev, installDate: e.target.value } : prev)}
                  />
                  <div className="text-sm text-muted-foreground ml-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> {editingSensor.installDate ? format(new Date(editingSensor.installDate), "PP") : ""}</div>
                </div>
              </div> */}
<div className="space-y-2 w-full">
  <Label className="text-md font-semibold">Install Date</Label>

  <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm">

    {/* Label + Icon */}
    <div className="flex items-center gap-2 mb-2">
      <Calendar className="h-5 w-5 text-primary" />
      <span className="text-md font-medium text-gray-700">
        Select installation date
      </span>
    </div>

    {/* Date Input */}
    <div>
    <Input
      type="date"
      className="
        w-full 
        h-12 
        rounded-lg 
        border-gray-300 
        bg-white 
        shadow-inner 
        text-[15px] 
        px-3 
        focus-visible:ring-2 
        focus-visible:ring-primary 
        focus-visible:border-primary
      "
      value={
        editingSensor.installDate ??
        format(new Date(), "yyyy-MM-dd")
      }
      onChange={(e: any) =>
        setEditingSensor(prev =>
          prev ? { ...prev, installDate: e.target.value } : prev
        )
      }
    />

    {/* Human readable date */}
    <div className="mt-3 pl-1 text-sm text-gray-600 flex items-center gap-2">
      {/* <Calendar className="h-4 w-4 text-muted-foreground" /> */}

      {editingSensor.installDate ? (
        <span className="font-medium">
          {format(new Date(editingSensor.installDate), "EEEE, MMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">No date selected</span>
      )}
    </div>
</div>
  </div>
</div>


              

              {/* GPS capture */}
              <div>
                <Label className="flex items-center gap-2 text-md mt-4 mb-3">GPS capture</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="text-md grid grid-cols-1 gap-2">
                    <div>Latitude: <span className="font-medium">{editingSensor.gps?.lat ?? "—"}</span></div>
                    <div>Longitude: <span className="font-medium">{editingSensor.gps?.lng ?? "—"}</span></div>
                    <div>Accuracy: <span className="font-medium">{editingSensor.gps ? `${editingSensor.gps.accuracyFt} ft` : "—"}</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{editingSensor.gps ? `Captured at ${new Date(editingSensor.gps.capturedAt).toLocaleString()}` : ""}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={captureGPS}>Capture GPS</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSensor(prev => prev ? { ...prev, gps: null } : prev)}>Clear GPS</Button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-6">
                <Label className="text-md">Status</Label>
                <Select value={editingSensor.status ?? "Planned"} onValueChange={(val) => setEditingSensor(prev => prev ? { ...prev, status: val as SensorStatus } : prev)} >
                  <SelectTrigger className="mt-2 h-[50px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Installed">Installed</SelectItem>
                    <SelectItem value="Needs service">Needs service</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <Label className="text-md ">Notes</Label>
                <Textarea className="mt-2"
                  placeholder="Install details, location landmarks, issues, etc."
                  value={editingSensor.notes ?? ""}
                  onChange={(e: any) => setEditingSensor(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                />
              </div>

              {/* Service history (read-only) */}
              <div>
                <Label className="text-md">Service history</Label>
                <div className="bg-gray-50 rounded p-3 border border-gray-100 mt-2 text-sm">
                  {editingSensor.history && editingSensor.history.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {editingSensor.history.map((h, idx) => <li key={idx}>{h}</li>)}
                    </ul>
                  ) : (
                    <div className="text-xs text-muted-foreground">No history available.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
                <div className="ml-auto flex gap-3">
              <Button className="flex-1" onClick={() => saveSensor({ ...editingSensor, siteId: selectedSiteId })}>
                Save sensor
              </Button>
              <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Service;
