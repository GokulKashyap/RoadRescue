package com.roadrescue.backend.security;

import com.roadrescue.backend.security.services.UserDetailsImpl;
import com.roadrescue.backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        boolean isAuthRoute = path.startsWith("/api/auth");
        String key;

        if (isAuthRoute) {
            // Rate limit by IP address for auth routes to prevent brute force
            key = "AUTH_" + getClientIP(request);
        } else {
            // Rate limit by User ID for authenticated routes
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
                key = "API_" + userDetails.getId();
            } else {
                // If not authenticated yet but trying to access API, limit by IP
                key = "API_ANON_" + getClientIP(request);
            }
        }

        Bucket bucket = rateLimitingService.resolveBucket(key, isAuthRoute);

        if (bucket.tryConsume(1)) {
            // Token available, allow request
            return true;
        } else {
            // No tokens left, deny request
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            return false;
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
