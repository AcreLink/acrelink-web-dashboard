import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar, QrCode } from "lucide-react";
import acreLinkLogo from "@/assets/acrelink-logo.png";
import { toast } from "react-toastify";


const MOCK_HISTORY: string[] = [
  "2025-03-10 – Installed at 6–8 in, east field, Parker",
  "2025-04-15 – Checked connectivity, OK",
];
 
// --- Mock Data (for first load only) ---
const MOCK_SITES = [
  { id: "none", name: "Select a site", info: "" },
  { id: "demo-a", name: "Demo Site A", info: "Hay Farm" },
  { id: "demo-b", name: "Demo Site B", info: "Orchard" },
  { id: "demo-c", name: "Demo Site C", info: "Wheat Farm" },
];
 
type SensorStatus = "Planned" | "Installed" | "Needs service" | "Offline";
 
type Sensor = {
  id: string;
  label?: string;
  siteId: string;
  depth?: "Shallow (0–6 in)" | "Medium (6–12 in)" | "Deep (12–24 in)";
  installDate?: string;
  gps?: {
    lat: number;
    lng: number;
    accuracyFt: number;
    capturedAt: string;
  } | null;
  status?: SensorStatus;
  notes?: string;
  history?: string[];
  devEUI?: string;    // add this
  battery?: string;   // add this
  rf?: string;        // add this
  lastSeen?: string;  // add this
};
 
// const DEFAULT_MOCK_SENSORS: Sensor[] = [
//   {
//     id: "ACR-0001",
//     siteId: "demo-a",
//     depth: "Medium (6–12 in)",
//     installDate: "2025-03-10",
//     gps: null,
//     status: "Installed",
//     notes: "",
//     history: MOCK_HISTORY,
//     devEUI: "ABC123456790",
//     battery: "75%",
//     rf: "Poor",
//     lastSeen: "2025-04-01 10:30 AM",
//   },
//   {
//     id: "ACR-0002",
//     siteId: "demo-a",
//     depth: "Shallow (0–6 in)",
//     installDate: "2025-03-12",
//     gps: null,
//     status: "Planned",
//     notes: "",
//     history: MOCK_HISTORY,
//     devEUI: "ABC123456789",
//     battery: "85%",
//     rf: "Good",
//     lastSeen: "2025-04-01 10:30 AM",
//   },
//     {
//     id: "ACR-0003",
//     siteId: "demo-b",
//     depth: "Medium (6–12 in)",
//     installDate: "2025-03-10",
//     gps: null,
//     status: "Installed",
//     notes: "",
//     history: MOCK_HISTORY,
//     devEUI: randomDevEUI(),
//     battery: randomBattery(),
//     rf: randomRF(),
//     lastSeen: randomLastSeen(),
//   },
//   {
//     id: "ACR-0101",
//     siteId: "demo-b",
//     depth: "Deep (12–24 in)",
//     installDate: "2025-02-20",
//     gps: {
//       lat: 36.12,
//       lng: -115.17,
//       accuracyFt: 14,
//       capturedAt: "2025-04-01T10:30:00Z",
//     },
//     status: "Installed",
//     notes: "Near oak tree",
//     history: MOCK_HISTORY,
//     devEUI: "ABC123456789",
//     battery: "85%",
//     rf: "Good",
//     lastSeen: "2025-04-01 10:30 AM",
//   },
//   {
//     id: "ACR-0201",
//     siteId: "demo-c",
//     depth: "Medium (6–12 in)",
//     installDate: "2025-01-10",
//     gps: null,
//     status: "Needs service",
//     notes: "Intermittent connectivity",
//     history: MOCK_HISTORY,
//     devEUI: "ABC123456789",
//     battery: "85%",
//     rf: "Good",
//     lastSeen: "2025-04-01 10:30 AM",
//   },
// ];
// RANDOM HELPERS ------------------------
 
const randomDevEUI = () =>
  "ABC" + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, "0");
 
const randomBattery = () => `${Math.floor(Math.random() * 51) + 50}%`;
 
const randomRF = () => ["Good", "Fair", "Poor"][Math.floor(Math.random() * 3)];
 
const randomLastSeen = () => {
  const start = new Date(2025, 0, 1).getTime();
  const end = Date.now();
  return new Date(start + Math.random() * (end - start)).toLocaleString("en-US", {
    hour12: true,
  });
};
 
const randomGPS = () => {
  // World-wide random coordinates for demo
  const lat = (Math.random() * 180 - 90).toFixed(6); // -90 to +90
  const lng = (Math.random() * 360 - 180).toFixed(6); // -180 to +180
  return {
    lat: Number(lat),
    lng: Number(lng),
    accuracyFt: Math.floor(Math.random() * 50) + 5, // 5–55 ft
    capturedAt: new Date().toISOString(),
  };
};
 
