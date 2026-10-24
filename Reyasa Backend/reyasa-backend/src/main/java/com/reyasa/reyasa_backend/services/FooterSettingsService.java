
package com.reyasa.reyasa_backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reyasa.reyasa_backend.dto.FooterLinkDto;
import com.reyasa.reyasa_backend.dto.FooterSettingsDto;
import com.reyasa.reyasa_backend.entities.FooterSettings;
import com.reyasa.reyasa_backend.repositories.FooterSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FooterSettingsService {

    private static final Long FOOTER_ID = 1L;

    private final FooterSettingsRepository repository;
    private final ObjectMapper objectMapper;

    public FooterSettingsService(
            FooterSettingsRepository repository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    private String toJson(List<FooterLinkDto> links) {
        try {
            return objectMapper.writeValueAsString(
                    links == null ? List.of() : links);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(
                    "Unable to process footer links.", e);
        }
    }

    private List<FooterLinkDto> fromJson(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }

            return objectMapper.readValue(
                    json,
                    new TypeReference<List<FooterLinkDto>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                    "Unable to read saved footer links.", e);
        }
    }

    private FooterSettingsDto toDto(FooterSettings entity) {
        return FooterSettingsDto.builder()
                .brandName(entity.getBrandName())
                .tagline(entity.getTagline())
                .description(entity.getDescription())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .quickLinks(fromJson(entity.getQuickLinksJson()))
                .socialLinks(fromJson(entity.getSocialLinksJson()))
                .policyLinks(fromJson(entity.getPolicyLinksJson()))
                .copyright(entity.getCopyright())
                .build();
    }

    private FooterSettings fromDto(FooterSettingsDto dto) {
        return FooterSettings.builder()
                .id(FOOTER_ID)
                .brandName(dto.getBrandName())
                .tagline(dto.getTagline())
                .description(dto.getDescription())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .quickLinksJson(toJson(dto.getQuickLinks()))
                .socialLinksJson(toJson(dto.getSocialLinks()))
                .policyLinksJson(toJson(dto.getPolicyLinks()))
                .copyright(dto.getCopyright())
                .build();
    }

    private FooterSettingsDto defaultSettings() {
        return FooterSettingsDto.builder()
                .brandName("REYASA")
                .tagline("Created with passion. Worn with love.")
                .description(
                        "Discover thoughtfully designed shirts that combine timeless style with everyday comfort.")
                .phone("+91 98765 43210")
                .email("reyasa@gmail.com")
                .address("Mumbai, Maharashtra, India")
                .quickLinks(List.of(
                        new FooterLinkDto("Home", "/"),
                        new FooterLinkDto("Collection", "/collection"),
                        new FooterLinkDto("About Us", "/about"),
                        new FooterLinkDto("Contact", "/contact")
                ))
                .socialLinks(List.of(
                        new FooterLinkDto(
                                "Instagram", "https://instagram.com"),
                        new FooterLinkDto(
                                "Facebook", "https://facebook.com"),
                        new FooterLinkDto(
                                "YouTube", "https://youtube.com")
                ))
                .policyLinks(List.of(
                        new FooterLinkDto(
                                "Privacy Policy", "/privacy-policy"),
                        new FooterLinkDto(
                                "Terms & Conditions", "/terms-and-conditions"),
                        new FooterLinkDto(
                                "Shipping Policy", "/shipping-policy"),
                        new FooterLinkDto(
                                "Return Policy", "/return-policy")
                ))
                .copyright("© 2026 REYASA. All Rights Reserved.")
                .build();
    }

    @Transactional
    public FooterSettingsDto getFooter() {
        FooterSettings settings = repository.findById(FOOTER_ID)
                .orElseGet(() -> repository.save(
                        fromDto(defaultSettings())));

        return toDto(settings);
    }

    @Transactional
    public FooterSettingsDto saveFooter(FooterSettingsDto dto) {
        validate(dto);

        FooterSettings saved = repository.save(fromDto(dto));
        return toDto(saved);
    }

    @Transactional
    public FooterSettingsDto resetFooter() {
        FooterSettings saved = repository.save(
                fromDto(defaultSettings()));

        return toDto(saved);
    }

    private void validate(FooterSettingsDto dto) {
        if (dto == null
                || dto.getBrandName() == null
                || dto.getBrandName().isBlank()) {
            throw new IllegalArgumentException(
                    "Brand name is required.");
        }

        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Contact email is required.");
        }

        if (!dto.getEmail().matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException(
                    "Enter a valid contact email.");
        }

        validateLinks(dto.getQuickLinks(), "Quick links");
        validateLinks(dto.getSocialLinks(), "Social links");
        validateLinks(dto.getPolicyLinks(), "Policy links");
    }

    private void validateLinks(
            List<FooterLinkDto> links, String fieldName) {

        if (links == null) {
            return;
        }

        for (FooterLinkDto link : links) {
            if (link == null
                    || link.getLabel() == null
                    || link.getLabel().isBlank()
                    || link.getUrl() == null
                    || link.getUrl().isBlank()) {
                throw new IllegalArgumentException(
                        fieldName + " must have a label and URL.");
            }
        }
    }
}
