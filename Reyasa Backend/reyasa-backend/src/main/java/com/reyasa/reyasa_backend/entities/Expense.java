package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(length = 120)
    private String materialType;

    @Column(length = 80)
    private String color;

    @Column(precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(length = 30)
    private String unit;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(length = 150)
    private String supplier;

    @Column(length = 40)
    private String paymentMethod;

    @Column(length = 1000)
    private String notes;

    @Column(length = 500)
    private String receiptPath;

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