const randomNote = () => {
  const NOTES = [
    "",
    "Near oak tree",
    "Close to irrigation line",
    "Shaded area",
    "High moisture zone",
    "Rocky patch",
    "Near fence corner",
    "Installed inside crop row",
    "Soil slightly compact",
    "Check connectivity weekly",
  ];
  return NOTES[Math.floor(Math.random() * NOTES.length)];
};
 
// CONFIG -------------------------
 
const DEPTHS = [
  "Shallow (0–6 in)",
  "Medium (6–12 in)",
  "Deep (12–24 in)",
];
 
const STATUSES: SensorStatus[] = ["Installed", "Planned", "Needs service", "Offline"];
 
// SENSOR MAKER -------------------------
 
const makeSensor = (id: string, siteId: string, depth: string, status: SensorStatus) => ({
  id,
  siteId,
  depth,
  installDate: "2025-03-10",
  gps: randomGPS(),     // ⭐ added
  status,
  notes: randomNote(),  // ⭐ added
  history: MOCK_HISTORY,
  devEUI: randomDevEUI(),
  battery: randomBattery(),
  rf: randomRF(),
  lastSeen: randomLastSeen(),
});
 
// AUTO GENERATOR ------------------------
 
const generateSensors = (count: number, siteId: string, startNo: number) => {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push(
      makeSensor(
        `ACR-${String(startNo + i).padStart(4, "0")}`,
        siteId,
        DEPTHS[i % DEPTHS.length],
        STATUSES[i % STATUSES.length]
      )
    );
  }
  return list;
};
 
// FINAL DATA ----------------------------
 
// demo-a → 10 sensors
const DEMO_A = generateSensors(10, "demo-a", 1);
 
// demo-b → 8 sensors
const DEMO_B = generateSensors(8, "demo-b", 101);
 
// demo-c → 7 sensors
const DEMO_C = generateSensors(7, "demo-c", 201);
 
// EXPORT
const DEFAULT_MOCK_SENSORS: Sensor[] = [
  ...DEMO_A,
  ...DEMO_B,
  ...DEMO_C,
];
 
 
// --- Load initial data from localStorage or fallback to mock ---
const loadInitialData = () => {
  const storedSensors = localStorage.getItem("acrelink_service_sensors");
  const storedSites = localStorage.getItem("acrelink_sites");
 
  let sensors: Sensor[] = storedSensors
    ? JSON.parse(storedSensors)
    : DEFAULT_MOCK_SENSORS;
 
  // Save sensors if not present in localStorage
  if (!storedSensors) {
    localStorage.setItem("acrelink_service_sensors", JSON.stringify(sensors));
  }
 
  let sites = storedSites
    ? JSON.parse(storedSites)
    : MOCK_SITES.map((site) => {
      if (site.id === "none") return site;
      const plannedCount = sensors.filter((s) => s.siteId === site.id).length;
      return { ...site, planned: plannedCount };
    });
 
  if (!storedSites) {
    localStorage.setItem("acrelink_sites", JSON.stringify(sites));
  }
 
  return { sensors, sites };
};
 
// --- Utility functions ---
const metersToFeet = (m: number) => m * 3.28084;
// const makeId = () => `ACR-${Math.floor(Math.random() * 9000 + 1000)}`;
 

