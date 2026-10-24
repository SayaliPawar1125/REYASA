package com.reyasa.reyasa_backend.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
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
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDto>> getExpenses(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(
                expenseService.getExpenses(startDate, endDate, category)
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                expenseService.getSummary(startDate, endDate)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDto> getExpense(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.getExpense(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExpenseDto> createExpense(
            @RequestPart("data") String data,
            @RequestPart(value = "receipt", required = false)
            MultipartFile receipt
    ) throws Exception {
        ExpenseDto dto = objectMapper.readValue(data, ExpenseDto.class);

        return ResponseEntity.ok(
                expenseService.createExpense(dto, receipt)
        );
    }

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
        ExpenseDto dto = objectMapper.readValue(data, ExpenseDto.class);

        return ResponseEntity.ok(
                expenseService.updateExpense(id, dto, receipt)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> getReceipt(@PathVariable Long id) {
        byte[] file = expenseService.getReceipt(id);

        // The server deliberately serves uploaded receipts as downloads.
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