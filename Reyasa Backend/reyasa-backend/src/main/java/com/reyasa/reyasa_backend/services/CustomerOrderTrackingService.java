
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.CustomerOrderTrackingResponse;
import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.repositories.OrderRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerOrderTrackingService {

    private final OrderRepository orderRepository;

    // Get all orders belonging to the logged-in customer
    public List<CustomerOrderTrackingResponse> getMyOrders(Long userId) {

        return orderRepository
                .findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Get one order belonging to the logged-in customer
    public CustomerOrderTrackingResponse getMyOrder(
            Long userId,
            Long orderId
    ) {

        Order order = orderRepository
                .findByIdAndUser_Id(orderId, userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Order not found or you are not authorized"
                        )
                );

        return convertToResponse(order);
    }

    private CustomerOrderTrackingResponse convertToResponse(Order order) {

        return new CustomerOrderTrackingResponse(
                order.getId(),
                order.getTotalAmount(),
                order.getShippingName(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getOrderStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                order.getCourierName(),
                order.getTrackingNumber(),
                order.getTrackingUrl(),
                order.getShippedAt(),
                order.getDeliveredAt()
        );
    }
}
