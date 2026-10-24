
package com.reyasa.reyasa_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Authentication
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/error"
                        ).permitAll()

                        // Public warehouse and delivery checking
                        .requestMatchers(
                                "/api/warehouse/public",
                                "/api/warehouse/check-delivery"
                        ).permitAll()

                        // Admin delivery PIN management
                        .requestMatchers(
                                "/api/warehouse/delivery-pins/admin",
                                "/api/warehouse/delivery-pins/admin/**"
                        ).hasRole("ADMIN")

                        // Public product browsing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/manageproducts",
                                "/api/manageproducts/{id}",
                                "/api/collections/**",
                                "/uploads/**"
                        ).permitAll()

                        // Admin product management
                        .requestMatchers(
                                "/api/manageproducts/admin/**",
                                "/api/manageproducts/**",
                                "/api/uploads/**"
                        ).hasRole("ADMIN")

                        // Collection writes require ADMIN
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/collections/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/collections/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/collections/**"
                        ).hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/collections/**"
                        ).hasRole("ADMIN")

                        // Material and expense management
                        .requestMatchers(
                                "/api/admin/expenses",
                                "/api/admin/expenses/**"
                        ).hasRole("ADMIN")

                        // Other admin APIs:
                        // dashboard, orders overview, videos management,
                        // footer settings, and other admin features
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // Homepage videos: public viewing
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/videos",
                                "/api/videos/**"
                        ).permitAll()

                        // About Us
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/about"
                        ).permitAll()

                        .requestMatchers(
                                "/api/about/admin",
                                "/api/about/admin/**"
                        ).hasRole("ADMIN")

                        // Footer settings: public read, admin write
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/footer",
                                "/api/footer/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/footer/admin",
                                "/api/footer/admin/**"
                        ).hasRole("ADMIN")

                        // Customer, cart, order and payment APIs
                        .requestMatchers(
                                "/api/users/**",
                                "/api/cart/**",
                                "/api/orders/**",
                                "/api/payments/**"
                        ).hasAnyRole("USER", "ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
