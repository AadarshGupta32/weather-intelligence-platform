package com.weatherintel.repository;

import com.weatherintel.entity.HazardType;
import com.weatherintel.entity.Report;
import com.weatherintel.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    Optional<Report> findByTrackingId(String trackingId);

    List<Report> findByStatus(ReportStatus status);

    List<Report> findByHazardType(HazardType hazardType);

    List<Report> findByPhashIsNotNull();

    List<Report> findTop50ByOrderByCreatedAtDesc();

    /**
     * Micro-local spatial radius query using Haversine formula on spherical earth.
     * Computes great-circle distance in meters between given (lat, lon) and report coordinates.
     * Guaranteed to work across all PostgreSQL and spatial DB configurations.
     */
    @Query(value = """
        SELECT r.* FROM reports r
        WHERE (
            6371000 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:latitude)) * cos(radians(r.latitude)) *
                    cos(radians(r.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(r.latitude))
                ))
            )
        ) <= :radiusMeters
        ORDER BY r.created_at DESC
        """, nativeQuery = true)
    List<Report> findWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusMeters") Double radiusMeters
    );

    @Query(value = """
        SELECT r.* FROM reports r
        WHERE r.status = 'ADMIN_VERIFIED'
        AND (
            6371000 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(:latitude)) * cos(radians(r.latitude)) *
                    cos(radians(r.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(r.latitude))
                ))
            )
        ) <= :radiusMeters
        ORDER BY r.created_at DESC
        """, nativeQuery = true)
    List<Report> findVerifiedWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusMeters") Double radiusMeters
    );
}
