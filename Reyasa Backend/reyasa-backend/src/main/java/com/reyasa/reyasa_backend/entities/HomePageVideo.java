
package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "homepage_videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomePageVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Video title is required")
    @Column(nullable = false, length = 150)
    private String title;

    @NotBlank(message = "Video URL is required")
    @Column(nullable = false, length = 1000)
    private String videoUrl;

    @Column(length = 1000)
    private String posterImageUrl;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    private Integer displayOrder = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
