package com.weatherintel.repository;

import com.weatherintel.entity.ReportMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportMediaRepository extends JpaRepository<ReportMedia, Long> {
    List<ReportMedia> findByPhashIsNotNull();
    List<ReportMedia> findTop100ByOrderByCreatedAtDesc();
}
