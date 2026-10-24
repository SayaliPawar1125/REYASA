
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.PlaceOrderRequest;
import com.reyasa.reyasa_backend.entities.CartItem;
import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.entities.OrderItem;
import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.CartItemRepository;
import com.reyasa.reyasa_backend.repositories.OrderItemRepository;
import com.reyasa.reyasa_backend.repositories.OrderRepository;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CustomerOrderService {

    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public CustomerOrderService(
            UserRepository userRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public record PlaceOrderResponse(
            Long orderId,
            BigDecimal totalAmount,
            String orderStatus,
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            java.time.LocalDateTime createdAt) {}

    @Transactional
    public PlaceOrderResponse placeOrder(PlaceOrderRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found"));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Customer account is inactive");
        }

        List<CartItem> cartItems =
                cartItemRepository.findByUserId(request.userId());

        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Your cart is empty");
        }

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            Product product = item.getProduct();

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        product.getName() + " is no longer available");
            }

            Integer stock = product.getStockQuantity();

            if (stock == null || item.getQuantity() > stock) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock for " + product.getName());
            }

            if (product.getPrice() == null ||
                    product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid price for " + product.getName());
            }

            total = total.add(
                    product.getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        String shippingAddress = String.join(", ",
                request.addressLine().trim(),
                request.area().trim(),
                request.city().trim(),
                request.state().trim(),
                request.pinCode().trim());

        if (request.landmark() != null &&
                !request.landmark().isBlank()) {
            shippingAddress += ", Landmark: " + request.landmark().trim();
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(total)
                .orderStatus("PLACED")
                .paymentStatus("PENDING")
                .shippingName(request.fullName().trim())
                .shippingPhone(request.phone().trim())
                .shippingAddress(shippingAddress)
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> OrderItem.builder()
                        .order(savedOrder)
                        .product(item.getProduct())
                        .quantity(item.getQuantity())
                        .price(item.getProduct().getPrice())
                        .size(item.getSize())
                        .build())
                .toList();

        orderItemRepository.saveAll(orderItems);

        // Reduce stock only after validating all cart items.
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            product.setStockQuantity(
                    product.getStockQuantity() - item.getQuantity());
        }

        cartItemRepository.deleteByUserId(request.userId());

        return new PlaceOrderResponse(
                savedOrder.getId(),
                savedOrder.getTotalAmount(),
                savedOrder.getOrderStatus(),
                savedOrder.getShippingName(),
                savedOrder.getShippingPhone(),
                savedOrder.getShippingAddress(),
                savedOrder.getCreatedAt());
    }
}
