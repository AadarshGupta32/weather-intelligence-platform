"""
Real-Time Weather Intelligence & Emergency Response Platform
AI & Misinformation Verification Microservice
Port: 8001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import re
import math
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="Weather Intelligence AI Verification Service",
    version="1.0.0",
    description="NLP Rumor Detection, Panic Sentiment Analysis, and Hazard Classification Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextVerificationRequest(BaseModel):
    text: str = Field(..., description="Raw report text or social media post content")
    source: Optional[str] = Field("CITIZEN_REPORT", description="Source channel: CITIZEN_REPORT, TWITTER_IMD, NEWS_WIRE")
    author: Optional[str] = Field("Anonymous", description="Username or citizen identifier")

class TextVerificationResponse(BaseModel):
    rumor_score: float
    is_rumor: bool
    sentiment: str
    panic_index: float
    hazard_type: str
    confidence: float
    flags: List[str]
    explanation: str

class HazardClassificationRequest(BaseModel):
    text: str

class HazardClassificationResponse(BaseModel):
    hazard_type: str
    confidence: float
    severity_level: str
    extracted_keywords: List[str]

# Pattern banks for Rumor and Panic heuristics & NLP keywords
PANIC_TRIGGERS = [
    r"\b(dam (burst|broke|broken|overflowing|breached|collapse))\b",
    r"\b(hundreds|thousands|\d{3,}) (dead|drowned|killed|trapped)\b",
    r"\b(catastrophe|apocalypse|doomsday|massive explosion)\b",
    r"\b(run for your lives|flee immediately|city submerged completely)\b",
    r"\b(deadly tsunami|toxic chemical rain|nuclear fallout)\b",
    r"\b(share before deleted|govt hiding the truth|media won't show)\b",
    r"\b(secret alert|emergency order declared everywhere)\b",
    r"\b(water reached (2nd|3rd|4th) floor everywhere)\b"
]

CREDIBILITY_SIGNALS = [
    r"\b(#imd|imd alert|meteorological department|official warning)\b",
    r"\b(ndrf deployed|sdrf team|helpline \d{3,}|evacuation camp)\b",
    r"\b(measured \d+\s?mm|rainfall recorded|station data)\b",
    r"\b(collector office|district magistrate|advisory issued)\b",
    r"\b(waterlogged near|slow traffic at|tree fallen on)\b"
]

HAZARD_KEYWORDS = {
    "FLASH_FLOOD": ["flash flood", "flood", "submerged", "inundated", "deluge", "water overflow", "river rising", "swept away", "breach"],
    "WATERLOGGING": ["waterlogging", "water logged", "puddle", "drain choke", "street flood", "knee deep", "traffic jam water"],
    "THUNDERSTORM": ["thunderstorm", "lightning", "cloudburst", "heavy downpour", "gusty winds", "thunder", "hailstorm", "hail"],
    "CYCLONE_WIND": ["cyclone", "gale", "storm surge", "hurricane", "squall", "uprooted tree", "roof blown", "high wind"],
    "HEATWAVE": ["heatwave", "loo", "extreme heat", "temperature 4", "sunstroke", "scorching heat", "heat stroke"],
    "FOG": ["dense fog", "smog", "zero visibility", "blind flight", "morning fog"],
    "LANDSLIDE": ["landslide", "mudslide", "rockfall", "debris flow", "hill collapse"]
}

def analyze_panic_and_rumor(text: str, source: str) -> tuple[float, float, str, List[str], str]:
    lower_text = text.lower()
    flags = []
    
    # 1. Check panic triggers
    panic_score = 0.05
    for pattern in PANIC_TRIGGERS:
        if re.search(pattern, lower_text):
            panic_score += 0.35
            flags.append(f"High panic trigger matched: '{re.search(pattern, lower_text).group(0)}'")
    
    # 2. Exclamation & uppercase shouting analysis
    caps_count = sum(1 for c in text if c.isupper())
    total_alpha = sum(1 for c in text if c.isalpha())
    caps_ratio = (caps_count / total_alpha) if total_alpha > 0 else 0
    if caps_ratio > 0.4 and total_alpha > 15:
        panic_score += 0.15
        flags.append("Excessive uppercase shouting detected (sensationalism)")
        
    exclamations = text.count("!")
    if exclamations >= 3:
        panic_score += 0.1
        flags.append("Excessive exclamation marks (urgency inflation)")
        
    # 3. Credibility boosters
    credibility_discount = 0.0
    for pattern in CREDIBILITY_SIGNALS:
        if re.search(pattern, lower_text):
            credibility_discount += 0.2
            flags.append(f"Credible anchor detected: '{re.search(pattern, lower_text).group(0)}'")
            
    if source == "TWITTER_IMD" or "official" in source.lower():
        credibility_discount += 0.3
        
    # Compute rumor score (clamped between 0.0 and 1.0)
    raw_rumor = max(0.02, min(0.99, (panic_score - credibility_discount)))
    
    # Sentiment calculation
    if raw_rumor > 0.6:
        sentiment = "PANIC_ALARMIST"
    elif raw_rumor > 0.35:
        sentiment = "DISTRESSED_URGENT"
    elif credibility_discount > 0.2:
        sentiment = "INFORMATIVE_OBJECTIVE"
    else:
        sentiment = "OBSERVATIONAL_NEUTRAL"
        
    is_rumor = raw_rumor >= 0.70
    
    explanation = (
        f"Rumor assessment: {raw_rumor:.2f} ({'FLAGGED AS POTENTIAL RUMOR' if is_rumor else 'VALIDATED/PLAUSIBLE'}). "
        f"Panic index: {panic_score:.2f}, Credibility offset: {credibility_discount:.2f}."
    )
    return round(raw_rumor, 3), round(min(1.0, panic_score), 3), sentiment, flags, explanation

def classify_hazard(text: str) -> tuple[str, float, str, List[str]]:
    lower_text = text.lower()
    scores = {}
    matched_words = []
    
    for hazard, keywords in HAZARD_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in lower_text:
                score += 1
                matched_words.append(kw)
        if score > 0:
            scores[hazard] = score
            
    if not scores:
        return "GENERAL_WEATHER", 0.5, "MODERATE", ["weather"]
        
    best_hazard = max(scores, key=scores.get)
    max_score = scores[best_hazard]
    confidence = min(0.98, 0.60 + (max_score * 0.12))
    
    # Severity assessment
    if any(w in lower_text for w in ["severe", "danger", "emergency", "fatal", "trapped", "red alert", "rescue"]):
        severity = "CRITICAL"
    elif any(w in lower_text for w in ["heavy", "intense", "high", "orange alert", "submerged"]):
        severity = "HIGH"
    elif any(w in lower_text for w in ["yellow alert", "waterlogging", "moderate", "slow"]):
        severity = "MEDIUM"
    else:
        severity = "LOW"
        
    return best_hazard, round(confidence, 2), severity, list(set(matched_words))

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "AI-Misinformation-Verification-Engine",
        "models": ["NLP-Rumor-Scorer-v1", "Weather-Hazard-Classifier-v1"],
        "version": "1.0.0"
    }

@app.post("/api/v1/verify-text", response_model=TextVerificationResponse)
def verify_text(req: TextVerificationRequest):
    rumor_score, panic_idx, sentiment, flags, explanation = analyze_panic_and_rumor(req.text, req.source)
    hazard, conf, severity, _ = classify_hazard(req.text)
    
    logger.info(f"Analyzed text from {req.author} [{req.source}]: RumorScore={rumor_score}, Hazard={hazard}")
    
    return TextVerificationResponse(
        rumor_score=rumor_score,
        is_rumor=(rumor_score >= 0.70),
        sentiment=sentiment,
        panic_index=panic_idx,
        hazard_type=hazard,
        confidence=conf,
        flags=flags,
        explanation=explanation
    )

@app.post("/api/v1/classify-hazard", response_model=HazardClassificationResponse)
def classify_hazard_endpoint(req: HazardClassificationRequest):
    hazard, conf, severity, kws = classify_hazard(req.text)
    return HazardClassificationResponse(
        hazard_type=hazard,
        confidence=conf,
        severity_level=severity,
        extracted_keywords=kws
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
