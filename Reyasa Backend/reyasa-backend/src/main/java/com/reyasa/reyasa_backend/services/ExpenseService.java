package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.ExpenseDto;
import com.reyasa.reyasa_backend.entities.Expense;
import com.reyasa.reyasa_backend.repositories.ExpenseRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository repository;
    private final Path uploadDirectory;

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("pdf", "jpg", "jpeg", "png", "webp");

    public ExpenseService(
            ExpenseRepository repository,
            @Value("${reyasa.upload-dir:uploads}") String uploadDirectory
    ) {
        this.repository = repository;
        this.uploadDirectory = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize()
                .resolve("expenses")
                .normalize();
    }

    private ExpenseDto toDto(Expense e) {
        return ExpenseDto.builder()
                .id(e.getId())
                .title(e.getTitle())
                .category(e.getCategory())
                .materialType(e.getMaterialType())
                .color(e.getColor())
                .quantity(e.getQuantity())
                .unit(e.getUnit())
                .unitCost(e.getUnitCost())
                .totalCost(e.getTotalCost())
                .expenseDate(e.getExpenseDate())
                .supplier(e.getSupplier())
                .paymentMethod(e.getPaymentMethod())
                .notes(e.getNotes())
                .receiptPath(e.getReceiptPath())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private void validate(ExpenseDto dto) {
        if (dto == null || blank(dto.getTitle())) {
            throw new IllegalArgumentException("Expense title is required.");
        }

        if (blank(dto.getCategory())) {
            throw new IllegalArgumentException("Expense category is required.");
        }

        if (dto.getExpenseDate() == null) {
            throw new IllegalArgumentException("Expense date is required.");
        }

        if (dto.getExpenseDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Expense date cannot be in the future."
            );
        }

        if (dto.getUnitCost() == null
                || dto.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Unit cost must be zero or greater."
            );
        }

        if (dto.getQuantity() != null
                && dto.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Quantity cannot be negative."
            );
        }

        if (dto.getUnitCost().scale() > 2) {
            throw new IllegalArgumentException(
                    "Unit cost can have at most two decimal places."
            );
        }

        if (dto.getQuantity() != null && dto.getQuantity().scale() > 3) {
            throw new IllegalArgumentException(
                    "Quantity can have at most three decimal places."
            );
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private BigDecimal calculateTotal(ExpenseDto dto) {
        BigDecimal quantity = dto.getQuantity() == null
                ? BigDecimal.ONE
                : dto.getQuantity();

        return quantity.multiply(dto.getUnitCost())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String saveReceipt(MultipartFile receipt) {
        if (receipt == null || receipt.isEmpty()) {
            return null;
        }

        if (receipt.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Receipt must be 5 MB or smaller."
            );
        }

        String originalName = receipt.getOriginalFilename();
        String extension = "";

        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(
                    originalName.lastIndexOf('.') + 1
            ).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Allowed receipt types: PDF, JPG, PNG and WEBP."
            );
        }

        try {
            Files.createDirectories(uploadDirectory);

            String filename = UUID.randomUUID() + "." + extension;
            Path target = uploadDirectory.resolve(filename).normalize();

            if (!target.startsWith(uploadDirectory)) {
                throw new IllegalArgumentException("Invalid receipt path.");
            }

            Files.copy(receipt.getInputStream(), target);

            // Store only the generated filename, never the original filename.
            return filename;

        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to save the receipt.", e
            );
        }
    }

    private void deleteReceiptFile(String filename) {
        if (blank(filename)) {
            return;
        }

        try {
            Path target = uploadDirectory.resolve(filename).normalize();

            if (target.startsWith(uploadDirectory)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to delete the receipt file.", e
            );
        }
    }

    private Expense applyDto(
            Expense expense,
            ExpenseDto dto,
            MultipartFile receipt
    ) {
        expense.setTitle(dto.getTitle().trim());
        expense.setCategory(dto.getCategory().trim());
        expense.setMaterialType(dto.getMaterialType());
        expense.setColor(dto.getColor());
        expense.setQuantity(dto.getQuantity());
        expense.setUnit(dto.getUnit());
        expense.setUnitCost(dto.getUnitCost());
        expense.setTotalCost(calculateTotal(dto));
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setSupplier(dto.getSupplier());
        expense.setPaymentMethod(dto.getPaymentMethod());
        expense.setNotes(dto.getNotes());

        if (receipt != null && !receipt.isEmpty()) {
            String oldReceipt = expense.getReceiptPath();
            String newReceipt = saveReceipt(receipt);
            expense.setReceiptPath(newReceipt);

            if (oldReceipt != null) {
                deleteReceiptFile(oldReceipt);
            }
        }

        return expense;
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpenses(
            LocalDate startDate,
            LocalDate endDate,
            String category
    ) {
        if ((startDate == null) != (endDate == null)) {
            throw new IllegalArgumentException(
                    "Provide both start date and end date."
            );
        }

        if (startDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date must not be before start date."
            );
        }

        List<Expense> expenses;

        if (startDate != null && category != null && !category.isBlank()) {
            expenses =
                    repository.findByExpenseDateBetweenAndCategoryIgnoreCaseOrderByExpenseDateDescIdDesc(
                            startDate, endDate, category.trim()
                    );
        } else if (startDate != null) {
            expenses =
                    repository.findByExpenseDateBetweenOrderByExpenseDateDescIdDesc(
                            startDate, endDate
                    );
        } else if (category != null && !category.isBlank()) {
            expenses =
                    repository.findByCategoryIgnoreCaseOrderByExpenseDateDescIdDesc(
                            category.trim()
                    );
        } else {
            expenses = repository.findAllByOrderByExpenseDateDescIdDesc();
        }

        return expenses.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseDto getExpense(Long id) {
        return toDto(repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found.")));
    }

    @Transactional
    public ExpenseDto createExpense(
            ExpenseDto dto,
            MultipartFile receipt
    ) {
        validate(dto);

        Expense expense = applyDto(new Expense(), dto, receipt);
        return toDto(repository.save(expense));
    }

    @Transactional
    public ExpenseDto updateExpense(
            Long id,
            ExpenseDto dto,
            MultipartFile receipt
    ) {
        validate(dto);

        Expense expense = repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found."));

        applyDto(expense, dto, receipt);
        return toDto(repository.save(expense));
    }

    @Transactional
    public void deleteExpense(Long id) {
        Expense expense = repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found."));

        deleteReceiptFile(expense.getReceiptPath());
        repository.delete(expense);
    }

    @Transactional(readOnly = true)
    public byte[] getReceipt(Long id) {
        Expense expense = repository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Expense not found."));

        if (blank(expense.getReceiptPath())) {
            throw new IllegalArgumentException(
                    "No receipt is attached to this expense."
            );
        }

        Path path = uploadDirectory.resolve(expense.getReceiptPath())
                .normalize();

        if (!path.startsWith(uploadDirectory) || !Files.isRegularFile(path)) {
            throw new IllegalArgumentException("Receipt file was not found.");
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Unable to read the receipt file.", e
            );
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getSummary(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date must not be before start date."
            );
        }

        BigDecimal total = repository.sumExpensesBetween(startDate, endDate);
        BigDecimal materials = repository.sumByCategoryBetween(
                startDate, endDate, "Material"
        );
        BigDecimal equipment = repository.sumByCategoryBetween(
                startDate, endDate, "Equipment"
        );
        long receipts = repository
                .countByReceiptPathIsNotNullAndExpenseDateBetween(
                        startDate, endDate
                );

        return java.util.Map.of(
                "startDate", startDate,
                "endDate", endDate,
                "totalExpenses", total,
                "materialExpenses", materials,
                "equipmentExpenses", equipment,
                "receiptCount", receipts
        );
    }
}