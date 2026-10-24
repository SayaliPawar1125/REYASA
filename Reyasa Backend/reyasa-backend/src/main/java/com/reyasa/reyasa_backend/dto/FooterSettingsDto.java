
package com.reyasa.reyasa_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FooterSettingsDto {

    private String brandName;
    private String tagline;
    private String description;

    private String phone;
    private String email;
    private String address;

    private List<FooterLinkDto> quickLinks;
    private List<FooterLinkDto> socialLinks;
    private List<FooterLinkDto> policyLinks;

    private String copyright;
}
