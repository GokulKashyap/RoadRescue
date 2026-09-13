package com.roadrescue.backend.controller;

import com.roadrescue.backend.entity.AssistanceRequest;
import com.roadrescue.backend.entity.RequestStatus;
import com.roadrescue.backend.entity.ServiceProvider;
import com.roadrescue.backend.entity.User;
import com.roadrescue.backend.payload.request.HelpRequest;
import com.roadrescue.backend.payload.response.MessageResponse;
import com.roadrescue.backend.repository.AssistanceRequestRepository;
import com.roadrescue.backend.repository.ServiceProviderRepository;
import com.roadrescue.backend.repository.UserRepository;
import com.roadrescue.backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    @Autowired
    AssistanceRequestRepository requestRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ServiceProviderRepository providerRepository;

    // CUSTOMER: Create a new request
    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public ResponseEntity<?> createRequest(@Valid @RequestBody HelpRequest helpRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        Optional<User> customerOpt = userRepository.findById(userDetails.getId());
        if (customerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }

        AssistanceRequest request = new AssistanceRequest();
        request.setCustomer(customerOpt.get());
        request.setLatitude(helpRequest.getLatitude());
        request.setLongitude(helpRequest.getLongitude());
        request.setIssueDescription(helpRequest.getIssueDescription());
        request.setStatus(RequestStatus.PENDING);

        requestRepository.save(request);

        return ResponseEntity.ok(request);
    }

    // PROVIDER: Get all pending requests
    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<?> getPendingRequests() {
        List<AssistanceRequest> pending = requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
        return ResponseEntity.ok(pending);
    }

    // PROVIDER: Accept a request
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        Optional<ServiceProvider> providerOpt = providerRepository.findByUserId(userDetails.getId());
        if (providerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Provider profile not found."));
        }

        Optional<AssistanceRequest> requestOpt = requestRepository.findById(id);
        if (requestOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Request not found."));
        }

        AssistanceRequest request = requestOpt.get();
        if (request.getStatus() != RequestStatus.PENDING) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Request is no longer pending."));
        }

        request.setStatus(RequestStatus.ACCEPTED);
        request.setProvider(providerOpt.get());
        requestRepository.save(request);

        return ResponseEntity.ok(request);
    }

    // BOTH: Get active request for polling
    @GetMapping("/active")
    public ResponseEntity<?> getActiveRequest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        if (role.equals("CUSTOMER")) {
            List<AssistanceRequest> requests = requestRepository.findByCustomer_IdOrderByCreatedAtDesc(userDetails.getId());
            if (!requests.isEmpty()) {
                return ResponseEntity.ok(requests.get(0)); // Return most recent
            }
        } else if (role.equals("PROVIDER")) {
            Optional<ServiceProvider> providerOpt = providerRepository.findByUserId(userDetails.getId());
            if (providerOpt.isPresent()) {
                List<AssistanceRequest> requests = requestRepository.findByProvider_IdOrderByCreatedAtDesc(providerOpt.get().getId());
                if (!requests.isEmpty()) {
                    return ResponseEntity.ok(requests.get(0)); // Return most recent
                }
            }
        }
        
        return ResponseEntity.ok().build(); // Empty if no active requests
    }
}
