package com.reyasa.reyasa_backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseDto {

    private Long id;
    private String title;
    private String category;
    private String materialType;
    private String color;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private LocalDate expenseDate;
    private String supplier;
    private String paymentMethod;
    private String notes;
    private String receiptPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}