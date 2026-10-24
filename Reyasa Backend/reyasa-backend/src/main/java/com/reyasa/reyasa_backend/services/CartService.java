
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.CartItem;
import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.repositories.CartItemRepository;
import com.reyasa.reyasa_backend.repositories.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CartItem addToCart(
            Long userId,
            Long productId,
            String size,
            Integer quantity) {

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid user ID");
        }

        if (size == null || size.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select a size");
        }

        if (quantity == null || quantity < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"));

        if (!product.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This product is unavailable");
        }

        boolean validSize = List.of(product.getAvailableSizes().split(","))
                .stream()
                .map(String::trim)
                .anyMatch(available -> available.equalsIgnoreCase(size.trim()));

        if (!validSize) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Selected size is unavailable");
        }

        CartItem item = cartItemRepository
                .findByUserIdAndProduct_IdAndSize(
                        userId, productId, size.trim().toUpperCase())
                .orElse(null);

        int newQuantity = quantity;

        if (item != null) {
            newQuantity += item.getQuantity();
        } else {
            item = CartItem.builder()
                    .userId(userId)
                    .product(product)
                    .size(size.trim().toUpperCase())
                    .quantity(0)
                    .build();
        }

        if (product.getStockQuantity() == null ||
                newQuantity > product.getStockQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Not enough stock available");
        }

        item.setQuantity(newQuantity);

        return cartItemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public List<CartItem> getCart(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @Transactional
    public CartItem updateQuantity(
            Long userId, Long cartItemId, Integer quantity) {

        if (quantity == null || quantity < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
        }

        CartItem item = cartItemRepository
                .findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cart item not found"));

        Product product = item.getProduct();

        if (quantity > product.getStockQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Not enough stock available");
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long userId, Long cartItemId) {
        CartItem item = cartItemRepository
                .findByIdAndUserId(cartItemId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cart item not found"));

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getSubtotal(Long userId) {
        return cartItemRepository.findByUserId(userId)
                .stream()
                .map(item -> item.getProduct().getPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
