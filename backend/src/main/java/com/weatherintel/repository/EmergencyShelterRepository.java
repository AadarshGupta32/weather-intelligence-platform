package com.weatherintel.repository;

import com.weatherintel.entity.EmergencyShelter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyShelterRepository extends JpaRepository<EmergencyShelter, Long> {

    List<EmergencyShelter> findByIsOperationalTrue();

    @Query(value = """
        SELECT s.* FROM emergency_shelters s
        WHERE s.is_operational = true
        ORDER BY (
            6371000 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:latitude)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(s.latitude))
                ))
            )
        ) ASC
        LIMIT 5
        """, nativeQuery = true)
    List<EmergencyShelter> findNearestShelters(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude
    );
}
