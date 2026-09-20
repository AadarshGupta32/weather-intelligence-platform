package com.weatherintel.controller;

import com.weatherintel.entity.TrustScore;
import com.weatherintel.entity.User;
import com.weatherintel.repository.TrustScoreRepository;
import com.weatherintel.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reputation")
@CrossOrigin(origins = "*")
public class TrustScoreController {

    private final TrustScoreRepository trustScoreRepository;
    private final UserRepository userRepository;

    public TrustScoreController(TrustScoreRepository trustScoreRepository, UserRepository userRepository) {
        this.trustScoreRepository = trustScoreRepository;
        this.userRepository = userRepository;
    }

    /**
     * Civic Reporter Leaderboard displaying verified contributors, trust scores, and badges.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        List<TrustScore> scores = trustScoreRepository.findTop10ByOrderByScoreDesc();

        List<Map<String, Object>> response = scores.stream().map(ts -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", ts.getUser().getId());
            map.put("username", ts.getUser().getUsername());
            map.put("fullName", ts.getUser().getFullName());
            map.put("score", ts.getScore());
            map.put("verifiedCount", ts.getVerifiedCount());
            map.put("falseAlarmCount", ts.getFalseAlarmCount());
            map.put("totalSubmissions", ts.getTotalSubmissions());
            map.put("badgeTier", ts.getBadgeTier().name());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<Map<String, Object>> getUserReputation(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        TrustScore ts = trustScoreRepository.findByUser(user)
                .orElseGet(() -> new TrustScore(user));

        Map<String, Object> map = new HashMap<>();
        map.put("userId", user.getId());
        map.put("username", user.getUsername());
        map.put("fullName", user.getFullName());
        map.put("score", ts.getScore());
        map.put("badgeTier", ts.getBadgeTier().name());
        map.put("verifiedCount", ts.getVerifiedCount());
        map.put("totalSubmissions", ts.getTotalSubmissions());
        return ResponseEntity.ok(map);
    }
}
