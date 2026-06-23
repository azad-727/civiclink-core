package com.civiclink.api_gateway.filter;

import com.civiclink.api_gateway.util.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    // These are the "VIP Door" routes. No wristband required to enter these.
    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh"
    );

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    // THIS IS THE REQUIRED METHOD JAVA WAS ASKING FOR
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            // 1. Check if the current request is trying to hit an open endpoint
            String path = exchange.getRequest().getURI().getPath();
            boolean isOpenEndpoint = OPEN_ENDPOINTS.stream().anyMatch(path::contains);

            // 2. If it is NOT an open endpoint, we strictly enforce security
            if (!isOpenEndpoint) {

                // Does the user even have an Authorization header?
                if (!exchange.getRequest().getHeaders().containsHeader(HttpHeaders.AUTHORIZATION)) {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete(); // Block request immediately
                }

                // Extract the token from the "Bearer <token>" string
                String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    authHeader = authHeader.substring(7);
                } else {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                // Mathematically validate the token
                try {
                    jwtUtil.validateToken(authHeader);
                } catch (Exception e) {
                    System.out.println("Invalid Token Detected: Blocking Request.");
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }
            }

            // 3. Token is valid (or it's an open endpoint). Let the request pass to the backend!
            return chain.filter(exchange);
        };
    }

    public static class Config {
        // Empty class required by Spring Cloud Gateway architecture
    }
}