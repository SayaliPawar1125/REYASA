package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.services.DeliveryPinCodeService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/warehouse/delivery-pins")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DeliveryPinCodeCheckController {

    private final DeliveryPinCodeService service;

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkDelivery(
            @RequestParam String pinCode) {

        boolean available = service.isDeliveryAvailable(pinCode);

        String message = available
                ? "Delivery is available at your location."
                : "Sorry, delivery is not available at your location.";

        return ResponseEntity.ok(
                Map.of(
                        "pinCode", pinCode,
                        "available", available,
                        "message", message
                )
        );
    }
}