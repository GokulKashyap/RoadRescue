package com.roadrescue.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    // Store buckets in memory. Key is "AUTH_ip" or "API_userId"
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // Resolve a bucket for a given key. If it doesn't exist, create it.
    public Bucket resolveBucket(String key, boolean isAuthRoute) {
        return cache.computeIfAbsent(key, k -> createNewBucket(isAuthRoute));
    }

    private Bucket createNewBucket(boolean isAuthRoute) {
        if (isAuthRoute) {
            // Auth Limits: 5 requests per minute per IP
            Refill refill = Refill.intervally(5, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(5, refill);
            return Bucket.builder().addLimit(limit).build();
        } else {
            // API Limits: 30 requests per minute per User
            Refill refill = Refill.intervally(30, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(30, refill);
            return Bucket.builder().addLimit(limit).build();
        }
    }
}
