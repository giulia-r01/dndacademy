package com.giulia.dndacademy.model;

import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "master_id")
    private User master;

    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "campaign_players",
            joinColumns = @JoinColumn(name = "campaign_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> players = new java.util.ArrayList<>();

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false)
    private CampaignDifficulty difficulty;
}