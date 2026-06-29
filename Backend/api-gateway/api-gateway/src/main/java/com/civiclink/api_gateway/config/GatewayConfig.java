package com.civiclink.api_gateway.config;

import com.civiclink.api_gateway.filter.AuthenticationFilter; // Update this if you renamed it!
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    private final AuthenticationFilter filter;

    public GatewayConfig(AuthenticationFilter filter) {
        this.filter = filter;
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                // We define the exact same route, but with 100% compiler safety
                .route("auth-service", r -> r
                        .path("/api/v1/auth/**")
                        .filters(f -> f.filter(filter.apply(new AuthenticationFilter.Config())))
                        .uri("http://localhost:8081"))
                .route("routing-service", r ->r
                        .path("/api/v1/routing/**")
                        .filters(f -> f.filter(filter.apply(new AuthenticationFilter.Config())))
                        .uri("http://localhost:8083"))
                .route("issue-service",r-> r
                        .path("/api/v1/issues/**")
                        .filters(f -> f.filter(filter.apply(new AuthenticationFilter.Config())))
                        .uri("http://localhost:8082"))
                .route("ai-vision-service",r->r
                        .path("/api/v1/ai/**")
                        .filters(f -> f.filter(filter.apply(new AuthenticationFilter.Config())))
                        .uri("http://localhost:8084"))
                .build();

    }
}