// --- Main Component ---
const Service: React.FC = () => {
  const { sensors: initialSensors, sites: initialSites } = loadInitialData();

  const [sensors, setSensors] = useState<Sensor[]>(initialSensors);
  const [sites, setSites] = useState(initialSites);
  const [selectedSiteId, setSelectedSiteId] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [remarks, setRemarks] = useState("");
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [techName] = useState("Parker");
  console.log(editingSensor)
  // --- Persist sensors and update planned count ---
  useEffect(() => {
    localStorage.setItem("acrelink_service_sensors", JSON.stringify(sensors));

    const updatedSites = sites.map((site) => {
      if (site.id === "none") return site;
      const plannedCount = sensors.filter((s) => s.siteId === site.id).length;
      return { ...site, planned: plannedCount };
    });

    setSites(updatedSites);
    localStorage.setItem("acrelink_sites", JSON.stringify(updatedSites));
  }, [sensors]);

  // --- Filter sensors by selected site & search ---
  const visibleSensors = useMemo(() => {
    return sensors
      .filter((s) => s.siteId === selectedSiteId)
      .filter((s) => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return s.id.toLowerCase().includes(t) || (s.label || "").toLowerCase().includes(t);
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [sensors, selectedSiteId, searchTerm]);

  const randomDevEUI = () => 'ABC' + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  const randomBattery = () => `${Math.floor(Math.random() * 51) + 50}%`; // 50%-100%
  const randomRF = () => ["Good", "Fair", "Poor"][Math.floor(Math.random() * 3)];
  const randomLastSeen = () => {
    const start = new Date(2025, 0, 1).getTime();
    const end = Date.now();
    return new Date(start + Math.random() * (end - start)).toLocaleString('en-US', { hour12: true });
  };

  const openCreate = () => {
    if (selectedSiteId === "none") return alert("Select a site first");
    setEditingSensor({
      id: "",
      siteId: selectedSiteId,
      depth: undefined,
      installDate: format(new Date(), "yyyy-MM-dd"),
      gps: null,
      status: "Planned",
      notes: "",
      history: MOCK_HISTORY,
      devEUI: randomDevEUI(),
      battery: randomBattery(),
      rf: randomRF(),
      lastSeen: randomLastSeen(),
    });
    setPanelOpen(true);
  };


  const openEdit = (sensor: Sensor) => {
    setEditingSensor(JSON.parse(JSON.stringify(sensor)));
    setPanelOpen(true);
  };

  const saveSensor = (sensor: Sensor) => {
    // if (!sensor.id.trim()) sensor.id = makeId();
    const id = sensor.id.trim();
    if (!id) return toast.error("Sensor ID cannot be empty!");
    if (!sensor?.depth) return toast.error("Depth cannot be select!");

    // Check if ID already exists (excluding the current editing sensor if editing)
    const exists = sensors.some(
      (s) => s.id === id && s !== editingSensor
    );
    if (exists) return toast.error(`Sensor ID "${id}" already exists!`);
    setSensors((prev) => {
      const idx = prev.findIndex((s) => s.id === sensor.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = sensor;
        return copy;
      }
      return [sensor, ...prev];
    });
    setPanelOpen(false);
    setEditingSensor(null);
    toast.success(`Saved ${sensor.id}`);
  };

  const cancelEdit = () => {
    setPanelOpen(false);
    setEditingSensor(null);
  };

  const handleSelectSensor = (id: string) => {
    if (!selectedSensors.includes(id)) {
      setSelectedSensors((prev) => [...prev, id]);
      setSearchTerm(""); // Clear search after selecting
    }
  };

  const removeSelected = (id: string) => {
    setSelectedSensors((prev) => prev.filter((s) => s !== id));
  };

  const handleSaveSelection = () => {
    if (!selectedSensors.length) return alert("No sensors selected!");
    console.log("Selected sensors:", selectedSensors);
    console.log("Remarks:", remarks);
    // alert("Saved successfully!");
     toast.success(`Saved successfully!`);
    setSelectedSensors([]);
    setRemarks("");
  };

  const captureGPS = () => {
    if (!editingSensor) return;
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyFt = Math.round(metersToFeet(pos.coords.accuracy || 0));
        const capturedAt = new Date().toISOString();
        setEditingSensor((prev) => prev ? { ...prev, gps: { lat, lng, accuracyFt, capturedAt } } : prev);
      },
      (err) => alert("Unable to get GPS: " + (err.message || "unknown"))
    );
  };

  useEffect(() => {
    if (!searchTerm) return;

    const match = visibleSensors.find(
      (s) => s.id.toLowerCase() === searchTerm.toLowerCase()
    );

    if (match && !selectedSensors.includes(match.id)) {
      setSelectedSensors((prev) => [...prev, match.id]);
      setSearchTerm(""); // <--- clears input immediately
    }
  }, [searchTerm, visibleSensors, selectedSensors]);

  return (
    <div>
      <nav className="bg-card border-b-2 border-border/50 sticky top-0 z-50 shadow-industrial">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={acreLinkLogo}
              alt="AcreLink"
              className="h-12 w-auto drop-shadow-md"
            />
            <div>
              <h1 className="text-[clamp(18px,2vw,24px)] font-display font-bold text-foreground">
                AcreLink Service
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Tech: <span className="font-medium">{techName}</span>
            </div>
          </div>
        </div>
      </nav>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-7xl mx-auto px-6 py-8 main-content-section">
        {/* Top bar */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-[clamp(23px,2vw,36px)] font-display font-bold text-foreground ">
              Service Mode
            </h2>
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
                <SelectItem value="none">
                  <span className="opacity-60 text-md md:text-lg">Select a site</span>
                </SelectItem>

                {/* Actual items */}
                {sites.filter((s: any) => s.id !== "none").map((site: any) => (
                  <SelectItem key={site.id} value={site.id}>
                    <div className="flex flex-col text-start">
                      <span className="font-semibold text-md md:text-lg">{site.name}</span>
                      <span className="text-md md:text-md text-muted-foreground">
                        {/* {site.info} {s.planned} */}
                        {`${site.info}, ${site.planned} sensors planned`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Step 2 - sensors */}
            {selectedSiteId !== "none" && (
              <section className="mb-10 mt-8">
                <div className="flex items-center justify-between mb-4 sensor-mob">
                  <h2 className="text-lg font-semibold">
                    Sensors on this site
                  </h2>
                  <Button onClick={openCreate} size="sm">
                    + Add Sensor
                  </Button>
                </div>
                {/* CHIPS + SEARCH (Gmail style) */}
                <div className="mb-2 border rounded-lg px-3 py-2 bg-white min-h-[50px] flex flex-wrap gap-2 items-center">
                  {selectedSensors.map((id) => (
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
                    placeholder={
                      selectedSensors.length === 0 ? "Search sensors..." : ""
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* SENSOR LIST */}
                {searchTerm.trim() !== "" && (
                  <div className="space-y-3 max-h-[40vh] overflow-auto  pb-6 border rounded-lg px-3 py-2 bg-white ">
                    <div className="bg-white flex flex-col gap-3 p-2">
                    
                    {visibleSensors
                      .filter((s) => !selectedSensors.includes(s.id)) // hide already selected
                      .map((s) => (
                    
                        <div
                          key={s.id}
                          onClick={() => handleSelectSensor(s.id)}
                          className="cursor-pointer rounded-lg p-3 
          shadow-sm hover:border-blue-400 hover:bg-blue-50 transition bg-yellow-100/60 border-l-4 border-yellow-400"
                        >
                          <div className="flex gap-2 md:gap-4 items-center justify-between mob-wrap">
                            <div className="w-full">
                              <div className="text-md md:text-lg font-semibold">{s.id}</div>
                              <div className=" depth-font text-md  text-muted-foreground mt-1 flex flex-wrap gap-2 md:gap-4">
                                <span>Depth: {s.depth ?? "—"}</span>
                                <span>
                                  GPS: {s.gps ? `captured (±${s.gps.accuracyFt} ft)` : "Not captured"}
                                </span>
                                <span>Status: {s.status}</span>
                              </div>
                              {s.notes && (
                                <div className="text-md mt-1 md:mt-3 text-muted-foreground">
                                  Note: {s.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-md text-muted-foreground mt-1 whitespace-nowrap">
                              {s.installDate
                                ? `Installed: ${format(new Date(s.installDate), "MMM d, yyyy")}`
                                : ""}
                            </div>
                          </div>
                        </div>
                    
                      ))}
                  </div>
                  </div>
                )}



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
                  <Button
                    size="lg"
                    className="shadow-industrial hover-glow h-12 px-6"
                    onClick={handleSaveSelection}
                  >
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
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                /* don't close on backdrop click to avoid accidental close */
              }}
            />

            <div className="absolute inset-y-0 right-0 w-full md:w-[640px] bg-white overflow-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={cancelEdit}
                  className="text-sm text-muted-foreground"
                >
                  ← Back
                </button>
                <div className="text-lg font-semibold">
                  {editingSensor.id
                    ? `Sensor ${editingSensor.id}`
                    : "New Sensor"}
                </div>
                <div style={{ width: 32 }} />
              </div>

              {/* Panel content */}
              <div className="space-y-4 pb-24 mt-4">
                {/* Sensor ID */}
                <div className="mt-4 ">
                  <Label className="text-md font-semibold  ">Sensor ID / Label</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      className="p-3 text-sm font-medium flex-1 bg-white"
                      placeholder="ACR-0001"
                      value={editingSensor.id}
                      onChange={(e: any) =>
                        setEditingSensor((prev) =>
                          prev ? { ...prev, id: e.target.value } : prev
                        )
                      }
                    />

                    <div className="">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 px-3 py-2 bg-white"
                        onClick={() => alert("Scan QR - placeholder")}
                      >
                        <QrCode className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {/* <div className="text-xs text-muted-foreground mt-1">Scan QR or enter ID manually.</div> */}

                {/* Device metadata (read only) */}
                  <div className="text-md font-semibold ">
                    Device metadata
                  </div>
                <div className=" mt-2 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 ">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="text-sm font-medium ">DevEUI: {editingSensor.devEUI}</div>
                    <div className="text-sm font-medium ">Battery: {editingSensor.battery}</div>
                    <div className="text-sm font-medium ">RF: {editingSensor.rf}</div>
                    <div className="text-sm font-medium ">Last seen: {editingSensor.lastSeen}</div>
                  </div>
                </div>

                {/* Depth */}
                <div>
                  <Label className="text-md ">Depth</Label>
                  <Select
                    value={editingSensor.depth ?? ""}
                    onValueChange={(val) =>
                      setEditingSensor((prev) =>
                        prev ? { ...prev, depth: val as Sensor["depth"] } : prev
                      )
                    }
                  >
                    <SelectTrigger className="mt-2 h-[50px] p-3 bg-white text-sm ">
                      <SelectValue placeholder="Select depth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shallow (0–6 in)">
                        Shallow (0–6 in)
                      </SelectItem>
                      <SelectItem value="Medium (6–12 in)">
                        Medium (6–12 in)
                      </SelectItem>
                      <SelectItem value="Deep (12–24 in)">
                        Deep (12–24 in)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Install Date */}
                <div className="space-y-2 w-full">
                  <Label className="text-md font-semibold">Install Date</Label>

                 
                    {/* Label + Icon */}
                   

                    {/* Date Input */}
                    <div>
                      <Input
                        type="date"
                        className=" w-full block h-12 rounded-lg border-gray-300 bg-white text-[15px] px-3  focus-visible:ring-2  focus-visible:ring-primary focus-visible:border-primary"
                        value={
                          editingSensor.installDate ??
                          format(new Date(), "yyyy-MM-dd")
                        }
                        onChange={(e: any) =>
                          setEditingSensor((prev) =>
                            prev
                              ? { ...prev, installDate: e.target.value }
                              : prev
                          )
                        }
                      />

                     
                    </div>
                  
                </div>

                {/* GPS capture */}
                <div>
                  <Label className="flex items-center gap-2 text-md font-semibold mt-4 mb-3">
                    GPS capture
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="text-md grid grid-cols-1 gap-2">

                      <div className="rounded-lg text-sm border text-muted-foreground border-gray-300 bg-white p-3">
                        Latitude:{" "}
                        <span className="font-medium text-sm">
                          {editingSensor.gps?.lat ?? "—"}
                        </span>
                      </div>

                      <div className="rounded-lg text-sm border text-muted-foreground border-gray-300 bg-white p-3">
                        Longitude:{" "}
                        <span className="font-medium text-sm">
                          {editingSensor.gps?.lng ?? "—"}
                        </span>
                      </div>

                      <div className="rounded-lg text-sm border text-muted-foreground border-gray-300 bg-white p-3">
                        Accuracy:{" "}
                        <span className="font-medium text-sm">
                          {editingSensor.gps
                            ? `${editingSensor.gps.accuracyFt} ft`
                            : "—"}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {editingSensor.gps
                          ? `Captured at ${new Date(
                            editingSensor.gps.capturedAt
                          ).toLocaleString()}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-2">
                      <Button size="sm" onClick={captureGPS}>
                        Capture GPS
                      </Button>
                      {/* <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditingSensor((prev) =>
                            prev ? { ...prev, gps: null } : prev
                          )
                        }
                      >
                        Clear GPS
                      </Button> */}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-6">
                  <Label className="text-md font-semibold">Status</Label>
                  <Select
                    value={editingSensor.status ?? "Planned"}
                    onValueChange={(val) =>
                      setEditingSensor((prev) =>
                        prev ? { ...prev, status: val as SensorStatus } : prev
                      )
                    }
                  >
                    <SelectTrigger className="mt-2 h-[50px] bg-white p-3 text-sm ">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Installed">Installed</SelectItem>
                      <SelectItem value="Needs service">
                        Needs service
                      </SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <Label className="text-md font-semibold ">Notes</Label>
                  <Textarea
                    className="mt-2 bg-white text-sm"
                    placeholder="Install details, location landmarks, issues, etc."
                    value={editingSensor.notes ?? ""}
                    onChange={(e: any) =>
                      setEditingSensor((prev) =>
                        prev ? { ...prev, notes: e.target.value } : prev
                      )
                    }
                  />
                </div>

                {/* Service history (read-only) */}
                <div>
                  <Label className="text-md font-semibold">Service history</Label>
                  <div className="bg-gray-50 rounded p-3 border border-gray-100 mt-2 text-sm">
                    <ul className="list-disc pl-5 space-y-2">
                      {MOCK_HISTORY?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li> // <-- return JSX here
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sticky actions */}
              <div className=" bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
                <div className="ml-auto flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() =>
                      saveSensor({ ...editingSensor, siteId: selectedSiteId })
                    }
                  >
                    Save sensor
                  </Button>
                  <Button variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
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
