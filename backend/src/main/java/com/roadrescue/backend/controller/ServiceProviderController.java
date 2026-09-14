package com.roadrescue.backend.controller;

import com.roadrescue.backend.entity.ServiceProvider;
import com.roadrescue.backend.payload.response.MessageResponse;
import com.roadrescue.backend.repository.ServiceProviderRepository;
import com.roadrescue.backend.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/providers")
public class ServiceProviderController {

    @Autowired
    ServiceProviderRepository providerRepository;

    @PostMapping("/status")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<?> toggleStatus(@RequestParam boolean available, 
                                          @RequestParam(required = false) Double lat, 
                                          @RequestParam(required = false) Double lng) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        Optional<ServiceProvider> providerOpt = providerRepository.findByUserId(userDetails.getId());
        if (providerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Provider profile not found."));
        }

        ServiceProvider provider = providerOpt.get();
        provider.setAvailable(available);
        if (available && lat != null && lng != null) {
            provider.setCurrentLat(lat);
            provider.setCurrentLng(lng);
        }
        providerRepository.save(provider);

        return ResponseEntity.ok(new MessageResponse("Status updated to " + (available ? "Online" : "Offline")));
    }
    
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<?> getProviderProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        
        Optional<ServiceProvider> providerOpt = providerRepository.findByUserId(userDetails.getId());
        if (providerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Provider profile not found."));
        }

        return ResponseEntity.ok(providerOpt.get());
    }
}
