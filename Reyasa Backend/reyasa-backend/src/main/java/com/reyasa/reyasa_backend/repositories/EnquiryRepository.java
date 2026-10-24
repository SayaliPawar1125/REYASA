
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {

    // Get all enquiries, newest first
    List<Enquiry> findAllByOrderByCreatedAtDesc();

    // Get enquiries by status, newest first
    List<Enquiry> findByStatusIgnoreCaseOrderByCreatedAtDesc(
            String status
    );

    // Search enquiries by customer email
    List<Enquiry> findByEmailIgnoreCaseOrderByCreatedAtDesc(
            String email
    );
}
