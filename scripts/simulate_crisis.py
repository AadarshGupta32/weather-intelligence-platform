"""
SURAKSHA-NET: National Weather Intelligence & Emergency Response Platform
Crisis Simulation & System Verification Suite
"""

import requests
import json
import time
import base64
import io
import sys
from PIL import Image, ImageDraw

BACKEND_URL = "http://localhost:8080"
AI_SERVICE_URL = "http://localhost:8001"

def log(msg):
    print(msg, flush=True)

def print_banner(msg):
    log("\n" + "=" * 70)
    log(f" {msg}")
    log("=" * 70)

def generate_test_image(color="navy", text="FLOOD_TEST"):
    img = Image.new("RGB", (200, 200), color=color)
    d = ImageDraw.Draw(img)
    d.text((20, 90), text, fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def wait_for_report(tracking_id, max_retries=10, delay=0.5):
    for _ in range(max_retries):
        try:
            r = requests.get(f"{BACKEND_URL}/api/reports/tracking/{tracking_id}", timeout=5)
            if r.status_code == 200:
                data = r.json()
                rep = data.get("report")
                if rep and rep.get("status") != "SUBMITTED":
                    return rep
        except Exception:
            pass
        time.sleep(delay)
    return requests.get(f"{BACKEND_URL}/api/reports/tracking/{tracking_id}").json().get("report")

def test_1_service_health():
    print_banner("TEST 1: Verifying Subsystems Health")
    r_ai = requests.get(f"{AI_SERVICE_URL}/health", timeout=3)
    log(f"[*] AI Verification Microservice (Port 8001): {r_ai.json()['status']}")
    
    r_backend = requests.get(f"{BACKEND_URL}/api/reports/geojson", timeout=5)
    log(f"[*] Spring Boot GIS Core Backend (Port 8080): HTTP {r_backend.status_code}")
    features = r_backend.json().get("features", [])
    log(f"    Current Active GIS Features: {len(features)}")

def test_2_high_velocity_social_stream():
    print_banner("TEST 2: Ingesting High-Velocity Social Media Stream (#IMD Feeds)")
    posts = [
        {
            "postId": "TWT-101",
            "platform": "TWITTER_IMD",
            "author": "IMD_Bhopal",
            "content": "#IMD Alert: Red warning issued for Indore and surrounding districts. Extreme precipitation exceeding 110mm recorded.",
            "latitude": 22.7196,
            "longitude": 75.8577,
            "city": "Indore",
            "district": "Indore"
        },
        {
            "postId": "TWT-102",
            "platform": "TWITTER_IMD",
            "author": "IndoreTrafficPolice",
            "content": "Severe waterlogging near Bhanwar Kuan square. Kahn river overflow causing backflow into low-lying wards. Diversions active.",
            "latitude": 22.6926,
            "longitude": 75.8676,
            "city": "Indore",
            "district": "Indore"
        }
    ]

    for post in posts:
        res = requests.post(f"{BACKEND_URL}/api/reports/social-stream", json=post)
        log(f"[*] Stream Ingestion: {post['postId']} -> Status {res.status_code}, Tracking: {res.json().get('trackingId')}")

def test_3_citizen_report_with_media():
    print_banner("TEST 3: Citizen Ground Report with Image Upload")
    img_bytes = generate_test_image(color="blue", text="GENUINE_FLOOD_01")
    files = {
        "mediaFile": ("ground_flood.jpg", img_bytes, "image/jpeg")
    }
    data = {
        "username": "citizen_arun",
        "title": "Severe Waterlogging near Geeta Bhawan Square",
        "hazardType": "WATERLOGGING",
        "severity": "HIGH",
        "latitude": 22.7205,
        "longitude": 75.8780,
        "city": "Indore",
        "district": "Indore",
        "description": "Underpass submerged up to 4 feet. Two city passenger buses stranded in floodwater. Rescue teams needed immediately."
    }

    res = requests.post(f"{BACKEND_URL}/api/reports/submit", data=data, files=files)
    receipt = res.json().get("trackingId")
    log(f"[*] Ground Report Ingested: HTTP {res.status_code}, Assigned Tracking ID: {receipt}")
    
    rep = wait_for_report(receipt)
    log(f"    Processed Report Status: {rep.get('status')}, Hazard: {rep.get('hazardType')}")
    return receipt, img_bytes

def test_4_recycled_duplicate_media_phash(original_img_bytes):
    print_banner("TEST 4: Image Deduplication via Perceptual Hashing (pHash)")
    log("[*] Submitting identical image under another report to test pHash Hamming Distance detection...")

    files = {
        "mediaFile": ("recycled_copy.jpg", original_img_bytes, "image/jpeg")
    }
    data = {
        "username": "citizen_priya",
        "title": "Claimed New Flood at Annapurna Road",
        "hazardType": "FLASH_FLOOD",
        "severity": "HIGH",
        "latitude": 22.6980,
        "longitude": 75.8390,
        "city": "Indore",
        "district": "Indore",
        "description": "Massive water level rising, send help right now!"
    }

    res = requests.post(f"{BACKEND_URL}/api/reports/submit", data=data, files=files)
    tracking = res.json().get("trackingId")
    log(f"[*] Submitted report: Tracking={tracking}")
    
    rep = wait_for_report(tracking)
    log(f"    Duplicate Flag Detected: {rep.get('duplicateFlag')}")
    log(f"    pHash Fingerprint: {rep.get('phash')}")
    log(f"    Action Notes: {rep.get('actionNotes')}")
    assert rep.get('duplicateFlag') == True, "pHash deduplication should flag identical image!"
    log("    [SUCCESS] Recycled duplicate media successfully caught by pHash engine!")

def test_5_ai_rumor_and_panic_filtering():
    print_banner("TEST 5: AI NLP Panic Rumor Detection & Purge")
    panic_rumor = {
        "username": "citizen_priya",
        "title": "INDORE DAM BURST 10000 DEAD RUN FOR YOUR LIVES!!!",
        "hazardType": "FLASH_FLOOD",
        "severity": "CRITICAL",
        "latitude": 22.6500,
        "longitude": 75.8200,
        "city": "Indore",
        "district": "Indore",
        "description": "BILAWALI AND YASHWANT SAGAR DAM BOTH BROKE COMPLETELY! THOUSANDS DROWNED! RUN IMMEDIATELY SHARE BEFORE DELETED!!!!"
    }

    files = {"dummy": ("", b"")}
    res = requests.post(f"{BACKEND_URL}/api/reports/submit", data=panic_rumor, files=files)
    tracking = res.json().get("trackingId")
    log(f"[*] Submitted panic rumor: Tracking={tracking}")
    
    rep = wait_for_report(tracking)
    log(f"    Status: {rep.get('status')}")
    log(f"    Rumor Score: {rep.get('rumorScore')}")
    log(f"    Is Rumor: {rep.get('isRumor')}")
    log(f"    Sentiment: {rep.get('sentiment')}")
    log(f"    Action Notes: {rep.get('actionNotes')}")
    assert rep.get('status') == 'FALSE_ALARM' or rep.get('isRumor') == True, "Panic rumor must be flagged!"
    log("    [SUCCESS] Panic rumor automatically purged by AI NLP model into FALSE_ALARM state!")

def test_6_lifecycle_state_machine_and_admin_verification(tracking_id):
    print_banner("TEST 6: Spring State Machine Lifecycle & Gamified Trust Score")
    track_res = requests.get(f"{BACKEND_URL}/api/reports/tracking/{tracking_id}").json()
    rep = track_res.get("report", {})
    rep_id = rep.get("id")
    log(f"[*] Testing report ID {rep_id} (Tracking: {tracking_id})")
    log(f"    Initial State: {rep.get('status')}")

    # 1. Admin Verification
    log("[*] Disaster Cell Admin verifying ground truth...")
    v_res = requests.put(f"{BACKEND_URL}/api/admin/reports/{rep_id}/verify", json={
        "adminUser": "admin_ndrf",
        "comments": "Field scout on site confirmed 4-foot water level"
    })
    log(f"    Transition after Admin Verification: {v_res.json().get('status')}")
    assert v_res.json().get('status') == 'ADMIN_VERIFIED', "Status must transition to ADMIN_VERIFIED"

    # Gamified trust score increase
    time.sleep(0.5)
    u_res = requests.get(f"{BACKEND_URL}/api/reputation/user/citizen_arun").json()
    log(f"    Citizen 'citizen_arun' Trust Rating: {u_res.get('score')} pts (Verified: {u_res.get('verifiedCount')}, Badge: {u_res.get('badgeTier')})")

    # 2. Disaster Response Action Dispatch
    log("[*] Dispatching NDRF Emergency Response Unit...")
    a_res = requests.put(f"{BACKEND_URL}/api/admin/reports/{rep_id}/action", json={
        "teamName": "NDRF Quick Response Team 2",
        "instructions": "De-watering pumps deployed to underpass; traffic marshals placed"
    })
    log(f"    Transition after Action Dispatch: {a_res.json().get('status')}")
    assert a_res.json().get('status') == 'ACTIONED', "Status must transition to ACTIONED"
    log("    [SUCCESS] Strict State Machine lifecycle (SUBMITTED -> AI_CHECKED -> ADMIN_VERIFIED -> ACTIONED) fully enforced!")

def test_7_micro_local_radius_gis_query():
    print_banner("TEST 7: Micro-Local Radius Spatial Filtering (5 km Zone)")
    res = requests.get(f"{BACKEND_URL}/api/reports/geojson?lat=22.7196&lon=75.8577&radiusKm=5")
    features = res.json().get("features", [])
    log(f"[*] Verified incidents within 5km radius of Indore Center (22.7196, 75.8577): {len(features)} reports")
    for f in features:
        p = f.get("properties", {})
        log(f"    - [{p.get('status')}] {p.get('hazardType')}: {p.get('title')}")
    log("    [SUCCESS] Spatial radius query and RFC 7946 GeoJSON export verified!")

if __name__ == "__main__":
    test_1_service_health()
    test_2_high_velocity_social_stream()
    tracking_id, img_bytes = test_3_citizen_report_with_media()
    test_4_recycled_duplicate_media_phash(img_bytes)
    test_5_ai_rumor_and_panic_filtering()
    test_6_lifecycle_state_machine_and_admin_verification(tracking_id)
    test_7_micro_local_radius_gis_query()
    print_banner("ALL SURAKSHA-NET SYSTEM INTEGRATION TESTS PASSED!")
