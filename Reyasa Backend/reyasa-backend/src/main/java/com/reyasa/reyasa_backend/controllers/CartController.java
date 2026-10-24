
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.CartItem;
import com.reyasa.reyasa_backend.services.CartService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    public record AddCartRequest(
            @NotNull Long userId,
            @NotNull @Min(1) Long productId,
            @NotBlank String size,
            @NotNull @Min(1) Integer quantity
    ) {}

    public record UpdateQuantityRequest(
            @NotNull @Min(1) Integer quantity
    ) {}

    public record CartItemResponse(
            Long id,
            Long productId,
            String name,
            String category,
            String imageKey,
            BigDecimal price,
            String size,
            Integer quantity,
            BigDecimal itemTotal,
            Integer stockQuantity
    ) {}

    public record CartResponse(
            List<CartItemResponse> items,
            BigDecimal subtotal,
            BigDecimal total
    ) {}

    @PostMapping("/add")
    @ResponseStatus(HttpStatus.CREATED)
    public CartItemResponse addToCart(
            @Valid @RequestBody AddCartRequest request) {

        CartItem item = cartService.addToCart(
                request.userId(),
                request.productId(),
                request.size(),
                request.quantity()
        );

        return toResponse(item);
    }

    @GetMapping("/user/{userId}")
    public CartResponse getCart(@PathVariable Long userId) {
        List<CartItemResponse> items = cartService.getCart(userId)
                .stream()
                .map(this::toResponse)
                .toList();

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::itemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Delivery is currently free.
        return new CartResponse(items, subtotal, subtotal);
    }

    @PutMapping("/update/{cartItemId}")
    public CartItemResponse updateQuantity(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateQuantityRequest request,
            @RequestParam Long userId) {

        CartItem item = cartService.updateQuantity(
                userId,
                cartItemId,
                request.quantity()
        );

        return toResponse(item);
    }

    @DeleteMapping("/remove/{cartItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(
            @PathVariable Long cartItemId,
            @RequestParam Long userId) {

        cartService.removeItem(userId, cartItemId);
    }

    @DeleteMapping("/clear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(@RequestParam Long userId) {
        cartService.clearCart(userId);
    }

    private CartItemResponse toResponse(CartItem item) {
        var product = item.getProduct();

        BigDecimal itemTotal = product.getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getImageKey(),
                product.getPrice(),
                item.getSize(),
                item.getQuantity(),
                itemTotal,
                product.getStockQuantity()
        );
    }
}
