
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.Enquiry;
import com.reyasa.reyasa_backend.services.EnquiryService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EnquiryController {

    private final EnquiryService enquiryService;

    // CUSTOMER: Submit a new enquiry
    @PostMapping
    public ResponseEntity<?> createEnquiry(
            @RequestBody EnquiryRequest request) {

        try {
            Enquiry enquiry = Enquiry.builder()
                    .customerName(request.customerName())
                    .email(request.email())
                    .subject(request.productName())
                    .message(request.message())
                    .build();

            Enquiry savedEnquiry =
                    enquiryService.createEnquiry(enquiry);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put(
                    "message",
                    "Your enquiry has been submitted successfully."
            );
            response.put("enquiry", savedEnquiry);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // ADMIN: Get all enquiries, newest first
    @GetMapping("/admin/all")
    public ResponseEntity<List<Enquiry>> getAllEnquiries() {
        return ResponseEntity.ok(
                enquiryService.getAllEnquiries()
        );
    }

    // ADMIN: Filter enquiries by status
    // Example: /api/enquiries/admin/status?status=PENDING
    @GetMapping("/admin/status")
    public ResponseEntity<List<Enquiry>> getEnquiriesByStatus(
            @RequestParam(required = false) String status) {

        return ResponseEntity.ok(
                enquiryService.getEnquiriesByStatus(status)
        );
    }

    // ADMIN: Get one enquiry by ID
    @GetMapping("/admin/{id}")
    public ResponseEntity<?> getEnquiryById(
            @PathVariable Long id) {

        try {
            return ResponseEntity.ok(
                    enquiryService.getEnquiryById(id)
            );
        } catch (RuntimeException ex) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // ADMIN: Reply to an enquiry
    @PutMapping("/admin/{id}/reply")
    public ResponseEntity<?> replyToEnquiry(
            @PathVariable Long id,
            @RequestBody ReplyRequest request) {

        try {
            Enquiry updatedEnquiry =
                    enquiryService.saveReply(id, request.reply());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "Reply saved successfully.");
            response.put("enquiry", updatedEnquiry);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // Request body for customer enquiries
    public record EnquiryRequest(
            String productName,
            String customerName,
            String email,
            String phone,
            String message
    ) {}

    // Request body for admin replies
    public record ReplyRequest(String reply) {}
}
