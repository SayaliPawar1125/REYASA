
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.PlaceOrderRequest;
import com.reyasa.reyasa_backend.services.CustomerOrderService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;

    public CustomerOrderController(
            CustomerOrderService customerOrderService) {
        this.customerOrderService = customerOrderService;
    }

    @PostMapping("/place")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrderService.PlaceOrderResponse placeOrder(
            @Valid @RequestBody PlaceOrderRequest request) {
        return customerOrderService.placeOrder(request);
    }
}
