package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByOrderByExpenseDateDescIdDesc();

    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDescIdDesc(
            LocalDate startDate,
            LocalDate endDate
    );

    List<Expense> findByCategoryIgnoreCaseOrderByExpenseDateDescIdDesc(
            String category
    );

    List<Expense> findByExpenseDateBetweenAndCategoryIgnoreCaseOrderByExpenseDateDescIdDesc(
            LocalDate startDate,
            LocalDate endDate,
            String category
    );

    @Query("""
        SELECT COALESCE(SUM(e.totalCost), 0)
        FROM Expense e
        WHERE e.expenseDate BETWEEN :startDate AND :endDate
    """)
    BigDecimal sumExpensesBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(e.totalCost), 0)
        FROM Expense e
        WHERE e.expenseDate BETWEEN :startDate AND :endDate
          AND e.category = :category
    """)
    BigDecimal sumByCategoryBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("category") String category
    );

    long countByReceiptPathIsNotNullAndExpenseDateBetween(
            LocalDate startDate,
            LocalDate endDate
    );
}