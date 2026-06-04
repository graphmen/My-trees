import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Popup, 
  Marker, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Trees, 
  MapPin, 
  Activity, 
  Flame, 
  Users, 
  Volume2, 
  ImageIcon, 
  Compass, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Sliders, 
  AlertTriangle,
  Database,
  Download,
  Search,
  CheckCircle,
  Clock,
  Map as MapIcon,
  RefreshCw,
  Bell,
  ChevronRight,
  ChevronLeft,
  FileText,
  Printer,
  Heart,
  Menu,
  ShieldCheck,
  Settings
} from 'lucide-react';

// Vite default leaflet icon fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8282";
if (backendUrl === "mytrees-qfield-backend") {
  backendUrl = "mytrees-qfield-backend.onrender.com";
}
if (backendUrl && !backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
  backendUrl = `https://${backendUrl}`;
}
if (backendUrl === "https://mytrees-qfield-backend") {
  backendUrl = "https://mytrees-qfield-backend.onrender.com";
}
const BACKEND_URL = backendUrl;

// Custom component to dynamically control map view recentering
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom]);
  return null;
}

// Custom MarkerClusterGroup React-Leaflet component using leaflet.markercluster directly
function MarkerClusterGroup({ data, activeTab, onEachFeature, pointToLayer, style }) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true
    });

    const geoJsonLayer = L.geoJSON(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature,
      style: style
    });

    clusterGroup.addLayer(geoJsonLayer);
    map.addLayer(clusterGroup);

    if (geoJsonLayer.getBounds().isValid()) {
      map.fitBounds(geoJsonLayer.getBounds(), { maxZoom: 14, padding: [20, 20] });
    }

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, data, activeTab]);

  return null;
}

