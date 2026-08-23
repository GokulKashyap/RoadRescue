package com.roadrescue.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "service_providers")
public class ServiceProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String companyName;

    @Column
    private String serviceTypes; // comma-separated for now, or could be a related table

    @Column(nullable = false)
    private boolean isAvailable = false;

    @Column
    private Double currentLat;

    @Column
    private Double currentLng;
}
