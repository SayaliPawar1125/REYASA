
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.DeliveryPinCodeRequest;
import com.reyasa.reyasa_backend.dto.DeliveryPinCodeStatusRequest;
import com.reyasa.reyasa_backend.entities.DeliveryPinCode;
import com.reyasa.reyasa_backend.services.DeliveryPinCodeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouse/delivery-pins/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class DeliveryPinCodeController {

    private final DeliveryPinCodeService service;

    @GetMapping
    public ResponseEntity<List<DeliveryPinCode>> getAllPinCodes() {
        return ResponseEntity.ok(service.getAllPinCodes());
    }

    @PostMapping
    public ResponseEntity<DeliveryPinCode> addPinCode(
            @Valid @RequestBody DeliveryPinCodeRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addPinCode(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DeliveryPinCode> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryPinCodeStatusRequest request) {

        return ResponseEntity.ok(
                service.updateStatus(id, request.getActive())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePinCode(
            @PathVariable Long id) {

        service.deletePinCode(id);

        return ResponseEntity.ok(
                Map.of("message", "Delivery PIN code deleted successfully.")
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(
            IllegalArgumentException exception) {

        return ResponseEntity.badRequest().body(
                Map.of("message", exception.getMessage())
        );
    }
}
