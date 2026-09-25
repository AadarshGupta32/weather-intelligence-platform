/**
 * Resilient Mock Data for SURAKSHA-NET
 * Guarantees smooth UI operation during local testing and offline demos
 */

export const MOCK_REPORTS = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8937, 22.7533] },
        properties: {
            id: 1,
            trackingId: "REP-VJ001",
            title: "Severe Waterlogging near Vijay Nagar Square",
            description: "Water level reached 3 feet near underpass. Stalled vehicles reported. Ground rescue teams diverted traffic via Ring Road.",
            hazardType: "WATERLOGGING",
            severity: "HIGH",
            status: "ADMIN_VERIFIED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_arun",
            reporterBadge: "DISASTER_SENTINEL",
            reporterTrustScore: 92.5,
            rumorScore: 0.04,
            isRumor: false,
            sentiment: "OBJECTIVE_INFORMATIVE",
            sourceType: "CITIZEN_MOBILE",
            mediaUrl: "/uploads/ground_flood.jpg",
            phash: "cccc3333ff333373",
            duplicateFlag: false,
            createdAt: new Date().toISOString()
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8577, 22.7196] },
        properties: {
            id: 2,
            trackingId: "REP-RW002",
            title: "Kahn River Overflow Alert near Rajwada Bridge",
            description: "Kahn river overflowing banks following 95mm precipitation. Low-lying slum settlements inundated. Evacuation underway.",
            hazardType: "FLASH_FLOOD",
            severity: "CRITICAL",
            status: "ACTIONED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_priya",
            reporterBadge: "ACTIVE_SCOUT",
            reporterTrustScore: 78.0,
            rumorScore: 0.06,
            isRumor: false,
            sentiment: "DISTRESSED_URGENT",
            sourceType: "TWITTER_IMD",
            mediaUrl: "/uploads/ground_flood.jpg",
            phash: "1122334455667788",
            duplicateFlag: false,
            createdAt: new Date().toISOString()
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8839, 22.7244] },
        properties: {
            id: 3,
            trackingId: "REP-PL003",
            title: "Massive Banyan Tree Fallen on Main AB Road",
            description: "High squall winds uprooted banyan tree near Industry House Palasia blocking carriage lanes. Municipal tree squad alerted.",
            hazardType: "CYCLONE_WIND",
            severity: "MEDIUM",
            status: "AI_CHECKED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_arun",
            reporterBadge: "DISASTER_SENTINEL",
            reporterTrustScore: 92.5,
            rumorScore: 0.12,
            isRumor: false,
            sentiment: "OBSERVATIONAL_NEUTRAL",
            sourceType: "CITIZEN_REPORT",
            mediaUrl: "",
            phash: null,
            duplicateFlag: false,
            createdAt: new Date().toISOString()
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8652, 22.6738] },
        properties: {
            id: 4,
            trackingId: "REP-RM004",
            title: "RUMOR: Bilawali Dam Collapsed 5000 Dead",
            description: "BILAWALI DAM COLLAPSED COMPLETELY! RUN FOR LIVES! Contradicted by official radar & station telemetry at 0mm rain.",
            hazardType: "FLASH_FLOOD",
            severity: "CRITICAL",
            status: "FALSE_ALARM",
            city: "Indore",
            district: "Indore",
            reportedBy: "panic_bot_99",
            reporterBadge: "NOVICE_SCOUT",
            reporterTrustScore: 15.0,
            rumorScore: 0.98,
            isRumor: true,
            sentiment: "PANIC_ALARMIST",
            sourceType: "TWITTER_IMD",
            mediaUrl: "",
            phash: null,
            duplicateFlag: false,
            createdAt: new Date().toISOString()
        }
    }
];

export const MOCK_SHELTERS = [
    { name: "Holkar Stadium Relief Camp", latitude: 22.7246, longitude: 75.8732, capacity: 1500, availableSlots: 320, type: "EVACUATION_CAMP", address: "Race Course Road, New Palasia, Indore", contactPhone: "+91-731-2544101" },
    { name: "Nehru Stadium Safe Zone", latitude: 22.7092, longitude: 75.8758, capacity: 2000, availableSlots: 150, type: "EVACUATION_CAMP", address: "Residency Area, Indore", contactPhone: "+91-731-2700300" },
    { name: "MY Hospital Trauma Response", latitude: 22.7164, longitude: 75.8705, capacity: 500, availableSlots: 110, type: "MEDICAL_CENTER", address: "Sanyogita Ganj, Indore", contactPhone: "+91-731-2527301" },
    { name: "NDRF Kahn River Boat Depot", latitude: 22.7185, longitude: 75.8540, capacity: 50, availableSlots: 12, type: "NDRF_DEPOT", address: "Riverside Road, Rajwada, Indore", contactPhone: "1078" },
    { name: "Scheme 54 Municipal Shelter", latitude: 22.7562, longitude: 75.8890, capacity: 800, availableSlots: 45, type: "EVACUATION_CAMP", address: "Vijay Nagar Sector A, Indore", contactPhone: "+91-731-2401122" }
];

export const MOCK_LEADERBOARD = [
    { username: "citizen_arun", fullName: "Arun Sharma", score: 92.5, badgeTier: "DISASTER_SENTINEL", verifiedCount: 13 },
    { username: "citizen_priya", fullName: "Priya Patel", score: 78.0, badgeTier: "ACTIVE_SCOUT", verifiedCount: 7 },
    { username: "scout_rahul", fullName: "Rahul Verma", score: 65.0, badgeTier: "ACTIVE_SCOUT", verifiedCount: 5 },
    { username: "citizen_vikram", fullName: "Vikram Singh", score: 42.0, badgeTier: "NOVICE_SCOUT", verifiedCount: 2 }
];

export const MOCK_TELEMETRY = {
    city: "Indore",
    temperature: 31.5,
    precipitationMm: 0.0,
    windSpeedKmh: 23.6,
    humidity: 44.0,
    floodRiskLevel: "NORMAL_READINESS"
};
