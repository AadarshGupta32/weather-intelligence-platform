/**
 * Internationalization & Centralized Platform Copy
 * Allows instant customization of hazard names, status text, and emergency terms
 */

export const i18n = {
    app: {
        title: "SURAKSHA-NET",
        subtitle: "National Weather Intelligence & Emergency Response Platform",
        authorityBadge: "MoES & IMD Validated Ground Truth System",
        tagline: "Crowdsourced Ground Truth • AI Rumor Forensics • Real-Time Dispatch"
    },
    sections: {
        overview: "Operational Overview",
        gisMap: "Live Geo-Hazard GIS",
        feed: "Verified Ground Truth Stream",
        report: "Citizen Incident Portal",
        trust: "Sentinel Trust & Leaderboard"
    },
    roles: {
        citizen: "Citizen Scout View",
        dispatcher: "Ops Commander View"
    },
    hazards: {
        FLASH_FLOOD: "Flash Flood Surge",
        WATERLOGGING: "Urban Waterlogging",
        CYCLONE_WIND: "Squall / Cyclone Wind",
        HEATWAVE: "Heatwave Alert",
        TREE_FALL: "Fallen Tree / Blockage"
    },
    statuses: {
        REPORTED: "Under AI Ingestion",
        AI_CHECKED: "AI Verified",
        ADMIN_VERIFIED: "Authority Confirmed",
        ACTIONED: "Teams Dispatched",
        FALSE_ALARM: "Debunked Rumor"
    },
    badges: {
        NOVICE_SCOUT: "Novice Scout",
        ACTIVE_SCOUT: "Active Scout",
        DISASTER_SENTINEL: "Disaster Sentinel",
        CRISIS_GUARDIAN: "Crisis Guardian"
    }
};
