
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.DeliveryPinCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryPinCodeRepository
        extends JpaRepository<DeliveryPinCode, Long> {

    boolean existsByPinCode(String pinCode);

    boolean existsByPinCodeAndIdNot(String pinCode, Long id);

    List<DeliveryPinCode> findAllByOrderByIdDesc();

    boolean existsByPinCodeAndActiveTrue(String pinCode);
}
