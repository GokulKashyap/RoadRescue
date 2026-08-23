package com.roadrescue.backend.controller;

import com.roadrescue.backend.entity.Role;
import com.roadrescue.backend.entity.ServiceProvider;
import com.roadrescue.backend.entity.User;
import com.roadrescue.backend.payload.request.LoginRequest;
import com.roadrescue.backend.payload.request.SignupRequest;
import com.roadrescue.backend.payload.response.JwtResponse;
import com.roadrescue.backend.payload.response.MessageResponse;
import com.roadrescue.backend.repository.ServiceProviderRepository;
import com.roadrescue.backend.repository.UserRepository;
import com.roadrescue.backend.security.jwt.JwtUtils;
import com.roadrescue.backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ServiceProviderRepository serviceProviderRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getEmail(),
                role));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setEmail(signUpRequest.getEmail());
        user.setPasswordHash(encoder.encode(signUpRequest.getPassword()));

        Role roleEnum;
        if (signUpRequest.getRole() != null && signUpRequest.getRole().equalsIgnoreCase("PROVIDER")) {
            roleEnum = Role.PROVIDER;
        } else {
            roleEnum = Role.CUSTOMER; // default
        }
        user.setRole(roleEnum);

        userRepository.save(user);

        // If provider, create ServiceProvider record
        if (roleEnum == Role.PROVIDER) {
            ServiceProvider provider = new ServiceProvider();
            provider.setUser(user);
            provider.setCompanyName(signUpRequest.getCompanyName() != null ? signUpRequest.getCompanyName() : "Independent");
            provider.setAvailable(false);
            serviceProviderRepository.save(provider);
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
