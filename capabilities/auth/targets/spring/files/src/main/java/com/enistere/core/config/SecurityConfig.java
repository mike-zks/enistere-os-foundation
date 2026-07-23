package com.enistere.core.config;

import com.enistere.core.common.web.CorrelationIdFilter;
import com.enistere.core.infrastructure.security.EnistereUserDetailsService;
import com.enistere.core.infrastructure.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter,
                                            CorsConfig corsConfig) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource(corsConfig)))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, e) ->
                    writeError(request, response, 401, "UNAUTHORIZED", "Authentication required"))
                .accessDeniedHandler((request, response, e) ->
                    writeError(request, response, 403, "FORBIDDEN", "Access denied"))
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * Writes the canonical flat error envelope (ADR-048) for Spring Security 401/403,
     * matching the {@code GlobalExceptionHandler}. The requestId is the correlation id
     * set by {@link CorrelationIdFilter}. Built without an injected ObjectMapper: the
     * security filter chain initializes before Jackson auto-configuration, so injecting
     * one here fails to resolve a bean.
     */
    private static void writeError(HttpServletRequest request, HttpServletResponse response,
                                   int statusCode, String errorCode, String message) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json;charset=UTF-8");
        Object id = request.getAttribute(CorrelationIdFilter.REQUEST_ID_ATTRIBUTE);
        String requestId = id instanceof String value ? "\"" + value + "\"" : "null";
        response.getWriter().write(String.format(
            "{\"success\":false,\"statusCode\":%d,\"errorCode\":\"%s\",\"message\":\"%s\","
                + "\"details\":null,\"path\":\"%s\",\"timestamp\":\"%s\",\"requestId\":%s}",
            statusCode, errorCode, message, request.getRequestURI(), Instant.now(), requestId));
    }

    @Bean
    public PasswordEncoder passwordEncoder(Argon2Config argon2Config) {
        return new Argon2PasswordEncoder(
            argon2Config.getSaltLength(),
            argon2Config.getHashLength(),
            argon2Config.getParallelism(),
            argon2Config.getMemory(),
            argon2Config.getIterations()
        );
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            EnistereUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsConfig corsConfig) {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = corsConfig.getAllowedOriginsList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