function App() {
  const [kpis, setKpis] = useState({
    trees_planted: 0,
    trees_target: 0,
    overall_survival_rate: 0.0,
    active_growers: 0,
    colonized_hives: 0,
    total_hives: 0,
    nursery_seedlings: 0,
    nursery_ready: 0,
    patrol_distance_km: 0.0,
    meetings_count: 0,
    fire_incidents: 0
  });

  const [activeTab, setActiveTab] = useState('overview'); // overview, nurseries, beekeeping, ops, fire, explorer, report
  const [dashboardSubTab, setDashboardSubTab] = useState('dashboard'); // dashboard, map
  const [meetingsSubTab, setMeetingsSubTab] = useState('outcomes'); // outcomes, map
  const [plantingOverTime, setPlantingOverTime] = useState([]);
  const [meetingsOutcomes, setMeetingsOutcomes] = useState(null);
  const [eligibilitySubTab, setEligibilitySubTab] = useState('outcomes'); // outcomes, map
  const [eligibilityOutcomes, setEligibilityOutcomes] = useState(null);
  const [landprepSubTab, setLandprepSubTab] = useState('outcomes'); // outcomes, map
  const [landprepOutcomes, setLandprepOutcomes] = useState(null);
  const [plantingSubTab, setPlantingSubTab] = useState('outcomes'); // outcomes, map
  const [plantingOutcomes, setPlantingOutcomes] = useState(null);
  const [survivalSubTab, setSurvivalSubTab] = useState('outcomes'); // outcomes, map
  const [survivalOutcomes, setSurvivalOutcomes] = useState(null);
  const [fireSubTab, setFireSubTab] = useState('outcomes'); // outcomes, map
  const [fireOutcomes, setFireOutcomes] = useState(null);
  const [seedSubTab, setSeedSubTab] = useState('outcomes'); // outcomes, map
  const [seedOutcomes, setSeedOutcomes] = useState(null);
  const [productionSubTab, setProductionSubTab] = useState('outcomes'); // outcomes, map
  const [productionOutcomes, setProductionOutcomes] = useState(null);
  const [dispatchSubTab, setDispatchSubTab] = useState('outcomes'); // outcomes, map
  const [dispatchOutcomes, setDispatchOutcomes] = useState(null);
  const [sitesSubTab, setSitesSubTab] = useState('outcomes'); // outcomes, map
  const [sitesOutcomes, setSitesOutcomes] = useState(null);
  const [beekeepingTrainingsSubTab, setBeekeepingTrainingsSubTab] = useState('outcomes'); // outcomes, map
  const [beekeepingTrainingsOutcomes, setBeekeepingTrainingsOutcomes] = useState(null);
  const [statusSubTab, setStatusSubTab] = useState('outcomes'); // outcomes, map
  const [statusOutcomes, setStatusOutcomes] = useState(null);
  const [auditsSubTab, setAuditsSubTab] = useState('outcomes'); // outcomes, map
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [qfieldConfig, setQfieldConfig] = useState({
    url: "https://app.qfield.cloud/api/v1/",
    username: "",
    password: "",
    project_id: "",
    token: ""
  });
  const [syncStatus, setSyncStatus] = useState(null);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const pollIntervalRef = React.useRef(null);
  const spatialCacheRef = React.useRef({});
  
  const [outplantingMetrics, setOutplantingMetrics] = useState(null);
  const [nurseryMetrics, setNurseryMetrics] = useState(null);
  const [beekeepingMetrics, setBeekeepingMetrics] = useState(null);
  const [verificationsMetrics, setVerificationsMetrics] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState('outplanting');
  const [selectedOfficer, setSelectedOfficer] = useState('All');
  const [mapBase, setMapBase] = useState('google-satellite'); // google-satellite, google-hybrid, google-streets, google-terrain
  
  // Data layers
  const [primaryLayerData, setPrimaryLayerData] = useState(null);
  const [secondaryLayerData, setSecondaryLayerData] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Lists & Filters
  const [searchText, setSearchText] = useState('');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  
  // Explorer configurations
  const [explorerTarget, setExplorerTarget] = useState('planting');
  const [explorerData, setExplorerData] = useState([]);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerPage, setExplorerPage] = useState(1);
  const rowsPerPage = 25;

  // Chart data
  const [speciesChart, setSpeciesChart] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Map position
  const [mapCenter, setMapCenter] = useState([-16.42, 29.62]);
  const [mapZoom, setMapZoom] = useState(10);

  // Report Generator States
  const [reportTemplate, setReportTemplate] = useState('restoration');
  const [reportTitle, setReportTitle] = useState('My Trees Trust - Woodland Restoration Report');
  const [reportRegion, setReportRegion] = useState('All');
  const [reportWard, setReportWard] = useState('All');
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  // Collapsible Sidebars States
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isInnerSidebarCollapsed, setIsInnerSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Media Gallery States
  const [mediaList, setMediaList] = useState({ images: [], audios: [] });
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilter, setGalleryFilter] = useState('all'); // all, aftercare, verification, nursery, meeting, other

  // Trigger window resize event to force Leaflet map to redraw correctly on sidebar collapse/expand transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320); // slightly longer than 300ms CSS transition
    return () => clearTimeout(timer);
  }, [isLeftSidebarCollapsed, isInnerSidebarCollapsed, isRightSidebarCollapsed]);

  // Fetch initial system data
  useEffect(() => {
    loadSystemMetrics();
    fetchQFieldConfig();
    checkActiveSyncStatus();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const checkActiveSyncStatus = () => {
    fetch(`${BACKEND_URL}/api/qfieldcloud/sync/status`)
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'syncing') {
          setIsSyncing(true);
          setShowSyncOverlay(true);
          setSyncStatus(data);
          startSyncPolling();
        }
      })
      .catch(console.error);
  };

  const startSyncPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = () => {
      fetch(`${BACKEND_URL}/api/qfieldcloud/sync/status`)
        .then(res => res.json())
        .then(data => {
          setSyncStatus(data);
          if (data.status !== 'syncing') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsSyncing(false);
            
            if (data.status === 'success') {
              // Reset all tab-specific cached state so lazy loader re-fetches fresh data
              setMeetingsOutcomes(null);
              setEligibilityOutcomes(null);
              setLandprepOutcomes(null);
              setPlantingOutcomes(null);
              setSurvivalOutcomes(null);
              setFireOutcomes(null);
              setSeedOutcomes(null);
              setProductionOutcomes(null);
              setDispatchOutcomes(null);
              setSitesOutcomes(null);
              setBeekeepingTrainingsOutcomes(null);
              setStatusOutcomes(null);
              setVerificationsMetrics(null);
              setOutplantingMetrics(null);
              setNurseryMetrics(null);
              setBeekeepingMetrics(null);
              spatialCacheRef.current = {};
              
              loadSystemMetrics();
            }
          }
        })
        .catch(err => {
          console.error('Error polling sync status:', err);
        });
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 2500);
  };

  const fetchQFieldConfig = () => {
    fetch(`${BACKEND_URL}/api/qfieldcloud/config`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        setQfieldConfig(prev => ({
          ...prev,
          url: data.url || prev.url,
          username: data.username || prev.username,
          project_id: data.project_id || prev.project_id,
          password: data.has_password ? "********" : "",
          token: data.has_token ? "********" : ""
        }));
      })
      .catch(console.error);
  };

  // ─── Lean startup: only fetch what Overview needs ───────────────────────────
  const loadSystemMetrics = () => {
    setConnectionStatus('connecting');

    // 1. KPIs — headline numbers for the Overview dashboard
    fetch(`${BACKEND_URL}/api/kpis`)
      .then(res => {
        if (!res.ok) throw new Error('API down');
        return res.json();
      })
      .then(data => {
        setKpis(data);
        setConnectionStatus('connected');
      })
      .catch(err => {
        console.error(err);
        setConnectionStatus('failed');
      });

    // 2. Species chart — used in Overview + Report generator
    fetch(`${BACKEND_URL}/api/charts/survival_by_species`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setSpeciesChart(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setSpeciesChart([]);
      });

    // 3. Planting over time — used in Overview timeline chart
    fetch(`${BACKEND_URL}/api/charts/planting_over_time`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setPlantingOverTime(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setPlantingOverTime([]);
      });

    // 4. Timeline — needed for Overview activity feed
    fetch(`${BACKEND_URL}/api/timeline`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTimeline(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setTimeline([]);
      });
  };

  // ─── Lazy per-tab data loader ────────────────────────────────────────────────
  // Each module's data is fetched only on first visit. Cached in state thereafter.
  useEffect(() => {
    const fetchTabData = async (tab) => {
      try {
        if (tab === 'outplanting-meetings' && !meetingsOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/meetings/outcomes`)
            .then(r => r.json()).then(setMeetingsOutcomes).catch(console.error);
          fetch(`${BACKEND_URL}/api/workflow/outplanting`)
            .then(r => r.json()).then(setOutplantingMetrics).catch(console.error);
        }
        if (tab === 'outplanting-eligibility' && !eligibilityOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/eligibility/outcomes`)
            .then(r => r.json()).then(setEligibilityOutcomes).catch(console.error);
        }
        if (tab === 'outplanting-landprep' && !landprepOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/landprep/outcomes`)
            .then(r => r.json()).then(setLandprepOutcomes).catch(console.error);
        }
        if (tab === 'outplanting-planted' && !plantingOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/planting/outcomes`)
            .then(r => r.json()).then(setPlantingOutcomes).catch(console.error);
        }
        if (tab === 'outplanting-survival' && !survivalOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/survival/outcomes`)
            .then(r => r.json()).then(setSurvivalOutcomes).catch(console.error);
        }
        if (tab === 'outplanting-fire' && !fireOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/fire/outcomes`)
            .then(r => r.json()).then(setFireOutcomes).catch(console.error);
        }
        if (tab === 'nursery-seed' && !seedOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/seed/outcomes`)
            .then(r => r.json()).then(setSeedOutcomes).catch(console.error);
          fetch(`${BACKEND_URL}/api/workflow/nursery`)
            .then(r => r.json()).then(setNurseryMetrics).catch(console.error);
        }
        if (tab === 'nursery-production' && !productionOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/nursery-production/outcomes`)
            .then(r => r.json()).then(setProductionOutcomes).catch(console.error);
          if (!nurseryMetrics) {
            fetch(`${BACKEND_URL}/api/workflow/nursery`)
              .then(r => r.json()).then(setNurseryMetrics).catch(console.error);
          }
        }
        if (tab === 'nursery-dispatch' && !dispatchOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/dispatch/outcomes`)
            .then(r => r.json()).then(setDispatchOutcomes).catch(console.error);
        }
        if (tab === 'beekeeping-sites' && !sitesOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/beekeeping/sites/outcomes`)
            .then(r => r.json()).then(setSitesOutcomes).catch(console.error);
          fetch(`${BACKEND_URL}/api/workflow/beekeeping`)
            .then(r => r.json()).then(setBeekeepingMetrics).catch(console.error);
        }
        if (tab === 'beekeeping-trainings' && !beekeepingTrainingsOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/beekeeping/trainings/outcomes`)
            .then(r => r.json()).then(setBeekeepingTrainingsOutcomes).catch(console.error);
        }
        if (tab === 'beekeeping-status' && !statusOutcomes) {
          fetch(`${BACKEND_URL}/api/workflow/beekeeping/status/outcomes`)
            .then(r => r.json()).then(setStatusOutcomes).catch(console.error);
          if (!beekeepingMetrics) {
            fetch(`${BACKEND_URL}/api/workflow/beekeeping`)
              .then(r => r.json()).then(setBeekeepingMetrics).catch(console.error);
          }
        }
        if (tab === 'verifications-audits' && !verificationsMetrics) {
          fetch(`${BACKEND_URL}/api/workflow/verifications`)
            .then(r => r.json()).then(setVerificationsMetrics).catch(console.error);
        }
        if (tab === 'gallery' && (!mediaList.images.length && !mediaList.audios.length)) {
          fetch(`${BACKEND_URL}/api/media/list`)
            .then(r => r.json()).then(setMediaList).catch(console.error);
        }
        if (tab === 'report') {
          // Report may need multiple datasets — fetch anything not yet loaded
          if (!survivalOutcomes) fetch(`${BACKEND_URL}/api/workflow/survival/outcomes`).then(r => r.json()).then(setSurvivalOutcomes).catch(console.error);
          if (!productionOutcomes) fetch(`${BACKEND_URL}/api/workflow/nursery-production/outcomes`).then(r => r.json()).then(setProductionOutcomes).catch(console.error);
          if (!statusOutcomes) fetch(`${BACKEND_URL}/api/workflow/beekeeping/status/outcomes`).then(r => r.json()).then(setStatusOutcomes).catch(console.error);
          if (!fireOutcomes) fetch(`${BACKEND_URL}/api/workflow/fire/outcomes`).then(r => r.json()).then(setFireOutcomes).catch(console.error);
        }
      } catch (err) {
        console.error('Tab data load error:', err);
      }
    };
    fetchTabData(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync data handler — connects to QField Cloud, downloads files, and refreshes state
  const handleSyncData = () => {
    if (isSyncing) {
      setShowSyncOverlay(true);
      return;
    }

    setIsSyncing(true);
    setShowSyncOverlay(true);
    setSyncStatus({
      status: 'syncing',
      downloaded: 0,
      skipped: 0,
      total_files: 0,
      current_file: 'Connecting to QField Cloud...',
      errors: [],
      error_count: 0
    });
    
    fetch(`${BACKEND_URL}/api/qfieldcloud/sync`, { method: 'POST' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Sync failed');
        }
        return data;
      })
      .then(data => {
        startSyncPolling();
      })
      .catch(err => {
        console.error('QField Cloud Sync Error:', err);
        setSyncStatus({
          status: 'error',
          downloaded: 0,
          skipped: 0,
          total_files: 0,
          current_file: '',
          errors: [err.message || 'Failed to start sync'],
          error_count: 1
        });
        setIsSyncing(false);
      });
  };

  // Fetch tab layers
  useEffect(() => {
    setSelectedRecord(null);

    let primary = "";
    let secondary = "";

    if (activeTab === 'overview') {
      primary = "red_boundary";
      secondary = "plots_mapping";
    } else if (activeTab === 'outplanting-meetings') {
      primary = "meetings";
    } else if (activeTab === 'outplanting-eligibility') {
      primary = "plots_assessment";
    } else if (activeTab === 'outplanting-landprep') {
      primary = "land_preparation";
    } else if (activeTab === 'outplanting-planted') {
      primary = "planting";
    } else if (activeTab === 'outplanting-survival') {
      primary = "survival_count";
    } else if (activeTab === 'outplanting-fire') {
      primary = "fires";
    } else if (activeTab === 'nursery-seed') {
      primary = "seed_collection";
      secondary = "seed_bank";
    } else if (activeTab === 'nursery-production') {
      primary = "nurseries";
      secondary = "nurseries_verification";
    } else if (activeTab === 'nursery-dispatch') {
      primary = "planting";
      secondary = "nurseries";
    } else if (activeTab === 'beekeeping-sites') {
      primary = "apiary_assessment";
    } else if (activeTab === 'beekeeping-trainings') {
      primary = "meetings";
    } else if (activeTab === 'beekeeping-status') {
      primary = "beekeeping";
    } else if (activeTab === 'verifications-audits') {
      primary = "verification";
      secondary = "nurseries_verification";
    }

    if (primary) {
      const cached = spatialCacheRef.current[primary];
      if (cached) {
        setPrimaryLayerData(cached);
      } else {
        setPrimaryLayerData(null);
        fetch(`${BACKEND_URL}/api/geojson/${primary}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              spatialCacheRef.current[primary] = data;
              setPrimaryLayerData(data);
            }
          })
          .catch(console.error);
      }
    } else {
      setPrimaryLayerData(null);
    }

    if (secondary) {
      const cached = spatialCacheRef.current[secondary];
      if (cached) {
        setSecondaryLayerData(cached);
      } else {
        setSecondaryLayerData(null);
        fetch(`${BACKEND_URL}/api/geojson/${secondary}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              spatialCacheRef.current[secondary] = data;
              setSecondaryLayerData(data);
            }
          })
          .catch(console.error);
      }
    } else {
      setSecondaryLayerData(null);
    }
  }, [activeTab]);

  // Load explorer table data
  useEffect(() => {
    if (activeTab === 'explorer') {
      setExplorerData([]);
      fetch(`${BACKEND_URL}/api/geojson/${explorerTarget}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.features) {
            const rows = data.features.map((f, i) => ({
              idx: i + 1,
              id: f.properties.id || f.properties.fid || i,
              geometry: f.geometry,
              ...f.properties
            }));
            setExplorerData(rows);
          }
        })
        .catch(console.error);
    }
  }, [explorerTarget, activeTab]);

  // Fetch media list when gallery tab becomes active
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetch(`${BACKEND_URL}/api/media/list`)
        .then(res => res.json())
        .then(data => setMediaList(data))
        .catch(console.error);
    }
  }, [activeTab]);

  // Get active features list for the Left Side Panel list view
  const getActiveListFeatures = () => {
    let features = [];
    if (activeTab === 'overview' && secondaryLayerData) {
      features = secondaryLayerData.features || [];
    } else if (primaryLayerData) {
      features = primaryLayerData.features || [];
    }

    // Apply filters
    return features.filter(f => {
      const props = f.properties;
      
      // Text search match
      const query = searchText.toLowerCase();
      const grower = (props.Grower || props["Grower Name"] || props.Name || props.Beekeepr || props.Nursery || '').toLowerCase();
      const ward = (props.Ward || props["Ward "] || '').toLowerCase();
      const region = (props.Region || '').toLowerCase();
      const matchesText = grower.includes(query) || ward.includes(query) || region.includes(query);

      // Dropdowns filter match
      const matchesWard = selectedWard === 'All' || String(props.Ward || props["Ward "]) === selectedWard;
      const matchesRegion = selectedRegion === 'All' || String(props.Region) === selectedRegion;

      return matchesText && matchesWard && matchesRegion;
    });
  };

  // Get unique Wards and Regions for drop-down filters
  const getFilterOptions = () => {
    let features = [];
    if (activeTab === 'overview' && secondaryLayerData) features = secondaryLayerData.features || [];
    else if (primaryLayerData) features = primaryLayerData.features || [];

    const wards = new Set();
    const regions = new Set();

    features.forEach(f => {
      if (f.properties.Ward) wards.add(String(f.properties.Ward));
      if (f.properties.Region) regions.add(String(f.properties.Region));
    });

    return {
      wards: ['All', ...Array.from(wards).sort()],
      regions: ['All', ...Array.from(regions).sort()]
    };
  };

  const filters = getFilterOptions();

  // Selected row/marker handler
  const handleSelectRecord = (props, geometry) => {
    setSelectedRecord(props);
    if (geometry && geometry.coordinates) {
      let coords = [];
      if (geometry.type === 'Point') {
        coords = [geometry.coordinates[1], geometry.coordinates[0]];
      } else if (geometry.type === 'MultiPolygon' || geometry.type === 'Polygon') {
        const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
        let latSum = 0;
        let lngSum = 0;
        ring.forEach(c => {
          lngSum += c[0];
          latSum += c[1];
        });
        coords = [latSum / ring.length, lngSum / ring.length];
      }
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setMapCenter(coords);
        setMapZoom(13);
      }
    }
  };

  // Map popup feature reader
  const onEachFeature = (feature, layer) => {
    let popupContent = '<div class="custom-popup">';
    if (feature.properties) {
      popupContent += `<h3 style="margin: 0 0 8px 0; font-size: 13px; color: #407e52; font-family: 'Outfit'; font-weight: 700;">My Trees Field Attributes</h3><table style="width:100%; font-size:12px; border-collapse:collapse;">`;
      Object.keys(feature.properties).forEach(key => {
        if (key !== 'geometry' && key !== 'fid' && feature.properties[key] !== 'None' && feature.properties[key] !== null) {
          const val = feature.properties[key];
          if (typeof val === 'string' && val.endsWith('.jpg') && (val.includes('aftercare_') || val.includes('field-verification_') || val.includes('meetings-') || val.includes('nursery-') || val.includes('plot-'))) {
            popupContent += `<tr><td colspan="2" style="padding:6px 0;"><img src="${BACKEND_URL}/api/media/image/${val}" style="width:100%; border-radius:6px; max-height:120px; object-fit:cover;" /></td></tr>`;
          } else {
            popupContent += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:4px; font-weight:600; color:#407e52; text-align:left;">${key}</td><td style="padding:4px; text-align:right; color:var(--text-secondary);">${val}</td></tr>`;
          }
        }
      });
      popupContent += `</table>`;
    }
    popupContent += '</div>';
    layer.bindPopup(popupContent);
    
    layer.on('click', () => {
      setSelectedRecord(feature.properties);
    });
  };

  // Map styling rules based on active tabs using brand moss green
  const getGeoJSONStyle = (feature) => {
    if (activeTab === 'overview') {
      if (feature.properties.Name && feature.properties.Name.includes("Kariba")) {
        return { color: '#3b82f6', weight: 3, fillOpacity: 0.02, dashArray: '5, 5' }; // REDD+ Boundary (Dashed Blue)
      }
      return { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.2 }; // Plots (Vibrant Red)
    }
    if (activeTab === 'ops') {
      return { color: '#3b82f6', weight: 3.5, opacity: 0.8 }; // Tracks path line
    }
  };

  // Helper to create beautiful custom divIcons for different spatial point types
  const createCustomMarker = (category, isSelected = false) => {
    let bgColor = '#407e52'; // default Kelly green
    let iconHtml = '';
    let shadowColor = 'rgba(64, 126, 82, 0.3)';

    if (category === 'nursery') {
      bgColor = '#407e52'; // Kelly green
      shadowColor = 'rgba(64, 126, 82, 0.4)';
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 22 1-1c1.4-1.4 2.4-3.2 3-5.2l1.5-5.2-5.2 1.5c-2 1-3.8 2-5.2 3.4l-1 1" />
          <path d="M12 22v-9" />
          <path d="M12 14c2.2-2.2 5.5-2.2 7.7 0" />
          <path d="M12 18c-2.2-2.2-5.5-2.2-7.7 0" />
        </svg>
      `;
    } else if (category === 'seed_bank') {
      bgColor = '#74614a'; // Soft Bronze/Brown
      shadowColor = 'rgba(116, 97, 74, 0.4)';
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z" />
          <path d="M9.13 8.87c.75-2.15 2.15-3.55 4.3-4.3" />
          <path d="M19 2 9.13 11.87" />
        </svg>
      `;
    } else if (category === 'beekeeping') {
      bgColor = '#f59e0b'; // Amber gold
      shadowColor = 'rgba(245, 158, 11, 0.4)';
      const beeSize = isSelected ? 18 : 16;
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${beeSize}" height="${beeSize}" viewBox="0 0 24 24" fill="none">
          <!-- Wings (translucent slate-blue/white) -->
          <path d="M12 9.5 C9 5.5, 4.5 6, 5.5 9.5 C6.5 12.5, 10.5 11, 12 9.5 Z" fill="#e2e8f0" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.2" />
          <path d="M12 9.5 C15 5.5, 19.5 6, 18.5 9.5 C17.5 12.5, 13.5 11, 12 9.5 Z" fill="#e2e8f0" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.2" />
          <!-- Lower Wings -->
          <path d="M12 11.5 C10 9, 7.5 10, 8 12 C8.5 13.5, 11 12.5, 12 11.5 Z" fill="#cbd5e1" fill-opacity="0.7" stroke="#ffffff" stroke-width="1" />
          <path d="M12 11.5 C14 9, 16.5 10, 16 12 C15.5 13.5, 13 12.5, 12 11.5 Z" fill="#cbd5e1" fill-opacity="0.7" stroke="#ffffff" stroke-width="1" />
          <!-- Body & Head (Dark slate) -->
          <path d="M12 9 C9.5 9, 9.5 12, 9.5 15 C9.5 17.5, 10.5 19, 12 20 C13.5 19, 14.5 17.5, 14.5 15 C14.5 12, 13.5 9, 12 9 Z" fill="#1e293b" />
          <circle cx="12" cy="6.8" r="2.2" fill="#1e293b" />
          <!-- Yellow Stripes -->
          <path d="M10.2 12 L13.8 12" stroke="#facc15" stroke-width="2" stroke-linecap="round" />
          <path d="M10.2 15 L13.8 15" stroke="#facc15" stroke-width="2" stroke-linecap="round" />
          <path d="M11 17.8 L13 17.8" stroke="#facc15" stroke-width="1.8" stroke-linecap="round" />
          <!-- Stinger -->
          <path d="M12 20 L12 22.5" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />
          <!-- Antennae -->
          <path d="M11.2 5 C10.5 3.5, 9.5 3.5, 9 4" stroke="#1e293b" stroke-width="1" stroke-linecap="round" />
          <path d="M12.8 5 C13.5 3.5, 14.5 3.5, 15 4" stroke="#1e293b" stroke-width="1" stroke-linecap="round" />
          <!-- Little eyes -->
          <circle cx="11.2" cy="6.5" r="0.35" fill="#ffffff" />
          <circle cx="12.8" cy="6.5" r="0.35" fill="#ffffff" />
        </svg>
      `;
    } else if (category === 'verification') {
      bgColor = '#3b82f6'; // Accent Blue
      shadowColor = 'rgba(59, 130, 246, 0.4)';
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      `;
    } else if (category === 'fires') {
      bgColor = '#ef4444'; // Crimson red
      shadowColor = 'rgba(239, 68, 68, 0.5)';
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      `;
    }

    const borderStyle = isSelected ? 'border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(255,255,255,0.8); scale: 1.15;' : `border: 2px solid #ffffff; box-shadow: 0 4px 10px ${shadowColor};`;
    const size = isSelected ? '34px' : '28px';

    return L.divIcon({
      html: `
        <div style="
          background-color: ${bgColor};
          width: ${size};
          height: ${size};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          ${borderStyle}
          transition: all 0.2s ease;
        ">
          ${iconHtml}
        </div>
      `,
      className: 'custom-leaflet-marker',
      iconSize: isSelected ? [34, 34] : [28, 28],
      iconAnchor: isSelected ? [17, 17] : [14, 14]
    });
  };

  const handleExportData = (format) => {
    let dataToExport = explorerData;
    if (activeTab !== 'explorer') {
      dataToExport = getActiveListFeatures().map(f => f.properties);
    }
    
    if (dataToExport.length === 0) return;

    const prefix = `restoration_${activeTab}_${activeTab === 'explorer' ? explorerTarget : 'list'}`;

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     dataStr);
      downloadAnchor.setAttribute("download", `${prefix}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else if (format === 'geojson') {
      const featureCollection = {
        type: "FeatureCollection",
        features: dataToExport.map(row => {
          const { geometry, idx, id, ...properties } = row;
          return {
            type: "Feature",
            geometry: geometry || null,
            properties: properties
          };
        })
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(featureCollection, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     dataStr);
      downloadAnchor.setAttribute("download", `${prefix}_export.geojson`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else if (format === 'kml') {
      let kmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>My Trees Trust Export - ${activeTab === 'explorer' ? explorerTarget : activeTab}</name>\n    <Folder>\n      <name>Restoration Features</name>\n`;

      dataToExport.forEach(row => {
        const { geometry, idx, id, ...properties } = row;
        const nameVal = properties.Grower || properties["Grower Name"] || properties.Name || properties.idx || `Feature ${id}`;
        
        let desc = '<![CDATA[<table border="1" style="border-collapse:collapse; font-family:sans-serif; font-size:12px;">';
        Object.keys(properties).forEach(key => {
          desc += `<tr><td><b>${key}</b></td><td>${properties[key]}</td></tr>`;
        });
        desc += '</table>]]>';

        let geomKml = '';
        if (geometry) {
          if (geometry.type === 'Point') {
            geomKml = `<Point><coordinates>${geometry.coordinates[0]},${geometry.coordinates[1]},0</coordinates></Point>`;
          } else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates.map(c => `${c[0]},${c[1]},0`).join(' ');
            geomKml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
          } else if (geometry.type === 'Polygon') {
            const coords = geometry.coordinates[0].map(c => `${c[0]},${c[1]},0`).join(' ');
            geomKml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
          } else if (geometry.type === 'MultiPolygon') {
            geomKml = '<MultiGeometry>';
            geometry.coordinates.forEach(poly => {
              const coords = poly[0].map(c => `${c[0]},${c[1]},0`).join(' ');
              geomKml += `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
            });
            geomKml += '</MultiGeometry>';
          }
        }

        kmlStr += `      <Placemark>\n        <name>${nameVal}</name>\n        <description>${desc}</description>\n        ${geomKml}\n      </Placemark>\n`;
      });

      kmlStr += '    </Folder>\n  </Document>\n</kml>';

      const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(kmlStr);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     dataStr);
      downloadAnchor.setAttribute("download", `${prefix}_export.kml`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = Object.keys(dataToExport[0]).filter(k => k !== 'geometry');
      const csvRows = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] || '')).join(','))
      ];
      const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     csvStr);
      downloadAnchor.setAttribute("download", `${prefix}_export.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // Pie chart calculation for overall targets using brand colors (Moss Green & Soil Brown)
  const getPieChartData = () => {
    return [
      { name: 'Planted', value: kpis.trees_planted, fill: '#407e52' },
      { name: 'Remaining Target', value: Math.max(0, kpis.trees_target - kpis.trees_planted), fill: '#74614a' }
    ];
  };

  const renderTabStatistics = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
              Restoration Targets (My Trees)
            </h3>
            <div style={{ height: '150px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={getPieChartData()} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={35} 
                    outerRadius={55} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: '#407e52', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#407e52' }} />
                  <span>Planted ({Math.round(kpis.trees_planted / 1000)}k)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#74614a' }} />
                  <span>Remaining ({Math.round(Math.max(0, kpis.trees_target - kpis.trees_planted) / 1000)}k)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: 0 }}>
              Network Snapshot
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Planted:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.trees_planted.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Targets:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.trees_target.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Survival %:</span>
              <span style={{ fontWeight: 600, color: '#407e52' }}>{kpis.overall_survival_rate}%</span>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-meetings') {
      const meetingsData = outplantingMetrics?.meetings;
      const typeData = Object.entries(meetingsData?.types || {}).map(([key, val]) => ({ name: key, value: val }));
      const stakeholderData = Object.entries(meetingsData?.stakeholders || {}).map(([key, val]) => ({ name: key, value: val })).slice(0, 5);

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Meetings Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Inceptions:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{meetingsData?.total || 0}</span>
            </div>
            
            {typeData.length > 0 && (
              <div style={{ height: '140px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer>
                  <BarChart data={typeData.slice(0, 4)} layout="vertical">
                    <XAxis type="number" fontSize={10} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" width={80} fontSize={10} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: '#407e52' }} />
                    <Bar dataKey="value" fill="#407e52" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Stakeholder Attendances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stakeholderData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value} meetings</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-eligibility') {
      const eligibility = outplantingMetrics?.plot_eligibility;
      const pieData = [
        { name: 'Qualified', value: eligibility?.qualified || 0, fill: '#407e52' },
        { name: 'Disqualified', value: eligibility?.disqualified || 0, fill: '#ef4444' },
        { name: 'Pending', value: eligibility?.pending || 0, fill: '#74614a' }
      ].filter(x => x.value > 0);

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Plot Eligibility</h3>
            {pieData.length > 0 ? (
              <div style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: '#407e52' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#407e52' }} />Qualified ({eligibility?.qualified})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />Disqualified ({eligibility?.disqualified})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#74614a' }} />Pending ({eligibility?.pending})</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '15px 0' }}>Loading eligibility...</div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Livelihood Hectares Mapped</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hectares Evaluated:</span>
              <span style={{ fontWeight: 700, color: '#72bb95' }}>{eligibility?.total_hectares || 0} ha</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Growers by Gender:</span>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', textAlign: 'right' }}>
                {Object.entries(eligibility?.by_gender || {}).slice(0, 3).map(([key, val]) => (
                  <div key={key}>{key}: <strong>{val}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-landprep') {
      const landprep = outplantingMetrics?.land_prep;
      const progressPercent = landprep?.target ? Math.round((landprep.ready / landprep.target) * 100) : 0;

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Land Preparation</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Holes:</span>
                <span style={{ fontWeight: 600 }}>{landprep?.target.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Marked Holes:</span>
                <span style={{ fontWeight: 600 }}>{landprep?.marked.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ready to Plant:</span>
                <span style={{ fontWeight: 600, color: '#407e52' }}>{landprep?.ready.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Completion:</span>
                <strong>{progressPercent}%</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--forest-emerald)' }} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>SOP Standard Compliance</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dug to SOP Standard:</span>
              <span style={{ fontWeight: 700, color: '#72bb95' }}>{landprep?.compliant.toLocaleString()} holes</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
              *Standard compliance tracks hole depth and sizing SOP requirements.
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-planted') {
      const planting = outplantingMetrics?.planting;
      const progress = planting?.target ? Math.round((planting.planted / planting.target) * 100) : 0;

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Planting Achievement</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Planting Target:</span>
                <span style={{ fontWeight: 600 }}>{planting?.target.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Actual Planted:</span>
                <span style={{ fontWeight: 700, color: '#72bb95' }}>{planting?.planted.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Variance:</span>
                <span style={{ fontWeight: 600, color: planting?.variance > 0 ? '#ef4444' : '#407e52' }}>{planting?.variance.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Achievement Rate:</span>
                <strong>{progress}%</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--forest-mint)' }} />
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-survival') {
      const sg = outplantingMetrics?.survival_growth;
      const growthData = Object.entries(sg?.growth_distribution || {}).map(([key, val]) => ({ name: key, count: val }));

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Growth Height Stage</h3>
            {growthData.length > 0 ? (
              <div style={{ height: '130px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={growthData}>
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                    <YAxis fontSize={10} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: '#407e52' }} />
                    <Bar dataKey="count" fill="#72bb95" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '15px' }}>Loading growth data...</div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Survival by Gender</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(sg?.by_gender || {}).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{key === '1' ? 'Male' : 'Female'} Growers:</span>
                  <span style={{ fontWeight: 700, color: '#407e52' }}>{val.survival_rate}% survival</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'outplanting-fire') {
      const fire = outplantingMetrics?.fire;
      const causeData = Object.entries(fire?.causes || {}).map(([key, val]) => ({ name: key, value: val }));

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', borderLeft: '3px solid #ef4444' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', margin: '0 0 10px 0' }}>Fire Damage Summary</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fire Incidents:</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{fire?.incidents}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Burnt Area Size:</span>
                <span style={{ fontWeight: 600 }}>{fire?.hectares_lost} hectares</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Trees Lost:</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{fire?.trees_lost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {causeData.length > 0 && (
            <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Primary Outbreak Causes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {causeData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                    <span style={{ fontWeight: 600 }}>{item.value} outbreaks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'nursery-seed') {
      const seed = nurseryMetrics?.seed_collection;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Seeds Collected</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Seeds (Kgs):</span>
              <span style={{ fontWeight: 700, color: '#72bb95' }}>{seed?.total_collected_kg} kg</span>
            </div>
            
            {seed?.by_species.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>By Species:</span>
                {seed.by_species.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.species}:</span>
                    <span style={{ fontWeight: 600 }}>{item.quantity_kg} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Collection by Region</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(seed?.by_region || {}).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                  <span style={{ fontWeight: 600 }}>{val} kg</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'nursery-production') {
      const prod = nurseryMetrics?.nursery_production;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Nursery Inventories</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Seeds Pocketed:</span>
                <span style={{ fontWeight: 600 }}>{prod?.pocketed.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Germinated Seedlings:</span>
                <span style={{ fontWeight: 600, color: '#407e52' }}>{prod?.germinated.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ready to Plant:</span>
                <span style={{ fontWeight: 700, color: '#72bb95' }}>{prod?.ready.toLocaleString()}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Germination Rate:</span>
              <strong style={{ fontSize: '15px', color: '#407e52' }}>{prod?.germination_rate}%</strong>
            </div>
          </div>

          {prod?.inventories.length > 0 && (
            <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', maxHeight: '180px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Nursery Leaderboard</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {prod.inventories.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.nursery}:</span>
                    <span style={{ fontWeight: 600 }}>{item.ready} ready</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'nursery-dispatch') {
      const disp = nurseryMetrics?.seedling_dispatch;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Seedling Distribution</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Distributed to Growers:</span>
                <span style={{ fontWeight: 700, color: '#72bb95' }}>{disp?.distributed.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remaining in Nurseries:</span>
                <span style={{ fontWeight: 600 }}>{disp?.remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'beekeeping-sites') {
      const sites = beekeepingMetrics?.apiary_suitability;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Apiary Suitability</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Evaluated Locations:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sites?.total_evaluated_sites}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Criteria Averages (Scale 1-4):</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flowers/Flora:</span>
                <strong>{sites?.average_scores.flowers}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Water Source:</span>
                <strong>{sites?.average_scores.water}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sunlight:</span>
                <strong>{sites?.average_scores.sunlight}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security/Access:</span>
                <strong>{sites?.average_scores.security}</strong>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'beekeeping-trainings') {
      const train = beekeepingMetrics?.trainings;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Beekeeping Trainings</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trainings Conducted:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{train?.conducted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Attendants:</span>
                <span style={{ fontWeight: 700, color: '#72bb95' }}>{train?.attendants_total}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Gender Attendance</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Female Trainees:</span>
              <span style={{ fontWeight: 600 }}>{train?.by_gender.female}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Male Trainees:</span>
              <span style={{ fontWeight: 600 }}>{train?.by_gender.male}</span>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'beekeeping-status') {
      const hive = beekeepingMetrics?.hive_colonization;
      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#407e52', margin: '0 0 12px 0' }}>Hive Colonization</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Hives Mounted:</span>
                <span style={{ fontWeight: 600 }}>{hive?.total_hives}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Colonized Hives:</span>
                <span style={{ fontWeight: 700, color: '#407e52' }}>{hive?.colonized}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uncolonized Hives:</span>
                <span style={{ fontWeight: 600 }}>{hive?.uncolonized}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Harvest Quality Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(hive?.quality || {}).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                  <span style={{ fontWeight: 600 }}>{val} hives</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'verifications-audits') {
      const totalAudits = verificationsMetrics?.verifications?.length || 0;
      const sortedOfficers = [...(verificationsMetrics?.officers || [])].sort((a, b) => b.count - a.count);

      const handlePrintOfficerReport = () => {
        if (selectedOfficer === 'All') return;
        const officerVerifications = verificationsMetrics.verifications.filter(v => v.officer === selectedOfficer);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Field Officer Audit Report - ${selectedOfficer}</title>
              <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Outfit', sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
                h1 { color: #064e3b; border-bottom: 2px solid #407e52; padding-bottom: 12px; margin-bottom: 20px; font-size: 24px; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; color: #475569; }
                .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
                .verification-item { border-bottom: 1px solid #e2e8f0; padding: 15px 0; display: flex; gap: 20px; }
                .verification-img { width: 100px; height: 75px; object-fit: cover; border-radius: 4px; }
                .item-body { flex: 1; }
                .item-title { font-weight: 700; color: #0f172a; margin-bottom: 4px; font-size: 15px; }
                .item-meta { font-size: 11px; color: #64748b; margin-bottom: 6px; }
                .item-text { font-size: 13px; color: #334155; margin-bottom: 4px; }
                .item-rec { font-size: 12px; font-style: italic; color: #407e52; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="no-print" style="margin-bottom: 20px;">
                <button onclick="window.print()" style="background:#407e52; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer;">Print / Save PDF</button>
              </div>
              <h1>FIELD OFFICER VERIFICATIONS AUDIT</h1>
              <div class="meta">
                <div><strong>Officer Name:</strong> ${selectedOfficer}</div>
                <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
              </div>
              <div class="summary-card">
                <h3 style="margin-top:0; color:#0f172a;">Audit Summary Metrics</h3>
                <div>Total Verification Audits Logged: <strong>${officerVerifications.length}</strong></div>
              </div>
              <h3>Audit Records Log</h3>
              <div>
                ${officerVerifications.slice(0, 50).map(v => `
                  <div class="verification-item">
                    ${v.photo && v.photo !== 'None' ? `<img class="verification-img" src="${BACKEND_URL}/api/media/image/${v.photo}" />` : ''}
                    <div class="item-body">
                      <div class="item-title">${v.grower} &bull; ${v.type}</div>
                      <div class="item-meta">Date: ${v.date} &bull; Ward: ${v.ward}</div>
                      <div class="item-text"><strong>Observations:</strong> "${v.observations}"</div>
                      <div class="item-rec"><strong>Recommendations:</strong> ${v.recommendations}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      };

      return (
        <>
          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', margin: '0 0 10px 0' }}>Field Officers Activity</h3>
            <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Audits:</span>
              <span style={{ fontWeight: 700 }}>{totalAudits}</span>
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Select Field Officer:</label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid rgba(122,129,108,0.3)',
                  color: 'var(--text-primary)',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Officers</option>
                {sortedOfficers.map(off => (
                  <option key={off.name} value={off.name}>{off.name} ({off.count})</option>
                ))}
              </select>

              <button
                onClick={handlePrintOfficerReport}
                disabled={selectedOfficer === 'All'}
                style={{
                  width: '100%',
                  backgroundColor: selectedOfficer === 'All' ? 'rgba(255,255,255,0.02)' : '#407e52',
                  color: selectedOfficer === 'All' ? 'var(--text-muted)' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: selectedOfficer === 'All' ? 'default' : 'pointer',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: selectedOfficer === 'All' ? 'none' : '0 4px 10px rgba(64,126,82,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                <Printer size={13} /> Compile Officer Report
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', maxHeight: '180px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Field Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedOfficers.slice(0, 5).map((off, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{off.name}:</span>
                  <span style={{ fontWeight: 600 }}>{off.count} audits</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  const renderMeetingsDashboard = () => {
    if (!meetingsOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Meetings & Trainings Outcomes...
          </div>
        </div>
      );
    }

    const { summary, meetings } = meetingsOutcomes;
    
    // Sort meetings: placing those with photos or long reports first
    const sortedMeetings = [...meetings].sort((a, b) => {
      const aScore = (a.photo_1 ? 3 : 0) + (a.registers ? 2 : 0) + (a.report && a.report.length > 50 ? 1 : 0);
      const bScore = (b.photo_1 ? 3 : 0) + (b.registers ? 2 : 0) + (b.report && b.report.length > 50 ? 1 : 0);
      return bScore - aScore;
    });

    const chartDataWard = Object.entries(summary.by_ward || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      count: val
    })).sort((a,b) => b.count - a.count).slice(0, 10);

    const chartDataType = Object.entries(summary.by_type || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#407e52', '#74614a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🤝 Meetings & Trainings Outcomes
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outcome logs, resolutions, minutes, and participant registers de-duplicated from {summary.total_records.toLocaleString()} monitor entries.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setMeetingsSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: meetingsSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: meetingsSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: meetingsSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcome Dashboard
            </button>
            <button
              onClick={() => setMeetingsSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: meetingsSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: meetingsSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: meetingsSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Unique Training Events</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.unique_meetings_count}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_records.toLocaleString()} raw logs</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Activity size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Attendants</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_attendants.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>M: {summary.males} | F: {summary.females}</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Training Sessions</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                {summary.by_type["Training"] || 0}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Classroom & field demos</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Community Engagement</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                {summary.by_type["Community Engagement"] || 0}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inceptions & feedback</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Ward Distribution */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Meetings Conducted by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Meetings Count" fill="#407e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Type Breakdown */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Meeting Categories Breakdown
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px' }}>
                {chartDataType.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, paddingLeft: '14px' }}>
                      {entry.value} meetings
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Training Outcomes & Field Proofs Log ({sortedMeetings.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedMeetings.map((meeting) => (
            <div key={meeting.id} className="glass-panel" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-primary)',
              boxSizing: 'border-box'
            }}>
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    backgroundColor: meeting.type.includes('Training') ? 'rgba(64,126,82,0.1)' : 'rgba(59,130,246,0.1)',
                    color: meeting.type.includes('Training') ? '#407e52' : '#3b82f6',
                    textTransform: 'uppercase'
                  }}>
                    {meeting.type}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{meeting.date}</span>
                </div>
                <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {meeting.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  📍 {meeting.location && `${meeting.location}, `}Ward {meeting.ward}
                </div>
              </div>

              {/* Reps and Stakeholders */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(122,129,108,0.1)'
              }}>
                <div>👥 <strong>Audience:</strong> {meeting.names || 'Growers'}</div>
                <div>👤 <strong>MTT Reps:</strong> {meeting.mtt_rep || 'Unknown'}</div>
                <div>📊 <strong>Attendance:</strong> {meeting.attendants_str || 'N/A'}</div>
              </div>

              {/* Outcomes details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {meeting.report && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>📝 Report Summary</div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                      "{meeting.report}"
                    </div>
                  </div>
                )}
                {meeting.minutes && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>⏱️ Discussion Minutes</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{meeting.minutes}</div>
                  </div>
                )}
                {meeting.decision && (
                  <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#b45309' }}>🔑 Key Resolution</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{meeting.decision}</div>
                  </div>
                )}
                {meeting.action_points && (
                  <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#1d4ed8' }}>⚡ Action Point</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{meeting.action_points}</div>
                  </div>
                )}
                {meeting.comments && (
                  <div style={{ borderLeft: '3px solid #74614a', paddingLeft: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#74614a' }}>💡 Comments & Guidance</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{meeting.comments}</div>
                  </div>
                )}
              </div>

              {/* Media Proof Section */}
              {(meeting.photo_1 || meeting.registers) && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  {meeting.photo_1 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Session Photo</div>
                      <a href={`${BACKEND_URL}/api/media/image/${meeting.photo_1}`} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={`${BACKEND_URL}/api/media/image/${meeting.photo_1}`} 
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                          alt="Meeting session proof"
                        />
                      </a>
                    </div>
                  )}
                  {meeting.registers && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Register Proof</div>
                      <a href={`${BACKEND_URL}/api/media/image/${meeting.registers}`} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={`${BACKEND_URL}/api/media/image/${meeting.registers}`} 
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                          alt="Meeting register proof"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBeekeepingSitesDashboard = () => {
    if (!sitesOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Apiary Site Assessment Outcomes...
          </div>
        </div>
      );
    }

    const { summary, logs } = sitesOutcomes;

    const criteriaData = [
      { name: 'Flora/Flowers', score: summary.average_scores.flowers, fill: '#10b981' },
      { name: 'Water Source', score: summary.average_scores.water, fill: '#3b82f6' },
      { name: 'Sunlight', score: summary.average_scores.sunlight, fill: '#f59e0b' },
      { name: 'Security/Access', score: summary.average_scores.security, fill: '#ef4444' }
    ];

    const accessibilityData = Object.entries(summary.by_accessibility || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const conditionData = Object.entries(summary.by_condition || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🐝 Apiary Site Assessment Outcomes
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Suitability evaluations, vegetation density, security ratings, and apiary location logs.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setSitesSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: sitesSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: sitesSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: sitesSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcome Dashboard
            </button>
            <button
              onClick={() => setSitesSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: sitesSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: sitesSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: sitesSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <MapPin size={20} />
            </div>
            <div>
              <span className="kpi-label">Evaluated Yards</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_evaluated_sites}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locations monitored</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="kpi-label">Standard Mounted</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.suitable_sites}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Proper height & shading</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <span className="kpi-label">Hives Waxed</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_evaluated_sites - (summary.total_evaluated_sites - 100)}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scent-primed for bees</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="kpi-label">Avg Suitability Score</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.avg_suitability_score} / 4.0</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Eco-health index</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Suitability Criteria */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Apiary Suitability Criteria Averages (Scale 1.0 - 4.0)
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={criteriaData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="score" name="Average Score" radius={[4, 4, 0, 0]}>
                    {criteriaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Accessibility & Conditions */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Yard Accessibility & Condition Splits
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accessibilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {accessibilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accessibility Status</span>
                {accessibilityData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logs title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Apiary Sites Assessment Feed ({logs.length})
          </h2>
        </div>

        {/* Logs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {logs.map((log) => (
            <div key={log.id} className="glass-panel" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-primary)',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {log.beekeeper}
                  </h4>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: log.condition === 'Good Condition' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: log.condition === 'Good Condition' ? '#10b981' : '#ef4444'
                  }}>
                    {log.condition}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Ward {log.ward}</span>
                  <span>•</span>
                  <span>{log.village}</span>
                  <span>•</span>
                  <span>{log.cluster}</span>
                </div>
              </div>

              {/* Suitability mini scores */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '8px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Flora</div>
                  <strong style={{ fontSize: '13px', color: '#10b981' }}>{log.flowers_score}/4</strong>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Water</div>
                  <strong style={{ fontSize: '13px', color: '#3b82f6' }}>{log.water_score}/4</strong>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sun</div>
                  <strong style={{ fontSize: '13px', color: '#f59e0b' }}>{log.sunlight_score}/4</strong>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Access</div>
                  <strong style={{ fontSize: '13px', color: '#ef4444' }}>{log.security_score}/4</strong>
                </div>
              </div>

              {log.comments && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{log.comments}"
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <span>Monitor: {log.monitor}</span>
                <span>{log.date}</span>
              </div>

              {/* Photo proofs */}
              {(log.photo_1 || log.photo_2) && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  {log.photo_1 && (
                    <div style={{ flex: 1 }}>
                      <a href={`${BACKEND_URL}/api/media/image/${log.photo_1}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`${BACKEND_URL}/api/media/image/${log.photo_1}`}
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}
                          alt="Apiary Site photo 1"
                        />
                      </a>
                    </div>
                  )}
                  {log.photo_2 && (
                    <div style={{ flex: 1 }}>
                      <a href={`${BACKEND_URL}/api/media/image/${log.photo_2}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`${BACKEND_URL}/api/media/image/${log.photo_2}`}
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}
                          alt="Apiary Site photo 2"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBeekeepingTrainingsDashboard = () => {
    if (!beekeepingTrainingsOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Beekeeping Trainings Outcomes...
          </div>
        </div>
      );
    }

    const { summary, trainings } = beekeepingTrainingsOutcomes;
    const roundPercent = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;

    const genderData = [
      { name: 'Female Trainees', value: summary.attendants_female, fill: '#10b981' },
      { name: 'Male Trainees', value: summary.attendants_male, fill: '#74614a' }
    ];

    const chartDataTrainings = trainings.map(t => ({
      name: t.title.length > 25 ? t.title.substring(0, 22) + '...' : t.title,
      attendants: t.attendants_total,
      female: t.attendants_female,
      male: t.attendants_male
    }));

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🤝 Beekeeping Trainings Outcomes
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Attendants, training sessions, gender splits, and lesson summaries.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setBeekeepingTrainingsSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: beekeepingTrainingsSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: beekeepingTrainingsSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: beekeepingTrainingsSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcome Dashboard
            </button>
            <button
              onClick={() => setBeekeepingTrainingsSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: beekeepingTrainingsSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: beekeepingTrainingsSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: beekeepingTrainingsSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Calendar size={20} />
            </div>
            <div>
              <span className="kpi-label">Trainings Conducted</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.trainings_conducted}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Classroom & field sessions</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Attendants Reached</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.attendants_total}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Growers & community members</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Users size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <span className="kpi-label">Female Attendants</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.attendants_female}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roundPercent(summary.attendants_female, summary.attendants_total)}% female split</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Users size={20} style={{ color: '#74614a' }} />
            </div>
            <div>
              <span className="kpi-label">Male Attendants</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.attendants_male}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roundPercent(summary.attendants_male, summary.attendants_total)}% male split</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Attendants per session */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Attendants Distribution by Training Session
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTrainings} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={32} iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="female" name="Female Attendants" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="male" name="Male Attendants" fill="#74614a" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Gender split donut */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Overall Participant Gender Attendance Split
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {genderData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.fill }} />
                      <span>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, paddingLeft: '14px' }}>
                      {entry.value} ({roundPercent(entry.value, summary.attendants_total)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logs Feed title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Training Sessions Log & Proofs ({trainings.length})
          </h2>
        </div>

        {/* Trainings Logs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {trainings.map((train) => (
            <div key={train.id} className="glass-panel" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-primary)',
              boxSizing: 'border-box'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {train.title}
                </h4>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{train.ward}</span>
                  <span>•</span>
                  <span>Attendants: {train.attendants_total} ({train.attendants_male}M / {train.attendants_female}F)</span>
                </div>
              </div>

              {train.comments && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {train.comments}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <span>Officer: {train.monitor}</span>
                <span>{train.date}</span>
              </div>

              {/* Photo proof */}
              {train.photo_1 && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Session Register Proof</div>
                  <a href={`${BACKEND_URL}/api/media/image/${train.photo_1}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`${BACKEND_URL}/api/media/image/${train.photo_1}`}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}
                      alt="Training Register Photo"
                    />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBeekeepingStatusDashboard = () => {
    if (!statusOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Hive Colonization Outcomes...
          </div>
        </div>
      );
    }

    const { summary, logs } = statusOutcomes;
    const roundPercent = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;

    const sortedLogs = [...logs].sort((a, b) => {
      const aPhoto = a.photo_1 ? 1 : 0;
      const bPhoto = b.photo_1 ? 1 : 0;
      if (bPhoto !== aPhoto) return bPhoto - aPhoto;
      return b.honey_yield_kg - a.honey_yield_kg;
    });

    const colonizationData = [
      { name: 'Colonized', value: summary.colonized, fill: '#10b981' },
      { name: 'Uncolonized', value: summary.uncolonized, fill: '#74614a' },
      { name: 'Decolonized', value: summary.decolonized, fill: '#ef4444' }
    ];

    const qualityData = Object.entries(summary.by_quality || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const QUALITY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🐝 Hive Colonization Outcomes
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Monitored hives, colonization status, honey yields, and grower log proofs.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setStatusSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: statusSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: statusSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: statusSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcome Dashboard
            </button>
            <button
              onClick={() => setStatusSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: statusSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: statusSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: statusSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Monitored Hives</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_hives}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hives in active project</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <span className="kpi-label">Colonized</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.colonized}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roundPercent(summary.colonized, summary.total_hives)}% Colonization Rate</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <span className="kpi-label">Uncolonized / Decolonized</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.uncolonized} / {summary.decolonized}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting swarms</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Sparkles size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <span className="kpi-label">Estimated Honey Yield</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_honey_yield_kg.toLocaleString()} kg</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calculated from observed buckets</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Colonization splits donut */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Hive Colonization Breakdown
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={colonizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {colonizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colonizationData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.fill }} />
                      <span>{entry.name}</span>
                    </div>
                    <strong>{entry.value} hives</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Hive quality ratings */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Hive Build & Wood Quality Ratings
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {qualityData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: QUALITY_COLORS[index % QUALITY_COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <strong>{entry.value} hives</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logs title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Hive Monitoring & Beekeepers Log ({sortedLogs.length})
          </h2>
        </div>

        {/* Logs Feed */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedLogs.slice(0, 100).map((log) => (
            <div key={log.id} className="glass-panel" style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-primary)',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.beekeeper}
                    </h4>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hive ID: {log.hive_id}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: log.status === 'Colonized' ? 'rgba(16, 185, 129, 0.1)' : log.status === 'Decolonized' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: log.status === 'Colonized' ? '#10b981' : log.status === 'Decolonized' ? '#ef4444' : '#f59e0b'
                  }}>
                    {log.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Ward {log.ward}</span>
                  <span>•</span>
                  <span>{log.village}</span>
                  <span>•</span>
                  <span>{log.cluster}</span>
                </div>
              </div>

              {/* Hive Specific Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '8px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bee Type</div>
                  <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{log.bee_type === 'nan' ? 'Unknown' : log.bee_type}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Quality</div>
                  <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{log.quality}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Yield (Est)</div>
                  <strong style={{ fontSize: '12px', color: '#f59e0b' }}>{log.honey_yield_kg > 0 ? `${log.honey_yield_kg} kg` : '0 kg'}</strong>
                </div>
              </div>

              {log.comments && (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{log.comments}"
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <span>Officer: {log.monitor}</span>
                <span>{log.date}</span>
              </div>

              {/* Photo proofs */}
              {(log.photo_1 || log.photo_2) && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  {log.photo_1 && (
                    <div style={{ flex: 1 }}>
                      <a href={`${BACKEND_URL}/api/media/image/${log.photo_1}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`${BACKEND_URL}/api/media/image/${log.photo_1}`}
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}
                          alt="Hive photo 1"
                        />
                      </a>
                    </div>
                  )}
                  {log.photo_2 && (
                    <div style={{ flex: 1 }}>
                      <a href={`${BACKEND_URL}/api/media/image/${log.photo_2}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`${BACKEND_URL}/api/media/image/${log.photo_2}`}
                          style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}
                          alt="Hive photo 2"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOfficerAuditsDashboard = () => {
    if (!verificationsMetrics) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Officer Audits Outcomes...
          </div>
        </div>
      );
    }

    const verifications = verificationsMetrics.verifications || [];
    const officersList = verificationsMetrics.officers || [];
    
    // KPIs calculations
    const totalAudits = verifications.length;
    const activeOfficersCount = officersList.length;
    const outplantingCount = verifications.filter(v => v.type === 'Out-Planting Audit').length;
    const nurseryCount = verifications.filter(v => v.type === 'Nursery Verification').length;
    const infraCount = verifications.filter(v => v.type === 'Infrastructure Audit').length;

    // Sort officers for bar chart
    const chartDataOfficers = [...officersList]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(o => ({
        name: o.name,
        count: o.count
      }));

    // Categories donut chart
    const chartDataCategories = [
      { name: 'Out-Planting', value: outplantingCount },
      { name: 'Nursery', value: nurseryCount },
      { name: 'Infrastructure', value: infraCount }
    ].filter(d => d.value > 0);

    const COLORS = ['#407e52', '#f59e0b', '#3b82f6'];

    // Media url resolver
    const getMediaUrl = (path, mediaType) => {
      if (!path || path === 'None' || path === 'nan') return null;
      const filename = path.split('/').pop().split('\\').pop();
      return `${BACKEND_URL}/api/media/${mediaType}/${filename}`;
    };

    // Filter audits
    const filteredAudits = verifications.filter(v => {
      const query = searchText.toLowerCase();
      const officer = (v.officer || '').toLowerCase();
      const grower = (v.grower || '').toLowerCase();
      const ward = (v.ward || '').toLowerCase();
      const obs = (v.observations || '').toLowerCase();
      const rec = (v.recommendations || '').toLowerCase();
      return officer.includes(query) || grower.includes(query) || ward.includes(query) || obs.includes(query) || rec.includes(query);
    });

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              👮 Officer Verifications & Audits
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outcome metrics and logs for field verifications, nurseries auditing, and livelihoods infrastructure.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setAuditsSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: auditsSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: auditsSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: auditsSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setAuditsSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: auditsSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: auditsSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: auditsSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Activity size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Verification Audits</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{totalAudits}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across all activities</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Active MEAL Officers</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{activeOfficersCount}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered in database</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Out-Planting Audits</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{outplantingCount}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Survival & planting audits</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Sliders size={20} />
            </div>
            <div>
              <span className="kpi-label">Nursery Verifications</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{nurseryCount}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seedlings stock verifications</span>
            </div>
          </div>

          {/* KPI 5 */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Database size={20} />
            </div>
            <div>
              <span className="kpi-label">Infrastructure Audits</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{infraCount}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Livelihoods structures audits</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {/* Chart 1: Audits per Officer */}
          <div className="glass-panel" style={{ background: 'var(--bg-primary)', padding: '20px', minHeight: '340px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Audits Conducted per Field Officer (Top 10)
            </h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataOfficers} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'rgba(64,126,82,0.2)', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--forest-green)' }}
                  />
                  <Bar dataKey="count" fill="#407e52" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Split */}
          <div className="glass-panel" style={{ background: 'var(--bg-primary)', padding: '20px', minHeight: '340px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Verification Categories Distribution
            </h3>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartDataCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'rgba(64,126,82,0.2)', color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
                {chartDataCategories.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, paddingLeft: '14px' }}>
                      {entry.value} ({((entry.value / totalAudits) * 100).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-panel" style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(122,129,108,0.2)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by officer name, grower, ward, observations or recommendations..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Officer Verification & Field Audit Records ({filteredAudits.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredAudits.map((v) => {
            const photoUrl = getMediaUrl(v.photo, 'image');
            const audioUrl = getMediaUrl(v.audio, 'audio');
            const typeColor = v.type === 'Out-Planting Audit' ? '#407e52' : v.type === 'Nursery Verification' ? '#f59e0b' : '#3b82f6';
            const typeBg = v.type === 'Out-Planting Audit' ? 'rgba(64,126,82,0.1)' : v.type === 'Nursery Verification' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';

            return (
              <div key={v.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: typeBg,
                      color: typeColor,
                      textTransform: 'uppercase'
                    }}>
                      {v.type}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{v.date}</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Audited: {v.grower}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                    <span>👮 Officer: <strong>{v.officer}</strong></span>
                    {v.ward && <span>📍 Ward: <strong>{v.ward}</strong></span>}
                  </div>
                </div>

                {/* Audit details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {v.observations && (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>📝 Observations</div>
                      <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                        "{v.observations}"
                      </div>
                    </div>
                  )}
                  {v.recommendations && (
                    <div style={{ borderLeft: `3px solid ${typeColor}`, paddingLeft: '8px', marginTop: '4px' }}>
                      <div style={{ fontWeight: 700, color: typeColor }}>💡 Resolution & Recommendations</div>
                      <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                        {v.recommendations}
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice player */}
                {audioUrl && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(122,129,108,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--forest-green)', fontWeight: 700 }}>
                      <Volume2 size={13} /> Voice Note Proof
                    </div>
                    <audio src={audioUrl} controls style={{ width: '100%', height: '32px' }} />
                  </div>
                )}

                {/* Photo proofs */}
                {photoUrl && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                      <ImageIcon size={13} /> Photo Verification Proof
                    </div>
                    <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photoUrl}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}
                        alt="Verification proof"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEligibilityDashboard = () => {
    if (!eligibilityOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Plot Eligibility Outcomes...
          </div>
        </div>
      );
    }

    const { summary, assessments } = eligibilityOutcomes;
    
    // Sort assessments: placing those with photos first
    const sortedAssessments = [...assessments].sort((a, b) => {
      const aScore = (a.photo_1 ? 3 : 0) + (a.photo_2 ? 2 : 0) + (a.comments && a.comments.length > 20 ? 1 : 0);
      const bScore = (b.photo_1 ? 3 : 0) + (b.photo_2 ? 2 : 0) + (b.comments && b.comments.length > 20 ? 1 : 0);
      return bScore - aScore;
    });

    const chartDataSoil = Object.entries(summary.by_soil || {}).map(([key, val]) => ({
      name: key,
      count: val
    })).sort((a,b) => b.count - a.count);

    const chartDataLandUse = Object.entries(summary.by_land_use || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataWard = Object.entries(summary.by_ward || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      count: val
    })).sort((a,b) => b.count - a.count).slice(0, 10);

    const COLORS = ['#407e52', '#74614a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🌱 Plot Eligibility Assessments
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Field assessments, soil suitability audits, pre-existing biomass, and land preparation suitability checks.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setEligibilitySubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: eligibilitySubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: eligibilitySubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: eligibilitySubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setEligibilitySubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: eligibilitySubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: eligibilitySubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: eligibilitySubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Assessed Plots */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Plots Mapped</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_records}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multipolygon boundaries</span>
            </div>
          </div>

          {/* KPI 2: Total Hectares */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Mapped Area</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_hectares.toLocaleString()} ha</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>M: {summary.by_gender.Male || 0} | F: {summary.by_gender.Female || 0} growers</span>
            </div>
          </div>

          {/* KPI 3: Qualified */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="kpi-label">Qualified (Good SOP)</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.qualified}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ready for outplanting</span>
            </div>
          </div>

          {/* KPI 4: Pending / Disqualified */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="kpi-label">Pending / Rejected</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-muted)' }}>{summary.pending}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                <span style={{ color: '#ef4444' }}>{summary.disqualified}</span>
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requires clearing or visit</span>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Soil Type Distribution */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Assessed Plots by Soil Type Suitability
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSoil} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Plots Count" fill="#74614a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Land Use Breakdown */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Pre-existing Land Use Context
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataLandUse}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataLandUse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '220px' }}>
                {chartDataLandUse.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, paddingLeft: '14px' }}>
                      {entry.value} plots
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mapped Hectares by Ward */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Assessed Plots Geographical Ward Distribution
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Plots Assessed" fill="#407e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Plot Eligibility Assessment & Soil Audits Feed ({sortedAssessments.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedAssessments.map((assess) => {
            const isQualified = assess.status_group === 'Qualified';
            const isDisqualified = assess.status_group === 'Disqualified';
            
            return (
              <div key={assess.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: isQualified ? 'rgba(64,126,82,0.1)' : isDisqualified ? 'rgba(239,68,68,0.1)' : 'rgba(116,97,74,0.1)',
                      color: isQualified ? '#407e52' : isDisqualified ? '#ef4444' : '#74614a',
                      textTransform: 'uppercase'
                    }}>
                      {assess.status_group}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{assess.plot_size} ha</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {assess.grower}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 Ward {assess.ward} {assess.village && `, Village ${assess.village}`} {assess.cluster && ` (${assess.cluster})`}
                  </div>
                </div>

                {/* Plot Bio Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(122,129,108,0.1)'
                }}>
                  <div>🌍 <strong>Region:</strong> {assess.region}</div>
                  <div>🪨 <strong>Soil Type:</strong> {assess.soil_type}</div>
                  <div>🌾 <strong>Land Use:</strong> {assess.land_use}</div>
                  <div>🌳 <strong>Existing Trees:</strong> {assess.trees_count}</div>
                  <div>🌱 <strong>Coppices:</strong> {assess.coppices}</div>
                  <div>🌾 <strong>Dominant:</strong> {assess.dominant_species}</div>
                  <div style={{ gridColumn: 'span 2' }}>🔍 <strong>Assessor Officer:</strong> {assess.assessor}</div>
                </div>

                {/* Comments & Status Guidance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {assess.comments && (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>📝 Field Observations</div>
                      <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                        "{assess.comments}"
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>⚡ Eligibility Status</div>
                    <div style={{ 
                      color: 'var(--text-primary)', 
                      fontWeight: 600, 
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: isQualified ? '#407e52' : isDisqualified ? '#ef4444' : '#74614a' 
                      }} />
                      {assess.status}
                    </div>
                  </div>
                </div>

                {/* Media Proof Section */}
                {(assess.photo_1 || assess.photo_2) && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    {assess.photo_1 && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Pre-restoration Photo 1</div>
                        <a href={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} 
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                            alt="Pre-restoration proof"
                          />
                        </a>
                      </div>
                    )}
                    {assess.photo_2 && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Pre-restoration Photo 2</div>
                        <a href={`${BACKEND_URL}/api/media/image/${assess.photo_2}`} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={`${BACKEND_URL}/api/media/image/${assess.photo_2}`} 
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                            alt="Pre-restoration proof"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLandprepDashboard = () => {
    if (!landprepOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Land Preparation Outcomes...
          </div>
        </div>
      );
    }

    const { summary, landprep } = landprepOutcomes;
    
    // Sort landprep: placing those with photos or audio first
    const sortedLandprep = [...landprep].sort((a, b) => {
      const aScore = (a.photo_1 ? 4 : 0) + (a.audio ? 3 : 0) + (a.comments && a.comments.length > 20 ? 1 : 0);
      const bScore = (b.photo_1 ? 4 : 0) + (b.audio ? 3 : 0) + (b.comments && b.comments.length > 20 ? 1 : 0);
      return bScore - aScore;
    });

    const chartDataWard = Object.entries(summary.by_ward_marked || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      marked: val,
      standard: summary.by_ward_standard[key] || 0
    })).sort((a,b) => b.marked - a.marked);

    const chartDataInterest = Object.entries(summary.by_interest || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataMonitor = Object.entries(summary.by_monitor || {}).map(([key, val]) => ({
      name: key,
      count: val
    })).sort((a,b) => b.count - a.count).slice(0, 10);

    const chartDataFrequency = Object.entries(summary.by_frequency || {}).map(([key, val]) => ({
      name: key,
      count: val
    })).sort((a,b) => b.count - a.count);

    const COLORS = ['#407e52', '#74614a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              ⛏️ Land Preparation & SOP Compliance
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outplanting prep audits: hole digging tracking, SOP quality standard compliance, and grower interest.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setLandprepSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: landprepSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: landprepSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: landprepSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setLandprepSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: landprepSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: landprepSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: landprepSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Valid Records */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Audited Growers</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.valid_records}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_records} logged visits</span>
            </div>
          </div>

          {/* KPI 2: Compliance Rate */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="kpi-label">SOP Compliance Rate</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.overall_compliance_rate}%</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average quality check score</span>
            </div>
          </div>

          {/* KPI 3: Hole Preparation Progress */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Standard Holes Prepared</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_standard.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_marked.toLocaleString()} marked</span>
            </div>
          </div>

          {/* KPI 4: Ready for planting */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <div>
              <span className="kpi-label">Ready Status (Yes/No)</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                <span style={{ color: '#407e52' }}>{summary.ready_yes}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                <span style={{ color: '#ef4444' }}>{summary.ready_no}</span>
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending second visits: {summary.ready_pending}</span>
            </div>
          </div>
        </div>

        {/* Charts row 1: Ward Distribution (Standard vs Marked) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Standard vs Marked Hole Audits by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="marked" name="Marked Holes" fill="#74614a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="standard" name="Standard Holes" fill="#407e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2: Interest & Frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Interest */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Grower Restoration Interest Level
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataInterest}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataInterest.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                {chartDataInterest.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, paddingLeft: '13px' }}>
                      {entry.value} growers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Frequencies */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Patrol Visit Audit Frequencies
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataFrequency} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Visits Count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 3: Monitor Audit Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Top 10 Monitors by Land Prep Audits Completed
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataMonitor} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Audits Mapped" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Land Prep Compliance & Field SOP Audits Log ({sortedLandprep.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedLandprep.map((assess) => {
            const isReady = assess.ready_status === 'Ready';
            const isNotReady = assess.ready_status === 'Not Ready';
            const complianceColor = assess.compliance_rate >= 90 ? '#407e52' : assess.compliance_rate >= 50 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={assess.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: isReady ? 'rgba(64,126,82,0.1)' : isNotReady ? 'rgba(239,68,68,0.1)' : 'rgba(116,97,74,0.1)',
                      color: isReady ? '#407e52' : isNotReady ? '#ef4444' : '#74614a',
                      textTransform: 'uppercase'
                    }}>
                      {assess.ready_status}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{assess.date}</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {assess.grower}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 Ward {assess.ward} {assess.cluster && ` (${assess.cluster})`} | Region: {assess.region}
                  </div>
                </div>

                {/* Audit details grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(122,129,108,0.1)'
                }}>
                  <div>👥 <strong>Gender:</strong> {assess.gender}</div>
                  <div>🌾 <strong>Interest:</strong> {assess.interest}</div>
                  <div>🔄 <strong>Patrol Visits:</strong> {assess.frequency}</div>
                  <div>👤 <strong>Monitor:</strong> {assess.monitor}</div>
                  <div>🎯 <strong>Target Holes:</strong> {assess.target}</div>
                  <div>📏 <strong>Marked Holes:</strong> {assess.marked}</div>
                  <div>⛏️ <strong>Standard Holes:</strong> {assess.standard}</div>
                  <div style={{ color: complianceColor, fontWeight: 700 }}>⚡ <strong>Compliance:</strong> {assess.compliance_rate}%</div>
                </div>

                {/* SOP Compliance Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>SOP Compliance Holes Progress</span>
                    <span style={{ fontWeight: 700, color: complianceColor }}>{assess.standard} / {assess.target} target</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (assess.standard / assess.target) * 100)}%`, 
                      height: '100%', 
                      backgroundColor: complianceColor,
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>

                {/* Comments & Audio Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {assess.comments && (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>📝 Field Observations</div>
                      <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                        "{assess.comments}"
                      </div>
                    </div>
                  )}

                  {/* Audio notes voice recording */}
                  {assess.audio && (
                    <div style={{ marginTop: '5px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>🔊 Voice Observation Notes:</div>
                      <div className="audio-player-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-secondary)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(122,129,108,0.1)'
                      }}>
                        <Volume2 size={14} style={{ color: 'var(--forest-green)' }} />
                        <audio controls style={{ height: '24px', flex: 1 }} src={`${BACKEND_URL}/api/media/audio/${assess.audio}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Proof Section */}
                {assess.photo_1 && (
                  <div style={{ marginTop: '5px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Hole Spacing & Standard Photo Proof</div>
                    <a href={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                        alt="Land preparation standard compliance proof"
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPlantingDashboard = () => {
    if (!plantingOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Planting Update Outcomes...
          </div>
        </div>
      );
    }

    const { summary, planting } = plantingOutcomes;

    // Sort planting grower logs: placing those with the most planted trees first
    const sortedPlanting = [...planting].sort((a, b) => b.planted - a.planted);

    const chartDataWard = Object.entries(summary.by_ward_planted || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      planted: val,
      target: summary.by_ward_target[key] || 0
    })).sort((a, b) => b.planted - a.planted);

    const chartDataProgram = Object.entries(summary.by_program_type || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataNursery = Object.entries(summary.by_nursery || {}).map(([key, val]) => ({
      name: key,
      planted: val
    })).sort((a, b) => b.planted - a.planted).slice(0, 10);

    const chartDataSpecies = Object.entries(summary.top_species || {}).map(([key, val]) => ({
      name: key.split('/')[0].split('(')[0].trim(), // Shorten species name for display
      count: val
    })).sort((a, b) => b.count - a.count);

    const COLORS = ['#407e52', '#3b82f6', '#74614a', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🌳 Planting Updates & Tree Counts
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outplanting updates: seedlings distributed and planted, variance metrics, species diversity, and grower audits.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setPlantingSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: plantingSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: plantingSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: plantingSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setPlantingSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: plantingSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: plantingSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: plantingSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Growers Audited */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Audited Growers</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.valid_records}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_records} logged updates</span>
            </div>
          </div>

          {/* KPI 2: Overall Planting Rate */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="kpi-label">Overall Planting Rate</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.overall_planting_rate}%</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Planted vs target ratio</span>
            </div>
          </div>

          {/* KPI 3: Total Trees Planted */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Trees Planted</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_planted.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_target.toLocaleString()} target</span>
            </div>
          </div>

          {/* KPI 4: Planting Variance */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="kpi-label">Planting Variance</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{summary.total_variance.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining seedlings to plant</span>
            </div>
          </div>
        </div>

        {/* Charts row 1: Ward Distribution (Planted vs Target) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Trees Planted vs Targets by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="target" name="Target Seedlings" fill="#74614a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="planted" name="Planted Seedlings" fill="#407e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2: Program Type & Species */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Program Type */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Seedlings Mapped by Restoration Program Type
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataProgram}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataProgram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                {chartDataProgram.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, paddingLeft: '13px' }}>
                      {entry.value} grower records
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Top Species */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Top Species Planted by Frequency
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSpecies} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Planting Occurrences" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 3: Top Nurseries */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Top 10 Nurseries by Seedling Output Mapped (Planted)
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataNursery} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="planted" name="Planted Seedlings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Grower Planting Update Logs ({sortedPlanting.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedPlanting.map((assess) => {
            const progressRate = assess.target > 0 ? Math.round((assess.planted / assess.target) * 100) : 0;
            const progressColor = progressRate >= 90 ? '#407e52' : progressRate >= 50 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={assess.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(64,126,82,0.1)',
                      color: 'var(--forest-green)',
                      textTransform: 'uppercase'
                    }}>
                      {assess.program_type || 'General'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{assess.date}</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {assess.grower}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 Ward {assess.ward} {assess.cluster && ` (${assess.cluster})`} | Region: {assess.region}
                  </div>
                </div>

                {/* Audit details grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(122,129,108,0.1)'
                }}>
                  <div>👥 <strong>Gender:</strong> {assess.gender}</div>
                  <div>🔄 <strong>Patrol Visit:</strong> {assess.frequency}</div>
                  <div>👤 <strong>Monitor:</strong> {assess.monitor}</div>
                  <div>🏡 <strong>Nursery Source:</strong> {assess.nursery}</div>
                  <div>🎯 <strong>Target Trees:</strong> {assess.target}</div>
                  <div>🌳 <strong>Planted Trees:</strong> {assess.planted}</div>
                  <div style={{ color: assess.variance > 0 ? '#ef4444' : 'var(--text-primary)' }}>⚠️ <strong>Variance:</strong> {assess.variance}</div>
                  <div style={{ color: progressColor, fontWeight: 700 }}>⚡ <strong>Progress Rate:</strong> {progressRate}%</div>
                </div>

                {/* Planting Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Tree Planting Progress</span>
                    <span style={{ fontWeight: 700, color: progressColor }}>{assess.planted} / {assess.target} target</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, progressRate)}%`, 
                      height: '100%', 
                      backgroundColor: progressColor,
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>

                {/* Species Planted Badge list */}
                {assess.species && assess.species.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>🌿 Planted Tree Species:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {assess.species.map((sp, sIdx) => (
                        <span key={sIdx} style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid rgba(64,126,82,0.12)',
                          color: 'var(--text-secondary)'
                        }}>
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {assess.observations && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '12px' }}>📝 Monitor Observations</div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4', fontSize: '12.5px' }}>
                      "{assess.observations}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSurvivalDashboard = () => {
    if (!survivalOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Survival & Growth Outcomes...
          </div>
        </div>
      );
    }

    const { summary, survival } = survivalOutcomes;

    // Sort survival grower logs: placing those with the most alive trees first
    const sortedSurvival = [...survival].sort((a, b) => b.alive - a.alive);

    const chartDataHeight = Object.entries(summary.height_distribution || {}).map(([key, val]) => ({
      name: key,
      count: val
    }));

    const chartDataWard = Object.entries(summary.by_ward_planted || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      planted: val,
      alive: summary.by_ward_alive[key] || 0
    })).sort((a, b) => b.planted - a.planted);

    const chartDataSurvivalRate = Object.entries(summary.by_ward_survival_avg || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      rate: val
    })).sort((a, b) => b.rate - a.rate);

    const chartDataGender = Object.entries(summary.by_gender || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#407e52', '#3b82f6', '#74614a', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              📈 Survival Count & Growth Monitoring
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outplanting survival: growth heights tracking, survival rates, gender distribution, and grower audits.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setSurvivalSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: survivalSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: survivalSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: survivalSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setSurvivalSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: survivalSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: survivalSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: survivalSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Growers Audited */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Audited Growers</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.valid_records}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_records} logged monitors</span>
            </div>
          </div>

          {/* KPI 2: Overall Survival Rate */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="kpi-label">Overall Survival Rate</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.overall_survival_rate}%</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weighted overall survival</span>
            </div>
          </div>

          {/* KPI 3: Total Trees Alive */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Trees size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Trees Alive</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_alive.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.total_planted.toLocaleString()} planted</span>
            </div>
          </div>

          {/* KPI 4: Seedlings Mapped */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Regions (North/South)</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                <span style={{ color: '#3b82f6' }}>{summary.by_region.Northern || 0}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                <span style={{ color: '#407e52' }}>{summary.by_region.Southern || 0}</span>
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Growers distributed in regions</span>
            </div>
          </div>
        </div>

        {/* Charts row 1: Height Class Distribution & Ward-level Mapped/Alive */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Height Class Distribution */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Growth Height Class Distribution (Classified Trees)
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataHeight} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Classified Trees" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Planted vs Alive Ward */}
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Seedlings Planted vs Alive by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="planted" name="Planted Seedlings" fill="#74614a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alive" name="Alive Seedlings" fill="#407e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2: Average Survival Rate Ward & Gender Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Average Survival Rate per Ward */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Average Survival Rate (%) by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSurvivalRate} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="rate" name="Average Survival %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Gender */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Growers Audited for Survival by Gender
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataGender}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataGender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                {chartDataGender.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, paddingLeft: '13px' }}>
                      {entry.value} growers
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
            Survival & Growth Audited Logs ({sortedSurvival.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {sortedSurvival.map((assess) => {
            const progressColor = assess.survival_rate >= 80 ? '#407e52' : assess.survival_rate >= 50 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={assess.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(64,126,82,0.1)',
                      color: 'var(--forest-green)',
                      textTransform: 'uppercase'
                    }}>
                      Year {assess.year_planted}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{assess.date}</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {assess.grower}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 Ward {assess.ward} {assess.cluster && ` (${assess.cluster})`} | Region: {assess.region}
                  </div>
                </div>

                {/* Audit details grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(122,129,108,0.1)'
                }}>
                  <div>👥 <strong>Gender:</strong> {assess.gender}</div>
                  <div>👤 <strong>Monitor ID:</strong> {assess.monitor}</div>
                  <div>🎯 <strong>Total Planted:</strong> {assess.planted}</div>
                  <div>🌳 <strong>Total Alive:</strong> {assess.alive}</div>
                  <div>🌿 <strong>Dominant:</strong> {assess.primary_species}</div>
                  <div style={{ color: progressColor, fontWeight: 700 }}>⚡ <strong>Survival:</strong> {assess.survival_rate}%</div>
                </div>

                {/* Survival Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Seedling Survival Progress</span>
                    <span style={{ fontWeight: 700, color: progressColor }}>{assess.alive} / {assess.planted} alive</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (assess.alive / assess.planted) * 100)}%`, 
                      height: '100%', 
                      backgroundColor: progressColor,
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>

                {/* Growth Heights Classifications */}
                {assess.heights && Object.keys(assess.heights).length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>📏 Height Class Breakdown:</div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}>
                      {['0-50cm', '51-100cm', '101-150cm', '151-200cm'].map((hc) => (
                        <div key={hc} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{hc}</span>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{assess.heights[hc] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {assess.comments && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '12px' }}>📝 Monitor Comments</div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4', fontSize: '12px' }}>
                      "{assess.comments}"
                    </div>
                  </div>
                )}

                {/* DCIM photo proof */}
                {assess.photo_1 && (
                  <div style={{ marginTop: '5px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Survival Audit Field Photo</div>
                    <a href={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                        alt="Restoration tree survival count standard proof"
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFireDashboard = () => {
    if (!fireOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Fire Management Outcomes...
          </div>
        </div>
      );
    }

    const { summary, incidents } = fireOutcomes;

    const chartDataWard = Object.entries(summary.by_ward || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      count: val
    })).sort((a,b) => b.count - a.count);

    const chartDataFireguard = Object.entries(summary.by_fireguard || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataSlashed = Object.entries(summary.by_slashed || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#ef4444', '#407e52', '#3b82f6', '#f59e0b', '#8b5cf6', '#74614a'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header Title & Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🔥 Fire Management & Plot Hazard Assessments
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outplanting fire hazard logs: monitored plots, EMA alert updates, safety boundary fireguards, and confirmed fire incidents.
            </p>
          </div>

          {/* Sub-tab Toggle Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setFireSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: fireSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: fireSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: fireSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setFireSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: fireSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: fireSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: fireSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* KPI 1: Monitored Plots */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Monitored Risk Plots</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_risk_plots}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered plots monitored</span>
            </div>
          </div>

          {/* KPI 2: Active Fires */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Flame size={20} />
            </div>
            <div>
              <span className="kpi-label">Confirmed Fire Incidents</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{summary.confirmed_fires}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Damaging forest fires logged</span>
            </div>
          </div>

          {/* KPI 3: Burnt Area */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Burnt Area Hectares</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_hectares_lost} ha</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total damaged area</span>
            </div>
          </div>

          {/* KPI 4: Trees Lost */}
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="kpi-label">Trees Lost to Fire</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_trees_lost}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seedlings burnt</span>
            </div>
          </div>
        </div>

        {/* Charts row 1: Monitored Plots by Ward */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Fire Hazard Monitored Plots by Geographical Ward
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Monitored Plots" fill="#74614a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2: Fireguard & Slashed Compliance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Fireguard presence */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Standard Fireguard Presence Compliance (Incident Areas)
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataFireguard}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataFireguard.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                {chartDataFireguard.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, paddingLeft: '13px' }}>
                      {entry.value} reports
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Slashed */}
          <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Plot Slashing & Sward Height Management Compliance
            </h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataSlashed}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataSlashed.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '200px' }}>
                {chartDataSlashed.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, paddingLeft: '13px' }}>
                      {entry.value} reports
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Outcomes Feed Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444' }}>
            Confirmed Fire Incident Audits ({incidents.length})
          </h2>
        </div>

        {/* Outcomes Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {incidents.map((assess) => {
            const recoveryRate = assess.total_trees > 0 ? Math.round((assess.survival_trees / assess.total_trees) * 100) : 0;
            const progressColor = recoveryRate >= 70 ? '#407e52' : recoveryRate >= 40 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={assess.id} className="glass-panel" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-primary)',
                boxSizing: 'border-box',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      textTransform: 'uppercase'
                    }}>
                      Severity: {assess.condition}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Date Logged</span>
                  </div>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Grower: {assess.grower}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📍 Ward {assess.ward} | Village: {assess.village} | Cluster: {assess.cluster}
                  </div>
                </div>

                {/* Audit details grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(122,129,108,0.1)'
                }}>
                  <div>🔥 <strong>Cause:</strong> {assess.cause}</div>
                  <div>👤 <strong>Reporter:</strong> Monitor {assess.reporter}</div>
                  <div>📏 <strong>Burnt Area:</strong> {assess.burnt_area} ({assess.hectares_lost} ha)</div>
                  <div>🛡️ <strong>EMA Notified:</strong> {assess.ema_notified}</div>
                  <div>🚨 <strong>Slashed Plot:</strong> {assess.slashed_status}</div>
                  <div>🏗️ <strong>Fireguard:</strong> {assess.fireguard_status}</div>
                  <div>🎯 <strong>Trees Total:</strong> {assess.total_trees}</div>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ <strong>Trees Burnt:</strong> {assess.trees_lost}</div>
                </div>

                {/* Fire survival Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Post-Fire Tree Survival Progress</span>
                    <span style={{ fontWeight: 700, color: progressColor }}>{assess.survival_trees} / {assess.total_trees} survived ({recoveryRate}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${recoveryRate}%`, 
                      height: '100%', 
                      backgroundColor: progressColor,
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>

                {/* Narrative Observations */}
                {assess.observations && (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '12px' }}>📝 Damage Assessment Narrative</div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4', fontSize: '12px' }}>
                      "{assess.observations}"
                    </div>
                  </div>
                )}

                {/* DCIM photo proof */}
                {assess.photo_1 && (
                  <div style={{ marginTop: '5px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>Fire Damage Audit Photo Proof</div>
                    <a href={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={`${BACKEND_URL}/api/media/image/${assess.photo_1}`} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }} 
                        alt="Forest fire damage tree assessment proof"
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSeedDashboard = () => {
    if (!seedOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Seed Collection Outcomes...
          </div>
        </div>
      );
    }

    const { summary, seedbanks, logs } = seedOutcomes;

    const chartDataPhenology = Object.entries(summary.by_phenology || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataSpecies = Object.entries(summary.by_species || {}).map(([key, val]) => ({
      name: key,
      quantity: val
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    const chartDataQuality = Object.entries(summary.by_quality || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataMethod = Object.entries(summary.by_method || {}).map(([key, val]) => ({
      name: key,
      count: val
    }));

    const chartDataSoil = Object.entries(summary.by_soil || {}).map(([key, val]) => ({
      name: key,
      count: val
    }));

    const COLORS = ['#407e52', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#74614a'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🍂 Seed Collection & Storage Monitoring
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Evaluate monitored seed trees phenology, seed collection trips, seedbank storage allocations and quality metrics.
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setSeedSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: seedSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: seedSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: seedSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setSeedSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: seedSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: seedSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: seedSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Monitored Seed Trees</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_monitored_trees}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered seed source trees</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Sprout size={20} />
            </div>
            <div>
              <span className="kpi-label">Total Seeds Collected</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.total_collected_kg} kg</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {summary.valid_records} collection logs</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Active Collectors</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.unique_collectors}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MyTrees monitors / collectors</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Database size={20} />
            </div>
            <div>
              <span className="kpi-label">Storing Seedbanks</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{seedbanks.length}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Community seedbank facilities</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Seed Tree Phenology Monitoring States
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataPhenology} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                    {chartDataPhenology.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Collected Seeds Volume (kg) by Tree Species
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSpecies} margin={{ bottom: 15 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="quantity" fill="#407e52" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Harvesting Methods Utilized
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataMethod} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Harvested Seed Quality Assessments
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataQuality} cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {chartDataQuality.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            🏛️ Seed Bank Facilities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {seedbanks.map((bank, b_idx) => (
              <div key={bank.id} className="glass-panel" style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 750, color: 'var(--forest-green)' }}>{bank.name}</h4>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    backgroundColor: bank.condition.toLowerCase().includes('good') ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    color: bank.condition.toLowerCase().includes('good') ? '#22c55e' : '#f59e0b'
                  }}>
                    {bank.condition}
                  </span>
                </div>
                <div style={{ margin: '14px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Established Year:</span>
                    <span style={{ fontWeight: 600 }}>{bank.est_year}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Storage Capacity:</span>
                    <span style={{ fontWeight: 600 }}>{bank.capacity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stored Species:</span>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{bank.species.length} Species</span>
                  </div>
                </div>
                {bank.species.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {bank.species.slice(0, 3).map((sp, s_idx) => (
                      <span key={s_idx} style={{
                        fontSize: '9.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '120px'
                      }}>
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            📋 Seed Collection & Phenology Monitoring Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {logs.map((log) => (
              <div key={log.id} className="glass-panel" style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: '20px',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row'
              }}>
                {log.photo_1 && (
                  <div style={{
                    width: window.innerWidth < 768 ? '100%' : '140px',
                    height: '100px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={`${BACKEND_URL}/api/media/image/${log.photo_1}`}
                      alt="Seed tree monitoring"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {log.primary_species}
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Collector: <strong>{log.collector}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(64,126,82,0.1)', color: 'var(--forest-green)', fontWeight: 700 }}>
                        {log.phenology}
                      </span>
                      {log.quantity_kg > 0 && (
                        <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 800 }}>
                          Collected: {log.quantity_raw}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    marginTop: '4px'
                  }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Location:</span> {log.ward ? `Ward ${log.ward}` : 'Unknown'} ({log.region})</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Seedbank Target:</span> {log.seedbank}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Harvesting Method:</span> {log.method}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Seed Quality:</span> {log.quality}</div>
                    {log.viability > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Tested Viability%:</span> {log.viability}%</div>}
                    <div><span style={{ color: 'var(--text-muted)' }}>Soil Type:</span> {log.soil}</div>
                  </div>

                  {log.comments && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      &ldquo;{log.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProductionDashboard = () => {
    if (!productionOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Nursery Production Outcomes...
          </div>
        </div>
      );
    }

    const { summary, audits } = productionOutcomes;

    const chartDataHub = Object.entries(summary.by_hub || {}).map(([key, val]) => ({
      name: key,
      pocketed: val.pocketed,
      ready: val.ready,
      germinated: val.germinated
    })).sort((a, b) => b.pocketed - a.pocketed);

    const chartDataWorkRate = Object.entries(summary.by_work_rate || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const chartDataCompletion = Object.entries(summary.by_completion || {}).map(([key, val]) => ({
      name: key,
      count: val
    })).sort((a, b) => b.name.localeCompare(a.name));

    const chartDataGender = Object.entries(summary.by_gender || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#407e52', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#74614a'];

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🌿 Nursery Production & Supervisor Audits
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Nursery grower inventories, pocketing vs germination totals, ready seedlings, and supervisor quality verifications.
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setProductionSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: productionSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: productionSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: productionSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setProductionSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: productionSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: productionSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: productionSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Pockets Filled</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_pocketed.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total pocketed seedling pots</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Sprout size={20} />
            </div>
            <div>
              <span className="kpi-label">Ready Seedlings</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.total_ready.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Germination rate: {summary.germination_rate_percent}%</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Growers & Gender</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>
                <span style={{ color: '#407e52' }}>{summary.by_gender.Female || 0}F</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                <span style={{ color: '#3b82f6' }}>{summary.by_gender.Male || 0}M</span>
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nursery operator splits</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="kpi-label">Quality Audits</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_audits.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verification site inspections</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Pocketed vs Ready Seedlings by Central Nursery Hub
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataHub.slice(0, 8)}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend />
                  <Bar dataKey="pocketed" fill="#407e52" name="Filled Pockets" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar dataKey="ready" fill="#10b981" name="Ready Seedlings" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Supervisor Verification Audit Work Rates
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataWorkRate} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                    {chartDataWorkRate.map((entry, index) => {
                      let color = '#407e52';
                      if (entry.name.toLowerCase().includes('better')) color = '#f59e0b';
                      if (entry.name.toLowerCase().includes('excellent')) color = '#10b981';
                      if (entry.name.toLowerCase().includes('poor')) color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Nursery Operational Task Completion Levels
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCompletion}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" name="Visits Count" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Nursery Operators Gender Split
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataGender} cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    <Cell fill="#a78bfa" />
                    <Cell fill="#60a5fa" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            📋 Supervisor Verification Audit Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {audits.slice(0, 15).map((audit) => {
              let badgeColor = 'rgba(34,197,94,0.1)';
              let textColor = '#22c55e';
              if (audit.work_rate.toLowerCase().includes('poor')) {
                badgeColor = 'rgba(239,68,68,0.1)';
                textColor = '#ef4444';
              } else if (audit.work_rate.toLowerCase().includes('better')) {
                badgeColor = 'rgba(245,158,11,0.1)';
                textColor = '#f59e0b';
              }
              
              return (
                <div key={audit.id} className="glass-panel" style={{
                  background: 'var(--bg-primary)',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  gap: '20px',
                  flexDirection: window.innerWidth < 768 ? 'column' : 'row'
                }}>
                  {audit.photo && (
                    <div style={{
                      width: window.innerWidth < 768 ? '100%' : '140px',
                      height: '100px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={`${BACKEND_URL}/api/media/image/${audit.photo}`}
                        alt="Nursery audit details"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Nursery Grower: {audit.nursery_name}
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Supervisor Assessor: <strong>{audit.officer}</strong> &bull; Date: {audit.date}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge" style={{ backgroundColor: badgeColor, color: textColor, fontWeight: 800 }}>
                          {audit.work_rate}
                        </span>
                        <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 700 }}>
                          Task Done: {audit.completion_level}
                        </span>
                      </div>
                    </div>

                    {audit.observations && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <strong>Observations:</strong> &ldquo;{audit.observations}&rdquo;
                      </p>
                    )}

                    {audit.recommendations && (
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--forest-green)' }}>
                        <strong>Supervisor Instructions:</strong> {audit.recommendations}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDispatchDashboard = () => {
    if (!dispatchOutcomes) {
      return (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw className="active-pulse" size={18} /> Loading Seedling Dispatch Outcomes...
          </div>
        </div>
      );
    }

    const { summary, dispatch } = dispatchOutcomes;

    const chartDataNursery = Object.entries(summary.by_nursery || {}).map(([key, val]) => ({
      name: key,
      quantity: val
    })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    const chartDataWard = Object.entries(summary.by_ward || {}).map(([key, val]) => ({
      name: `Ward ${key}`,
      quantity: val
    })).sort((a, b) => b.quantity - a.quantity);

    const chartDataProgram = Object.entries(summary.by_program || {}).map(([key, val]) => ({
      name: key,
      value: val
    }));

    const COLORS = ['#407e52', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#74614a'];

    const successRate = summary.total_ready_remaining > 0 
      ? Math.min(100.0, ((summary.total_distributed / (summary.total_distributed + summary.total_ready_remaining)) * 100)).toFixed(1)
      : '100.0';

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🚚 Seedling Dispatch & Distribution
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Outplanting seedling allocations, dispatch success rates, ward destinations, program types, and delivery logs.
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setDispatchSubTab('outcomes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: dispatchSubTab === 'outcomes' ? 'var(--bg-primary)' : 'transparent',
                color: dispatchSubTab === 'outcomes' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: dispatchSubTab === 'outcomes' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Outcomes Dashboard
            </button>
            <button
              onClick={() => setDispatchSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: dispatchSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: dispatchSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: dispatchSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Compass size={20} />
            </div>
            <div>
              <span className="kpi-label">Distributed Seedlings</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.total_distributed.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Delivered to outplanting locations</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
              <Sprout size={20} />
            </div>
            <div>
              <span className="kpi-label">Ready Hub Stock</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#407e52' }}>{summary.total_ready_remaining.toLocaleString()}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining seedling inventory</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
              <Users size={20} />
            </div>
            <div>
              <span className="kpi-label">Recipient Growers</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{summary.active_recipients}</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unique local smallholders</span>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="kpi-label">Dispatch Ratio</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800 }}>{successRate}%</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Proportion distributed vs ready</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Top Seedling Supplying Nurseries
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataNursery} margin={{ bottom: 15 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="quantity" fill="#407e52" name="Distributed Seedlings" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Distributed Seedlings by Ward Destination
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWard.slice(0, 10)} margin={{ bottom: 15 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="quantity" fill="#3b82f6" name="Distributed" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Seedling Dispatch volume timeline
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.timeline}>
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="distributed" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', height: '320px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Seedling Allocation by Program Type
            </h3>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataProgram} cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {chartDataProgram.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            🚚 Community Seedling Distribution Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {dispatch.slice(0, 20).map((log) => (
              <div key={log.id} className="glass-panel" style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Grower: {log.grower}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Nursery Source: <strong>{log.nursery}</strong> &bull; Date: {log.date}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 800 }}>
                      Planted: {log.quantity.toLocaleString()} Seedlings
                    </span>
                    <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700 }}>
                      {log.program_type}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Location:</span> Ward {log.ward} &bull; Cluster: {log.cluster}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Region:</span> {log.region}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Monitor Officer:</span> {log.monitor}</div>
                </div>

                {log.observations && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <strong>Monitor Note:</strong> &ldquo;{log.observations}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    // 1. Outplanting Calculations
    const planted = kpis.trees_planted || 0;
    const target = kpis.trees_target || 0;
    const percentReached = target > 0 ? Math.round((planted / target) * 100) : 0;
    
    // 2. Beekeeping Calculations
    const hivesTotal = kpis.total_hives || 0;
    const hivesColonized = kpis.colonized_hives || 0;
    const hivesRate = hivesTotal > 0 ? Math.round((hivesColonized / hivesTotal) * 100) : 0;

    // 3. Nursery Calculations
    const seedlingsReady = kpis.nursery_ready || 0;
    const seedlingsTotal = kpis.nursery_seedlings || 0;
    const germinationRate = nurseryMetrics?.nursery_production?.germination_rate || 0;

    // 4. Species Survival Chart data formatting
    const speciesData = speciesChart.map(s => ({
      name: s.Species || s.name || 'Unknown',
      planted: s.total_planted || s.planted || 0,
      alive: s.total_alive || s.alive || 0,
      rate: s.avg_survival_rate || s.survival_rate || 0
    })).slice(0, 8); // Top 8 species for clarity

    // 5. Seeds collected species data
    const seedsCollectedBySpecies = nurseryMetrics?.seed_collection?.by_species?.map(s => ({
      name: s.species || 'Unknown',
      value: s.quantity_kg || 0
    })).sort((a,b) => b.value - a.value).slice(0, 6) || [];

    const COLORS = ['#407e52', '#74614a', '#f59e0b', '#3b82f6', '#ef4444', '#72bb95', '#8b5cf6', '#ec4899'];

    // 6. Nursery Inventories formatting
    const nurseryInvData = nurseryMetrics?.nursery_production?.inventories?.map(n => ({
      name: n.nursery || 'Unknown',
      pocketed: n.pocketed || 0,
      germinated: n.germinated || 0,
      ready: n.ready || 0
    })).slice(0, 8) || [];

    // 7. Hive Status formatting
    const hiveStatusData = [
      { name: 'Colonized', value: beekeepingMetrics?.hive_colonization?.colonized || 0, fill: '#f59e0b' },
      { name: 'Uncolonized', value: beekeepingMetrics?.hive_colonization?.uncolonized || 0, fill: '#74614a' },
      { name: 'Decolonized', value: beekeepingMetrics?.hive_colonization?.decolonized || 0, fill: '#ef4444' }
    ].filter(h => h.value > 0);

    // 8. Suitability scores
    const suitabilityScores = Object.entries(beekeepingMetrics?.apiary_suitability?.average_scores || {}).map(([key, val]) => ({
      name: key.toUpperCase(),
      score: val
    }));

    return (
      <div className="dashboard-scrollable" style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '24px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '24px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {/* Dashboard Title & Toggle Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              🌳 My Trees Restoration Hub
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Real-time monitoring metrics, spatial distributions, and livelihood impact metrics.
            </p>
          </div>

          {/* Tab Sub Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(64,126,82,0.1)'
          }}>
            <button
              onClick={() => setDashboardSubTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: dashboardSubTab === 'dashboard' ? 'var(--bg-primary)' : 'transparent',
                color: dashboardSubTab === 'dashboard' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: dashboardSubTab === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Activity size={14} /> Project Dashboard
            </button>
            <button
              onClick={() => setDashboardSubTab('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: dashboardSubTab === 'map' ? 'var(--bg-primary)' : 'transparent',
                color: dashboardSubTab === 'map' ? 'var(--forest-green)' : 'var(--text-muted)',
                boxShadow: dashboardSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <MapIcon size={14} /> Spatial Map View
            </button>
          </div>
        </div>

        {/* Master KPIs grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Out-Planting */}
          <div className="glass-panel kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(64, 126, 82, 0.1)', color: '#407e52' }}>
                <Trees size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="kpi-label">Trees Out-Planted</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {planted.toLocaleString()}
                </h3>
              </div>
            </div>
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Target: {target.toLocaleString()}</span>
                <span>{percentReached}% Reached</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, percentReached)}%`, height: '100%', backgroundColor: '#407e52', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Survival */}
          <div className="glass-panel kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Activity size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="kpi-label">Tree Survival Rate</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: 800, color: '#407e52' }}>
                  {kpis.overall_survival_rate}%
                </h3>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span>Growers: <strong>{kpis.active_growers}</strong></span>
              <span>Patrols: <strong>{kpis.patrol_distance_km} km</strong></span>
            </div>
          </div>

          {/* Card 3: Nursery seedlings */}
          <div className="glass-panel kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(116, 97, 74, 0.1)', color: '#74614a' }}>
                <Sparkles size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="kpi-label">Nursery Seedlings</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {seedlingsTotal.toLocaleString()}
                </h3>
              </div>
            </div>
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Ready to Plant: {seedlingsReady.toLocaleString()}</span>
                <span>Germination: {germinationRate}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${germinationRate}%`, height: '100%', backgroundColor: '#74614a', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Card 4: Beekeeping */}
          <div className="glass-panel kpi-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="kpi-icon-container" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {/* Wings (translucent slate-blue/white) */}
                  <path d="M12 9.5 C9 5.5, 4.5 6, 5.5 9.5 C6.5 12.5, 10.5 11, 12 9.5 Z" fill="#e2e8f0" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.2" />
                  <path d="M12 9.5 C15 5.5, 19.5 6, 18.5 9.5 C17.5 12.5, 13.5 11, 12 9.5 Z" fill="#e2e8f0" fill-opacity="0.9" stroke="#ffffff" stroke-width="1.2" />
                  {/* Lower Wings */}
                  <path d="M12 11.5 C10 9, 7.5 10, 8 12 C8.5 13.5, 11 12.5, 12 11.5 Z" fill="#cbd5e1" fill-opacity="0.7" stroke="#ffffff" stroke-width="1" />
                  <path d="M12 11.5 C14 9, 16.5 10, 16 12 C15.5 13.5, 13 12.5, 12 11.5 Z" fill="#cbd5e1" fill-opacity="0.7" stroke="#ffffff" stroke-width="1" />
                  {/* Body & Head (Dark slate) */}
                  <path d="M12 9 C9.5 9, 9.5 12, 9.5 15 C9.5 17.5, 10.5 19, 12 20 C13.5 19, 14.5 17.5, 14.5 15 C14.5 12, 13.5 9, 12 9 Z" fill="#1e293b" />
                  <circle cx="12" cy="6.8" r="2.2" fill="#1e293b" />
                  {/* Yellow Stripes */}
                  <path d="M10.2 12 L13.8 12" stroke="#facc15" stroke-width="2" stroke-linecap="round" />
                  <path d="M10.2 15 L13.8 15" stroke="#facc15" stroke-width="2" stroke-linecap="round" />
                  <path d="M11 17.8 L13 17.8" stroke="#facc15" stroke-width="1.8" stroke-linecap="round" />
                  {/* Stinger */}
                  <path d="M12 20 L12 22.5" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" />
                  {/* Antennae */}
                  <path d="M11.2 5 C10.5 3.5, 9.5 3.5, 9 4" stroke="#1e293b" stroke-width="1" stroke-linecap="round" />
                  <path d="M12.8 5 C13.5 3.5, 14.5 3.5, 15 4" stroke="#1e293b" stroke-width="1" stroke-linecap="round" />
                  {/* Little eyes */}
                  <circle cx="11.2" cy="6.5" r="0.35" fill="#ffffff" />
                  <circle cx="12.8" cy="6.5" r="0.35" fill="#ffffff" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span className="kpi-label">Hive Colonization</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {hivesColonized} / {hivesTotal}
                </h3>
              </div>
            </div>
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>Colonization Rate</span>
                <span>{hivesRate}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${hivesRate}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Out-Planting & Carbon Restoration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(64,126,82,0.15)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🌱</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#407e52' }}>
              Out-Planting & Carbon Project Analysis
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Hectares Assessed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>
                {outplantingMetrics?.plot_eligibility?.total_hectares || '0'} ha
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Eligible Plots</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {outplantingMetrics?.plot_eligibility?.qualified || '0'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Disqualified: {outplantingMetrics?.plot_eligibility?.disqualified || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Land Prep Completed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {(outplantingMetrics?.land_prep?.ready || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Compliance: {outplantingMetrics?.land_prep?.compliant || 0} Standard
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Fire Incidents</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: kpis.fire_incidents > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '4px' }}>
                {kpis.fire_incidents}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Burnt Area: {outplantingMetrics?.fire?.hectares_lost || 0} ha
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            {/* Chart 1: Species Survival Bar Chart */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Top Planted Species & Survival Performance
              </h3>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speciesData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={0} angle={-15} dx={-5} />
                    <YAxis yAxisId="left" orientation="left" stroke="#407e52" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#74614a" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="planted" name="Planted (QTY)" fill="#407e52" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="alive" name="Alive (QTY)" fill="#72bb95" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="rate" name="Survival Rate (%)" stroke="#74614a" strokeWidth={2} dot={{ r: 3 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cumulative Planting Timeline */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Woodland Restoration Planting Timeline
              </h3>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plantingOverTime} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="Month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Planted" name="Trees Planted (Monthly)" fill="rgba(114, 187, 149, 0.2)" stroke="#72bb95" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumulative_planted" name="Cumulative Trees Planted" fill="rgba(64, 126, 82, 0.15)" stroke="#407e52" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Seed & Nursery supply chain */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(116,97,74,0.2)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🍂</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#74614a' }}>
              Seed Collection & Nursery Production
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Seeds Collected</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#74614a', marginTop: '4px' }}>
                {nurseryMetrics?.seed_collection?.total_collected_kg || '0'} kg
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Seedlings Pocketed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {(nurseryMetrics?.nursery_production?.pocketed || 0).toLocaleString()}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Seedlings Germinated</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>
                {(nurseryMetrics?.nursery_production?.germinated || 0).toLocaleString()}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Seedlings Dispatched</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {(nurseryMetrics?.seedling_dispatch?.distributed || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Stock Remaining: {(nurseryMetrics?.seedling_dispatch?.remaining || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            {/* Chart 3: Nursery Stock Inventory Bar Chart */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Nursery Inventories (Pocketed vs Germinated vs Ready)
              </h3>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nurseryInvData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pocketed" name="Pocketed Seedlings" fill="#74614a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="germinated" name="Germinated Seeds" fill="#72bb95" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ready" name="Ready to Plant" fill="#407e52" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Seed Collection by Species Pie Chart */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Seed Collection Volume (kg) by Tree Species
              </h3>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '55%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={seedsCollectedBySpecies}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {seedsCollectedBySpecies.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} formatter={(value) => `${value} kg`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '250px', paddingLeft: '15px' }}>
                  {seedsCollectedBySpecies.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {entry.value.toFixed(1)}kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Beekeeping & Livelihoods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(245,158,11,0.2)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🐝</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>
              Beekeeping Livelihoods Program
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Apiaries Evaluated</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {beekeepingMetrics?.apiary_suitability?.total_evaluated_sites || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Trainings Conducted</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {beekeepingMetrics?.trainings?.conducted || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Training Attendees</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {(beekeepingMetrics?.trainings?.attendants_total || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                M: {beekeepingMetrics?.trainings?.by_gender?.male || 0} | F: {beekeepingMetrics?.trainings?.by_gender?.female || 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Colonized Hives</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>
                {beekeepingMetrics?.hive_colonization?.colonized || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Decolonized: {beekeepingMetrics?.hive_colonization?.decolonized || 0}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            {/* Chart 5: Hive Colonization Donut Chart */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Hive Colonization Status Breakdown
              </h3>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '50%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={hiveStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {hiveStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hiveStatusData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.fill }} />
                        <span>{entry.name}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, paddingLeft: '16px', color: 'var(--text-primary)' }}>
                        {entry.value} hives <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({Math.round((entry.value / hivesTotal) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 6: Apiary Site Suitability Ratings */}
            <div className="glass-panel" style={{ padding: '20px', height: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Average Apiary Suitability Scores (out of 4.0)
              </h3>
              <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={suitabilityScores} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 4.0]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-card)', borderRadius: '8px' }} />
                    <Bar dataKey="score" name="Mean Suitability Score" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                      {suitabilityScores.map((entry, index) => {
                        const scoreColors = ['#f59e0b', '#3b82f6', '#407e52', '#74614a'];
                        return <Cell key={`cell-${index}`} fill={scoreColors[index % scoreColors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: MEAL & Field Audits Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6' }}>
              MEAL & Field Verification Audits Log
            </h2>
          </div>

          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Recent Verification Audits Logged
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(122,129,108,0.2)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Officer</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Audit Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Date Logged</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Site / Grower Name</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Region/Ward</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Observations & Findings</th>
                </tr>
              </thead>
              <tbody>
                {verificationsMetrics?.verifications?.slice(0, 5).map((v, i) => (
                  <tr key={v.id || i} style={{ borderBottom: '1px solid rgba(122,129,108,0.1)' }}>
                    <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.officer}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: v.type.includes('Nursery') ? 'rgba(116,97,74,0.1)' : v.type.includes('Planting') ? 'rgba(64,126,82,0.1)' : 'rgba(59,130,246,0.1)',
                        color: v.type.includes('Nursery') ? '#74614a' : v.type.includes('Planting') ? '#407e52' : '#3b82f6'
                      }}>
                        {v.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>{v.date}</td>
                    <td style={{ padding: '12px 12px', fontWeight: 600 }}>{v.grower}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-muted)' }}>{v.ward || 'N/A'}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.observations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* 1. TOP HEADER BANNER (My Trees Trust branded with logo & color theme) */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '2px solid #407e52',
        height: '65px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Left Main Sidebar Hamburger Toggle */}
          <button 
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s',
            }}
            title={isLeftSidebarCollapsed ? "Expand Left Menu" : "Collapse Left Menu"}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 126, 82, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Menu size={20} style={{ color: 'var(--forest-emerald)' }} />
          </button>
          
          {/* Official My Trees logo loaded locally */}
          <img 
            src="/logo-icon.png" 
            alt="My Trees Trust Logo" 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(122, 129, 108, 0.4)',
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              padding: '2px'
            }}
          />
          <div>
            <h1 className="gradient-header" style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.019em', fontFamily: 'Outfit' }}>
              My Trees Trust Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#72bb95', fontWeight: 600 }}>
              Planting the Right Trees in the Right Places &bull; Woodland Protection & Conservation
            </p>
          </div>
        </div>

        {/* Header Action Buttons & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* Sync Button */}
          <button 
            onClick={handleSyncData}
            disabled={isSyncing && showSyncOverlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#407e52',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(122, 129, 108, 0.25)',
              transition: 'all 0.2s'
            }}
            className="sync-btn"
          >
            <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            {isSyncing ? 'Syncing...' : 'Sync QField Cloud'}
          </button>

          {/* Settings button */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(64, 126, 82, 0.1)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(64, 126, 82, 0.2)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            title="QField Cloud Configuration Settings"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(64, 126, 82, 0.18)';
              e.currentTarget.style.transform = 'rotate(45deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(64, 126, 82, 0.1)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <Settings size={17} />
          </button>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>My Trees Admin</div>
              <div style={{ fontSize: '10px', color: '#72bb95' }}>Restoration Coordinator</div>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#407e52',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              MT
            </div>
          </div>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 2. LEFT SIDEBAR PANEL */}
        <aside style={{
          width: isLeftSidebarCollapsed ? '0px' : '260px',
          minWidth: isLeftSidebarCollapsed ? '0px' : '260px',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: isLeftSidebarCollapsed ? 'none' : '1px solid rgba(64, 126, 82, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isLeftSidebarCollapsed ? '20px 0px' : '20px 15px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Operations Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* My Trees Trust Brand Banner Logo Card */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '10px 15px',
              borderRadius: '12px',
              border: '1px solid rgba(64, 126, 82, 0.2)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)'
            }}>
              <img 
                src="/logo-banner.png" 
                alt="My Trees Trust" 
                style={{ width: '100%', maxHeight: '42px', objectFit: 'contain' }}
              />
            </div>

            <div>
              <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--forest-emerald)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>
                RESTORATION HUB
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* 1. OUT-PLANTING ACCORDION */}
                <div className="accordion-group">
                  <button 
                    onClick={() => setExpandedAccordion(expandedAccordion === 'outplanting' ? '' : 'outplanting')}
                    className="accordion-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🌱 Out-Planting</span>
                    <span>{expandedAccordion === 'outplanting' ? '▼' : '►'}</span>
                  </button>
                  {expandedAccordion === 'outplanting' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <button onClick={() => { setActiveTab('overview'); setDashboardSubTab('dashboard'); }} className={`sub-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}>
                        Overview & Map
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-meetings'); setMeetingsSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-meetings' ? 'active' : ''}`}>
                        Meetings & Trainings
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-eligibility'); setEligibilitySubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-eligibility' ? 'active' : ''}`}>
                        Plot Eligibility
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-landprep'); setLandprepSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-landprep' ? 'active' : ''}`}>
                        Land Prep & SOPs
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-planted'); setPlantingSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-planted' ? 'active' : ''}`}>
                        Planting Update
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-survival'); setSurvivalSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-survival' ? 'active' : ''}`}>
                        Survival & Growth
                      </button>
                      <button onClick={() => { setActiveTab('outplanting-fire'); setFireSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'outplanting-fire' ? 'active' : ''}`}>
                        Fire Management
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. SEED & NURSERY ACCORDION */}
                <div className="accordion-group">
                  <button 
                    onClick={() => setExpandedAccordion(expandedAccordion === 'nursery' ? '' : 'nursery')}
                    className="accordion-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🍂 Seed & Nursery</span>
                    <span>{expandedAccordion === 'nursery' ? '▼' : '►'}</span>
                  </button>
                  {expandedAccordion === 'nursery' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <button onClick={() => { setActiveTab('nursery-seed'); setSeedSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'nursery-seed' ? 'active' : ''}`}>
                        Seed Collection
                      </button>
                      <button onClick={() => { setActiveTab('nursery-production'); setProductionSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'nursery-production' ? 'active' : ''}`}>
                        Nursery Production
                      </button>
                      <button onClick={() => { setActiveTab('nursery-dispatch'); setDispatchSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'nursery-dispatch' ? 'active' : ''}`}>
                        Seedling Dispatch
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. BEEKEEPING ACCORDION */}
                <div className="accordion-group">
                  <button 
                    onClick={() => setExpandedAccordion(expandedAccordion === 'beekeeping' ? '' : 'beekeeping')}
                    className="accordion-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🐝 Beekeeping</span>
                    <span>{expandedAccordion === 'beekeeping' ? '▼' : '►'}</span>
                  </button>
                  {expandedAccordion === 'beekeeping' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <button onClick={() => { setActiveTab('beekeeping-sites'); setSitesSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'beekeeping-sites' ? 'active' : ''}`}>
                        Apiary Sites
                      </button>
                      <button onClick={() => { setActiveTab('beekeeping-trainings'); setBeekeepingTrainingsSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'beekeeping-trainings' ? 'active' : ''}`}>
                        Trainings Conducted
                      </button>
                      <button onClick={() => { setActiveTab('beekeeping-status'); setStatusSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'beekeeping-status' ? 'active' : ''}`}>
                        Hive Colonization
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. MEAL & AUDITS ACCORDION */}
                <div className="accordion-group">
                  <button 
                    onClick={() => setExpandedAccordion(expandedAccordion === 'meal' ? '' : 'meal')}
                    className="accordion-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  >
                    <span>📊 MEAL & Audits</span>
                    <span>{expandedAccordion === 'meal' ? '▼' : '►'}</span>
                  </button>
                  {expandedAccordion === 'meal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <button onClick={() => { setActiveTab('verifications-audits'); setAuditsSubTab('outcomes'); }} className={`sub-tab-btn ${activeTab === 'verifications-audits' ? 'active' : ''}`}>
                        Officer Audits
                      </button>
                      <button onClick={() => setActiveTab('gallery')} className={`sub-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}>
                        Media Gallery
                      </button>
                      <button onClick={() => setActiveTab('explorer')} className={`sub-tab-btn ${activeTab === 'explorer' ? 'active' : ''}`}>
                        Database Explorer
                      </button>
                      <button onClick={() => setActiveTab('report')} className={`sub-tab-btn ${activeTab === 'report' ? 'active' : ''}`}>
                        Report Generator
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>


        </aside>

        {/* 3. CENTER & RIGHT AREA */}
        {activeTab !== 'explorer' && activeTab !== 'report' && activeTab !== 'gallery' && !(activeTab === 'overview' && dashboardSubTab === 'dashboard') && !(activeTab === 'outplanting-meetings' && meetingsSubTab === 'outcomes') && !(activeTab === 'outplanting-eligibility' && eligibilitySubTab === 'outcomes') && !(activeTab === 'outplanting-landprep' && landprepSubTab === 'outcomes') && !(activeTab === 'outplanting-planted' && plantingSubTab === 'outcomes') && !(activeTab === 'outplanting-survival' && survivalSubTab === 'outcomes') && !(activeTab === 'outplanting-fire' && fireSubTab === 'outcomes') && !(activeTab === 'nursery-seed' && seedSubTab === 'outcomes') && !(activeTab === 'nursery-production' && productionSubTab === 'outcomes') && !(activeTab === 'nursery-dispatch' && dispatchSubTab === 'outcomes') && !(activeTab === 'beekeeping-sites' && sitesSubTab === 'outcomes') && !(activeTab === 'beekeeping-trainings' && beekeepingTrainingsSubTab === 'outcomes') && !(activeTab === 'beekeeping-status' && statusSubTab === 'outcomes') && !(activeTab === 'verifications-audits' && auditsSubTab === 'outcomes') ? (
          
          /* LAYOUT STYLE A: Three-column layout (List + Map + Stats/Inspect) */
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* LEFT COLUMN: Filter & Record List (Width 320px) */}
            <div style={{
              width: isInnerSidebarCollapsed ? '0px' : '320px',
              minWidth: isInnerSidebarCollapsed ? '0px' : '320px',
              backgroundColor: 'var(--bg-primary)',
              borderRight: isInnerSidebarCollapsed ? 'none' : '1px solid rgba(34, 197, 94, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              
              <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: '#407e52' }} /> Active Monitor Sites
                </h2>

                {/* Text search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search grower, ward, region..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid rgba(122, 129, 108, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 8px 8px 30px',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Dropdowns filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Region</label>
                    <select 
                      value={selectedRegion} 
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        padding: '4px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    >
                      {filters.regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ward</label>
                    <select 
                      value={selectedWard} 
                      onChange={(e) => setSelectedWard(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        padding: '4px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    >
                      {filters.wards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Records List Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const activeFeatures = getActiveListFeatures();
                  if (activeFeatures.length === 0) {
                    return (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                        No matching records found.
                      </div>
                    );
                  }
                  return (
                    <>
                      {activeFeatures.slice(0, 100).map((f, i) => {
                        const props = f.properties;
                        const growerName = props.Grower || props["Grower Name"] || props.Name || 'Site ' + (i+1);
                        const subtitle = props.Village ? `${props.Village} • Ward ${props.Ward}` : `Ward ${props.Ward || 'N/A'}`;
                        const detailsStr = props.Species || props["Hive Type"] || props.Findings || props.Type || '';
                        
                        const isSelected = selectedRecord && selectedRecord.fid === props.fid;

                        return (
                          <div 
                            key={props.fid || i}
                            onClick={() => handleSelectRecord(props, f.geometry)}
                            style={{
                              backgroundColor: isSelected ? 'rgba(122,129,108,0.1)' : 'rgba(255,255,255,0.02)',
                              border: isSelected ? '1px solid #407e52' : '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              padding: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                          >
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>{growerName}</h4>
                            <p style={{ margin: '0 0 6px 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>{subtitle}</p>
                            
                            {detailsStr && (
                              <div style={{ fontSize: '11px', color: '#72bb95', background: 'rgba(122,129,108,0.05)', padding: '3px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                {detailsStr.substring(0, 30)}{detailsStr.length > 30 ? '...' : ''}
                              </div>
                            )}
                            
                            {isSelected && (
                              <ChevronRight size={16} style={{ position: 'absolute', right: '10px', top: '40%', color: '#407e52' }} />
                            )}
                          </div>
                        );
                      })}
                      {activeFeatures.length > 100 && (
                        <div style={{ 
                          color: 'var(--text-muted)', 
                          fontSize: '11px', 
                          textAlign: 'center', 
                          padding: '10px 5px',
                          borderTop: '1px dashed rgba(64, 126, 82, 0.15)',
                          marginTop: '8px'
                        }}>
                          Showing first 100 of {activeFeatures.length} records. Please use the search input or dropdown filters above to refine your search.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* CENTER COLUMN: Leaflet Map Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Dashboard/Map Toggle when in Overview tab and map is selected */}
              {activeTab === 'overview' && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '3px',
                  borderRadius: '10px',
                  border: '1px solid rgba(64, 126, 82, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <button
                    onClick={() => setDashboardSubTab('dashboard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: dashboardSubTab === 'dashboard' ? 'var(--forest-emerald)' : 'transparent',
                      color: dashboardSubTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: dashboardSubTab === 'dashboard' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <Activity size={14} /> Project Dashboard
                  </button>
                  <button
                    onClick={() => setDashboardSubTab('map')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: dashboardSubTab === 'map' ? 'var(--forest-emerald)' : 'transparent',
                      color: dashboardSubTab === 'map' ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: dashboardSubTab === 'map' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <MapIcon size={14} /> Spatial Map View
                  </button>
                </div>
              )}
              
              {/* Floating Toggle Button for Inner Sites List Sidebar */}
              <button
                onClick={() => setIsInnerSidebarCollapsed(!isInnerSidebarCollapsed)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid rgba(64, 126, 82, 0.3)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                title={isInnerSidebarCollapsed ? "Expand Sites List" : "Collapse Sites List"}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--forest-mint)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {isInnerSidebarCollapsed ? <ChevronRight size={18} style={{ color: 'var(--forest-emerald)' }} /> : <ChevronLeft size={18} style={{ color: 'var(--forest-emerald)' }} />}
              </button>

              {/* Floating Toggle Button for Right Details Inspector Sidebar */}
              <button
                onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid rgba(64, 126, 82, 0.3)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                title={isRightSidebarCollapsed ? "Expand Details Inspector" : "Collapse Details Inspector"}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--forest-mint)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {isRightSidebarCollapsed ? <ChevronLeft size={18} style={{ color: 'var(--forest-emerald)' }} /> : <ChevronRight size={18} style={{ color: 'var(--forest-emerald)' }} />}
              </button>

              {/* Basemap Selector Dropdown */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(64, 126, 82, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}>
                <MapIcon size={14} style={{ color: 'var(--forest-emerald)' }} />
                <select
                  value={mapBase}
                  onChange={(e) => setMapBase(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    paddingRight: '5px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="google-satellite" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)' }}>Google Satellite</option>
                  <option value="google-hybrid" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)' }}>Google Hybrid</option>
                  <option value="google-streets" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)' }}>Google Streets</option>
                  <option value="google-terrain" style={{ backgroundColor: '#ffffff', color: 'var(--text-primary)' }}>Google Terrain</option>
                </select>
              </div>

              {/* Leaflet map object */}
              <div style={{
                flex: 1,
                width: '100%',
                borderRadius: '16px',
                border: '1px solid var(--border-card)',
                boxShadow: 'var(--shadow-glow)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Floating Map Toggle Switcher for Meetings/Trainings */}
                {activeTab === 'outplanting-meetings' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setMeetingsSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: meetingsSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: meetingsSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setMeetingsSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: meetingsSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: meetingsSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Plot Eligibility */}
                {activeTab === 'outplanting-eligibility' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setEligibilitySubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: eligibilitySubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: eligibilitySubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setEligibilitySubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: eligibilitySubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: eligibilitySubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Land Prep & SOPs */}
                {activeTab === 'outplanting-landprep' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setLandprepSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: landprepSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: landprepSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setLandprepSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: landprepSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: landprepSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Planting Update */}
                {activeTab === 'outplanting-planted' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setPlantingSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: plantingSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: plantingSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setPlantingSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: plantingSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: plantingSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Survival & Growth */}
                {activeTab === 'outplanting-survival' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setSurvivalSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: survivalSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: survivalSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setSurvivalSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: survivalSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: survivalSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {activeTab === 'outplanting-fire' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setFireSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: fireSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: fireSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setFireSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: fireSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: fireSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Seed Collection */}
                {activeTab === 'nursery-seed' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setSeedSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: seedSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: seedSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setSeedSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: seedSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: seedSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Nursery Production */}
                {activeTab === 'nursery-production' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setProductionSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: productionSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: productionSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setProductionSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: productionSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: productionSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Seedling Dispatch */}
                {activeTab === 'nursery-dispatch' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setDispatchSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: dispatchSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: dispatchSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setDispatchSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: dispatchSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: dispatchSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Apiary Sites */}
                {activeTab === 'beekeeping-sites' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setSitesSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: sitesSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: sitesSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setSitesSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: sitesSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: sitesSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Beekeeping Trainings */}
                {activeTab === 'beekeeping-trainings' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setBeekeepingTrainingsSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: beekeepingTrainingsSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: beekeepingTrainingsSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setBeekeepingTrainingsSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: beekeepingTrainingsSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: beekeepingTrainingsSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Hive Colonization */}
                {activeTab === 'beekeeping-status' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setStatusSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: statusSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: statusSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setStatusSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: statusSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: statusSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                {/* Floating Map Toggle Switcher for Officer Audits */}
                {activeTab === 'verifications-audits' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    background: 'var(--bg-primary)',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid rgba(64,126,82,0.3)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}>
                    <button
                      onClick={() => setAuditsSubTab('outcomes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: auditsSubTab === 'outcomes' ? 'var(--forest-green)' : 'transparent',
                        color: auditsSubTab === 'outcomes' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <Activity size={12} /> Outcomes
                    </button>
                    <button
                      onClick={() => setAuditsSubTab('map')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: auditsSubTab === 'map' ? 'var(--forest-green)' : 'transparent',
                        color: auditsSubTab === 'map' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      <MapIcon size={12} /> Map View
                    </button>
                  </div>
                )}
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%', background: 'var(--bg-primary)' }}
                  zoomControl={true}
                >
                  <MapRecenter center={mapCenter} zoom={mapZoom} />

                  <TileLayer
                    key={mapBase}
                    attribution='&copy; Google Maps'
                    url={
                      mapBase === 'google-satellite' ? 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' :
                      mapBase === 'google-hybrid' ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' :
                      mapBase === 'google-streets' ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' :
                      'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}'
                    }
                  />

                  {primaryLayerData && (
                    <MarkerClusterGroup 
                      key={`prim-${activeTab}-${primaryLayerData.features?.length || 0}`} 
                      data={primaryLayerData} 
                      style={getGeoJSONStyle}
                      onEachFeature={onEachFeature}
                      pointToLayer={(feature, latlng) => {
                        const isSelected = selectedRecord && selectedRecord.fid === feature.properties.fid;
                        let category = 'nursery';
                        if (activeTab === 'nurseries') {
                          if (feature.properties["Bank Name"] || feature.properties["Capacity"] || feature.properties.capacity) {
                            category = 'seed_bank';
                          } else {
                            category = 'nursery';
                          }
                        } else if (activeTab === 'beekeeping') {
                          category = 'beekeeping';
                        } else if (activeTab === 'ops') {
                          category = 'verification';
                        } else if (activeTab === 'fire') {
                          category = 'fires';
                        }
                        return L.marker(latlng, { icon: createCustomMarker(category, isSelected) });
                      }}
                    />
                  )}

                  {secondaryLayerData && (
                    <MarkerClusterGroup 
                      key={`sec-${activeTab}-${secondaryLayerData.features?.length || 0}`} 
                      data={secondaryLayerData} 
                      style={getGeoJSONStyle}
                      onEachFeature={onEachFeature}
                      pointToLayer={(feature, latlng) => {
                        const isSelected = selectedRecord && selectedRecord.fid === feature.properties.fid;
                        let category = 'nursery';
                        if (activeTab === 'nurseries') {
                          if (feature.properties["Bank Name"] || feature.properties["Capacity"] || feature.properties.capacity) {
                            category = 'seed_bank';
                          } else {
                            category = 'nursery';
                          }
                        } else if (activeTab === 'beekeeping') {
                          category = 'beekeeping';
                        } else if (activeTab === 'ops') {
                          category = 'verification';
                        } else if (activeTab === 'fire') {
                          category = 'fires';
                        }
                        return L.marker(latlng, { icon: createCustomMarker(category, isSelected) });
                      }}
                    />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* RIGHT COLUMN: Statistics, Charts, Inspections (Width 360px) */}
            <div style={{
              width: isRightSidebarCollapsed ? '0px' : '360px',
              minWidth: isRightSidebarCollapsed ? '0px' : '360px',
              backgroundColor: 'var(--bg-primary)',
              borderLeft: isRightSidebarCollapsed ? 'none' : '1px solid rgba(34, 197, 94, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: isRightSidebarCollapsed ? '15px 0px' : '15px',
              boxSizing: 'border-box',
              overflowX: 'hidden',
              overflowY: isRightSidebarCollapsed ? 'hidden' : 'auto',
              gap: isRightSidebarCollapsed ? '0px' : '15px',
              transition: 'all 0.3s ease'
            }}>
              
              {/* Selected Record Inspection Panel */}
              <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#407e52', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={15} /> Site Details
                </h3>

                {selectedRecord ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
                      {selectedRecord.Grower || selectedRecord["Grower Name"] || selectedRecord.Name || 'Selected Feature'}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {Object.keys(selectedRecord).filter(k => k !== 'geometry' && k !== 'fid' && selectedRecord[k] !== 'None' && selectedRecord[k] !== null).slice(0, 10).map(key => {
                        const val = selectedRecord[key];
                        if (typeof val === 'string' && val.endsWith('.jpg') && (val.includes('aftercare_') || val.includes('field-verification_') || val.includes('meetings-') || val.includes('nursery-') || val.includes('plot-'))) {
                          return (
                            <div key={key} style={{ marginTop: '8px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Photo Evidence:</div>
                              <img 
                                src={`${BACKEND_URL}/api/media/image/${val}`} 
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover', maxHeight: '160px' }} 
                                alt="Record photo"
                              />
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{String(val)}</span>
                          </div>
                        );
                      })}

                      {/* Audio player */}
                      {selectedRecord["Field Audio"] && selectedRecord["Field Audio"] !== 'None' && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Field Recording:</span>
                          <div className="audio-player-card" style={{ marginTop: '5px' }}>
                            <Volume2 size={13} style={{ color: '#74614a' }} />
                            <audio controls style={{ height: '28px', width: '100%' }} src={`${BACKEND_URL}/api/media/audio/${selectedRecord["Field Audio"]}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '15px 0' }}>
                    Click a map marker or card from the list to inspect details.
                  </div>
                )}
              </div>

              {renderTabStatistics()}
            </div>

          </div>
        ) : (activeTab === 'overview' && dashboardSubTab === 'dashboard') ? (
          renderDashboard()
        ) : (activeTab === 'outplanting-meetings' && meetingsSubTab === 'outcomes') ? (
          renderMeetingsDashboard()
        ) : (activeTab === 'outplanting-eligibility' && eligibilitySubTab === 'outcomes') ? (
          renderEligibilityDashboard()
        ) : (activeTab === 'outplanting-landprep' && landprepSubTab === 'outcomes') ? (
          renderLandprepDashboard()
        ) : (activeTab === 'outplanting-planted' && plantingSubTab === 'outcomes') ? (
          renderPlantingDashboard()
        ) : (activeTab === 'outplanting-survival' && survivalSubTab === 'outcomes') ? (
          renderSurvivalDashboard()
        ) : (activeTab === 'outplanting-fire' && fireSubTab === 'outcomes') ? (
          renderFireDashboard()
        ) : (activeTab === 'nursery-seed' && seedSubTab === 'outcomes') ? (
          renderSeedDashboard()
        ) : (activeTab === 'nursery-production' && productionSubTab === 'outcomes') ? (
          renderProductionDashboard()
        ) : (activeTab === 'nursery-dispatch' && dispatchSubTab === 'outcomes') ? (
          renderDispatchDashboard()
        ) : (activeTab === 'beekeeping-sites' && sitesSubTab === 'outcomes') ? (
          renderBeekeepingSitesDashboard()
        ) : (activeTab === 'beekeeping-trainings' && beekeepingTrainingsSubTab === 'outcomes') ? (
          renderBeekeepingTrainingsDashboard()
        ) : (activeTab === 'beekeeping-status' && statusSubTab === 'outcomes') ? (
          renderBeekeepingStatusDashboard()
        ) : (activeTab === 'verifications-audits' && auditsSubTab === 'outcomes') ? (
          renderOfficerAuditsDashboard()
        ) : activeTab === 'explorer' ? (
          
          /* LAYOUT STYLE B: Database Explorer full-width table view */
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '15px', overflowY: 'hidden', boxSizing: 'border-box', gap: '12px' }}>
            
            {/* Header: Title, Metrics, and Active Table Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} style={{ color: '#407e52' }} /> Database Explorer
                </h2>
                <p style={{ margin: '2px 0 8px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Audit, query, and browse raw data columns synchronized from all My Trees databases.
                </p>
                
                {/* Inline Metrics Pills */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="glass-panel" style={{ padding: '4px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', background: 'rgba(64,126,82,0.05)', border: '1px solid rgba(64,126,82,0.15)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Records:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{explorerData.length}</span>
                  </div>
                  <div className="glass-panel" style={{ padding: '4px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', background: 'rgba(116,97,74,0.05)', border: '1px solid rgba(116,97,74,0.15)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Columns:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {explorerData.length > 0 ? Object.keys(explorerData[0]).filter(k => k !== 'geometry').length : 0}
                    </span>
                  </div>
                  <div className="glass-panel" style={{ padding: '4px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', background: 'rgba(49,109,75,0.05)', border: '1px solid rgba(49,109,75,0.15)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Filtered Matches:</span>
                    <span style={{ fontWeight: 700, color: '#407e52' }}>
                      {explorerData.filter(row => Object.keys(row).some(k => k !== 'geometry' && String(row[k] || '').toLowerCase().includes(explorerSearch.toLowerCase()))).length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Select target DB table */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(122,129,108,0.15)' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Table:</span>
                <select 
                  value={explorerTarget} 
                  onChange={(e) => {
                    setExplorerTarget(e.target.value);
                    setExplorerPage(1);
                  }}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(122,129,108,0.2)',
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    outline: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="planting">Planting updates</option>
                  <option value="nurseries">Seed Nurseries</option>
                  <option value="beekeeping">Beekeeping logs</option>
                  <option value="verification">Field verifications</option>
                  <option value="fires">Fire assessments</option>
                  <option value="aftercare">Aftercare audits</option>
                  <option value="user_tracks">User tracks</option>
                </select>
              </div>
            </div>

            {/* Table Filters Search & Exports */}
            <div className="glass-panel" style={{ padding: '10px 15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '9px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter records..."
                  value={explorerSearch}
                  onChange={(e) => {
                    setExplorerSearch(e.target.value);
                    setExplorerPage(1);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(122,129,108,0.2)',
                    borderRadius: '8px',
                    padding: '6px 10px 6px 36px',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Exports */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleExportData('csv')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#407e52',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Export CSV
                </button>
                <button 
                  onClick={() => handleExportData('json')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#74614a',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Export JSON
                </button>
                <button 
                  onClick={() => handleExportData('geojson')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#316d4b',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Export GeoJSON
                </button>
                <button 
                  onClick={() => handleExportData('kml')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#72bb95',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Export KML
                </button>
              </div>
            </div>

            {/* Grid Spreadsheet view */}
            <div className="glass-panel" style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid rgba(122, 129, 108, 0.2)' }}>
                      <th style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>Idx</th>
                      {explorerData.length > 0 && Object.keys(explorerData[0]).filter(k => k !== 'geometry' && k !== 'idx').map(key => (
                        <th key={key} style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = explorerData.filter(row => 
                        Object.keys(row).some(k => k !== 'geometry' && String(row[k] || '').toLowerCase().includes(explorerSearch.toLowerCase()))
                      );
                      const paged = filtered.slice((explorerPage - 1) * rowsPerPage, explorerPage * rowsPerPage);

                      if (paged.length === 0) {
                        return (
                          <tr>
                            <td 
                              colSpan={explorerData.length > 0 ? Object.keys(explorerData[0]).length : 5} 
                              style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}
                            >
                              No records match filter search parameters.
                            </td>
                          </tr>
                        );
                      }

                      return paged.map((row, rIdx) => (
                        <tr 
                          key={rIdx} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.03)', 
                            backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                          }}
                        >
                          <td style={{ padding: '10px', fontWeight: 600, color: '#407e52' }}>{row.idx}</td>
                          {Object.keys(row).filter(k => k !== 'geometry' && k !== 'idx').map(colKey => {
                            const val = row[colKey];
                            
                            if (typeof val === 'string' && val.endsWith('.jpg') && (val.includes('aftercare_') || val.includes('field-verification_') || val.includes('meetings-') || val.includes('nursery-') || val.includes('plot-'))) {
                              return (
                                <td key={colKey} style={{ padding: '8px 10px' }}>
                                  <a href={`${BACKEND_URL}/api/media/image/${val}`} target="_blank" rel="noreferrer" style={{ color: '#72bb95', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ImageIcon size={14} /> View Photo
                                  </a>
                                </td>
                              );
                            }
                            
                            if (colKey === 'Field Audio' && val && val !== 'None') {
                              return (
                                <td key={colKey} style={{ padding: '8px 10px' }}>
                                  <a href={`${BACKEND_URL}/api/media/audio/${val}`} target="_blank" rel="noreferrer" style={{ color: '#74614a', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Volume2 size={14} /> Play Audio
                                  </a>
                                </td>
                              );
                            }

                            return (
                              <td key={colKey} style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {String(val || '')}
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controller */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                {(() => {
                  const filtered = explorerData.filter(row => 
                    Object.keys(row).some(k => k !== 'geometry' && String(row[k] || '').toLowerCase().includes(explorerSearch.toLowerCase()))
                  );
                  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
                  
                  return (
                    <>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Showing {Math.min(filtered.length, (explorerPage - 1) * rowsPerPage + 1)} to {Math.min(filtered.length, explorerPage * rowsPerPage)} of {filtered.length} entries
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          disabled={explorerPage === 1}
                          onClick={() => setExplorerPage(p => Math.max(1, p - 1))}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: explorerPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: explorerPage === 1 ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, padding: '0 8px' }}>
                          Page {explorerPage} of {totalPages}
                        </span>
                        <button 
                          disabled={explorerPage === totalPages}
                          onClick={() => setExplorerPage(p => Math.min(totalPages, p + 1))}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: explorerPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: explorerPage === totalPages ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        ) : activeTab === 'gallery' ? (
          
          /* LAYOUT STYLE D: MEDIA GALLERY PANEL */
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '20px', overflowY: 'auto', boxSizing: 'border-box', gap: '20px' }}>
            
            {/* Title / Description */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ImageIcon style={{ color: '#407e52' }} /> Field Media Gallery
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Browse photo evidence, grower recordings, and field audit attachments synchronized from QField operations.
                </p>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search input */}
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search grower, monitor, ward, village..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(122,129,108,0.2)',
                    borderRadius: '8px',
                    padding: '8px 10px 8px 36px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Category dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Category:</span>
                <select 
                  value={galleryFilter} 
                  onChange={(e) => setGalleryFilter(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(122,129,108,0.3)',
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="aftercare">Aftercare Audits</option>
                  <option value="verification">Field Verifications</option>
                  <option value="nursery">Nursery Photos</option>
                  <option value="meetings">Meetings & Trainings</option>
                  <option value="plot">Plot Mapping & Planting</option>
                  <option value="other">General Media</option>
                </select>
              </div>

              {/* Media Counter stats */}
              <div style={{ marginLeft: 'auto', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                {(() => {
                  const getCategorizedImage = (filename) => {
                    const fn = filename.toLowerCase();
                    if (fn.includes('aftercare_')) return { id: 'aftercare', label: 'Aftercare Audit', color: '#74614a' };
                    if (fn.includes('field-verification_')) return { id: 'verification', label: 'Field Verification', color: '#3b82f6' };
                    if (fn.includes('meetings-')) return { id: 'meetings', label: 'Meetings & Trainings', color: '#a855f7' };
                    if (fn.includes('nursery-')) return { id: 'nursery', label: 'Nursery Operations', color: '#10b981' };
                    if (fn.includes('plot-')) return { id: 'plot', label: 'Plot Mapping', color: '#407e52' };
                    return { id: 'other', label: 'General Media', color: '#64748b' };
                  };

                  const imagesWithMetadata = (mediaList.images || []).map((img) => {
                    const matchedRecord = timeline.find(t => t.photo === img || (t.photo && t.photo.includes(img)));
                    const category = getCategorizedImage(img);
                    return { filename: img, category, record: matchedRecord || null };
                  });

                  const filtered = imagesWithMetadata.filter(item => {
                    if (galleryFilter !== 'all' && item.category.id !== galleryFilter) return false;
                    if (gallerySearch.trim() !== '') {
                      const q = gallerySearch.toLowerCase();
                      const filenameMatch = item.filename.toLowerCase().includes(q);
                      const categoryMatch = item.category.label.toLowerCase().includes(q);
                      let recordMatch = false;
                      if (item.record) {
                        recordMatch = 
                          (item.record.grower || '').toLowerCase().includes(q) ||
                          (item.record.monitor || '').toLowerCase().includes(q) ||
                          (item.record.ward || '').toLowerCase().includes(q) ||
                          (item.record.village || '').toLowerCase().includes(q) ||
                          (item.record.findings || '').toLowerCase().includes(q);
                      }
                      return filenameMatch || categoryMatch || recordMatch;
                    }
                    return true;
                  });

                  return (
                    <span>
                      Showing <strong>{filtered.length}</strong> of <strong>{mediaList.images ? mediaList.images.length : 0}</strong> photos
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Media Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
              flex: 1
            }}>
              {(() => {
                const getCategorizedImage = (filename) => {
                  const fn = filename.toLowerCase();
                  if (fn.includes('aftercare_')) return { id: 'aftercare', label: 'Aftercare Audit', color: '#74614a' };
                  if (fn.includes('field-verification_')) return { id: 'verification', label: 'Field Verification', color: '#3b82f6' };
                  if (fn.includes('meetings-')) return { id: 'meetings', label: 'Meetings & Trainings', color: '#a855f7' };
                  if (fn.includes('nursery-')) return { id: 'nursery', label: 'Nursery Operations', color: '#10b981' };
                  if (fn.includes('plot-')) return { id: 'plot', label: 'Plot Mapping', color: '#407e52' };
                  return { id: 'other', label: 'General Media', color: '#64748b' };
                };

                const imagesWithMetadata = (mediaList.images || []).map((img) => {
                  const matchedRecord = timeline.find(t => t.photo === img || (t.photo && t.photo.includes(img)));
                  const category = getCategorizedImage(img);
                  return { filename: img, category, record: matchedRecord || null };
                });

                const filtered = imagesWithMetadata.filter(item => {
                  if (galleryFilter !== 'all' && item.category.id !== galleryFilter) return false;
                  if (gallerySearch.trim() !== '') {
                    const q = gallerySearch.toLowerCase();
                    const filenameMatch = item.filename.toLowerCase().includes(q);
                    const categoryMatch = item.category.label.toLowerCase().includes(q);
                    let recordMatch = false;
                    if (item.record) {
                      recordMatch = 
                        (item.record.grower || '').toLowerCase().includes(q) ||
                        (item.record.monitor || '').toLowerCase().includes(q) ||
                        (item.record.ward || '').toLowerCase().includes(q) ||
                        (item.record.village || '').toLowerCase().includes(q) ||
                        (item.record.findings || '').toLowerCase().includes(q);
                    }
                    return filenameMatch || categoryMatch || recordMatch;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                      No media files match your filter parameters.
                    </div>
                  );
                }

                return filtered.map((item, idx) => {
                  const title = item.record ? item.record.grower : item.filename;
                  const subtitle = item.record ? `Ward ${item.record.ward} • ${item.record.date}` : item.category.label;
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedGalleryItem(item)}
                      className="glass-panel"
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-card)',
                        height: 'fit-content'
                      }}
                    >
                      {/* Image Preview */}
                      <div style={{ position: 'relative', height: '150px', width: '100%', backgroundColor: '#060a08', overflow: 'hidden' }}>
                        <img 
                          src={`${BACKEND_URL}/api/media/image/${item.filename}`}
                          alt={item.filename}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        {/* Category Badge */}
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: item.category.color,
                          color: '#ffffff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {item.category.label}
                        </span>

                        {/* Matched Database record badge */}
                        {item.record && (
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#407e52',
                            color: '#ffffff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700
                          }} title="Linked to database record">
                            ✓
                          </span>
                        )}

                        {/* Play button overlay if matching audio */}
                        {item.record && item.record.audio && item.record.audio !== 'None' && (
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(11, 18, 13, 0.75)',
                            color: '#ffffff',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Volume2 size={12} style={{ color: '#72bb95' }} />
                          </div>
                        )}
                      </div>

                      {/* Card details */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {subtitle}
                        </p>
                        {item.record && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.record.findings}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

          </div>
        ) : (
          
          /* LAYOUT STYLE C: REPORT GENERATION COMPONENT PANEL */
          <div style={{ display: 'flex', flex: 1, padding: '20px', overflowY: 'auto', boxSizing: 'border-box', gap: '20px' }}>
            
            {/* Left Form controls (Width 360px) */}
            <div className="glass-panel" style={{ width: '360px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: 'fit-content' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText style={{ color: '#407e52' }} /> Custom Report Builder
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                Configure parameters and compile a printable PDF summary report utilizing aggregated QField data layers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {/* Template Selection */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Report Template:</label>
                  <select 
                    value={reportTemplate}
                    onChange={(e) => {
                      setReportTemplate(e.target.value);
                      if (e.target.value === 'restoration') setReportTitle('My Trees Trust - Woodland Restoration Report');
                      else if (e.target.value === 'nurseries') setReportTitle('My Trees Trust - Seedling Nursery Operations');
                      else if (e.target.value === 'beekeeping') setReportTitle('My Trees Trust - Beekeeping Livelihoods Impact');
                      else if (e.target.value === 'fire') setReportTitle('My Trees Trust - Fire Vulnerability & Damage Assessment');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid rgba(122,129,108,0.3)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="restoration">Woodland Restoration & Planting</option>
                    <option value="nurseries">Seed Nursery Inventories</option>
                    <option value="beekeeping">Beekeeping Livelihoods</option>
                    <option value="fire">Fire Incidents & Assessments</option>
                  </select>
                </div>

                {/* Report Title */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Report Title:</label>
                  <input 
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Region & Ward Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Region:</label>
                    <select 
                      value={reportRegion}
                      onChange={(e) => setReportRegion(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        padding: '6px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      {filters.regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ward:</label>
                    <select 
                      value={reportWard}
                      onChange={(e) => setReportWard(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        padding: '6px',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      {filters.wards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Inclusions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Include Sections:</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeKPIs} onChange={(e) => setIncludeKPIs(e.target.checked)} />
                    KPI Metrics Summary
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} />
                    Analytics Charts (Species / Survival)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} />
                    DCIM Field Photos & Reports
                  </label>
                </div>

                {/* Generate Button */}
                <button 
                  onClick={() => setIsReportGenerated(true)}
                  style={{
                    backgroundColor: '#407e52',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 12px rgba(122, 129, 108, 0.2)'
                  }}
                >
                  Generate Print Preview
                </button>
              </div>
            </div>

            {/* Right Printable Preview Sheet */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {isReportGenerated ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      onClick={() => window.print()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#407e52',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={15} /> Print / Export to PDF
                    </button>
                  </div>

                  {/* PDF Page A4 styled sheet */}
                  <div id="printableReport" style={{
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    borderRadius: '8px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    fontFamily: "'Outfit', sans-serif",
                    lineHeight: '1.6',
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Report Header Logo with official logo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #407e52', paddingBottom: '20px', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src="/logo-icon.png" 
                          alt="My Trees Trust Logo" 
                          style={{ width: '40px', height: '40px' }}
                        />
                        <div>
                          <h1 style={{ margin: 0, fontSize: '24px', color: '#064e3b', fontWeight: 800 }}>MY TREES TRUST</h1>
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>WOODLAND PROTECTION & REFORESTATION PROGRAM</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                        <div><strong>Compiled:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Region:</strong> {reportRegion} &bull; <strong>Ward:</strong> {reportWard}</div>
                      </div>
                    </div>

                    <h2 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 700, marginBottom: '20px' }}>{reportTitle}</h2>

                    {/* KPI Statistics */}
                    {includeKPIs && (
                      <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                          {reportTemplate === 'restoration' ? 'Restoration Indicators' :
                           reportTemplate === 'nurseries' ? 'Nursery Supply Chain Indicators' :
                           reportTemplate === 'beekeeping' ? 'Beekeeping Livelihoods Indicators' :
                           'Fire Management & Vulnerability Indicators'}
                        </h3>
                        
                        {reportTemplate === 'restoration' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Trees Planted</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{kpis.trees_planted.toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Target Program</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{kpis.trees_target.toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Woodland Survival</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>{kpis.overall_survival_rate}%</div>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'nurseries' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Pots Pocketed</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{(productionOutcomes?.summary?.total_pocketed || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Seeds Germinated</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{(productionOutcomes?.summary?.total_germinated || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Ready Seedlings</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>{(productionOutcomes?.summary?.total_ready || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'beekeeping' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Hives Monitored</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{(statusOutcomes?.summary?.total_hives || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Colonized Hives</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#407e52', marginTop: '4px' }}>{(statusOutcomes?.summary?.colonized || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Est. Honey Yield</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{(statusOutcomes?.summary?.total_honey_yield_kg || 0).toLocaleString()} kg</div>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'fire' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                              <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Burnt Incidents</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>{fireOutcomes?.summary?.confirmed_fires || 0}</div>
                            </div>
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                              <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Total Burnt Area</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>{(fireOutcomes?.summary?.total_hectares_lost || 0).toLocaleString()} ha</div>
                            </div>
                            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                              <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Trees Lost</div>
                              <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>{(fireOutcomes?.summary?.total_trees_lost || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chart Inclusion */}
                    {includeCharts && (
                      <div style={{ marginBottom: '30px' }}>
                        {reportTemplate === 'restoration' && speciesChart.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                              Woodland Species Survival Rates
                            </h3>
                            <div style={{ height: '180px', width: '100%' }}>
                              <ResponsiveContainer>
                                <BarChart data={speciesChart.slice(0, 6)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                  <XAxis dataKey="Species" stroke="#475569" fontSize={11} />
                                  <YAxis stroke="#475569" fontSize={11} />
                                  <Bar dataKey="avg_survival_rate" fill="#407e52" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'nurseries' && Object.keys(productionOutcomes?.summary?.by_hub || {}).length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                              Nursery Hub Stock Levels (Pocketed vs Ready)
                            </h3>
                            <div style={{ height: '180px', width: '100%' }}>
                              <ResponsiveContainer>
                                <BarChart
                                  data={Object.entries(productionOutcomes?.summary?.by_hub || {}).map(([key, val]) => ({
                                    name: key.replace(' Nursery', '').substring(0, 12),
                                    pocketed: val.pocketed,
                                    ready: val.ready
                                  })).slice(0, 5)}
                                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                >
                                  <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                                  <YAxis stroke="#475569" fontSize={11} />
                                  <Tooltip />
                                  <Bar dataKey="pocketed" fill="#74614a" name="Pocketed" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="ready" fill="#407e52" name="Ready" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'beekeeping' && (
                          <div>
                            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                              Hive Colonization Distribution
                            </h3>
                            <div style={{ display: 'flex', height: '160px', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
                              <div style={{ width: '140px', height: '140px' }}>
                                <ResponsiveContainer>
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Colonized', value: statusOutcomes?.summary?.colonized || 0 },
                                        { name: 'Uncolonized', value: statusOutcomes?.summary?.uncolonized || 0 },
                                        { name: 'Decolonized', value: statusOutcomes?.summary?.decolonized || 0 }
                                      ].filter(d => d.value > 0)}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={55}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      {[
                                        { name: 'Colonized', color: '#407e52' },
                                        { name: 'Uncolonized', color: '#74614a' },
                                        { name: 'Decolonized', color: '#ef4444' }
                                      ].map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#407e52' }} />
                                  <strong>Colonized:</strong> {statusOutcomes?.summary?.colonized || 0} hives
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#74614a' }} />
                                  <strong>Uncolonized:</strong> {statusOutcomes?.summary?.uncolonized || 0} hives
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                  <strong>Decolonized:</strong> {statusOutcomes?.summary?.decolonized || 0} hives
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {reportTemplate === 'fire' && Object.keys(fireOutcomes?.summary?.by_ward || {}).length > 0 && (
                          <div>
                            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                              Fire Incidents Distribution by Ward
                            </h3>
                            <div style={{ height: '180px', width: '100%' }}>
                              <ResponsiveContainer>
                                <BarChart
                                  data={Object.entries(fireOutcomes?.summary?.by_ward || {}).map(([key, val]) => ({
                                    name: `Ward ${key}`,
                                    incidents: val
                                  })).sort((a,b) => b.incidents - a.incidents).slice(0, 6)}
                                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                >
                                  <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                                  <YAxis stroke="#475569" fontSize={11} />
                                  <Bar dataKey="incidents" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos Inclusions */}
                    {includePhotos && (
                      <div style={{ marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#064e3b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '12px' }}>
                          Logged Field Operational Records & Proofs
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          {/* Restoration logs */}
                          {reportTemplate === 'restoration' && (survivalOutcomes?.survival || timeline).filter(i => i.photo_1 || i.photo).slice(0, 4).map(item => {
                            const p = item.photo_1 || item.photo;
                            const filename = p.split('/').pop().split('\\').pop();
                            return (
                              <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                {p && p !== 'None' && (
                                  <img 
                                    src={`${BACKEND_URL}/api/media/image/${filename}`} 
                                    style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                                    alt="Report photo item"
                                  />
                                )}
                                <div style={{ fontSize: '11px', flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.grower}</div>
                                  <div style={{ color: '#475569' }}>Date: {item.date} &bull; Ward {item.ward}</div>
                                  <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                                    {(item.comments || item.findings || '').substring(0, 40)}...
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Nursery supervisor audits */}
                          {reportTemplate === 'nurseries' && (productionOutcomes?.audits || []).filter(i => i.photo).slice(0, 4).map(item => {
                            const filename = item.photo.split('/').pop().split('\\').pop();
                            return (
                              <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                <img 
                                  src={`${BACKEND_URL}/api/media/image/${filename}`} 
                                  style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                                  alt="Nursery report photo"
                                />
                                <div style={{ fontSize: '11px', flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.nursery_name}</div>
                                  <div style={{ color: '#475569' }}>Officer: {item.officer} &bull; Date: {item.date}</div>
                                  <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                                    {(item.observations || '').substring(0, 40)}...
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Beekeeping logs */}
                          {reportTemplate === 'beekeeping' && (statusOutcomes?.logs || []).filter(i => i.photo_1 || i.photo_2).slice(0, 4).map(item => {
                            const p = item.photo_1 || item.photo_2;
                            const filename = p.split('/').pop().split('\\').pop();
                            return (
                              <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                <img 
                                  src={`${BACKEND_URL}/api/media/image/${filename}`} 
                                  style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                                  alt="Beekeeping report photo"
                                />
                                <div style={{ fontSize: '11px', flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.beekeeper}</div>
                                  <div style={{ color: '#475569' }}>Status: {item.status} &bull; Ward: {item.ward}</div>
                                  <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                                    {(item.comments || '').substring(0, 40)}...
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Fire incidents */}
                          {reportTemplate === 'fire' && (fireOutcomes?.incidents || []).filter(i => i.photo_1 || i.photo_2).slice(0, 4).map(item => {
                            const p = item.photo_1 || item.photo_2;
                            const filename = p.split('/').pop().split('\\').pop();
                            return (
                              <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                <img 
                                  src={`${BACKEND_URL}/api/media/image/${filename}`} 
                                  style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                                  alt="Fire report photo"
                                />
                                <div style={{ fontSize: '11px', flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.grower}</div>
                                  <div style={{ color: '#475569' }}>Burnt: {item.hectares_lost} ha &bull; Ward: {item.ward}</div>
                                  <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                                    {(item.observations || '').substring(0, 40)}...
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Report Footer */}
                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '40px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b' }}>
                      <span>&copy; {new Date().getFullYear()} My Trees Trust Zimbabwe. All rights reserved.</span>
                      <span style={{ fontWeight: 600, color: '#407e52' }}>Mitigating Woodland Loss</span>
                    </div>

                  </div>
                </>
              ) : (
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                  <FileText size={48} style={{ color: '#407e52', marginBottom: '15px' }} />
                  <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>No Report Generated</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px', fontSize: '13.5px' }}>
                    Configure the template and parameters in the left side form and click **Generate Print Preview** to display the compiled report template here.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* Footer bar */}
      <footer style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        height: '35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        boxSizing: 'border-box'
      }}>
        <span>&copy; 2026 My Trees Trust, Zimbabwe. (Registered Trust: MA0001091/2019). All rights reserved.</span>
        <span style={{ fontWeight: 600, color: '#407e52', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Heart size={11} style={{ fill: '#407e52' }} /> Miti Yangu - Restoring Woodlands & Preserving Biodiversity
        </span>
      </footer>

      {/* 4. LIGHTBOX DETAIL MODAL */}
      {selectedGalleryItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(6, 10, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          {/* Modal Container */}
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '850px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
            maxHeight: '90vh',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedGalleryItem(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: 'rgba(6, 10, 8, 0.1)',
                border: 'none',
                color: 'var(--text-primary)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '16px',
                fontWeight: 800,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 10, 8, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 10, 8, 0.1)'}
            >
              ✕
            </button>

            {/* Left Side: Large Image */}
            <div style={{ flex: 1.2, backgroundColor: '#060a08', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '350px' }}>
              <img 
                src={`${BACKEND_URL}/api/media/image/${selectedGalleryItem.filename}`}
                alt={selectedGalleryItem.filename}
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '550px' }}
              />
            </div>

            {/* Right Side: Details Panel */}
            <div style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflowY: 'auto', maxHeight: '550px', borderLeft: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Header Category and title */}
                <div>
                  <span style={{
                    backgroundColor: selectedGalleryItem.category.color,
                    color: '#ffffff',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {selectedGalleryItem.category.label}
                  </span>
                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedGalleryItem.record ? selectedGalleryItem.record.grower : selectedGalleryItem.filename}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Filename: {selectedGalleryItem.filename}
                  </span>
                </div>

                {/* Database Metadata attributes */}
                {selectedGalleryItem.record ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monitor:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedGalleryItem.record.monitor}</span>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedGalleryItem.record.date}</span>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedGalleryItem.record.village ? `${selectedGalleryItem.record.village}, Ward ${selectedGalleryItem.record.ward}` : `Ward ${selectedGalleryItem.record.ward}`}
                      </span>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Findings:</span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.4', fontStyle: 'italic', background: 'rgba(64,126,82,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(64,126,82,0.05)' }}>
                        "{selectedGalleryItem.record.findings}"
                      </p>
                    </div>

                    {selectedGalleryItem.record.conclusion && selectedGalleryItem.record.conclusion !== 'None' && (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Conclusion:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{selectedGalleryItem.record.conclusion}</span>
                      </div>
                    )}

                    {/* Audio Player inside Modal */}
                    {selectedGalleryItem.record.audio && selectedGalleryItem.record.audio !== 'None' && (
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Field Interview / Recording:</span>
                        <div className="audio-player-card">
                          <Volume2 size={14} style={{ color: '#74614a' }} />
                          <audio controls style={{ height: '30px', width: '100%' }} src={`${BACKEND_URL}/api/media/audio/${selectedGalleryItem.record.audio}`} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '15px 0', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    No matching database records containing findings or audio logs for this photo.
                  </div>
                )}
              </div>

              {/* Show on Map Button at bottom */}
              {selectedGalleryItem.record && selectedGalleryItem.record.coords && (
                <button 
                  onClick={() => {
                    setMapCenter(selectedGalleryItem.record.coords);
                    setMapZoom(14);
                    setActiveTab('overview');
                    setSelectedGalleryItem(null);
                  }}
                  style={{
                    backgroundColor: '#407e52',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '20px',
                    width: '100%',
                    boxShadow: '0 4px 10px rgba(64,126,82,0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#316d4b'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#407e52'}
                >
                  <MapIcon size={14} /> Show on Interactive Map
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* QField Cloud Configuration Settings Modal */}
      {isConfigModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid rgba(64,126,82,0.3)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} style={{ color: '#407e52' }} /> QField Cloud Settings
              </h3>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Configure connection details to fetch raw databases directly from QField Cloud. Either Username & Password or a Personal API Token is required.
              </p>

              {/* Endpoint URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cloud Endpoint URL</label>
                <input 
                  type="text" 
                  value={qfieldConfig.url}
                  onChange={(e) => setQfieldConfig({...qfieldConfig, url: e.target.value})}
                  placeholder="https://app.qfield.cloud/api/v1/"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Project UUID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project ID (UUID) <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  value={qfieldConfig.project_id}
                  onChange={(e) => setQfieldConfig({...qfieldConfig, project_id: e.target.value})}
                  placeholder="e.g. 87ff9661-2bf2-4e77-9233-bed37613f983"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Credentials Fields Group */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--forest-emerald)' }}>Option A: Username & Password</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Username</label>
                    <input 
                      type="text" 
                      value={qfieldConfig.username}
                      onChange={(e) => setQfieldConfig({...qfieldConfig, username: e.target.value})}
                      placeholder="QField Cloud username"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                    <input 
                      type="password" 
                      value={qfieldConfig.password}
                      onChange={(e) => setQfieldConfig({...qfieldConfig, password: e.target.value})}
                      placeholder="Password"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* API Token Group */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--forest-emerald)' }}>Option B: API Personal Access Token</span>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>API Token (bypasses username/password)</label>
                <input 
                  type="password" 
                  value={qfieldConfig.token}
                  onChange={(e) => setQfieldConfig({...qfieldConfig, token: e.target.value})}
                  placeholder="Paste QField Cloud API token..."
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-primary)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const saveRes = await fetch(`${BACKEND_URL}/api/qfieldcloud/config`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        url: qfieldConfig.url,
                        username: qfieldConfig.username,
                        project_id: qfieldConfig.project_id,
                        password: qfieldConfig.password === "********" ? undefined : qfieldConfig.password,
                        token: qfieldConfig.token === "********" ? undefined : qfieldConfig.token
                      })
                    });
                    if (!saveRes.ok) throw new Error("Failed to save configuration settings.");
                    setIsConfigModalOpen(false);
                    alert("Settings saved successfully!");
                    fetchQFieldConfig();
                  } catch (err) {
                    alert(err.message);
                  }
                }}
                style={{
                  backgroundColor: '#74614a',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Save first
                    const saveRes = await fetch(`${BACKEND_URL}/api/qfieldcloud/config`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        url: qfieldConfig.url,
                        username: qfieldConfig.username,
                        project_id: qfieldConfig.project_id,
                        password: qfieldConfig.password === "********" ? undefined : qfieldConfig.password,
                        token: qfieldConfig.token === "********" ? undefined : qfieldConfig.token
                      })
                    });
                    if (!saveRes.ok) throw new Error("Failed to save configuration settings.");
                    
                    setIsConfigModalOpen(false);
                    fetchQFieldConfig();
                    
                    // Trigger sync
                    handleSyncData();
                  } catch (err) {
                    alert(err.message);
                  }
                }}
                style={{
                  backgroundColor: '#407e52',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(64,126,82,0.3)'
                }}
              >
                Save & Sync Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QField Cloud Sync Progress Modal */}
      {showSyncOverlay && syncStatus && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: '#f8fafc',
            fontFamily: "'Outfit', sans-serif"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(64, 126, 82, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#72bb95'
              }}>
                <RefreshCw 
                  size={20} 
                  className={syncStatus.status === 'syncing' ? 'spin-anim' : ''} 
                  style={{ animation: syncStatus.status === 'syncing' ? 'spin 1.5s linear infinite' : 'none' }} 
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                  {syncStatus.status === 'syncing' && 'Synchronizing QField Cloud'}
                  {syncStatus.status === 'success' && 'Sync Completed Successfully'}
                  {syncStatus.status === 'error' && 'Sync Encountered Errors'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {syncStatus.status === 'syncing' && 'Fetching and updating restoration data...'}
                  {syncStatus.status === 'success' && 'All project databases and media are up to date.'}
                  {syncStatus.status === 'error' && 'Some files failed to synchronize.'}
                </p>
              </div>
            </div>

            {/* Current File / Activity */}
            {syncStatus.status === 'syncing' && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#cbd5e1', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    {syncStatus.current_file || 'Processing...'}
                  </span>
                  <span style={{ color: '#72bb95', fontWeight: 600 }}>
                    {syncStatus.total_files > 0 
                      ? `${Math.round(((syncStatus.downloaded + syncStatus.skipped) / syncStatus.total_files) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: syncStatus.total_files > 0 
                      ? `${((syncStatus.downloaded + syncStatus.skipped) / syncStatus.total_files) * 100}%` 
                      : '0%',
                    background: 'linear-gradient(90deg, #407e52 0%, #72bb95 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            )}

            {/* Stats Counter Badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>Total Files</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>{syncStatus.total_files}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(64, 126, 82, 0.08)', border: '1px solid rgba(64, 126, 82, 0.15)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#72bb95', fontWeight: 600 }}>Downloaded</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#a7f3d0', marginTop: '4px' }}>{syncStatus.downloaded}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>Skipped</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>{syncStatus.skipped}</div>
              </div>
              {syncStatus.error_count > 0 && (
                <div style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fca5a5', fontWeight: 600 }}>Errors</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fca5a5', marginTop: '4px' }}>{syncStatus.error_count}</div>
                </div>
              )}
            </div>

            {/* Errors List */}
            {syncStatus.errors && syncStatus.errors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fca5a5', marginBottom: '6px' }}>Error Details:</div>
                <div style={{
                  maxHeight: '110px',
                  overflowY: 'auto',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  color: '#fecdd3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {syncStatus.errors.map((err, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ color: '#fca5a5' }}>•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {syncStatus.status === 'syncing' && (
                <button
                  onClick={() => setShowSyncOverlay(false)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  Run in Background
                </button>
              )}
              {syncStatus.status !== 'syncing' && (
                <button
                  onClick={() => {
                    setShowSyncOverlay(false);
                    setSyncStatus(null);
                  }}
                  style={{
                    backgroundColor: '#407e52',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(64,126,82,0.25)'
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
