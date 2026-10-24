
package com.reyasa.reyasa_backend.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiration;

    public JwtService(
            @Value("${reyasa.jwt.secret}") String secret,
            @Value("${reyasa.jwt.expiration}") long expiration) {

        if (secret == null ||
                secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 bytes"
            );
        }

        this.key = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.expiration = expiration;
    }

    // Generate JWT token
    public String generateToken(String email, String role) {

        Date now = new Date();

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key)
                .compact();
    }

    // Extract and validate token claims
    public Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Extract email from token
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // Validate token and email
    public boolean isTokenValid(String token, String email) {

        try {
            Claims claims = extractClaims(token);

            return claims.getSubject() != null
                    && claims.getSubject().equalsIgnoreCase(email)
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date());

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
