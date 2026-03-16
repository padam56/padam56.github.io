(function() {
  "use strict";

  var MAP_DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  var LIVE_FEED_DATA_URL = "data/threat-live.json";

  var TEMPLATE_VIEW_CONFIGS = {
    campaign: {
      kpis: [
        { value: "23", label: "active campaign clusters tracked this quarter" },
        { value: "1.9k", label: "sinkholed and monitored suspicious domains" },
        { value: "67", label: "infrastructure overlap signals under active review" }
      ],
      victimTitle: "Campaign Exposure Origin Pattern (Template)",
      victimIntro: "Illustrative regional spread for campaign telemetry reporting. Replace with your measured incidents per region.",
      victimBars: [
        { region: "North America", pct: 31 },
        { region: "Europe", pct: 24 },
        { region: "Asia Pacific", pct: 28 },
        { region: "Latin America", pct: 11 },
        { region: "Africa and Middle East", pct: 6 }
      ],
      infraPoints: [
        { label: "Wallet-drain phishing infra", lon: -74, lat: 40.7, tone: "cyan" },
        { label: "Sinkhole / takedown infra", lon: 8.5, lat: 50.1, tone: "green" },
        { label: "Abuse hosting overlap", lon: -58.4, lat: -34.6, tone: "blue" },
        { label: "Scam kit distribution infra", lon: 103.8, lat: 1.3, tone: "cyan" }
      ],
      victimPoints: [
        { label: "NA incident origin", lon: -98, lat: 38, tone: "amber" },
        { label: "EU incident origin", lon: 12, lat: 50, tone: "amber" },
        { label: "APAC incident origin", lon: 108, lat: 16, tone: "amber" }
      ],
      flows: [
        { from: [-74, 40.7], to: [-98, 38], tone: "cyan" },
        { from: [8.5, 50.1], to: [12, 50], tone: "green" },
        { from: [103.8, 1.3], to: [108, 16], tone: "amber" },
        { from: [-58.4, -34.6], to: [-63, -15], tone: "blue" }
      ]
    },
    crypto: {
      kpis: [
        { value: "34%", label: "estimated reported victim origin share from North America" },
        { value: "26%", label: "estimated reported victim origin share from Europe" },
        { value: "24%", label: "estimated reported victim origin share from Asia Pacific" }
      ],
      victimTitle: "Reported Crypto Wallet Fraud Victim Origins (Illustrative Template)",
      victimIntro: "Regional template for wallet-phishing and seed phrase theft complaints. Replace with your own complaint dataset.",
      victimBars: [
        { region: "North America", pct: 34 },
        { region: "Europe", pct: 26 },
        { region: "Asia Pacific", pct: 24 },
        { region: "Latin America", pct: 10 },
        { region: "Africa and Middle East", pct: 6 }
      ],
      infraPoints: [
        { label: "Wallet drainer hosting", lon: -77, lat: 39, tone: "cyan" },
        { label: "Fake support cluster", lon: 2.3, lat: 48.8, tone: "green" },
        { label: "Seed phrase lure cluster", lon: 121.4, lat: 31.2, tone: "cyan" }
      ],
      victimPoints: [
        { label: "Victim reports NA", lon: -99, lat: 38, tone: "amber" },
        { label: "Victim reports EU", lon: 10, lat: 51, tone: "amber" },
        { label: "Victim reports APAC", lon: 113, lat: 16, tone: "amber" },
        { label: "Victim reports LATAM", lon: -60, lat: -15, tone: "amber" }
      ],
      flows: [
        { from: [-77, 39], to: [-99, 38], tone: "cyan" },
        { from: [2.3, 48.8], to: [10, 51], tone: "green" },
        { from: [121.4, 31.2], to: [113, 16], tone: "amber" },
        { from: [121.4, 31.2], to: [-60, -15], tone: "amber" }
      ]
    },
    expired: {
      kpis: [
        { value: "740", label: "expired-domain candidates monitored for risky re-registration" },
        { value: "13%", label: "template re-registration rate within 30 days" },
        { value: "58", label: "high lexical-similarity domains to known brands" }
      ],
      victimTitle: "Potential User Exposure from Expired-Domain Re-Use (Template)",
      victimIntro: "Template view for expiring-domain re-registration risk. Replace with your zone diff + hosting + abuse evidence pipeline.",
      victimBars: [
        { region: "North America", pct: 30 },
        { region: "Europe", pct: 25 },
        { region: "Asia Pacific", pct: 27 },
        { region: "Latin America", pct: 11 },
        { region: "Africa and Middle East", pct: 7 }
      ],
      infraPoints: [
        { label: "Drop-catching registrar cluster", lon: -95, lat: 37, tone: "cyan" },
        { label: "Re-registration broker hubs", lon: 5, lat: 51, tone: "green" },
        { label: "Secondary resale pocket", lon: 78, lat: 22, tone: "blue" }
      ],
      victimPoints: [
        { label: "Exposure region NA", lon: -100, lat: 40, tone: "amber" },
        { label: "Exposure region EU", lon: 10, lat: 49, tone: "amber" },
        { label: "Exposure region APAC", lon: 110, lat: 14, tone: "amber" }
      ],
      flows: [
        { from: [-95, 37], to: [-100, 40], tone: "cyan" },
        { from: [5, 51], to: [10, 49], tone: "green" },
        { from: [78, 22], to: [110, 14], tone: "blue" }
      ]
    },
    social: {
      kpis: [
        { value: "19", label: "social scam campaign archetypes tracked (template)" },
        { value: "260", label: "suspicious account-sale listings under observation" },
        { value: "41", label: "donation-abuse entities flagged for verification" }
      ],
      victimTitle: "Social Platform Scam Pressure by Region (Template)",
      victimIntro: "Inspired by account market and donation-abuse studies. Replace with your own automated engagement telemetry.",
      victimBars: [
        { region: "North America", pct: 28 },
        { region: "Europe", pct: 22 },
        { region: "Asia Pacific", pct: 33 },
        { region: "Latin America", pct: 11 },
        { region: "Africa and Middle East", pct: 6 }
      ],
      infraPoints: [
        { label: "Account-market hub", lon: 55.3, lat: 25.2, tone: "cyan" },
        { label: "Donation abuse operations", lon: 77.2, lat: 28.6, tone: "green" },
        { label: "Engagement bot corridor", lon: -46.6, lat: -23.5, tone: "blue" }
      ],
      victimPoints: [
        { label: "Platform user impact APAC", lon: 110, lat: 13, tone: "amber" },
        { label: "Platform user impact NA", lon: -98, lat: 38, tone: "amber" },
        { label: "Platform user impact EU", lon: 9, lat: 50, tone: "amber" }
      ],
      flows: [
        { from: [55.3, 25.2], to: [9, 50], tone: "cyan" },
        { from: [77.2, 28.6], to: [110, 13], tone: "green" },
        { from: [-46.6, -23.5], to: [-98, 38], tone: "blue" }
      ]
    },
    brand: {
      kpis: [
        { value: "126", label: "brand-impersonation entities in template corpus" },
        { value: "17", label: "high-risk brands repeatedly imitated" },
        { value: "3.4x", label: "template conversion lift in impersonation lures" }
      ],
      victimTitle: "Brand Impersonation Exposure by Region (Template)",
      victimIntro: "Based on brand impersonation attack measurement patterns. Replace with your own classifier and manual validation output.",
      victimBars: [
        { region: "North America", pct: 35 },
        { region: "Europe", pct: 24 },
        { region: "Asia Pacific", pct: 24 },
        { region: "Latin America", pct: 10 },
        { region: "Africa and Middle East", pct: 7 }
      ],
      infraPoints: [
        { label: "Clone-page cluster", lon: -122.4, lat: 37.8, tone: "cyan" },
        { label: "Fake support farms", lon: 30.5, lat: 50.4, tone: "green" },
        { label: "redirect/relay infra", lon: 100.5, lat: 13.7, tone: "blue" }
      ],
      victimPoints: [
        { label: "Brand victim NA", lon: -96, lat: 39, tone: "amber" },
        { label: "Brand victim EU", lon: 13, lat: 49, tone: "amber" },
        { label: "Brand victim APAC", lon: 114, lat: 15, tone: "amber" }
      ],
      flows: [
        { from: [-122.4, 37.8], to: [-96, 39], tone: "cyan" },
        { from: [30.5, 50.4], to: [13, 49], tone: "green" },
        { from: [100.5, 13.7], to: [114, 15], tone: "blue" }
      ]
    },
    captcha: {
      kpis: [
        { value: "22", label: "captcha-attack infrastructure clusters (template)" },
        { value: "58%", label: "attacks leveraging human-solver relay paths" },
        { value: "12", label: "automation toolchains tied to bypass activity" }
      ],
      victimTitle: "CAPTCHA Abuse Pressure by Region (Template)",
      victimIntro: "Structured for C-FRAME-style in-the-wild CAPTCHA abuse measurement and regional impact reporting.",
      victimBars: [
        { region: "North America", pct: 26 },
        { region: "Europe", pct: 21 },
        { region: "Asia Pacific", pct: 36 },
        { region: "Latin America", pct: 11 },
        { region: "Africa and Middle East", pct: 6 }
      ],
      infraPoints: [
        { label: "Solver relay market", lon: 77.2, lat: 28.6, tone: "cyan" },
        { label: "Automation panel cluster", lon: 121.4, lat: 31.2, tone: "green" },
        { label: "Abuse API corridor", lon: -74, lat: 40.7, tone: "blue" }
      ],
      victimPoints: [
        { label: "Bot pressure APAC", lon: 112, lat: 14, tone: "amber" },
        { label: "Bot pressure NA", lon: -97, lat: 38, tone: "amber" },
        { label: "Bot pressure EU", lon: 10, lat: 50, tone: "amber" }
      ],
      flows: [
        { from: [77.2, 28.6], to: [112, 14], tone: "cyan" },
        { from: [121.4, 31.2], to: [10, 50], tone: "green" },
        { from: [-74, 40.7], to: [-97, 38], tone: "blue" }
      ]
    },
    phishing: {
      kpis: [
        { value: "11", label: "credential phishing wave families this month (template)" },
        { value: "420", label: "high-risk lure domains under monitoring" },
        { value: "73%", label: "waves reusing known kit templates" }
      ],
      victimTitle: "Credential Phishing Impact by Region (Template)",
      victimIntro: "Use this panel for account-takeover campaign impact distribution and sector-specific targeting.",
      victimBars: [
        { region: "North America", pct: 29 },
        { region: "Europe", pct: 27 },
        { region: "Asia Pacific", pct: 25 },
        { region: "Latin America", pct: 12 },
        { region: "Africa and Middle East", pct: 7 }
      ],
      infraPoints: [
        { label: "Kit host cluster", lon: -3.7, lat: 40.4, tone: "cyan" },
        { label: "Drop panel cluster", lon: 32.8, lat: 39.9, tone: "green" },
        { label: "Replay infra", lon: 106.8, lat: -6.2, tone: "blue" }
      ],
      victimPoints: [
        { label: "Affect region NA", lon: -97, lat: 37, tone: "amber" },
        { label: "Affect region EU", lon: 11, lat: 48, tone: "amber" },
        { label: "Affect region APAC", lon: 116, lat: 11, tone: "amber" }
      ],
      flows: [
        { from: [-3.7, 40.4], to: [11, 48], tone: "cyan" },
        { from: [32.8, 39.9], to: [-97, 37], tone: "green" },
        { from: [106.8, -6.2], to: [116, 11], tone: "blue" }
      ]
    },
    pigbutchering: {
      kpis: [
        { value: "8", label: "pig butchering clusters tracked (template)" },
        { value: "96", label: "romance-finance lure domains under watch" },
        { value: "14", label: "high-confidence laundering corridors" }
      ],
      victimTitle: "Pig Butchering Victim Report Distribution (Template)",
      victimIntro: "Illustrative reporting spread for confidence-scam + fake trading platform operations.",
      victimBars: [
        { region: "North America", pct: 38 },
        { region: "Europe", pct: 22 },
        { region: "Asia Pacific", pct: 28 },
        { region: "Latin America", pct: 8 },
        { region: "Africa and Middle East", pct: 4 }
      ],
      infraPoints: [
        { label: "Comms lure ops", lon: 114.1, lat: 22.3, tone: "cyan" },
        { label: "Fake exchange ops", lon: 100.5, lat: 13.7, tone: "green" },
        { label: "Cash-out relay", lon: -80.1, lat: 25.8, tone: "blue" }
      ],
      victimPoints: [
        { label: "Victim region NA", lon: -102, lat: 37, tone: "amber" },
        { label: "Victim region APAC", lon: 118, lat: 12, tone: "amber" },
        { label: "Victim region EU", lon: 8, lat: 49, tone: "amber" }
      ],
      flows: [
        { from: [114.1, 22.3], to: [-102, 37], tone: "cyan" },
        { from: [100.5, 13.7], to: [118, 12], tone: "green" },
        { from: [-80.1, 25.8], to: [8, 49], tone: "blue" }
      ]
    },
    drainers: {
      kpis: [
        { value: "17", label: "wallet drainer kit variants observed (template)" },
        { value: "61", label: "campaign pages imitating major wallet brands" },
        { value: "4", label: "high-reuse operator clusters" }
      ],
      victimTitle: "Wallet Drainer Incident Origin Pattern (Template)",
      victimIntro: "Regional template for drainer-kit incidents. Replace with your own blocklisted URL + complaint joins.",
      victimBars: [
        { region: "North America", pct: 33 },
        { region: "Europe", pct: 24 },
        { region: "Asia Pacific", pct: 29 },
        { region: "Latin America", pct: 9 },
        { region: "Africa and Middle East", pct: 5 }
      ],
      infraPoints: [
        { label: "Drainer kit CDN nodes", lon: 139.7, lat: 35.7, tone: "cyan" },
        { label: "Mirror farm", lon: 19, lat: 52, tone: "green" },
        { label: "Fast-flux resolver pocket", lon: -46.6, lat: -23.5, tone: "blue" }
      ],
      victimPoints: [
        { label: "Wallet users impacted NA", lon: -98, lat: 37, tone: "amber" },
        { label: "Wallet users impacted EU", lon: 11, lat: 50, tone: "amber" },
        { label: "Wallet users impacted APAC", lon: 114, lat: 14, tone: "amber" }
      ],
      flows: [
        { from: [139.7, 35.7], to: [114, 14], tone: "cyan" },
        { from: [19, 52], to: [11, 50], tone: "green" },
        { from: [-46.6, -23.5], to: [-98, 37], tone: "blue" }
      ]
    },
    malware: {
      kpis: [
        { value: "42", label: "malware C2 node clusters under sinkhole watch" },
        { value: "310", label: "beacon domains linked by infra overlap" },
        { value: "9", label: "cross-family infrastructure pivots" }
      ],
      victimTitle: "Malware C2 Exposure Signals by Region (Template)",
      victimIntro: "Use this panel to summarize beacon telemetry region weighting and infrastructure concentration.",
      victimBars: [
        { region: "North America", pct: 27 },
        { region: "Europe", pct: 23 },
        { region: "Asia Pacific", pct: 30 },
        { region: "Latin America", pct: 13 },
        { region: "Africa and Middle East", pct: 7 }
      ],
      infraPoints: [
        { label: "C2 relay spine", lon: 37.6, lat: 55.7, tone: "cyan" },
        { label: "Sinkhole gateway", lon: -0.1, lat: 51.5, tone: "green" },
        { label: "Fallback resolver", lon: 151.2, lat: -33.8, tone: "blue" }
      ],
      victimPoints: [
        { label: "Beacon volume NA", lon: -100, lat: 37, tone: "amber" },
        { label: "Beacon volume APAC", lon: 116, lat: 9, tone: "amber" },
        { label: "Beacon volume EU", lon: 12, lat: 49, tone: "amber" }
      ],
      flows: [
        { from: [37.6, 55.7], to: [12, 49], tone: "cyan" },
        { from: [-0.1, 51.5], to: [-100, 37], tone: "green" },
        { from: [151.2, -33.8], to: [116, 9], tone: "blue" }
      ]
    }
  };

  var PIPELINE_DATA_URL = "data/threat-map-data.json";

  function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function toNum(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clampPct(value, fallback) {
    var pct = toNum(value, fallback);
    if (!Number.isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  function toneOrDefault(tone) {
    var valid = { cyan: true, green: true, amber: true, blue: true };
    return valid[tone] ? tone : "cyan";
  }

  function normalizePoint(point, fallbackLabel) {
    if (!point) return null;
    var lon = toNum(point.lon, null);
    var lat = toNum(point.lat, null);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    return {
      label: String(point.label || fallbackLabel || "Intel point"),
      lon: Math.max(-180, Math.min(180, lon)),
      lat: Math.max(-90, Math.min(90, lat)),
      tone: toneOrDefault(point.tone)
    };
  }

  function normalizeFlow(flow) {
    if (!flow || !flow.from || !flow.to) return null;
    if (!Array.isArray(flow.from) || !Array.isArray(flow.to)) return null;
    if (flow.from.length < 2 || flow.to.length < 2) return null;

    var fromLon = toNum(flow.from[0], null);
    var fromLat = toNum(flow.from[1], null);
    var toLon = toNum(flow.to[0], null);
    var toLat = toNum(flow.to[1], null);
    if (!Number.isFinite(fromLon) || !Number.isFinite(fromLat) || !Number.isFinite(toLon) || !Number.isFinite(toLat)) return null;

    return {
      from: [Math.max(-180, Math.min(180, fromLon)), Math.max(-90, Math.min(90, fromLat))],
      to: [Math.max(-180, Math.min(180, toLon)), Math.max(-90, Math.min(90, toLat))],
      tone: toneOrDefault(flow.tone)
    };
  }

  function normalizeSourceRef(item) {
    if (!item || typeof item !== "object") return null;
    var label = item.label ? String(item.label) : "Reference";
    var url = item.url ? String(item.url) : "";
    if (!/^https?:\/\//i.test(url)) return null;
    return { label: label, url: url };
  }

  function normalizeLiveContext(item) {
    if (!item || typeof item !== "object") return null;
    var summary = item.summary ? String(item.summary) : "Threat activity update";
    var region = item.region ? String(item.region) : "Global";
    var timestamp = item.timestamp ? String(item.timestamp) : "ongoing";
    var severity = item.severity ? String(item.severity).toLowerCase() : "medium";
    if (["low", "medium", "high"].indexOf(severity) === -1) severity = "medium";

    var point = normalizePoint({
      label: item.label || summary,
      lon: item.lon,
      lat: item.lat,
      tone: item.tone || "cyan"
    }, "Live context");

    return {
      summary: summary,
      region: region,
      timestamp: timestamp,
      severity: severity,
      lon: point ? point.lon : null,
      lat: point ? point.lat : null,
      tone: point ? point.tone : "cyan"
    };
  }

  function mergePipelineView(baseView, incomingView) {
    var view = deepClone(baseView);
    if (!incomingView || typeof incomingView !== "object") return view;

    if (Array.isArray(incomingView.kpis)) {
      var kpis = incomingView.kpis.slice(0, 3).map(function(kpi, idx) {
        var fallback = view.kpis[idx] || { value: "0", label: "pipeline metric" };
        return {
          value: String(kpi && kpi.value != null ? kpi.value : fallback.value),
          label: String(kpi && kpi.label ? kpi.label : fallback.label)
        };
      });
      while (kpis.length < 3) {
        kpis.push(view.kpis[kpis.length] || { value: "0", label: "pipeline metric" });
      }
      view.kpis = kpis;
    }

    if (incomingView.victimTitle) view.victimTitle = String(incomingView.victimTitle);
    if (incomingView.victimIntro) view.victimIntro = String(incomingView.victimIntro);

    if (Array.isArray(incomingView.victimBars)) {
      view.victimBars = incomingView.victimBars.map(function(item, idx) {
        var fallback = view.victimBars[idx] || { region: "Region", pct: 0 };
        return {
          region: String(item && item.region ? item.region : fallback.region),
          pct: clampPct(item && item.pct, fallback.pct)
        };
      }).filter(function(item) {
        return item.region;
      });
    }

    if (Array.isArray(incomingView.infraPoints)) {
      view.infraPoints = incomingView.infraPoints.map(function(point, idx) {
        return normalizePoint(point, "Infra point " + (idx + 1));
      }).filter(Boolean);
    }

    if (Array.isArray(incomingView.victimPoints)) {
      view.victimPoints = incomingView.victimPoints.map(function(point, idx) {
        return normalizePoint(point, "Victim point " + (idx + 1));
      }).filter(Boolean);
    }

    if (Array.isArray(incomingView.flows)) {
      view.flows = incomingView.flows.map(normalizeFlow).filter(Boolean);
    }

    if (Array.isArray(incomingView.sourceRefs)) {
      view.sourceRefs = incomingView.sourceRefs.map(normalizeSourceRef).filter(Boolean);
    }

    if (Array.isArray(incomingView.liveContexts)) {
      view.liveContexts = incomingView.liveContexts.map(normalizeLiveContext).filter(Boolean);
    }

    return view;
  }

  function buildViewConfigsFromPipeline(pipelineData) {
    var viewConfigs = deepClone(TEMPLATE_VIEW_CONFIGS);
    if (!pipelineData || typeof pipelineData !== "object" || !pipelineData.views || typeof pipelineData.views !== "object") {
      return viewConfigs;
    }

    Object.keys(viewConfigs).forEach(function(viewKey) {
      if (!pipelineData.views[viewKey]) return;
      viewConfigs[viewKey] = mergePipelineView(viewConfigs[viewKey], pipelineData.views[viewKey]);
    });

    return viewConfigs;
  }

  function loadPipelineData() {
    if (window.THREAT_PIPELINE_DATA && typeof window.THREAT_PIPELINE_DATA === "object") {
      return Promise.resolve({
        data: window.THREAT_PIPELINE_DATA,
        mode: "pipeline",
        source: "window.THREAT_PIPELINE_DATA"
      });
    }

    return fetch(PIPELINE_DATA_URL, { cache: "no-store" }).then(function(resp) {
      if (!resp.ok) return null;
      return resp.json().then(function(data) {
        return {
          data: data,
          mode: "pipeline",
          source: PIPELINE_DATA_URL
        };
      }).catch(function() {
        return null;
      });
    }).catch(function() {
      return null;
    });
  }

  function markerOffset(index) {
    var offsets = [
      { x: 12, y: -10 },
      { x: 12, y: -12 },
      { x: 12, y: 14 },
      { x: 12, y: -10 },
      { x: 12, y: 14 }
    ];
    return offsets[index % offsets.length];
  }

  function labelCandidates(index) {
    var base = markerOffset(index);
    return [
      { x: base.x, y: base.y },
      { x: 14, y: -14 },
      { x: 14, y: 16 },
      { x: -14, y: -14 },
      { x: -14, y: 16 },
      { x: 18, y: 0 },
      { x: -18, y: 0 },
      { x: 0, y: -18 }
    ];
  }

  function toneClass(tone) {
    return tone ? "tone-" + tone : "tone-cyan";
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadLiveThreatFeed() {
    return fetch(LIVE_FEED_DATA_URL, { cache: "no-store" }).then(function(resp) {
      if (!resp.ok) return null;
      return resp.json().catch(function() { return null; });
    }).catch(function() {
      return null;
    });
  }

  function renderThreatMap() {
    var svgEl = document.getElementById("threat-world-map");
    if (!svgEl || !window.d3 || !window.topojson) return;

    var d3 = window.d3;
    var topojson = window.topojson;
    var width = 1000;
    var height = 450;
    var mapMode = "globe";
    var currentView = "campaign";
    var viewConfigs = deepClone(TEMPLATE_VIEW_CONFIGS);
    var dataNoteEl = document.querySelector(".intel_data_note");
    var liveContextTextEl = document.getElementById("intel-live-context-text");
    var liveContextMetaEl = document.getElementById("intel-live-context-meta");
    var sourceListEl = document.getElementById("intel-source-list");
    var liveFeedListEl = document.getElementById("intel-live-feed-list");
    var liveFeedUpdatedEl = document.getElementById("intel-live-feed-updated");
    var liveKevTotalEl = document.getElementById("intel-live-kev-total");
    var liveKev30El = document.getElementById("intel-live-kev-30d");
    var liveKevRansomEl = document.getElementById("intel-live-kev-ransom");
    var globeRotation = [-15, -18, 0];
    var isDragging = false;
    var rotationTimer = null;
    var contextTimer = null;
    var liveFeedTimer = null;
    var viewRotateTimer = null;
    var contextIndex = 0;

    var svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    var defs = svg.append("defs");

    var oceanGradDark = defs.append("radialGradient")
      .attr("id", "intel-ocean-grad-dark")
      .attr("cx", "38%")
      .attr("cy", "30%")
      .attr("r", "70%");
    oceanGradDark.append("stop").attr("offset", "0%").attr("stop-color", "#113153");
    oceanGradDark.append("stop").attr("offset", "55%").attr("stop-color", "#0b1f37");
    oceanGradDark.append("stop").attr("offset", "100%").attr("stop-color", "#060f1d");

    var oceanGradLight = defs.append("radialGradient")
      .attr("id", "intel-ocean-grad-light")
      .attr("cx", "38%")
      .attr("cy", "30%")
      .attr("r", "72%");
    oceanGradLight.append("stop").attr("offset", "0%").attr("stop-color", "#dff0ff");
    oceanGradLight.append("stop").attr("offset", "55%").attr("stop-color", "#c3ddf5");
    oceanGradLight.append("stop").attr("offset", "100%").attr("stop-color", "#9fc6ea");

    var atmosphereGrad = defs.append("radialGradient")
      .attr("id", "intel-atmosphere-grad")
      .attr("cx", "35%")
      .attr("cy", "28%")
      .attr("r", "76%");
    atmosphereGrad.append("stop").attr("offset", "60%").attr("stop-color", "rgba(0,0,0,0)");
    atmosphereGrad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(125, 211, 252, 0.55)");

    var glow = defs.append("filter").attr("id", "intel-map-glow");
    glow.append("feGaussianBlur").attr("stdDeviation", 1.8).attr("result", "coloredBlur");
    var merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "coloredBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    var globeSoftGlow = defs.append("filter").attr("id", "intel-globe-softglow");
    globeSoftGlow.append("feGaussianBlur").attr("stdDeviation", 4.2).attr("result", "blurred");
    var globeMerge = globeSoftGlow.append("feMerge");
    globeMerge.append("feMergeNode").attr("in", "blurred");
    globeMerge.append("feMergeNode").attr("in", "SourceGraphic");

    var projection = d3.geoNaturalEarth1();
    var path = d3.geoPath(projection);
    var graticule = d3.geoGraticule10();

    var backdropLayer = svg.append("g").attr("class", "threat_map_backdrop");
    var baseLayer = svg.append("g").attr("class", "threat_map_base");
    var flowLayer = svg.append("g").attr("class", "threat_map_flows");
    var hotspotLayer = svg.append("g").attr("class", "threat_map_hotspots");

    var globeShadow = backdropLayer.append("ellipse").attr("class", "threat_globe_shadow");
    var starsLayer = backdropLayer.append("g").attr("class", "threat_map_stars");

    for (var s = 0; s < 110; s += 1) {
      starsLayer.append("circle")
        .attr("class", "threat_star")
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 1.4 + 0.25)
        .attr("opacity", Math.random() * 0.45 + 0.2)
        .style("animation-delay", (Math.random() * 3).toFixed(2) + "s");
    }

    var ocean = baseLayer.append("path").datum({ type: "Sphere" }).attr("class", "threat_map_ocean");
    var atmosphere = baseLayer.append("path").datum({ type: "Sphere" }).attr("class", "threat_map_atmosphere");
    var grid = baseLayer.append("path").datum(graticule).attr("class", "threat_map_graticule");

    function renderLiveFeed(feed) {
      if (!liveFeedListEl) return;

      if (!feed || !Array.isArray(feed.liveItems)) {
        liveFeedListEl.innerHTML = '<li><span>Live feed unavailable. Run the scraper to refresh local data.</span></li>';
        if (liveFeedUpdatedEl) liveFeedUpdatedEl.textContent = "No live snapshot available";
        if (liveKevTotalEl) liveKevTotalEl.textContent = "-";
        if (liveKev30El) liveKev30El.textContent = "-";
        if (liveKevRansomEl) liveKevRansomEl.textContent = "-";
        return;
      }

      if (liveKevTotalEl) liveKevTotalEl.textContent = String(feed.metrics && feed.metrics.kevTotal != null ? feed.metrics.kevTotal : "-");
      if (liveKev30El) liveKev30El.textContent = String(feed.metrics && feed.metrics.kevAddedLast30d != null ? feed.metrics.kevAddedLast30d : "-");
      if (liveKevRansomEl) liveKevRansomEl.textContent = String(feed.metrics && feed.metrics.kevKnownRansomwareUse != null ? feed.metrics.kevKnownRansomwareUse : "-");

      if (liveFeedUpdatedEl) {
        var dt = feed.generatedAt ? new Date(feed.generatedAt) : null;
        liveFeedUpdatedEl.textContent = dt && !Number.isNaN(dt.getTime())
          ? "Live snapshot: " + dt.toLocaleString()
          : "Live snapshot timestamp unavailable";
      }

      var items = feed.liveItems.slice(0, 8);
      liveFeedListEl.innerHTML = items.map(function(item) {
        var ref = item.referenceUrl ? '<a href="' + escapeHtml(item.referenceUrl) + '" target="_blank" rel="noopener noreferrer">Reference</a>' : "";
        var cve = escapeHtml(item.cve || "N/A");
        var title = escapeHtml(item.name || "Known exploited vulnerability");
        var vendor = escapeHtml(item.vendor || "Unknown");
        var dateAdded = escapeHtml(item.dateAdded || "");
        var dueDate = escapeHtml(item.dueDate || "");
        var summary = escapeHtml(item.summary || "");
        var ransomware = escapeHtml(item.knownRansomwareCampaignUse || "Unknown");

        return '<li>' +
          '<div class="intel_live_feed_head"><strong>' + cve + '</strong><span>' + dateAdded + '</span></div>' +
          '<p>' + title + '</p>' +
          '<small>Vendor: ' + vendor + ' | Ransomware use: ' + ransomware + (dueDate ? ' | Due: ' + dueDate : '') + '</small>' +
          '<em>' + summary + '</em>' +
          (ref ? '<div class="intel_live_feed_ref">' + ref + '</div>' : '') +
          '</li>';
      }).join("");
    }

    function updateDataModeNote(meta) {
      if (!dataNoteEl) return;
      if (!meta || meta.mode !== "pipeline") {
        dataNoteEl.textContent = "Data mode: template dataset. Add your pipeline output via data/threat-map-data.json or window.THREAT_PIPELINE_DATA.";
        return;
      }

      var source = meta.source || "custom dataset";
      var updated = meta.updatedAt ? " | Updated: " + meta.updatedAt : "";
      dataNoteEl.textContent = "Data mode: pipeline dataset loaded from " + source + updated + ".";
    }

    function getViewData() {
      return viewConfigs[currentView] || viewConfigs.campaign;
    }

    function applyViewData() {
      var data = getViewData();
      setText("intel-kpi-1-value", data.kpis[0].value);
      setText("intel-kpi-1-label", data.kpis[0].label);
      setText("intel-kpi-2-value", data.kpis[1].value);
      setText("intel-kpi-2-label", data.kpis[1].label);
      setText("intel-kpi-3-value", data.kpis[2].value);
      setText("intel-kpi-3-label", data.kpis[2].label);
      setText("intel-victim-title", data.victimTitle);
      setText("intel-victim-intro", data.victimIntro);

      var victimList = document.getElementById("intel-victim-list");
      if (!victimList) return;
      victimList.innerHTML = data.victimBars.map(function(item) {
        return '<li><span>' + item.region + '</span><strong>' + item.pct + '%</strong><em style="--bar:' + item.pct + '%"></em></li>';
      }).join("");

      if (sourceListEl) {
        var refs = Array.isArray(data.sourceRefs) ? data.sourceRefs : [];
        sourceListEl.innerHTML = refs.length
          ? refs.map(function(ref) {
            return '<li><a href="' + ref.url + '" target="_blank" rel="noopener noreferrer">' + ref.label + '</a></li>';
          }).join("")
          : '<li><span>No external references provided for this view.</span></li>';
      }

      contextIndex = 0;
      renderLiveContext(data);
    }

    function renderLiveContext(data) {
      if (!liveContextTextEl || !liveContextMetaEl) return;
      var contexts = Array.isArray(data.liveContexts) ? data.liveContexts : [];
      if (!contexts.length) {
        liveContextTextEl.textContent = "No live context entries for this view yet. Add liveContexts in your pipeline data.";
        liveContextMetaEl.textContent = "Severity: n/a | Region: n/a | Time: n/a";
        return;
      }

      var item = contexts[contextIndex % contexts.length];
      liveContextTextEl.textContent = item.summary;
      liveContextMetaEl.textContent = "Severity: " + item.severity.toUpperCase() + " | Region: " + item.region + " | Time: " + item.timestamp;
    }

    function setViewButtons() {
      document.querySelectorAll(".intel_view_btn").forEach(function(btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-intel-view") === currentView);
      });
    }

    function getAvailableViewOrder() {
      return Array.prototype.slice.call(document.querySelectorAll(".intel_view_btn")).map(function(btn) {
        return btn.getAttribute("data-intel-view");
      }).filter(function(viewId) {
        return !!viewConfigs[viewId];
      });
    }

    function startViewAutoRotate(countries) {
      if (viewRotateTimer) window.clearInterval(viewRotateTimer);
      viewRotateTimer = window.setInterval(function() {
        var order = getAvailableViewOrder();
        if (order.length < 2) return;
        var idx = order.indexOf(currentView);
        currentView = order[(idx + 1) % order.length];
        setViewButtons();
        applyViewData();
        drawAll(countries);
      }, 5000);
    }

    function isVisible(lonLat) {
      if (mapMode !== "globe") return true;
      var rot = projection.rotate();
      var center = [-rot[0], -rot[1]];
      return d3.geoDistance(lonLat, center) < Math.PI / 2;
    }

    function flowLine(from, to) {
      var interp = d3.geoInterpolate(from, to);
      var coords = [];
      for (var i = 0; i <= 30; i += 1) coords.push(interp(i / 30));
      return { type: "LineString", coordinates: coords };
    }

    function setupProjection(countries) {
      if (mapMode === "globe") {
        projection = d3.geoOrthographic()
          .translate([width / 2, height / 2])
          .scale(Math.min(width, height) * 0.42)
          .clipAngle(90)
          .rotate(globeRotation);
      } else {
        projection = d3.geoNaturalEarth1();
        projection.fitExtent([[16, 16], [width - 16, height - 16]], countries);
      }
      path = d3.geoPath(projection);
    }

    function drawAll(countries) {
      setupProjection(countries);
      var isLight = document.body && document.body.classList.contains("theme-light");
      var translate = projection.translate ? projection.translate() : [width / 2, height / 2];
      var scale = projection.scale ? projection.scale() : Math.min(width, height) * 0.42;

      globeShadow
        .attr("cx", translate[0])
        .attr("cy", translate[1] + scale * 0.92)
        .attr("rx", scale * 0.86)
        .attr("ry", scale * 0.14)
        .style("display", mapMode === "globe" ? null : "none");

      starsLayer.style("display", mapMode === "globe" ? null : "none");

      ocean
        .attr("d", path)
        .attr("fill", mapMode === "globe"
          ? (isLight ? "url(#intel-ocean-grad-light)" : "url(#intel-ocean-grad-dark)")
          : null)
        .attr("filter", mapMode === "globe" ? "url(#intel-globe-softglow)" : null);

      atmosphere
        .attr("d", path)
        .style("display", mapMode === "globe" ? null : "none");

      grid.attr("d", path);

      var countrySel = baseLayer.selectAll("path.threat_map_country").data(countries.features);
      countrySel.enter().append("path").attr("class", "threat_map_country");
      baseLayer.selectAll("path.threat_map_country")
        .attr("d", path)
        .style("display", function(d) {
          if (mapMode !== "globe") return null;
          var c = d3.geoCentroid(d);
          return isVisible(c) ? null : "none";
        });

      var activeData = getViewData();

      var flowSel = flowLayer.selectAll("path.threat_flow_path").data(activeData.flows);
      flowSel.enter().append("path").attr("class", function(d) { return "threat_flow_path " + toneClass(d.tone); });
      flowSel.exit().remove();
      flowLayer.selectAll("path.threat_flow_path")
        .attr("d", function(d) { return path(flowLine(d.from, d.to)); })
        .style("display", function(d) {
          if (mapMode !== "globe") return null;
          return (isVisible(d.from) || isVisible(d.to)) ? null : "none";
        });

      var points = activeData.infraPoints.concat(activeData.victimPoints);
      var markers = hotspotLayer.selectAll("g.threat_marker").data(points);
      var markersEnter = markers.enter().append("g").attr("class", function(d) { return "threat_marker " + toneClass(d.tone); });
      markers.exit().remove();

      markersEnter.append("circle").attr("class", "threat_marker_pulse").attr("r", 13);
      markersEnter.append("circle").attr("class", "threat_marker_core").attr("r", 4).attr("filter", "url(#intel-map-glow)");
      markersEnter.append("line").attr("class", "threat_marker_link");
      markersEnter.append("text").attr("class", "threat_marker_label");
      markersEnter.append("title");

      hotspotLayer.selectAll("g.threat_marker")
        .attr("transform", function(d) {
          var c = projection([d.lon, d.lat]);
          return c ? "translate(" + c[0] + "," + c[1] + ")" : "translate(-999,-999)";
        })
        .style("display", function(d) {
          return isVisible([d.lon, d.lat]) ? null : "none";
        });

      hotspotLayer.selectAll("g.threat_marker title")
        .text(function(d) { return d.label; });

      var placedBoxes = [];
      hotspotLayer.selectAll("g.threat_marker").each(function(d, i) {
        var marker = d3.select(this);
        if (marker.style("display") === "none") return;

        var label = marker.select("text.threat_marker_label");
        var link = marker.select("line.threat_marker_link");
        var raw = String(d.label || "");
        var textValue = raw.length > 30 ? raw.slice(0, 28) + "..." : raw;
        label.text(textValue).attr("opacity", 1);
        link.attr("opacity", 1);

        var chosen = null;
        var candidates = labelCandidates(i);
        for (var cidx = 0; cidx < candidates.length; cidx += 1) {
          var c = candidates[cidx];
          label.attr("x", c.x).attr("y", c.y);
          var box = label.node().getBBox();
          var padded = { x: box.x - 3, y: box.y - 2, w: box.width + 6, h: box.height + 4 };
          var out = padded.x < 2 || padded.y < 2 || (padded.x + padded.w) > (width - 2) || (padded.y + padded.h) > (height - 2);
          var overlap = placedBoxes.some(function(p) {
            return !(padded.x + padded.w < p.x || p.x + p.w < padded.x || padded.y + padded.h < p.y || p.y + p.h < padded.y);
          });
          if (!out && !overlap) {
            chosen = { offset: c, box: padded };
            break;
          }
        }

        if (!chosen) {
          label.attr("opacity", 0);
          link.attr("opacity", 0);
          return;
        }

        placedBoxes.push(chosen.box);
        var y = chosen.offset.y;
        link
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", chosen.offset.x > 0 ? chosen.offset.x - 4 : chosen.offset.x + 4)
          .attr("y2", y > 0 ? y - 6 : y + 6);
      });
    }

    function startAutoRotate(countries) {
      if (rotationTimer) rotationTimer.stop();
      if (mapMode !== "globe") return;
      rotationTimer = d3.timer(function() {
        if (isDragging) return;
        globeRotation = [globeRotation[0] + 0.11, globeRotation[1], globeRotation[2] || 0];
        drawAll(countries);
      });
    }

    function spawnLiveBlink() {
      var activeData = getViewData();
      var pool = activeData.infraPoints.concat(activeData.victimPoints);
      if (!pool.length) return;

      if (Array.isArray(activeData.liveContexts) && activeData.liveContexts.length && liveContextTextEl && liveContextMetaEl) {
        contextIndex = (contextIndex + 1) % activeData.liveContexts.length;
        renderLiveContext(activeData);
        var livePick = activeData.liveContexts[contextIndex];
        if (livePick && Number.isFinite(livePick.lon) && Number.isFinite(livePick.lat)) {
          pool = [{ lon: livePick.lon, lat: livePick.lat, tone: livePick.tone || "cyan" }];
        }
      }

      var pick = pool[Math.floor(Math.random() * pool.length)];
      var c = projection([pick.lon, pick.lat]);
      if (!c || !isVisible([pick.lon, pick.lat])) return;

      var pulse = hotspotLayer.append("circle")
        .attr("class", "threat_marker_live")
        .attr("cx", c[0])
        .attr("cy", c[1])
        .attr("r", 2.5)
        .attr("opacity", 0.9);

      pulse.transition()
        .duration(900)
        .ease(d3.easeCubicOut)
        .attr("r", 26)
        .attr("opacity", 0)
        .remove();
    }

    Promise.all([d3.json(MAP_DATA_URL), loadPipelineData(), loadLiveThreatFeed()]).then(function(results) {
      var world = results[0];
      var pipelinePayload = results[1];
      var liveFeedPayload = results[2];
      if (pipelinePayload && pipelinePayload.data) {
        viewConfigs = buildViewConfigsFromPipeline(pipelinePayload.data);
      }
      renderLiveFeed(liveFeedPayload);

      if (!viewConfigs[currentView]) currentView = "campaign";
      updateDataModeNote({
        mode: pipelinePayload && pipelinePayload.mode ? pipelinePayload.mode : "template",
        source: pipelinePayload && pipelinePayload.data && pipelinePayload.data.meta && pipelinePayload.data.meta.source
          ? String(pipelinePayload.data.meta.source)
          : (pipelinePayload && pipelinePayload.source ? pipelinePayload.source : "template"),
        updatedAt: pipelinePayload && pipelinePayload.data && pipelinePayload.data.meta && pipelinePayload.data.meta.updatedAt
          ? String(pipelinePayload.data.meta.updatedAt)
          : ""
      });

      var countries = topojson.feature(world, world.objects.countries);
      applyViewData();
      setViewButtons();
      drawAll(countries);
      startAutoRotate(countries);
      if (contextTimer) window.clearInterval(contextTimer);
      contextTimer = window.setInterval(spawnLiveBlink, 2200);
      if (liveFeedTimer) window.clearInterval(liveFeedTimer);
      liveFeedTimer = window.setInterval(function() {
        loadLiveThreatFeed().then(function(payload) {
          renderLiveFeed(payload);
        });
      }, 300000);
      startViewAutoRotate(countries);

      document.querySelectorAll(".intel_view_btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var nextView = btn.getAttribute("data-intel-view");
          if (!viewConfigs[nextView]) return;
          currentView = nextView;
          setViewButtons();
          applyViewData();
          drawAll(countries);
          startViewAutoRotate(countries);
        });
      });

      svg.call(
        d3.drag()
          .on("start", function() { isDragging = true; })
          .on("drag", function(event) {
            if (mapMode !== "globe") return;
            var k = 0.2;
            var lon = globeRotation[0] + event.dx * k;
            var lat = globeRotation[1] - event.dy * k;
            lat = Math.max(-70, Math.min(70, lat));
            globeRotation = [lon, lat, globeRotation[2] || 0];
            drawAll(countries);
          })
          .on("end", function() { isDragging = false; })
      );
    }).catch(function() {
      svg.append("text")
        .attr("class", "threat_map_fallback")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Threat map data could not be loaded.");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderThreatMap);
  } else {
    renderThreatMap();
  }
})();
