package com.weatherintel.repository;

import com.weatherintel.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByReportIdOrderByCreatedAtDesc(Long reportId);
}
