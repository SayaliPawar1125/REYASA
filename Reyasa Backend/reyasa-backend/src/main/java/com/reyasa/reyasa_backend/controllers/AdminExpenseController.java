 package com.reyasa.reyasa_backend.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.reyasa.reyasa_backend.dto.ExpenseDto;
import com.reyasa.reyasa_backend.services.ExpenseService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/expenses")
public class AdminExpenseController {

    private final ExpenseService expenseService;
    private final ObjectMapper objectMapper;

    public AdminExpenseController(
            ExpenseService expenseService,
            ObjectMapper objectMapper
    ) {
        this.expenseService = expenseService;
        this.objectMapper = objectMapper;

        // Register support for LocalDate and LocalDateTime
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // Get all expenses with optional filters
    @GetMapping
    public ResponseEntity<List<ExpenseDto>> getExpenses(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(
                expenseService.getExpenses(
                        startDate,
                        endDate,
                        category
                )
        );
    }

    // Get expense summary
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                expenseService.getSummary(
                        startDate,
                        endDate
                )
        );
    }

    // Get expense by ID
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDto> getExpense(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                expenseService.getExpense(id)
        );
    }

    // Create expense with optional receipt upload
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExpenseDto> createExpense(
            @RequestPart("data") String data,
            @RequestPart(value = "receipt", required = false)
            MultipartFile receipt
    ) throws Exception {

        ExpenseDto dto = objectMapper.readValue(
                data,
                ExpenseDto.class
        );

        return ResponseEntity.ok(
                expenseService.createExpense(dto, receipt)
        );
    }

    // Update expense with optional receipt upload
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ExpenseDto> updateExpense(
            @PathVariable Long id,
            @RequestPart("data") String data,
            @RequestPart(value = "receipt", required = false)
            MultipartFile receipt
    ) throws Exception {

        ExpenseDto dto = objectMapper.readValue(
                data,
                ExpenseDto.class
        );

        return ResponseEntity.ok(
                expenseService.updateExpense(
                        id,
                        dto,
                        receipt
                )
        );
    }

    // Delete expense
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id
    ) {
        expenseService.deleteExpense(id);

        return ResponseEntity.noContent().build();
    }

    // Download expense receipt
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> getReceipt(
            @PathVariable Long id
    ) {
        byte[] file = expenseService.getReceipt(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("expense-receipt-" + id)
                                .build()
                                .toString()
                )
                .body(file);
    }
}
