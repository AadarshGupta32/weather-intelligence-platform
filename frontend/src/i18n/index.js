/**
 * Internationalization & Localization Dictionary
 * Supports English & Hindi (हिंदी) for ground citizen accessibility
 */

export const translations = {
    en: {
        app: {
            title: "SURAKSHA-NET",
            subtitle: "National Weather Intelligence & Emergency Response Platform",
            authorityBadge: "MoES & IMD Validated Ground Truth System",
            tagline: "Crowdsourced Ground Truth • AI Rumor Forensics • Real-Time Dispatch",
            live: "LIVE STREAM",
            roleCitizen: "Citizen Scout",
            roleCommander: "Ops Commander",
            sitrep: "SITREP",
            simulate: "Simulate Crisis",
            broadcast: "Mass Broadcast"
        },
        hotlines: {
            title: "Emergency Helplines",
            ndrf: "NDRF HQ (1078)",
            disaster: "State Disaster Cell (1077)",
            medical: "Ambulance (108)",
            police: "National Emergency (112)",
            fire: "Fire Brigade (101)"
        },
        sections: {
            overview: "1. Operational Overview",
            gisMap: "2. Geo-Hazard GIS",
            feed: "3. Ground Truth Feed",
            report: "4. Citizen Portal",
            trust: "5. Sentinel Trust"
        },
        metrics: {
            activeIncidents: "Active Ground Incidents",
            accuracy: "AI Ground-Truth Accuracy",
            shelters: "Emergency Shelters Ready",
            radar: "IMD Doppler Telemetry",
            critical: "Critical",
            rumorsFiltered: "Rumors Filtered",
            facilitiesActive: "Facilities Active",
            wind: "Wind"
        },
        gis: {
            title: "Live Geo-Hazard GIS & Evacuation Grid",
            desc: "Spatial correlation of citizen ground alerts with official IMD radar Doppler swaths, relief camps, and safe evacuation corridors.",
            streets: "Streets",
            satellite: "Satellite",
            clean: "Clean",
            shelters: "Shelters",
            routes: "Corridors",
            radar: "Radar Swath",
            recenter: "Recenter",
            findShelter: "Find Nearest Shelter",
            radius: "Radius"
        },
        feed: {
            title: "Verified Ground-Truth Incident Stream",
            desc: "Real-time field reports synthesized with automated pHash image deduplication, LLM sentiment audit, and commander verification.",
            all: "All Feeds",
            verified: "Verified Ground Truth",
            critical: "Critical Urgency",
            rumors: "Debunked Rumors",
            searchPlaceholder: "Filter by keyword, locality, or hazard...",
            focusMap: "Focus Map",
            forensics: "AI Forensics",
            dispatch: "Dispatch Squad",
            listen: "Listen"
        },
        report: {
            title: "Incident Reporting Portal & Lifecycle Tracker",
            desc: "Submit verified ground observation with client-side media fingerprinting, and monitor end-to-end disaster response progression.",
            catTitle: "Select Hazard & Location",
            detailsTitle: "Incident Details & Photo Evidence",
            step1: "1. Category",
            step2: "2. Evidence",
            step3: "3. Verified",
            headlinePlaceholder: "e.g., Severe waterlogging near Vijay Nagar Square",
            descPlaceholder: "Describe water depth, blocked roads, trapped people, or urgent assistance needed...",
            uploadText: "Click to browse or take ground photo",
            submitBtn: "Submit Incident Report",
            detectLocation: "Use My GPS Location"
        },
        trust: {
            title: "Sentinel Trust & Community Leaderboard",
            desc: "Anti-disinformation trust framework rewarding citizens who report verified ground conditions and penalizing panic-inducing falsehoods.",
            meterLabel: "Civic Trust Index",
            verifiedReports: "Verified Reports",
            falseAlarms: "False Alarms",
            metroRank: "Rank #1",
            tableHeading: "Top Verified Field Sentinels"
        },
        hazards: {
            FLASH_FLOOD: "Flash Flood Surge",
            WATERLOGGING: "Urban Waterlogging",
            CYCLONE_WIND: "Squall / Cyclone Wind",
            HEATWAVE: "Heatwave Alert",
            TREE_FALL: "Fallen Tree / Blockage",
            THUNDERSTORM: "Severe Thunderstorm",
            LANDSLIDE: "Landslide Risk"
        }
    },
    hi: {
        app: {
            title: "सुरक्षा-नेट",
            subtitle: "राष्ट्रीय मौसम आसूचना एवं आपदा आपातकालीन प्रतिक्रिया मंच",
            authorityBadge: "पृथ्वी विज्ञान मंत्रालय एवं IMD द्वारा प्रमाणित प्रणाली",
            tagline: "नागरिक अवलोकन • AI अफवाह जांच • त्वरित बचाव दल प्रेषण",
            live: "लाइव प्रसारण",
            roleCitizen: "नागरिक दृश्य",
            roleCommander: "कमांड सेंटर",
            sitrep: "सिटरेप रिपोर्ट",
            simulate: "आपदा सिमुलेशन",
            broadcast: "सामूहिक चेतावनी"
        },
        hotlines: {
            title: "आपातकालीन हेल्पलाइन",
            ndrf: "एनडीआरएफ (1078)",
            disaster: "राज्य आपदा सेल (1077)",
            medical: "एम्बुलेंस (108)",
            police: "राष्ट्रीय आपातकाल (112)",
            fire: "दमकल सेवा (101)"
        },
        sections: {
            overview: "1. परिचालन समीक्षा",
            gisMap: "2. भू-आपदा GIS नक्शा",
            feed: "3. सत्यापित घटना प्रवाह",
            report: "4. नागरिक रिपोर्टिंग",
            trust: "5. नागरिक प्रतिष्ठा"
        },
        metrics: {
            activeIncidents: "सक्रिय भू-आपदा घटनाएं",
            accuracy: "AI सत्यता सटीकता दर",
            shelters: "सक्रिय राहत शिविर",
            radar: "IMD डॉपलर रडार मौसम",
            critical: "गंभीर",
            rumorsFiltered: "अफवाहें निरस्त",
            facilitiesActive: "शिविर सक्रिय",
            wind: "हवा"
        },
        gis: {
            title: "लाइव भू-आपदा GIS एवं निकासी गलियारा",
            desc: "नागरिक आपदा रिपोर्टों का मौसम विज्ञान विभाग के डॉपलर रडार, राहत शिविरों और सुरक्षित निकासी मार्गों से वास्तविक समय मिलान।",
            streets: "सड़कें",
            satellite: "उपग्रह",
            clean: "साफ नक्शा",
            shelters: "राहत शिविर",
            routes: "निकासी मार्ग",
            radar: "रडार परिधि",
            recenter: "केंद्र पर लाएं",
            findShelter: "निकटतम शिविर खोजें",
            radius: "दायरा"
        },
        feed: {
            title: "सत्यापित जमीनी घटनाओं की सूची",
            desc: "स्वचालित छवि मिलान (pHash), भाषा विश्लेषण एवं आपातकालीन कमांडरों द्वारा सत्यापित वास्तविक घटनाएं।",
            all: "सभी घटनाएं",
            verified: "सत्यापित सत्य",
            critical: "अति गंभीर",
            rumors: "खारिज अफवाहें",
            searchPlaceholder: "स्थान, आपदा या कीवर्ड द्वारा खोजें...",
            focusMap: "नक्शे पर देखें",
            forensics: "AI फोरेंसिक",
            dispatch: "दल भेजें",
            listen: "सुनें"
        },
        report: {
            title: "नागरिक आपदा रिपोर्टिंग पोर्टल",
            desc: "जमीनी आपदा की फोटो एवं जीपीएस स्थान दर्ज करें और निवारण की स्थिति लाइव ट्रैक करें।",
            catTitle: "आपदा प्रकार एवं स्थान चुनें",
            detailsTitle: "घटना का विवरण एवं फोटो साक्ष्य",
            step1: "1. श्रेणी",
            step2: "2. साक्ष्य",
            step3: "3. सत्यापित",
            headlinePlaceholder: "उदा. विजय नगर चौराहे पर भारी जलभराव",
            descPlaceholder: "पानी की गहराई, अवरुद्ध मार्ग, फंसे हुए लोग या आवश्यक सहायता का विवरण लिखें...",
            uploadText: "फोटो खींचें या अपलोड करें",
            submitBtn: "घटना रिपोर्ट प्रेषित करें",
            detectLocation: "मेरा वर्तमान जीपीएस स्थान लें"
        },
        trust: {
            title: "नागरिक विश्वास सूचकांक एवं लीडरबोर्ड",
            desc: "सच्ची सूचना देने वाले सजग नागरिकों को सम्मान एवं भ्रामक अफवाह फैलाने वालों को दंडित करने की प्रणाली।",
            meterLabel: "नागरिक विश्वास सूचकांक",
            verifiedReports: "सत्यापित रिपोर्टें",
            falseAlarms: "गलत सूचनाएं",
            metroRank: "रैंक #1",
            tableHeading: "शीर्ष प्रमाणित नागरिक प्रहरी"
        },
        hazards: {
            FLASH_FLOOD: "अचानक आई बाढ़",
            WATERLOGGING: "शहरी जलभराव",
            CYCLONE_WIND: "तूफानी हवा / चक्रवात",
            HEATWAVE: "भीषण लू चेतावनी",
            TREE_FALL: "गिरा हुआ पेड़ / अवरोध",
            THUNDERSTORM: "भीषण आंधी-तूफान",
            LANDSLIDE: "भूस्खलन का खतरा"
        }
    }
};

export const i18n = translations.en;
