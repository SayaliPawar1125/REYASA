
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

        String pinCode = request.getPinCode().trim();

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
    public DeliveryPinCode updateStatus(
            Long id,
            Boolean active) {

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
        return repository.existsByPinCodeAndActiveTrue(
                pinCode.trim()
        );
    }
}
