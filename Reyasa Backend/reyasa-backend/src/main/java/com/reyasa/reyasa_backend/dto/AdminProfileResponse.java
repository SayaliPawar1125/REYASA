package com.reyasa.reyasa_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AdminProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}