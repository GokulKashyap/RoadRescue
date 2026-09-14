package com.roadrescue.backend.repository;

import com.roadrescue.backend.entity.ServiceProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {
    Optional<ServiceProvider> findByUserId(Long userId);

    @Query(value = "SELECT * FROM service_providers sp " +
           "WHERE sp.is_available = true " +
           "AND sp.current_lat IS NOT NULL " +
           "AND sp.current_lng IS NOT NULL " +
           "AND (6371 * acos(cos(radians(:lat)) * cos(radians(sp.current_lat)) * cos(radians(sp.current_lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(sp.current_lat)))) <= :radiusKm", 
           nativeQuery = true)
    List<ServiceProvider> findNearbyAvailableProviders(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusKm") double radiusKm);
}
