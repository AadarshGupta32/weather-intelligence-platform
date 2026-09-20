package com.weatherintel;

import com.weatherintel.entity.*;
import com.weatherintel.repository.ReportRepository;
import com.weatherintel.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.LocalDateTime;
import java.util.UUID;

@SpringBootApplication
@EnableAsync
public class WeatherIntelApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeatherIntelApplication.class, args);
    }

    @Bean
    CommandLineRunner seedDemoData(
            ReportRepository reportRepository,
            UserRepository userRepository,
            com.weatherintel.repository.EmergencyShelterRepository shelterRepository) {
        return args -> {
            if (shelterRepository.count() == 0) {
                shelterRepository.save(new EmergencyShelter("Holkar Stadium Relief Camp", "EVACUATION_CAMP", 22.7246, 75.8732, "Race Course Road, New Palasia, Indore", "+91-731-2544101", 1500, 320));
                shelterRepository.save(new EmergencyShelter("Nehru Stadium Safe Zone", "EVACUATION_CAMP", 22.7092, 75.8758, "Residency Area, Indore", "+91-731-2700300", 2000, 150));
                shelterRepository.save(new EmergencyShelter("MY Hospital Trauma Response", "MEDICAL_CENTER", 22.7164, 75.8705, "Sanyogita Ganj, Indore", "+91-731-2527301", 500, 110));
                shelterRepository.save(new EmergencyShelter("NDRF Kahn River Boat Depot", "NDRF_DEPOT", 22.7185, 75.8540, "Riverside Road, Rajwada, Indore", "1078", 50, 12));
                shelterRepository.save(new EmergencyShelter("Scheme 54 Municipal Shelter", "EVACUATION_CAMP", 22.7562, 75.8890, "Vijay Nagar Sector A, Indore", "+91-731-2401122", 800, 45));
                System.out.println(">>> Seeded 5 Operational Emergency Shelters & Safe Zones <<<");
            }

            if (reportRepository.count() == 0) {
                User arun = userRepository.findByUsername("citizen_arun").orElse(null);
                User priya = userRepository.findByUsername("citizen_priya").orElse(null);
                User imd = userRepository.findByUsername("imd_bot").orElse(null);

                // 1. Critical Waterlogging in Vijay Nagar
                Report r1 = new Report();
                r1.setTrackingId("REP-VJ001");
                r1.setTitle("Severe Waterlogging near Vijay Nagar Square");
                r1.setDescription("Water level reached 3 feet near Vijay Nagar underpass. Several vehicles stalled. Citizens need rescue diversion.");
                r1.setHazardType(HazardType.WATERLOGGING);
                r1.setSeverity(Severity.HIGH);
                r1.setStatus(ReportStatus.ADMIN_VERIFIED);
                r1.setLatitude(22.7533);
                r1.setLongitude(75.8937);
                r1.setCity("Indore");
                r1.setDistrict("Indore");
                r1.setRumorScore(0.04);
                r1.setIsRumor(false);
                r1.setSentiment("INFORMATIVE_OBJECTIVE");
                r1.setUser(arun);
                r1.setActionNotes("Verified by field inspector: traffic diverted via Ring Road.");
                reportRepository.save(r1);

                // 2. Flash flood threat near Kahn River / Rajwada
                Report r2 = new Report();
                r2.setTrackingId("REP-RW002");
                r2.setTitle("Kahn River Overflow Alert near Rajwada Bridge");
                r2.setDescription("River overflowing banks after 110mm cloudburst. Low-lying slum settlements inundated.");
                r2.setHazardType(HazardType.FLASH_FLOOD);
                r2.setSeverity(Severity.CRITICAL);
                r2.setStatus(ReportStatus.ACTIONED);
                r2.setLatitude(22.7196);
                r2.setLongitude(75.8577);
                r2.setCity("Indore");
                r2.setDistrict("Indore");
                r2.setRumorScore(0.06);
                r2.setIsRumor(false);
                r2.setSentiment("DISTRESSED_URGENT");
                r2.setUser(priya);
                r2.setActionNotes("Emergency Response Dispatched: [NDRF Unit 3] - 2 rubber inflatable boats deployed.");
                reportRepository.save(r2);

                // 3. Tree Fall / Thunderstorm near Palasia
                Report r3 = new Report();
                r3.setTrackingId("REP-PL003");
                r3.setTitle("Massive Banyan Tree Fallen on Main AB Road");
                r3.setDescription("Severe squall winds uprooted tree across both carriage lanes near Industry House Palasia.");
                r3.setHazardType(HazardType.CYCLONE_WIND);
                r3.setSeverity(Severity.MEDIUM);
                r3.setStatus(ReportStatus.AI_CHECKED);
                r3.setLatitude(22.7244);
                r3.setLongitude(75.8839);
                r3.setCity("Indore");
                r3.setDistrict("Indore");
                r3.setRumorScore(0.12);
                r3.setIsRumor(false);
                r3.setSentiment("OBSERVATIONAL_NEUTRAL");
                r3.setUser(arun);
                r3.setActionNotes("AI Evaluation: RumorScore=0.12, Verified plausible imagery.");
                reportRepository.save(r3);

                // 4. Panic Rumor (Filtered out)
                Report r4 = new Report();
                r4.setTrackingId("REP-RM004");
                r4.setTitle("RUMOR: Bilawali Dam Collapsed 2000 Dead");
                r4.setDescription("BILAWALI DAM COLLAPSED COMPLETELY! THOUSANDS DROWNED RUN FOR YOUR LIVES IMMEDIATELY!!!");
                r4.setHazardType(HazardType.FLASH_FLOOD);
                r4.setSeverity(Severity.CRITICAL);
                r4.setStatus(ReportStatus.FALSE_ALARM);
                r4.setLatitude(22.6738);
                r4.setLongitude(75.8652);
                r4.setCity("Indore");
                r4.setDistrict("Indore");
                r4.setRumorScore(0.98);
                r4.setIsRumor(true);
                r4.setPanicIndex(1.0);
                r4.setSentiment("PANIC_ALARMIST");
                r4.setUser(priya);
                r4.setActionNotes("Auto-Flagged as False Alarm: AI rumor detection score 0.98. Dam gates operating normally.");
                reportRepository.save(r4);

                System.out.println(">>> Demo Weather Intelligence Seed Data Inserted Successfully <<<");
            }
        };
    }
}
