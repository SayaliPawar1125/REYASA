
package com.reyasa.reyasa_backend.services;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;

import com.reyasa.reyasa_backend.dto.PaymentCreateResponse;
import com.reyasa.reyasa_backend.entities.CartItem;
import com.reyasa.reyasa_backend.repositories.CartItemRepository;

import lombok.RequiredArgsConstructor;

import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final CartItemRepository cartItemRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    // ==========================================
    // CREATE RAZORPAY ORDER
    // ==========================================

    public PaymentCreateResponse createRazorpayOrder(
            Long userId,
            List<Long> selectedCartItemIds) {

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User is required"
            );
        }

        if (selectedCartItemIds == null || selectedCartItemIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Please select cart items"
            );
        }

        Set<Long> selectedIds = new HashSet<>(selectedCartItemIds);

        if (selectedIds.contains(null)
                || selectedIds.size() != selectedCartItemIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid cart item selection"
            );
        }

        List<CartItem> userItems = cartItemRepository.findByUserId(userId);

        List<CartItem> selectedItems = userItems.stream()
                .filter(item -> selectedIds.contains(item.getId()))
                .toList();

        if (selectedItems.size() != selectedIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected cart items do not belong to this user"
            );
        }

        BigDecimal total = calculateTotal(selectedItems);

        try {
            long amountInPaise = total
                    .setScale(2, RoundingMode.HALF_UP)
                    .movePointRight(2)
                    .longValueExact();

            RazorpayClient client =
                    new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject request = new JSONObject();
            request.put("amount", amountInPaise);
            request.put("currency", "INR");
            request.put("receipt", "REYASA_" + UUID.randomUUID());

            JSONObject notes = new JSONObject();
            notes.put("userId", String.valueOf(userId));

            String cartIds = selectedIds.stream()
                    .sorted()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));

            notes.put("cartItemIds", cartIds);
            request.put("notes", notes);

            Order razorpayOrder = client.orders.create(request);

            return new PaymentCreateResponse(
                    razorpayOrder.get("id"),
                    amountInPaise,
                    "INR",
                    razorpayKeyId
            );

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to create Razorpay order"
            );
        }
    }

    // ==========================================
    // CALCULATE TOTAL FROM DATABASE
    // ==========================================

    private BigDecimal calculateTotal(List<CartItem> items) {

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem item : items) {

            if (item.getProduct() == null
                    || !item.getProduct().isActive()) {
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

            if (item.getProduct().getStockQuantity() == null
                    || item.getProduct().getStockQuantity()
                    < item.getQuantity()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock for "
                                + item.getProduct().getName()
                );
            }

            BigDecimal price = item.getProduct().getPrice();

            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid product price"
                );
            }

            total = total.add(
                    price.multiply(BigDecimal.valueOf(item.getQuantity()))
            );
        }

        return total;
    }

    // ==========================================
    // VERIFY PAYMENT
    // ==========================================

    public boolean verifyPayment(
            Long userId,
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature) {

        return verifyPayment(
                userId,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                null,
                null
        );
    }

    // Verification used when placing a customer order.
    // It also checks the original selected cart IDs and total.

    public boolean verifyPayment(
            Long userId,
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature,
            List<Long> selectedCartItemIds,
            BigDecimal expectedAmount) {

        if (userId == null
                || isBlank(razorpayOrderId)
                || isBlank(razorpayPaymentId)
                || isBlank(razorpaySignature)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment verification details are required"
            );
        }

        try {
            // 1. Verify HMAC SHA256 signature

            String message = razorpayOrderId + "|" + razorpayPaymentId;

            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(secretKey);

            byte[] signatureBytes = mac.doFinal(
                    message.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder generatedSignature = new StringBuilder();

            for (byte b : signatureBytes) {
                generatedSignature.append(String.format("%02x", b));
            }

            boolean signatureValid = MessageDigest.isEqual(
                    generatedSignature.toString()
                            .getBytes(StandardCharsets.UTF_8),
                    razorpaySignature.getBytes(StandardCharsets.UTF_8)
            );

            if (!signatureValid) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid Razorpay signature"
                );
            }

            // 2. Fetch actual Razorpay payment and order

            RazorpayClient client =
                    new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            Payment payment =
                    client.payments.fetch(razorpayPaymentId);

            Order order =
                    client.orders.fetch(razorpayOrderId);

            // 3. Check payment belongs to this Razorpay order

            String paymentOrderId = payment.get("order_id");

            if (!razorpayOrderId.equals(paymentOrderId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Payment does not belong to this order"
                );
            }

            // 4. Check authenticated user

            JSONObject notes = order.get("notes");

            String orderUserId = String.valueOf(notes.get("userId"));

            if (!String.valueOf(userId).equals(orderUserId)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Payment does not belong to this user"
                );
            }

            // 5. Check selected cart IDs against original Razorpay notes

            if (selectedCartItemIds != null) {

                String savedIds = String.valueOf(
                        notes.get("cartItemIds")
                );

                String requestedIds = selectedCartItemIds.stream()
                        .sorted()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","));

                if (!savedIds.equals(requestedIds)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Selected cart items do not match the payment"
                    );
                }
            }

            // 6. Payment must be captured

            String status = payment.get("status");

            if (!"captured".equalsIgnoreCase(status)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Payment has not been captured"
                );
            }

            // 7. Check amount and currency

            Number paymentAmount = payment.get("amount");
            Number orderAmount = order.get("amount");

            if (paymentAmount == null
                    || orderAmount == null
                    || paymentAmount.longValue() != orderAmount.longValue()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Payment amount does not match Razorpay order"
                );
            }

            if (expectedAmount != null) {

                long expectedPaise = expectedAmount
                        .setScale(2, RoundingMode.HALF_UP)
                        .movePointRight(2)
                        .longValueExact();

                if (paymentAmount.longValue() != expectedPaise) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Paid amount does not match selected cart total"
                    );
                }
            }

            String currency = payment.get("currency");
            String orderCurrency = order.get("currency");

            if (!"INR".equalsIgnoreCase(currency)
                    || !currency.equalsIgnoreCase(orderCurrency)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid payment currency"
                );
            }

            return true;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Payment verification failed: " + e.getMessage()
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
