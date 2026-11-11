
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.CustomerOrderRequest;

import com.reyasa.reyasa_backend.entities.CartItem;
import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.entities.OrderItem;
import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.entities.User;

import com.reyasa.reyasa_backend.repositories.CartItemRepository;
import com.reyasa.reyasa_backend.repositories.OrderItemRepository;
import com.reyasa.reyasa_backend.repositories.OrderRepository;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryPinCodeService deliveryPinCodeService;
    private final PaymentService paymentService;

    // Order confirmation email service
    private final OrderConfirmationEmailService orderConfirmationEmailService;

    public record PlaceOrderResponse(
            Long orderId,
            BigDecimal totalAmount,
            String orderStatus,
            String paymentStatus,
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            LocalDateTime createdAt
    ) {
    }

    // ==========================================
    // PLACE CUSTOMER ORDER
    // ==========================================

    @Transactional
    public PlaceOrderResponse placeOrder(
            Long authenticatedUserId,
            CustomerOrderRequest request) {

        // STEP 1: Validate request

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order details are required"
            );
        }

        if (request.getSelectedCartItemIds() == null
                || request.getSelectedCartItemIds().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select cart items"
            );
        }

        if (authenticatedUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please login first"
            );
        }

        // STEP 2: Validate customer

        User user = userRepository.findById(authenticatedUserId)
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

        // STEP 3: Check whether payment was already used.

        String razorpayPaymentId = request.getRazorpayPaymentId();
        String razorpayOrderId = request.getRazorpayOrderId();

        if (razorpayPaymentId == null || razorpayPaymentId.isBlank()
                || razorpayOrderId == null || razorpayOrderId.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment details are required"
            );
        }

        Order existingOrder = orderRepository
                .findByRazorpayPaymentId(razorpayPaymentId)
                .orElse(null);

        if (existingOrder != null) {

            boolean sameUser = existingOrder.getUser() != null
                    && Objects.equals(
                    existingOrder.getUser().getId(),
                    authenticatedUserId
            );

            boolean samePaymentOrder = Objects.equals(
                    existingOrder.getRazorpayOrderId(),
                    razorpayOrderId
            );

            if (sameUser && samePaymentOrder) {
                return createResponse(existingOrder);
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This payment has already been used"
            );
        }

        if (orderRepository.findByRazorpayOrderId(razorpayOrderId)
                .isPresent()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This Razorpay order has already been used"
            );
        }

        // STEP 4: Validate delivery PIN

        String pinCode = request.getPinCode();

        if (pinCode == null || !pinCode.trim().matches("\\d{6}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter a valid 6-digit delivery PIN code."
            );
        }

        if (!deliveryPinCodeService.isDeliveryAvailable(pinCode.trim())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sorry, delivery is not available at PIN code "
                            + pinCode.trim()
            );
        }

        // STEP 5: Validate selected cart IDs

        List<Long> selectedIds = request.getSelectedCartItemIds();

        Set<Long> uniqueIds = new HashSet<>(selectedIds);

        if (uniqueIds.contains(null)
                || uniqueIds.size() != selectedIds.size()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid selected cart items"
            );
        }

        // STEP 6: Get only this customer's selected cart items

        List<CartItem> customerCart =
                cartItemRepository.findByUserId(authenticatedUserId);

        List<CartItem> selectedItems = customerCart.stream()
                .filter(item -> uniqueIds.contains(item.getId()))
                .toList();

        if (selectedItems.size() != uniqueIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Some selected cart items are invalid"
            );
        }

        // STEP 7: Validate products and calculate database total

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem item : selectedItems) {

            Product product = item.getProduct();

            if (product == null || !product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A selected product is unavailable"
                );
            }

            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid product quantity"
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
                    product.getPrice().multiply(
                            BigDecimal.valueOf(item.getQuantity())
                    )
            );
        }

        // STEP 8: Verify payment directly with Razorpay

        paymentService.verifyPayment(
                authenticatedUserId,
                razorpayOrderId,
                razorpayPaymentId,
                request.getRazorpaySignature(),
                selectedIds,
                total
        );

        // STEP 9: Prepare shipping address

        String shippingAddress = String.join(
                ", ",
                request.getAddressLine().trim(),
                request.getArea().trim(),
                request.getCity().trim(),
                request.getState().trim(),
                pinCode.trim()
        );

        if (request.getLandmark() != null
                && !request.getLandmark().isBlank()) {

            shippingAddress += ", Landmark: "
                    + request.getLandmark().trim();
        }

        // STEP 10: Create paid order

        Order order = Order.builder()
                .user(user)
                .totalAmount(total)
                .orderStatus("PLACED")
                .paymentStatus("PAID")
                .paymentMethod("RAZORPAY")
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(razorpayPaymentId)
                .shippingName(request.getFullName().trim())
                .shippingPhone(request.getPhone().trim())
                .shippingAddress(shippingAddress)
                .build();

        Order savedOrder = orderRepository.saveAndFlush(order);

        // STEP 11: Save order items

        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem item : selectedItems) {

            Product product = item.getProduct();

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .quantity(item.getQuantity())
                    .price(product.getPrice())
                    .size(item.getSize())
                    .build();

            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);

        // STEP 12: Reduce product stock

        for (CartItem item : selectedItems) {

            Product product = item.getProduct();

            product.setStockQuantity(
                    product.getStockQuantity() - item.getQuantity()
            );
        }

        // Product entities are managed by JPA within this transaction.
        // Updated stock values will be persisted automatically.

        // STEP 13: Delete only selected cart items

        cartItemRepository.deleteAll(selectedItems);

        // STEP 14: Send confirmation email AFTER transaction commits

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {

                        try {

                            orderConfirmationEmailService
                                    .sendConfirmationEmail(savedOrder);

                        } catch (Exception e) {

                            System.err.println(
                                    "Order confirmation email failed for order ID: "
                                            + savedOrder.getId()
                            );

                            e.printStackTrace();
                        }
                    }
                }
        );

        // STEP 15: Return order response

        return createResponse(savedOrder);
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    private PlaceOrderResponse createResponse(Order order) {

        return new PlaceOrderResponse(
                order.getId(),
                order.getTotalAmount(),
                order.getOrderStatus(),
                order.getPaymentStatus(),
                order.getShippingName(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getCreatedAt()
        );
    }
}
