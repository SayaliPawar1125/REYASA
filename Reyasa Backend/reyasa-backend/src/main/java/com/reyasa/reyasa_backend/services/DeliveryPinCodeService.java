package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.DeliveryPinCodeRequest;
import com.reyasa.reyasa_backend.entities.DeliveryPinCode;
import com.reyasa.reyasa_backend.repositories.DeliveryPinCodeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryPinCodeService {

    private final DeliveryPinCodeRepository repository;

    @Transactional(readOnly = true)
    public List<DeliveryPinCode> getAllPinCodes() {
        return repository.findAllByOrderByIdDesc();
    }

    @Transactional
    public DeliveryPinCode addPinCode(DeliveryPinCodeRequest request) {

        if (request == null || request.getPinCode() == null) {
            throw new IllegalArgumentException(
                    "PIN code is required."
            );
        }

        String pinCode = request.getPinCode().trim();

        if (!pinCode.matches("\\d{6}")) {
            throw new IllegalArgumentException(
                    "PIN code must contain exactly 6 digits."
            );
        }

        if (repository.existsByPinCode(pinCode)) {
            throw new IllegalArgumentException(
                    "This delivery PIN code already exists."
            );
        }

        DeliveryPinCode deliveryPinCode = DeliveryPinCode.builder()
                .pinCode(pinCode)
                .active(true)
                .build();

        return repository.save(deliveryPinCode);
    }

    @Transactional
    public DeliveryPinCode updateStatus(Long id, Boolean active) {

        if (active == null) {
            throw new IllegalArgumentException(
                    "PIN code status is required."
            );
        }

        DeliveryPinCode deliveryPinCode = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery PIN code not found."
                ));

        deliveryPinCode.setActive(active);

        return repository.save(deliveryPinCode);
    }

    @Transactional
    public void deletePinCode(Long id) {

        DeliveryPinCode deliveryPinCode = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery PIN code not found."
                ));

        repository.delete(deliveryPinCode);
    }

    @Transactional(readOnly = true)
    public boolean isDeliveryAvailable(String pinCode) {

        if (pinCode == null) {
            return false;
        }

        String normalizedPin = pinCode.trim();

        if (!normalizedPin.matches("\\d{6}")) {
            return false;
        }

        return repository.existsByPinCodeAndActiveTrue(
                normalizedPin
        );
    }

    @Transactional(readOnly = true)
    public void validateDeliveryPin(String pinCode) {

        if (!isDeliveryAvailable(pinCode)) {
            throw new IllegalArgumentException(
                    "Delivery is not available for this PIN code."
            );
        }
    }
}