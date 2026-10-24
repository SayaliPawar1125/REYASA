package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "about_us")
@Data
public class AboutUs {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String paragraph1;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String paragraph2;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String paragraph3;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String paragraph4;

    @Column(nullable = false, length = 255)
    private String tagline;

    @Column(nullable = false, length = 150)
    private String signature;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}