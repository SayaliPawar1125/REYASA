
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Enquiry;
import com.reyasa.reyasa_backend.repositories.EnquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;
    private final EnquiryEmailService enquiryEmailService;

    // Save a customer enquiry
    public Enquiry createEnquiry(Enquiry enquiry) {

        enquiry.setId(null);
        enquiry.setAdminReply(null);
        enquiry.setRepliedAt(null);
        enquiry.setStatus("PENDING");

        if (enquiry.getCustomerName() == null
                || enquiry.getCustomerName().isBlank()) {
            throw new IllegalArgumentException(
                    "Customer name is required"
            );
        }

        if (enquiry.getEmail() == null
                || enquiry.getEmail().isBlank()
                || !enquiry.getEmail().matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException(
                    "Please enter a valid email address"
            );
        }

        if (enquiry.getMessage() == null
                || enquiry.getMessage().isBlank()) {
            throw new IllegalArgumentException(
                    "Enquiry message is required"
            );
        }

        return enquiryRepository.save(enquiry);
    }

    // Get all enquiries for admin
    @Transactional(readOnly = true)
    public List<Enquiry> getAllEnquiries() {
        return enquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    // Get enquiries by status
    @Transactional(readOnly = true)
    public List<Enquiry> getEnquiriesByStatus(String status) {

        if (status == null || status.isBlank()) {
            return getAllEnquiries();
        }

        return enquiryRepository
                .findByStatusIgnoreCaseOrderByCreatedAtDesc(status);
    }

    // Get enquiry by ID
    @Transactional(readOnly = true)
    public Enquiry getEnquiryById(Long id) {
        return enquiryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Enquiry not found with ID: " + id
                        ));
    }

    // Save admin reply and send email to customer
    public Enquiry saveReply(Long id, String reply) {

        if (reply == null || reply.isBlank()) {
            throw new IllegalArgumentException(
                    "Reply message cannot be empty"
            );
        }

        Enquiry enquiry = getEnquiryById(id);

        enquiry.setAdminReply(reply.trim());
        enquiry.setStatus("REPLIED");
        enquiry.setRepliedAt(
                java.time.LocalDateTime.now()
        );

        Enquiry savedEnquiry = enquiryRepository.save(enquiry);

        // Send email only after the database transaction commits
        String customerName = savedEnquiry.getCustomerName();
        String customerEmail = savedEnquiry.getEmail();
        String subject = savedEnquiry.getSubject();
        String originalMessage = savedEnquiry.getMessage();
        String adminReply = savedEnquiry.getAdminReply();

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {

                        enquiryEmailService.sendReplyEmail(
                                customerName,
                                customerEmail,
                                subject,
                                originalMessage,
                                adminReply
                        );
                    }
                }
        );

        return savedEnquiry;
    }
}
