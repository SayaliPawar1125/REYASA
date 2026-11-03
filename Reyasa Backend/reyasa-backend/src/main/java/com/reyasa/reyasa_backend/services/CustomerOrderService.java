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
    private final DeliveryPinCodeService deliveryPinCodeService;

    public CustomerOrderService(
            UserRepository userRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            DeliveryPinCodeService deliveryPinCodeService) {

        this.userRepository = userRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.deliveryPinCodeService = deliveryPinCodeService;
    }

    public record PlaceOrderResponse(
            Long orderId,
            BigDecimal totalAmount,
            String orderStatus,
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            java.time.LocalDateTime createdAt) {
    }

    @Transactional
    public PlaceOrderResponse placeOrder(PlaceOrderRequest request) {

        // STEP 1: Validate delivery PIN before placing the order.
        String pinCode = request.pinCode();

        if (pinCode == null || !pinCode.trim().matches("\\d{6}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter a valid 6-digit delivery PIN code."
            );
        }

        if (!deliveryPinCodeService.isDeliveryAvailable(pinCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sorry, delivery is not available at PIN code "
                            + pinCode.trim()
                            + ". Please enter a PIN code supported by REYASA."
            );
        }

        // STEP 2: Validate customer.
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Customer account is inactive"
            );
        }

        // STEP 3: Validate cart.
        List<CartItem> cartItems =
                cartItemRepository.findByUserId(request.userId());

        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your cart is empty"
            );
        }

        BigDecimal total = BigDecimal.ZERO;

        // STEP 4: Validate products, quantities and prices.
        for (CartItem item : cartItems) {

            Product product = item.getProduct();

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        product.getName() + " is no longer available"
                );
            }

            Integer stock = product.getStockQuantity();

            if (stock == null || item.getQuantity() > stock) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock for " + product.getName()
                );
            }

            if (product.getPrice() == null
                    || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid price for " + product.getName()
                );
            }

            total = total.add(
                    product.getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()))
            );
        }

        // STEP 5: Prepare shipping address.
        String shippingAddress = String.join(", ",
                request.addressLine().trim(),
                request.area().trim(),
                request.city().trim(),
                request.state().trim(),
                pinCode.trim()
        );

        if (request.landmark() != null
                && !request.landmark().isBlank()) {
            shippingAddress += ", Landmark: "
                    + request.landmark().trim();
        }

        // STEP 6: Create the order only after PIN validation succeeds.
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

        // STEP 7: Save order items.
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

        // STEP 8: Reduce stock after validating all cart items.
        for (CartItem item : cartItems) {
            Product product = item.getProduct();

            product.setStockQuantity(
                    product.getStockQuantity() - item.getQuantity()
            );
        }

        // STEP 9: Clear the cart after successful order placement.
        cartItemRepository.deleteByUserId(request.userId());

        // STEP 10: Return the order response.
        return new PlaceOrderResponse(
                savedOrder.getId(),
                savedOrder.getTotalAmount(),
                savedOrder.getOrderStatus(),
                savedOrder.getShippingName(),
                savedOrder.getShippingPhone(),
                savedOrder.getShippingAddress(),
                savedOrder.getCreatedAt()
        );
    }
}
