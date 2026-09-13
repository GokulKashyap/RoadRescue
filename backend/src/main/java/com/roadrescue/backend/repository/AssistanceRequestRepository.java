package com.roadrescue.backend.repository;

import com.roadrescue.backend.entity.AssistanceRequest;
import com.roadrescue.backend.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssistanceRequestRepository extends JpaRepository<AssistanceRequest, Long> {
    List<AssistanceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
    List<AssistanceRequest> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);
    List<AssistanceRequest> findByProvider_IdOrderByCreatedAtDesc(Long providerId);
}
