package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Product {



        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @NotBlank(message = "Product name is required")
        @Column(nullable = false, length = 150)
        private String name;

        @NotBlank(message = "Category is required")
        @Column(nullable = false, length = 80)
        private String category;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than zero")
        @Column(nullable = false, precision = 10, scale = 2)
        private BigDecimal price;

        @Column(length = 2000)
        private String description;

        // Maps to your existing shirt1.jpg through shirt8.jpg images
        @NotBlank(message = "Image key is required")
        @Column(nullable = false, length = 40)
        private String imageKey;

        // Example: S,M,L,XL
        @NotBlank(message = "Available sizes are required")
        @Column(nullable = false, length = 100)
        private String availableSizes;

        @NotNull(message = "Stock quantity is required")
        @Min(value = 0, message = "Stock cannot be negative")
        @Column(nullable = false)
        private Integer stockQuantity;

        @Builder.Default
        @Column(nullable = false)
        private boolean active = true;
        @Builder.Default
        @Column(nullable = false)
        private boolean trending = false;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @Column(nullable = false)
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

