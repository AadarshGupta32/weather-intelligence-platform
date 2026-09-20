package com.weatherintel.repository;

import com.weatherintel.entity.TrustScore;
import com.weatherintel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {
    Optional<TrustScore> findByUser(User user);
    Optional<TrustScore> findByUserId(Long userId);
    List<TrustScore> findTop10ByOrderByScoreDesc();
}
